/**
 * Billza API Client Service
 * Communicates with the Django REST Framework backend API.
 * Replaces all placeholder / mock data with real live backend operations.
 */

import {
  BillItem,
  PaymentHistoryItem,
  Currency,
  BillIconType,
  BillStatus,
} from '../data/initialData';
import { DetailedPaymentRecord } from '../data/paymentHistoryData';
import { ReminderItem } from '../data/remindersData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  wallet_address?: string;
  preferred_currency?: Currency;
  is_verified?: boolean;
  email_notifications?: boolean;
  in_app_notifications?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthTokens {
  access: string;
  access_token?: string;
  refresh?: string;
  refresh_token?: string;
  user?: AuthUser;
}

// Token storage helpers
export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('billza_access_token');
};

export const setStoredToken = (token: string, user?: AuthUser, refresh?: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('billza_access_token', token);
  if (refresh) {
    localStorage.setItem('billza_refresh_token', refresh);
  }
  if (user) {
    localStorage.setItem('billza_user', JSON.stringify(user));
  }
};

export const clearStoredAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('billza_access_token');
  localStorage.removeItem('billza_refresh_token');
  localStorage.removeItem('billza_user');
};

export const getStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('billza_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// Generic request wrapper with auto-auth headers
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText || 'An unexpected server error occurred.' };
    }
    const message =
      errorData.error ||
      errorData.detail ||
      (typeof errorData === 'object' ? Object.values(errorData).flat().join(' ') : 'Request failed');
    throw new Error(message || `API error ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ==========================================
// Authentication APIs
// ==========================================

export async function loginUser(email: string, password: string): Promise<AuthTokens> {
  const data = await apiRequest<any>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const token = data.access_token || data.access;
  const refresh = data.refresh_token || data.refresh;
  if (token) {
    setStoredToken(token, data.user, refresh);
  }
  return {
    access: token,
    access_token: token,
    refresh,
    refresh_token: refresh,
    user: data.user,
  };
}

export async function registerUser(
  email: string,
  password: string,
  fullName: string
): Promise<AuthTokens> {
  const data = await apiRequest<any>('/auth/register/', {
    method: 'POST',
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  const token = data.access_token || data.access;
  const refresh = data.refresh_token || data.refresh;
  if (token) {
    setStoredToken(token, data.user, refresh);
  }
  return {
    access: token,
    access_token: token,
    refresh,
    refresh_token: refresh,
    user: data.user,
  };
}

export async function getWalletNonce(walletAddress: string): Promise<{
  wallet_address: string;
  nonce: string;
  message: string;
  expires_at: string;
}> {
  return apiRequest('/auth/wallet/nonce/', {
    method: 'POST',
    body: JSON.stringify({ wallet_address: walletAddress }),
  });
}

export async function verifyWalletAuth(
  walletAddress: string,
  nonce: string,
  signature: string
): Promise<AuthTokens> {
  const data = await apiRequest<any>('/auth/wallet/verify/', {
    method: 'POST',
    body: JSON.stringify({
      wallet_address: walletAddress,
      nonce,
      signature,
    }),
  });
  const token = data.access_token || data.access;
  const refresh = data.refresh_token || data.refresh;
  if (token) {
    setStoredToken(token, data.user, refresh);
  }
  return {
    access: token,
    access_token: token,
    refresh,
    refresh_token: refresh,
    user: data.user,
  };
}

export async function getUserProfile(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/profile/');
}

export async function updateUserProfile(data: Partial<AuthUser>): Promise<AuthUser> {
  const updated = await apiRequest<AuthUser>('/auth/profile/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  setStoredToken(getStoredToken() || '', updated);
  return updated;
}

export async function fetchAuditLogs(): Promise<any[]> {
  try {
    return await apiRequest<any[]>('/auth/audit-logs/');
  } catch (err) {
    console.warn('[API] Could not fetch audit logs:', err);
    return [];
  }
}

export async function checkBackendHealth(): Promise<any> {
  return apiRequest('/auth/health/');
}

// ==========================================
// Bills & Occurrences APIs
// ==========================================

export interface BackendOccurrence {
  id: number;
  bill: number;
  bill_name: string;
  bill_category: string;
  occurrence_number: number;
  due_date: string;
  amount: string | number;
  currency: Currency;
  status: 'UPCOMING' | 'DUE_SOON' | 'PENDING' | 'PAID' | 'OVERDUE' | 'FAILED' | 'CANCELLED';
  is_manual_paid: boolean;
  payment_reference: string;
  paid_at?: string;
  transaction_hash?: string;
  notes?: string;
  recipient_stellar_address: string;
  recipient_name: string;
  created_at?: string;
  updated_at?: string;
}

export async function fetchOccurrences(): Promise<BackendOccurrence[]> {
  try {
    const data = await apiRequest<any>('/bills/occurrences/');
    return Array.isArray(data) ? data : data.results || [];
  } catch (err) {
    console.warn('[API] Could not fetch occurrences:', err);
    return [];
  }
}

export async function fetchBills(): Promise<any[]> {
  try {
    const data = await apiRequest<any>('/bills/');
    return Array.isArray(data) ? data : data.results || [];
  } catch (err) {
    console.warn('[API] Could not fetch bills:', err);
    return [];
  }
}

export async function createBillApi(billData: {
  name: string;
  category: string;
  custom_category?: string;
  description?: string;
  amount: number;
  currency: Currency;
  recipient_name?: string;
  recipient_stellar_address?: string;
  payment_method?: string;
  account_reference?: string;
  frequency: 'MONTHLY' | 'WEEKLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_OFF';
  repeat_every?: number;
  ends_type?: string;
  end_date?: string;
  end_occurrences?: number;
  due_date: string;
  remind_7_days?: boolean;
  remind_3_days?: boolean;
  remind_1_day?: boolean;
  remind_on_due?: boolean;
  remind_overdue?: boolean;
  remind_in_app?: boolean;
  remind_email?: boolean;
}): Promise<any> {
  return apiRequest('/bills/', {
    method: 'POST',
    body: JSON.stringify(billData),
  });
}

export async function updateBillApi(
  billId: number | string,
  billData: Partial<{
    name: string;
    category: string;
    custom_category: string;
    description: string;
    amount: number;
    currency: Currency;
    recipient_name: string;
    recipient_stellar_address: string;
    payment_method: string;
    account_reference: string;
    frequency: string;
    repeat_every: number;
    ends_type: string;
    end_date: string;
    end_occurrences: number;
    due_date: string;
    remind_7_days: boolean;
    remind_3_days: boolean;
    remind_1_day: boolean;
    remind_on_due: boolean;
    remind_overdue: boolean;
    remind_in_app: boolean;
    remind_email: boolean;
  }>
): Promise<any> {
  return apiRequest(`/bills/${billId}/`, {
    method: 'PATCH',
    body: JSON.stringify(billData),
  });
}

export async function deleteBillApi(billId: number | string): Promise<any> {
  return apiRequest(`/bills/${billId}/`, {
    method: 'DELETE',
  });
}

export async function markOccurrencePaidApi(occurrenceId: number | string): Promise<any> {
  return apiRequest(`/bills/occurrences/${occurrenceId}/mark-paid/`, {
    method: 'POST',
  });
}

export async function snoozeOccurrenceApi(
  occurrenceId: number | string,
  days: number = 3
): Promise<any> {
  return apiRequest(`/bills/occurrences/${occurrenceId}/snooze/`, {
    method: 'POST',
    body: JSON.stringify({ days }),
  });
}

// ==========================================
// Payments APIs
// ==========================================

export async function fetchPaymentHistory(): Promise<any[]> {
  try {
    const data = await apiRequest<any>('/payments/history/');
    return Array.isArray(data) ? data : data.results || [];
  } catch (err) {
    console.warn('[API] Could not fetch payment history:', err);
    return [];
  }
}

export async function preparePaymentApi(
  occurrenceId: number | string,
  payerAddress?: string
): Promise<{
  payment_id: number;
  occurrence_id: number;
  bill_name: string;
  amount: number | string;
  asset: string;
  recipient_address: string;
  payer_address: string;
  payment_reference: string;
  estimated_network_fee: string;
  contract_id: string;
  network_passphrase: string;
  usdc_issuer?: string;
  horizon_url?: string;
}> {
  return apiRequest('/payments/prepare/', {
    method: 'POST',
    body: JSON.stringify({ occurrence_id: occurrenceId, payer_address: payerAddress || '' }),
  });
}

export async function verifyPaymentApi(payload: {
  transaction_hash: string;
  occurrence_id: number;
  amount: number;
  asset: string;
  payment_method?: string;
}): Promise<any> {
  return apiRequest('/payments/verify/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function testnetExecutePaymentApi(occurrenceId: number | string, payerAddress?: string): Promise<any> {
  return apiRequest('/payments/testnet-execute/', {
    method: 'POST',
    body: JSON.stringify({ occurrence_id: occurrenceId, payer_address: payerAddress || '' }),
  });
}

export async function fetchWalletBalances(address: string): Promise<{
  wallet_address: string;
  balances: { asset: string; balance: string }[];
}> {
  return apiRequest(`/payments/wallet/balances/?address=${encodeURIComponent(address)}`);
}

export async function requestFriendbotFaucet(address: string): Promise<any> {
  return apiRequest('/payments/wallet/faucet/', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
}

export async function downloadPaymentHistoryCsv(): Promise<void> {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const url = `${BASE_URL}/payments/history/export-csv/`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error('Failed to export payment history CSV');
  }
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `billza_payment_history_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}

