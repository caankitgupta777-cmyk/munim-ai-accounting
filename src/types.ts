export type AppTab = "home" | "chat" | "voucher" | "gst" | "calendar" | "financials" | "guide" | "queries";

export type Language = "en" | "hi" | "mr";

export interface QueryRecord {
  id: string;
  userId?: string;
  queryType: "advisor" | "voucher" | "ocr_scan" | "gst_calc" | "setoff" | "financials";
  title: string;
  queryText: string;
  resultSummary?: string;
  payload?: Record<string, any>;
  createdAt: string;
  status: "completed" | "failed";
  tags?: string[];
}

export type IndAsHeadType = 
  | "non_current_asset"
  | "current_asset"
  | "equity"
  | "non_current_liability"
  | "current_liability"
  | "revenue"
  | "expense"
  | "tax";

export type IndAsClassification =
  // Non-Current Assets
  | "PPE (Property, Plant & Equipment - Ind AS 16)"
  | "Right-of-Use Assets (Ind AS 116)"
  | "Intangible Assets (Ind AS 38)"
  | "Non-Current Investments & Financial Assets"
  // Current Assets
  | "Inventories (Ind AS 2)"
  | "Trade Receivables (Sundry Debtors)"
  | "Cash and Cash Equivalents"
  | "Bank Balances (Current / Savings)"
  | "Current Tax Assets (TDS Receivable / Advance Tax)"
  | "Other Current Assets (Input GST Credit / Prepaid Expenses)"
  // Equity
  | "Equity Share Capital / Owner's Capital"
  | "Owner's Drawings (Contra-Equity)"
  | "Other Equity (Reserves & Surplus / Retained Earnings)"
  // Non-Current Liabilities
  | "Long-Term Borrowings (Term Loans)"
  | "Deferred Tax Liabilities (Net) (Ind AS 12)"
  | "Lease Liabilities - Non-Current (Ind AS 116)"
  // Current Liabilities
  | "Short-Term Borrowings / Bank Overdraft"
  | "Trade Payables (MSME Vendors - Sec 43B(h))"
  | "Trade Payables (Other Creditors)"
  | "Other Current Liabilities (Contract Liabilities / Customer Advances Ind AS 115)"
  | "Statutory Dues Payable (Output GST / TDS Payable / PF)"
  | "Current Tax Liabilities (Provision for Income Tax)"
  // Revenue
  | "Revenue from Operations (Sales / Services - Ind AS 115)"
  | "Other Income (Interest / Discounts / Forex)"
  // Expenses
  | "Cost of Materials Consumed / Purchases (Ind AS 2)"
  | "Employee Benefits Expense (Salaries / Wages - Ind AS 19)"
  | "Finance Costs (Bank Interest / Loan Processing - Ind AS 23)"
  | "Depreciation and Amortisation Expense (Ind AS 16 / 38)"
  | "Other Operating Expenses (Rent, Professional Fees, Utilities)"
  // Tax Expense
  | "Current Tax Expense (Ind AS 12)"
  | "Deferred Tax Expense / (Income) (Ind AS 12)";

export interface LedgerAccountInput {
  id: string;
  accountName: string;
  classification: IndAsClassification;
  balanceType: "Debit" | "Credit";
  amount: number;
  notes?: string;
  confidence?: "high" | "medium" | "low";
  confidenceScore?: number; // 0 to 100
  reviewRequired?: boolean;
  classificationReason?: string;
}

export type EntityType = 
  | "Sole Proprietorship" 
  | "Private Limited Company" 
  | "Partnership Firm" 
  | "LLP (Limited Liability Partnership)" 
  | "One Person Company (OPC)";

export type AccountingBasis = "Accrual (Mercantile) Basis" | "Cash Basis";

export type TurnoverBracket = 
  | "Micro (< ₹1 Crore)" 
  | "Small (₹1 - ₹5 Crores)" 
  | "Medium (₹5 - ₹25 Crores)" 
  | "Growth (> ₹25 Crores)";

export interface BusinessProfile {
  companyId?: string;
  name?: string;
  currentFY?: string;
  entityType: EntityType;
  gstRegistered: boolean;
  gstin?: string;
  turnoverBracket: TurnoverBracket;
  accountingBasis: AccountingBasis;
  state: string;
}

