export type Currency = 'USDC' | 'XLM' | 'EUR';

export type BillStatus = 'overdue' | 'soon' | 'pending' | 'upcoming' | 'paid' | 'manual';

export type BillIconType = 'wifi' | 'bolt' | 'monitor' | 'shield' | 'house' | 'drop' | 'grad' | 'building' | 'receipt';

export interface BillHistoryRecord {
  id: string;
  cycleLabel: string;
  dateSubLabel: string;
  method: 'stellar' | 'manual' | 'failed';
  methodLabel: string;
  txHashOrNote: string;
  amount: number;
  currency: Currency;
}

export interface BillItem {
  id: string;
  name: string;
  category: string;
  frequency: 'monthly' | 'quarterly';
  subtitle: string;
  billsSubtitle: string;
  dueDateLabel: string;
  billsNextDueLabel?: string;
  dueInLabel: string;
  billsStatusLabel?: string;
  status: BillStatus;
  amount: number;
  billsAmount?: number;
  currency: Currency;
  billsCurrency?: Currency;
  actionType: 'pay' | 'status' | 'mark';
  icon: BillIconType;
  failureReason?: string;
  warningReason?: string;
  recipientAddress: string;
  recipientShort: string;
  inNext7Days?: boolean;
  inNext14Days?: boolean;
  inNext30Days?: boolean;
  // Detailed fields for Screen 6 (Bill Details)
  payeeName?: string;
  memo?: string;
  repeatsText?: string;
  startedDate?: string;
  endsText?: string;
  description?: string;
  reminderSentText?: string;
  reminderWhen?: string;
  reminderWhere?: string;
  reminderOverdue?: string;
  billHistory?: BillHistoryRecord[];
}

export interface PaymentHistoryItem {
  id: string;
  billId: string;
  name: string;
  dateLabel: string;
  date?: string;
  amount: number;
  currency: Currency;
  status: 'pending' | 'failed' | 'paid' | 'manual';
  statusLabel: string;
  icon: BillIconType;
  txHash?: string;
}

export interface MonthlyExpensePoint {
  month: string;
  fullMonth: string;
  USDC: number;
  XLM: number;
  EUR: number;
  isCurrentSoFar?: boolean;
}

export interface CategoryBreakdownItem {
  category: string;
  billsCount: number;
  amount: number;
  percentage: number;
  color: string;
  borderColor?: string;
  currency: Currency;
}

export const INITIAL_WALLET = {
  addressShort: 'GBZX…Q4PA',
  addressFull: 'GBZX7K4M9J2RT8LP5V3N6WQ2C9X7H4Y8B5D2E6F9Q4PA',
  address: 'GBZXK3QF7VJ2N4HT6LRAWMOE5YCBP8DS2UGNI3XQ',
  network: 'Stellar Testnet',
  connected: true,
  connectedProvider: 'Freighter',
  balances: {
    USDC: 312.50,
    XLM: 85.20,
    EUR: 210.00,
  },
};

export type WalletState = typeof INITIAL_WALLET;