// ==========================================
// Reminders APIs
// ==========================================

export async function fetchReminders(): Promise<any[]> {
  try {
    const data = await apiRequest<any>('/reminders/');
    return Array.isArray(data) ? data : data.results || [];
  } catch (err) {
    console.warn('[API] Could not fetch reminders:', err);
    return [];
  }
}

export async function markReminderReadApi(reminderId: number | string): Promise<any> {
  return apiRequest(`/reminders/${reminderId}/read/`, {
    method: 'POST',
  });
}

export async function markAllRemindersReadApi(): Promise<any> {
  return apiRequest('/reminders/read-all/', {
    method: 'POST',
  });
}

export async function fetchReminderPreferencesApi(): Promise<{
  email_enabled: boolean;
  in_app_enabled: boolean;
  remind_7_days: boolean;
  remind_3_days: boolean;
  remind_1_day: boolean;
  remind_on_due: boolean;
  remind_overdue: boolean;
}> {
  return apiRequest('/reminders/preferences/');
}

export async function updateReminderPreferencesApi(data: Partial<{
  email_enabled: boolean;
  in_app_enabled: boolean;
  remind_7_days: boolean;
  remind_3_days: boolean;
  remind_1_day: boolean;
  remind_on_due: boolean;
  remind_overdue: boolean;
}>): Promise<any> {
  return apiRequest('/reminders/preferences/', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function triggerReminderWorkerApi(): Promise<{
  status: string;
  evaluated: number;
  created: number;
  dispatched: number;
}> {
  return apiRequest('/reminders/worker/run/', {
    method: 'POST',
  });
}

// ==========================================
// Dashboard Overview API
// ==========================================

export interface DashboardOverviewData {
  total_bills_count: number;
  upcoming_bills_count: number;
  overdue_bills_count: number;
  paid_this_month_count: number;
  unread_reminders_count: number;
  scheduled_by_currency: { currency: Currency; total_amount: number | string; count: number }[];
  paid_this_month_by_currency: { currency: Currency; total_amount: number | string; count: number }[];
  category_breakdown: {
    category: string;
    category_display: string;
    currency: Currency;
    total_amount: number | string;
    count: number;
  }[];
  upcoming_occurrences: BackendOccurrence[];
  overdue_occurrences: BackendOccurrence[];
  recent_payments: any[];
}

export async function fetchDashboardOverview(): Promise<DashboardOverviewData | null> {
  try {
    return await apiRequest<DashboardOverviewData>('/dashboard/overview/');
  } catch (err) {
    console.warn('[API] Could not fetch dashboard overview:', err);
    return null;
  }
}

// ==========================================
// Data Transformation Helpers
// ==========================================

export function getCategoryIcon(cat: string): BillIconType {
  const c = (cat || '').toLowerCase();
  if (c.includes('internet') || c.includes('wifi') || c.includes('telecom')) return 'wifi';
  if (c.includes('electric') || c.includes('power')) return 'bolt';
  if (c.includes('water')) return 'drop';
  if (c.includes('rent') || c.includes('housing') || c.includes('workspace')) return 'house';
  if (c.includes('insurance')) return 'shield';
  if (c.includes('software') || c.includes('saas') || c.includes('stream') || c.includes('cloud'))
    return 'monitor';
  if (c.includes('edu') || c.includes('school') || c.includes('course')) return 'grad';
  if (c.includes('other') || c.includes('receipt') || c.includes('fitness')) return 'receipt';
  return 'building';
}

export function mapStatus(status: string, isManualPaid: boolean, dueDateStr: string): BillStatus {
  if (isManualPaid) return 'manual';
  const s = (status || '').toUpperCase();
  if (s === 'PAID') return 'paid';
  if (s === 'OVERDUE') return 'overdue';

  const due = new Date(dueDateStr);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 3) return 'soon';
  if (diffDays <= 7) return 'pending';
  return 'upcoming';
}

export function transformBackendOccurrence(occ: BackendOccurrence): BillItem {
  const amt = typeof occ.amount === 'number' ? occ.amount : parseFloat(occ.amount);
  const status = mapStatus(occ.status, occ.is_manual_paid, occ.due_date);
  const dueDate = new Date(occ.due_date);
  const dueDateLabel = dueDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const recipientAddr = occ.recipient_stellar_address || '';
  const recipientShort =
    occ.currency === 'EUR'
      ? occ.recipient_name
        ? `${occ.recipient_name}, you pay`
        : 'You pay directly'
      : recipientAddr
      ? `${recipientAddr.slice(0, 4)}...${recipientAddr.slice(-4)}`
      : 'Stellar Vault';

  const now = new Date();
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let dueInLabel = 'Due in ' + diffDays + ' days';
  if (diffDays < 0) dueInLabel = `${Math.abs(diffDays)} days overdue`;
  else if (diffDays === 0) dueInLabel = 'Due today';
  else if (diffDays === 1) dueInLabel = 'Due tomorrow';

  if (status === 'paid') dueInLabel = 'Paid on Stellar';
  if (status === 'manual') dueInLabel = 'Marked paid';

  const isEur = occ.currency === 'EUR';
  const isSettled = status === 'paid' || status === 'manual';

  return {
    id: String(occ.id),
    name: occ.bill_name || 'Utility Bill',
    category: occ.bill_category || 'Utilities',
    frequency: 'monthly',
    subtitle: `${occ.bill_category || 'Service'} · Due ${dueDateLabel}`,
    billsSubtitle: `${occ.recipient_name || 'Utility Provider'} · Monthly cycle`,
    dueDateLabel,
    billsNextDueLabel: dueDateLabel,
    dueInLabel,
    billsStatusLabel:
      status === 'paid' ? 'Settled' : status === 'overdue' ? 'Overdue' : 'Pending',
    status,
    amount: amt,
    currency: occ.currency || 'USDC',
    actionType: isSettled ? 'status' : isEur ? 'mark' : 'pay',
    icon: getCategoryIcon(occ.bill_category || ''),
    recipientAddress: recipientAddr,
    recipientShort,
    payeeName: occ.recipient_name,
    description: occ.notes || `${occ.bill_name} payment occurrence #${occ.occurrence_number}`,
    memo: occ.payment_reference,
    inNext7Days: diffDays >= 0 && diffDays <= 7,
    inNext14Days: diffDays >= 0 && diffDays <= 14,
    inNext30Days: diffDays >= 0 && diffDays <= 30,
    billHistory: occ.transaction_hash
      ? [
          {
            id: `hist-${occ.id}`,
            cycleLabel: `Cycle #${occ.occurrence_number}`,
            dateSubLabel: dueDateLabel,
            method: occ.is_manual_paid ? 'manual' : 'stellar',
            methodLabel: occ.is_manual_paid ? 'Manual confirmation' : 'Stellar Testnet',
            txHashOrNote: occ.transaction_hash,
            amount: amt,
            currency: occ.currency || 'USDC',
          },
        ]
      : [],
  };
}

export function transformBackendPaymentRecord(rec: any): {
  historyItem: PaymentHistoryItem;
  detailedRecord: DetailedPaymentRecord;
} {
  const amt = typeof rec.amount === 'number' ? rec.amount : parseFloat(rec.amount);
  const createdDate = new Date(rec.created_at || rec.ledger_timestamp || Date.now());
  const monthYearStr = createdDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  }) as 'October 2026' | 'September 2026' | 'August 2026';

  const dateLabel = createdDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const timeLabel = createdDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const isConfirmed = rec.verification_status === 'CONFIRMED';
  const isFailed = rec.verification_status === 'FAILED';
  const statusKey = isConfirmed ? 'paid' : isFailed ? 'failed' : 'pending';
  const statusLabel = isConfirmed
    ? 'Paid on Stellar'
    : isFailed
    ? 'Failed'
    : 'Verifying on Horizon';

  const detailedStatus = isConfirmed ? 'verified' : isFailed ? 'failed' : 'verifying';
  const icon = getCategoryIcon(rec.bill_category || '');

  const historyItem: PaymentHistoryItem = {
    id: String(rec.id),
    billId: String(rec.bill || rec.occurrence || rec.id),
    name: rec.bill_name || 'Bill Payment',
    dateLabel,
    date: createdDate.toISOString(),
    amount: amt,
    currency: (rec.asset || 'USDC') as Currency,
    status: statusKey,
    statusLabel,
    icon,
    txHash: rec.transaction_hash || undefined,
  };

  const detailedRecord: DetailedPaymentRecord = {
    id: String(rec.id),
    billId: String(rec.bill || rec.occurrence || rec.id),
    billName: rec.bill_name || 'Bill Payment',
    billCycleLabel: `Cycle #${rec.occurrence_number || 1}`,
    icon,
    paidDateLabel: dateLabel,
    paidTimeLabel: timeLabel,
    paidTimestamp: createdDate.toISOString(),
    monthYear: monthYearStr,
    paymentMethod: rec.payment_method === 'MANUAL' ? 'bank' : 'stellar',
    paymentMethodLabel: rec.payment_method === 'MANUAL' ? 'Bank transfer' : 'Stellar wallet',
    txHashOrNote: rec.transaction_hash
      ? `${rec.transaction_hash.slice(0, 8)}...${rec.transaction_hash.slice(-6)}`
      : rec.payment_reference || 'Manual Payment',
    fullTxHash: rec.transaction_hash || undefined,
    isNote: !rec.transaction_hash,
    amount: amt,
    currency: (rec.asset || 'USDC') as Currency,
    status: detailedStatus,
    statusBadgeText: isConfirmed ? 'Verified on Stellar' : isFailed ? 'Failed' : 'Verifying',
    statusBadgeKind: isConfirmed ? 'verified' : isFailed ? 'failed' : 'verifying',
    recipientAddress: rec.recipient_address,
    recipientShort: rec.recipient_address
      ? `${rec.recipient_address.slice(0, 4)}...${rec.recipient_address.slice(-4)}`
      : undefined,
    payeeName: rec.bill_name,
    receiptNo: `REC-${String(rec.id).padStart(6, '0')}`,
    networkFee: '0.0000100 XLM',
    memo: rec.payment_reference,
    ledgerSequence: rec.ledger_sequence,
    failureReason: rec.error_message,
  };

  return { historyItem, detailedRecord };
}