export interface TaxDeadline {
  id: string;
  category: "GST" | "TDS" | "Advance Tax" | "ITR & Audit";
  formOrChallan: string;
  title: string;
  dueDate: string; // ISO date string YYYY-MM-DD
  frequency: "Monthly" | "Quarterly" | "Annual";
  periodCovered: string;
  applicableCondition: string;
  interestOrPenaltyNote: string;
  portalLinkText: string;
  portalUrl: string;
  actionSummary: string;
  isEligibleForProfile: (profile: BusinessProfile) => boolean;
}

export interface JournalEntryLine {
  accountName: string;
  category: "Asset" | "Liability" | "Expense" | "Revenue" | "Equity" | "ContraAsset" | "ContraEquity";
  debitAmount: number;
  creditAmount: number;
  reason: string;
}

export interface VoucherValidationResult {
  isValid: boolean;
  mathematicallyBalanced: boolean;
  gstValidated: boolean;
  tdsValidated: boolean;
  confidence: number; // 0 to 100
  caReviewRequired: boolean;
  checksPassed: string[];
  warnings: string[];
  errors?: string[];
}

export type SubscriptionTier = "Free" | "Student" | "CA_Pro";

export interface CompanyMaster {
  id: string;
  userId: string;
  name: string;
  legalConstitution: EntityType;
  gstin?: string;
  pan?: string;
  state: string;
  stateCode: string;
  isGstRegistered: boolean;
  accountingBasis: AccountingBasis;
  turnoverBracket: TurnoverBracket;
  currentFY: string;
  supportedFYs: string[];
  createdAt: string;
}

export interface FeedbackSubmission {
  id: string;
  userId: string;
  type: "bug" | "feature" | "rating" | "accounting_query" | "general";
  module?: string;
  rating?: number; // 1 to 5
  title: string;
  description: string;
  contactEmail?: string;
  createdAt: string;
  userAgent?: string;
}

export interface GstLineItem {
  id: string;
  description: string;
  hsnSac: string;
  taxableAmount: number;
  gstRate: number; // 0, 0.25, 3, 5, 12, 18, 28
  isRcm?: boolean;
  isBlockedItc?: boolean;
  blockedItcReason?: string;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface GstCalculationResult {
  supplierStateCode: string;
  recipientStateCode: string;
  isInterState: boolean;
  taxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  invoiceTotal: number;
  roundedInvoiceTotal: number;
  roundingDifference: number;
  rcmApplicable: boolean;
  rcmTaxAmount: number;
  itcClaimable: number;
  itcBlocked: number;
  items: GstLineItem[];
  warnings: string[];
  complianceNotes: string[];
  errors?: string[];
}

export interface TdsCalculationResult {
  applicable: boolean;
  section: string;
  rate: number;
  threshold: number;
  thresholdExceeded: boolean;
  taxableTdsBase: number;
  tdsAmount: number;
  reason: string;
  lawVersion: "Income-tax Act, 1961" | "Income-tax Act, 2025";
  sectionDisplay: string;
  challanCode: string;
  dueDate: string;
}

export interface StructuredVoucher {
  voucherType: string;
  plainSummary: string;
  entries: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  narration: string;
  validationStatus?: VoucherValidationResult;
  gstBreakdown?: {
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    itcEligible: boolean;
    itcNote: string;
  };
  tdsBreakdown?: {
    applicable: boolean;
    section: string;
    rate: number;
    tdsAmount: number;
    challanCode: string;
    dueDate: string;
    thresholdUsed?: number;
    thresholdExceeded?: boolean;
    lawVersion?: string;
  };
  indAsReference: {
    standardCode: string;
    title: string;
    keyPrinciple: string;
  };
  incomeTaxRule: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  voucher?: StructuredVoucher;
}

export interface ScenarioPreset {
  id: string;
  title: string;
  category: "GST" | "TDS" | "Ind AS" | "Income Tax" | "Day-to-Day" | "Provisions";
  tag: string;
  prompt: string;
}

export interface ReceiptLineItem {
  name: string;
  quantity?: number;
  price: number;
}

export interface ScannedReceiptData {
  merchant: string;
  date: string; // YYYY-MM-DD
  amount: number;
  taxableAmount?: number;
  invoiceNumber?: string;
  gstin?: string;
  gstRate?: number;
  gstType?: "Intra-state (CGST + SGST)" | "Inter-state (IGST)";
  cgst?: number;
  sgst?: number;
  igst?: number;
  category: string;
  suggestedExpenseAccount: string;
  paymentMode: "Bank / UPI / Card" | "Cash";
  tdsSection: string;
  section43BhRelevant?: boolean;
  complianceNotes?: string;
  confidence?: "high" | "medium" | "low";
  yearUncertain?: boolean;
  items?: ReceiptLineItem[];
}