export const INITIAL_BILLS: BillItem[] = [
  {
    id: 'bill-fibre',
    name: 'Fibre internet',
    category: 'Internet',
    frequency: 'monthly',
    subtitle: 'Internet, monthly',
    billsSubtitle: 'Internet · Monthly',
    dueDateLabel: 'Sun 18 Oct',
    dueInLabel: '2 days overdue',
    status: 'overdue',
    amount: 25.00,
    currency: 'USDC',
    actionType: 'pay',
    icon: 'wifi',
    failureReason: 'Last attempt failed: wallet was short',
    recipientAddress: 'GD4F8X2K9LM4NP7Q2R5T8V3W6Y9Z2B4D6F8H2J4KW2NK',
    recipientShort: 'GD4F…W2NK',
    inNext7Days: true,
    inNext14Days: true,
    inNext30Days: true,
    payeeName: 'Hyperion Fibre Networks',
    memo: 'FIBRE-1810-9921',
    repeatsText: 'Every month on the 18th',
    startedDate: 'Mon 18 May 2026',
    endsText: 'No end date',
    description: 'Home gigabit fibre broadband plan.',
    reminderSentText: 'Overdue reminder sent today, 2 days after due date',
    reminderWhen: '3 days before, on due date',
    reminderWhere: 'In-app and email',
    reminderOverdue: 'Every 2 days',
  },
  {
    id: 'bill-electricity',
    name: 'Home electricity',
    category: 'Electricity',
    frequency: 'monthly',
    subtitle: 'Electricity, monthly',
    billsSubtitle: 'Electricity · Monthly',
    dueDateLabel: 'Fri 23 Oct',
    dueInLabel: 'Due in 3 days',
    status: 'soon',
    amount: 38.50,
    currency: 'USDC',
    actionType: 'pay',
    icon: 'bolt',
    recipientAddress: 'GBQE5P8M2K7N4Q9R3T6V8W2Y5Z7B9D4F6H8J2L4M7HDN',
    recipientShort: 'GBQE…7HDN',
    inNext7Days: true,
    inNext14Days: true,
    inNext30Days: true,
    payeeName: 'Brightline Power',
    memo: 'ELEC-2210-0457',
    repeatsText: 'Every month on the 23rd',
    startedDate: 'Tue 23 Jun 2026',
    endsText: 'No end date',
    description: 'Prepaid meter top-up for the flat.',
    reminderSentText: 'Reminder sent today, 3 days before due date',
    reminderWhen: '3 days before, on due date',
    reminderWhere: 'In-app and email',
    reminderOverdue: 'Every 2 days',
    billHistory: [
      {
        id: 'bh-1',
        cycleLabel: '23 Sep bill',
        dateSubLabel: 'Paid Mon 21 Sep, 2 days early',
        method: 'stellar',
        methodLabel: 'Paid on Stellar',
        txHashOrNote: '7c1e…3a90',
        amount: 38.50,
        currency: 'USDC',
      },
      {
        id: 'bh-2',
        cycleLabel: '23 Aug bill',
        dateSubLabel: 'Paid Sat 22 Aug, 1 day early',
        method: 'stellar',
        methodLabel: 'Paid on Stellar',
        txHashOrNote: '4a8b…9d12',
        amount: 38.50,
        currency: 'USDC',
      },
      {
        id: 'bh-3',
        cycleLabel: '23 Jul bill',
        dateSubLabel: 'Paid Thu 23 Jul',
        method: 'manual',
        methodLabel: 'Marked paid by you',
        txHashOrNote: 'Paid by card while travelling',
        amount: 38.50,
        currency: 'USDC',
      },
      {
        id: 'bh-4',
        cycleLabel: '23 Jun bill',
        dateSubLabel: 'Paid Wed 24 Jun, 1 day late',
        method: 'manual',
        methodLabel: 'Marked paid by you',
        txHashOrNote: 'Paid after failed attempt',
        amount: 38.50,
        currency: 'USDC',
      },
      {
        id: 'bh-5',
        cycleLabel: '23 Jun bill',
        dateSubLabel: 'Tried Tue 23 Jun',
        method: 'failed',
        methodLabel: 'Payment failed',
        txHashOrNote: 'Wallet was short',
        amount: 38.50,
        currency: 'USDC',
      },
    ],
  },
  {
    id: 'bill-design',
    name: 'Design software',
    category: 'Subscriptions',
    frequency: 'monthly',
    subtitle: 'Subscriptions, monthly',
    billsSubtitle: 'Subscriptions · Monthly',
    dueDateLabel: 'Mon 26 Oct',
    dueInLabel: 'Verifying',
    status: 'pending',
    amount: 18.00,
    currency: 'USDC',
    actionType: 'status',
    icon: 'monitor',
    recipientAddress: 'GDS49L3M7P2K5N8Q4R7T2V5W8Y3Z6B9D2F5H8J3KM2PA',
    recipientShort: 'GDS4…M2PA',
    inNext7Days: true,
    inNext14Days: true,
    inNext30Days: true,
    payeeName: 'Figma Studio Pro',
    memo: 'SUB-2610-8840',
    repeatsText: 'Every month on the 26th',
    startedDate: 'Fri 26 Jun 2026',
    endsText: 'No end date',
    description: 'Professional design seat & prototyping suite.',
    reminderSentText: 'Payment submitted today at 2:41 pm · Verifying on Stellar',
    reminderWhen: '3 days before, on due date',
    reminderWhere: 'In-app and email',
    reminderOverdue: 'Every 2 days',
  },
  {
    id: 'bill-insurance',
    name: 'Health insurance',
    category: 'Insurance',
    frequency: 'monthly',
    subtitle: 'Insurance, monthly',
    billsSubtitle: 'Insurance · Monthly',
    dueDateLabel: 'Fri 30 Oct',
    dueInLabel: 'Due in 10 days',
    status: 'upcoming',
    amount: 140.00,
    currency: 'XLM',
    actionType: 'pay',
    icon: 'shield',
    warningReason: 'Wallet short by 56.30 XLM',
    recipientAddress: 'GAH64M8N2P6Q9R3T7V2W5Y8Z4B7D2F5H9J3K6L8MQ9TC',
    recipientShort: 'GAH6…Q9TC',
    inNext7Days: false,
    inNext14Days: true,
    inNext30Days: true,
    payeeName: 'Aegis Mutual Health',
    memo: 'HLTH-3010-1129',
    repeatsText: 'Every month on the 30th',
    startedDate: 'Thu 30 Apr 2026',
    endsText: 'No end date',
    description: 'Comprehensive personal medical & dental cover.',
    reminderSentText: 'Next reminder scheduled for Tue 27 Oct (3 days before)',
    reminderWhen: '3 days before, on due date',
    reminderWhere: 'In-app and email',
    reminderOverdue: 'Every 2 days',
  },
  {
    id: 'bill-rent-nov',
    name: 'Flat rent',
    category: 'Rent',
    frequency: 'monthly',
    subtitle: 'Rent, monthly',
    billsSubtitle: 'Rent · Monthly',
    dueDateLabel: 'Sun 1 Nov',
    dueInLabel: 'Due in 10 days',
    status: 'upcoming',
    amount: 450.00,
    currency: 'USDC',
    actionType: 'pay',
    icon: 'house',
    recipientAddress: 'GC7K7P3Q8R2T6V9W4Y7Z2B5D8F3H6J9K2L5M8N3PX2LM',
    recipientShort: 'GC7K…X2LM',
    inNext7Days: false,
    inNext14Days: true,
    inNext30Days: true,
    payeeName: 'Oakwood Property Management',
    memo: 'RENT-APT4B-NOV',
    repeatsText: 'Every month on the 1st',
    startedDate: 'Fri 1 May 2026',
    endsText: 'No end date',
    description: 'Monthly apartment lease for Flat 4B.',
    reminderSentText: 'Next reminder scheduled for Thu 29 Oct (3 days before)',
    reminderWhen: '3 days before, on due date',
    reminderWhere: 'In-app and email',
    reminderOverdue: 'Every 2 days',
  },
  {
    id: 'bill-water-nov',
    name: 'Water',
    category: 'Water',
    frequency: 'monthly',
    subtitle: 'Monthly · you pay directly',
    billsSubtitle: 'Water · Monthly',
    dueDateLabel: 'Tue 3 Nov',
    dueInLabel: 'Due in 10 days',
    status: 'upcoming',
    amount: 45.00,
    currency: 'EUR',
    actionType: 'mark',
    icon: 'drop',
    recipientAddress: 'Direct bank / utility transfer',
    recipientShort: 'You pay directly',
    inNext7Days: false,
    inNext14Days: true,
    inNext30Days: true,
    payeeName: 'Municipal Water Works',
    memo: 'WTR-0311-DIRECT',
    repeatsText: 'Every month on the 3rd',
    startedDate: 'Sun 3 May 2026',
    endsText: 'No end date',
    description: 'Direct SEPA utility bill tracked manually in Billza.',
    reminderSentText: 'Next reminder scheduled for Sat 31 Oct (3 days before)',
    reminderWhen: '3 days before, on due date',
    reminderWhere: 'In-app and email',
    reminderOverdue: 'Every 2 days',
  },
  {
    id: 'bill-school',
    name: 'School fees',
    category: 'Education',
    frequency: 'quarterly',
    subtitle: 'Education, quarterly',
    billsSubtitle: 'Education · Quarterly',
    dueDateLabel: 'Thu 5 Nov',
    dueInLabel: 'Due in 10 days',
    status: 'upcoming',
    amount: 140.00,
    billsAmount: 300.00,
    currency: 'XLM',
    billsCurrency: 'USDC',
    actionType: 'pay',
    icon: 'grad',
    recipientAddress: 'GBN22N5P8Q3R6T9V4W7Y2Z5B8D3F6H9J4K7L2M5NT7WQ',
    recipientShort: 'GBN2…T7WQ',
    inNext7Days: false,
    inNext14Days: false,
    inNext30Days: true,
    payeeName: 'St. Jude Academy',
    memo: 'TERM-Q4-2026',
    repeatsText: 'Every quarter on the 5th',
    startedDate: 'Thu 5 Feb 2026',
    endsText: 'No end date',
    description: 'Quarterly tuition and laboratory contribution.',
    reminderSentText: 'Next reminder scheduled for Mon 2 Nov (3 days before)',
    reminderWhen: '3 days before, on due date',
    reminderWhere: 'In-app and email',
    reminderOverdue: 'Every 2 days',
  },
  {
    id: 'bill-office-internet',
    name: 'Office internet',
    category: 'Business utilities',
    frequency: 'quarterly',
    subtitle: 'Business utilities, quarterly',
    billsSubtitle: 'Business utilities · Quarterly',
    dueDateLabel: 'Mon 12 Oct',
    billsNextDueLabel: 'Tue 12 Jan',
    dueInLabel: 'Paid on Stellar',
    billsStatusLabel: 'Paid this quarter',
    status: 'paid',
    amount: 30.00,
    currency: 'USDC',
    actionType: 'pay',
    icon: 'building',
    recipientAddress: 'GCO36Q9R4T7V2W5Y8Z3B6D9F2H5J8K3L6M9N2P5QP8LZ',
    recipientShort: 'GCO3…P8LZ',
    inNext7Days: false,
    inNext14Days: false,
    inNext30Days: false,
    payeeName: 'Metro Business Fibre',
    memo: 'BIZ-Q4-0192',
    repeatsText: 'Every quarter on the 12th',
    startedDate: 'Mon 12 Jan 2026',
    endsText: 'No end date',
    description: 'Dedicated co-working studio internet line.',
    reminderSentText: 'Paid on Stellar on Mon 12 Oct · Next due Tue 12 Jan',
    reminderWhen: '3 days before, on due date',
    reminderWhere: 'In-app and email',
    reminderOverdue: 'Every 2 days',
  },
];

