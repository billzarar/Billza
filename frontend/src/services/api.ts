/**
 * Billza API Client Service
 * Communicates with the Django REST Framework backend API.
 */

import { BillItem, PaymentHistoryItem, Currency, BillIconType, BillStatus } from '../data/initialData';
import { ReminderItem } from '../data/remindersData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  wallet_address?: string;
  preferred_currency?: Currency;
  is_verified?: boolean;
}

export interface AuthTokens {
  access: string;
  refresh?: string;
  user?: AuthUser;
}

// Token storage helpers
export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('billza_access_token');
};

export const setStoredToken = (token: string, user?: AuthUser) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('billza_access_token', token);
  if (user) {
    localStorage.setItem('billza_user', JSON.stringify(user));
  }
};

export const clearStoredAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('billza_access_token');
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
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

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
    const message = errorData.error || errorData.detail || (typeof errorData === 'object' ? Object.values(errorData).flat().join(' ') : 'Request failed');
    throw new Error(message || `API error ${response.status}`);
  }

  return response.json();
}

// ==========================================
// Authentication APIs
// ==========================================

export async function loginUser(email: string, password: string): Promise<AuthTokens> {
  const data = await apiRequest<AuthTokens>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.access) {
    setStoredToken(data.access, data.user);
  }
  return data;
}

export async function registerUser(email: string, password: string, fullName: string): Promise<AuthTokens> {
  const data = await apiRequest<AuthTokens>('/auth/register/', {
    method: 'POST',
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  if (data.access) {
    setStoredToken(data.access, data.user);
  }
  return data;
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
  const data = await apiRequest<AuthTokens>('/auth/wallet/verify/', {
    method: 'POST',
    body: JSON.stringify({
      wallet_address: walletAddress,
      nonce,
      signature,
    }),
  });
  if (data.access) {
    setStoredToken(data.access, data.user);
  }
  return data;
}

export async function getUserProfile(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/profile/');
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
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'FAILED' | 'CANCELLED';
  is_manual_paid: boolean;
  payment_reference: string;
  paid_at?: string;
  transaction_hash?: string;
  notes?: string;
  recipient_stellar_address: string;
  recipient_name: string;
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

export async function markOccurrencePaidApi(occurrenceId: number | string): Promise<any> {
  return apiRequest(`/bills/occurrences/${occurrenceId}/mark-paid/`, {
    method: 'POST',
  });
}

export async function snoozeOccurrenceApi(occurrenceId: number | string, days: number = 3): Promise<any> {
  return apiRequest(`/bills/occurrences/${occurrenceId}/snooze/`, {
    method: 'POST',
    body: JSON.stringify({ days }),
  });
}

export async function createBillApi(billData: {
  name: string;
  category: string;
  description?: string;
  amount: number;
  currency: Currency;
  recipient_name: string;
  recipient_stellar_address: string;
  frequency: 'MONTHLY' | 'WEEKLY' | 'QUARTERLY' | 'YEARLY' | 'ONCE';
  due_date: string;
}): Promise<any> {
  return apiRequest('/bills/', {
    method: 'POST',
    body: JSON.stringify(billData),
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

export async function preparePaymentApi(occurrenceId: number | string, payerAddress?: string): Promise<any> {
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

// ==========================================
// Dashboard Overview API
// ==========================================

export async function fetchDashboardOverview(): Promise<any> {
  try {
    return await apiRequest('/dashboard/overview/');
  } catch (err) {
    console.warn('[API] Could not fetch dashboard overview:', err);
    return null;
  }
}

// ==========================================
// Data Transformation Helpers
// ==========================================

function getCategoryIcon(cat: string): BillIconType {
  const c = cat.toLowerCase();
  if (c.includes('internet') || c.includes('wifi') || c.includes('telecom')) return 'wifi';
  if (c.includes('electric') || c.includes('power')) return 'bolt';
  if (c.includes('water')) return 'drop';
  if (c.includes('rent') || c.includes('housing')) return 'house';
  if (c.includes('insurance')) return 'shield';
  if (c.includes('software') || c.includes('saas') || c.includes('stream')) return 'monitor';
  return 'building';
}

function mapStatus(status: string, isManualPaid: boolean, dueDateStr: string): BillStatus {
  if (isManualPaid) return 'manual';
  const s = status.toUpperCase();
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
  const dueDateLabel = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const recipientAddr = occ.recipient_stellar_address || 'GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q';
  const recipientShort = `${recipientAddr.slice(0, 4)}...${recipientAddr.slice(-4)}`;

  return {
    id: String(occ.id),
    name: occ.bill_name || 'Utility Bill',
    category: occ.bill_category || 'Utilities',
    frequency: 'monthly',
    subtitle: `${occ.bill_category || 'Service'} · Due ${dueDateLabel}`,
    billsSubtitle: `${occ.recipient_name || 'Utility Provider'} · Monthly cycle`,
    dueDateLabel,
    billsNextDueLabel: dueDateLabel,
    dueInLabel: status === 'overdue' ? 'Overdue' : 'Due Soon',
    billsStatusLabel: status === 'paid' ? 'Settled' : status === 'overdue' ? 'Overdue' : 'Pending',
    status,
    amount: amt,
    currency: occ.currency || 'USDC',
    actionType: status === 'paid' || status === 'manual' ? 'status' : 'pay',
    icon: getCategoryIcon(occ.bill_category || ''),
    recipientAddress: recipientAddr,
    recipientShort,
    payeeName: occ.recipient_name,
    description: occ.notes || `${occ.bill_name} payment occurrence #${occ.occurrence_number}`,
  };
}