export function transformBackendReminder(rem: any): ReminderItem {
  const amt = rem.bill_amount ? parseFloat(rem.bill_amount) : 0;
  const isOverdue = rem.reminder_type === 'OVERDUE';
  const isRead = !!rem.read_at || rem.status === 'READ';
  const created = new Date(rem.scheduled_for || rem.created_at || Date.now());

  let via: ReminderItem['via'] = 'app';
  if (rem.channel === 'EMAIL') via = 'email';
  if (rem.channel === 'BOTH') via = 'both';

  return {
    id: String(rem.id),
    billId: String(rem.bill || rem.occurrence || rem.id),
    billName: rem.bill_name || 'Payment Alert',
    icon: getCategoryIcon(''),
    tone: isOverdue ? 'overdue' : 'normal',
    isUnread: !isRead,
    status: isRead ? 'read' : rem.status === 'SENT' ? 'sent' : rem.status === 'FAILED' ? 'failed' : 'scheduled',
    statusBadge: isOverdue ? 'Overdue' : 'Scheduled',
    statusBadgeKind: isOverdue ? 'overdue' : 'upcoming',
    subtitle: rem.title || rem.message?.slice(0, 60) || 'Upcoming payment alert',
    timeLabel: created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    via,
    dueDateLabel: rem.occurrence_due_date || 'Due Soon',
    amount: amt,
    currency: (rem.bill_currency || 'USDC') as Currency,
    actionText: isRead ? undefined : 'Mark as read',
    isOverdueSection: isOverdue,
  };
}