export const INITIAL_PAYMENTS: PaymentHistoryItem[] = [
  {
    id: 'pay-1',
    billId: 'bill-design',
    name: 'Design software',
    dateLabel: 'Today, 2:41 pm',
    amount: 18.00,
    currency: 'USDC',
    status: 'pending',
    statusLabel: 'Verifying',
    icon: 'monitor',
    txHash: '8f3e9b2a4c1d7e6f5a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d',
  },
  {
    id: 'pay-2',
    billId: 'bill-fibre',
    name: 'Fibre internet',
    dateLabel: 'Mon 19 Oct',
    amount: 25.00,
    currency: 'USDC',
    status: 'failed',
    statusLabel: 'Payment failed',
    icon: 'wifi',
    txHash: '4d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e',
  },
  {
    id: 'pay-3',
    billId: 'bill-office-internet',
    name: 'Office internet',
    dateLabel: 'Mon 12 Oct',
    amount: 30.00,
    currency: 'USDC',
    status: 'paid',
    statusLabel: 'Paid on Stellar',
    icon: 'building',
    txHash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f',
  },
  {
    id: 'pay-4',
    billId: 'bill-water-oct',
    name: 'Water',
    dateLabel: 'Sat 3 Oct',
    amount: 45.00,
    currency: 'EUR',
    status: 'manual',
    statusLabel: 'Marked paid',
    icon: 'drop',
  },
  {
    id: 'pay-5',
    billId: 'bill-rent-oct',
    name: 'Flat rent',
    dateLabel: 'Thu 1 Oct',
    amount: 450.00,
    currency: 'USDC',
    status: 'paid',
    statusLabel: 'Paid on Stellar',
    icon: 'house',
    txHash: '1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
  },
];

export const MONTHLY_EXPENSES_6M: MonthlyExpensePoint[] = [
  { month: 'May', fullMonth: 'May', USDC: 462.00, XLM: 120.00, EUR: 42.00 },
  { month: 'Jun', fullMonth: 'June', USDC: 495.00, XLM: 135.00, EUR: 44.00 },
  { month: 'Jul', fullMonth: 'July', USDC: 470.00, XLM: 125.00, EUR: 45.00 },
  { month: 'Aug', fullMonth: 'August', USDC: 505.00, XLM: 140.00, EUR: 43.50 },
  { month: 'Sep', fullMonth: 'September', USDC: 535.00, XLM: 150.00, EUR: 46.00 },
  { month: 'Oct', fullMonth: 'October', USDC: 480.00, XLM: 0.00, EUR: 45.00, isCurrentSoFar: true },
];

export const MONTHLY_EXPENSES_12M: MonthlyExpensePoint[] = [
  { month: 'Nov', fullMonth: 'November', USDC: 455.00, XLM: 115.00, EUR: 40.00 },
  { month: 'Dec', fullMonth: 'December', USDC: 510.00, XLM: 140.00, EUR: 48.00 },
  { month: 'Jan', fullMonth: 'January', USDC: 475.00, XLM: 125.00, EUR: 42.00 },
  { month: 'Feb', fullMonth: 'February', USDC: 468.00, XLM: 120.00, EUR: 41.00 },
  { month: 'Mar', fullMonth: 'March', USDC: 488.00, XLM: 130.00, EUR: 44.00 },
  { month: 'Apr', fullMonth: 'April', USDC: 479.00, XLM: 128.00, EUR: 43.00 },
  ...MONTHLY_EXPENSES_6M,
];

export const USDC_CATEGORIES: CategoryBreakdownItem[] = [
  {
    category: 'Rent',
    billsCount: 1,
    amount: 450.00,
    percentage: 80.1,
    color: '#0B1530',
    currency: 'USDC',
  },
  {
    category: 'Electricity',
    billsCount: 1,
    amount: 38.50,
    percentage: 6.9,
    color: '#4164D9',
    currency: 'USDC',
  },
  {
    category: 'Business utilities',
    billsCount: 1,
    amount: 30.00,
    percentage: 5.3,
    color: '#7B96F0',
    currency: 'USDC',
  },
  {
    category: 'Internet',
    billsCount: 1,
    amount: 25.00,
    percentage: 4.5,
    color: '#B7C2D9',
    currency: 'USDC',
  },
  {
    category: 'Subscriptions',
    billsCount: 1,
    amount: 18.00,
    percentage: 3.2,
    color: '#E6ECFB',
    borderColor: '#77839F',
    currency: 'USDC',
  },
];

export const XLM_CATEGORIES: CategoryBreakdownItem[] = [
  {
    category: 'Insurance',
    billsCount: 1,
    amount: 140.00,
    percentage: 100.0,
    color: '#4164D9',
    currency: 'XLM',
  },
];

export const EUR_CATEGORIES: CategoryBreakdownItem[] = [
  {
    category: 'Water',
    billsCount: 1,
    amount: 45.00,
    percentage: 100.0,
    color: '#0B1530',
    currency: 'EUR',
  },
];
