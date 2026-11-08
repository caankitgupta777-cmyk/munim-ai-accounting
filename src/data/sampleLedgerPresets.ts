import { LedgerAccountInput, IndAsClassification } from "../types";

export interface ClassificationMeta {
  section: 
    | "BS_NCA" // Non-Current Assets
    | "BS_CA"  // Current Assets
    | "BS_EQ"  // Equity
    | "BS_NCL" // Non-Current Liabilities
    | "BS_CL"  // Current Liabilities
    | "PL_REV" // Revenue
    | "PL_EXP" // Expenses
    | "PL_TAX"; // Tax Expense
  label: string;
  normalBalance: "Debit" | "Credit";
  indAsNote: string;
}

export const IND_AS_CLASSIFICATIONS_META: Record<IndAsClassification, ClassificationMeta> = {
  // Non-Current Assets
  "PPE (Property, Plant & Equipment - Ind AS 16)": {
    section: "BS_NCA",
    label: "Property, Plant & Equipment",
    normalBalance: "Debit",
    indAsNote: "Ind AS 16: Measured at cost less accumulated depreciation and impairment.",
  },
  "Right-of-Use Assets (Ind AS 116)": {
    section: "BS_NCA",
    label: "Right-of-Use Assets",
    normalBalance: "Debit",
    indAsNote: "Ind AS 116: Capitalized value of long-term leased premises/assets.",
  },
  "Intangible Assets (Ind AS 38)": {
    section: "BS_NCA",
    label: "Intangible Assets",
    normalBalance: "Debit",
    indAsNote: "Ind AS 38: Software licenses, patents, and trademarks.",
  },
  "Non-Current Investments & Financial Assets": {
    section: "BS_NCA",
    label: "Non-Current Investments",
    normalBalance: "Debit",
    indAsNote: "Ind AS 109: Security deposits, long-term bonds, and equity holdings.",
  },

  // Current Assets
  "Inventories (Ind AS 2)": {
    section: "BS_CA",
    label: "Inventories (Finished Goods & Materials)",
    normalBalance: "Debit",
    indAsNote: "Ind AS 2: Valued at lower of cost and net realizable value (NRV).",
  },
  "Trade Receivables (Sundry Debtors)": {
    section: "BS_CA",
    label: "Trade Receivables",
    normalBalance: "Debit",
    indAsNote: "Ind AS 109: Customer invoice balances subject to Expected Credit Loss (ECL).",
  },
  "Cash and Cash Equivalents": {
    section: "BS_CA",
    label: "Cash on Hand",
    normalBalance: "Debit",
    indAsNote: "Ind AS 7: Highly liquid cash or petty cash.",
  },
  "Bank Balances (Current / Savings)": {
    section: "BS_CA",
    label: "Bank Balances",
    normalBalance: "Debit",
    indAsNote: "Balances with scheduled commercial banks.",
  },
  "Current Tax Assets (TDS Receivable / Advance Tax)": {
    section: "BS_CA",
    label: "Current Tax Assets (TDS / Advance Tax)",
    normalBalance: "Debit",
    indAsNote: "Ind AS 12: Income tax paid in advance and TDS deducted by clients u/s 194J/194C.",
  },
  "Other Current Assets (Input GST Credit / Prepaid Expenses)": {
    section: "BS_CA",
    label: "Other Current Assets (Input GST / Prepaids)",
    normalBalance: "Debit",
    indAsNote: "Electronic Credit Ledger balance (IGST/CGST/SGST) & prepaid expenses.",
  },

  // Equity
  "Equity Share Capital / Owner's Capital": {
    section: "BS_EQ",
    label: "Capital / Contributed Equity",
    normalBalance: "Credit",
    indAsNote: "Ind AS 1: Paid-up equity capital or proprietor capital introduced.",
  },
  "Owner's Drawings (Contra-Equity)": {
    section: "BS_EQ",
    label: "Owner's Drawings (Contra-Equity)",
    normalBalance: "Debit",
    indAsNote: "Personal withdrawals reducing total proprietor equity.",
  },
  "Other Equity (Reserves & Surplus / Retained Earnings)": {
    section: "BS_EQ",
    label: "Other Equity & Retained Earnings",
    normalBalance: "Credit",
    indAsNote: "Ind AS 1: Accumulated past profits and statutory reserves.",
  },

  // Non-Current Liabilities
  "Long-Term Borrowings (Term Loans)": {
    section: "BS_NCL",
    label: "Long-Term Borrowings",
    normalBalance: "Credit",
    indAsNote: "Ind AS 109: Secured bank term loans due after 12 months.",
  },
  "Deferred Tax Liabilities (Net) (Ind AS 12)": {
    section: "BS_NCL",
    label: "Deferred Tax Liabilities (Net)",
    normalBalance: "Credit",
    indAsNote: "Ind AS 12: Timing differences between accounting and tax depreciation.",
  },
  "Lease Liabilities - Non-Current (Ind AS 116)": {
    section: "BS_NCL",
    label: "Non-Current Lease Liabilities",
    normalBalance: "Credit",
    indAsNote: "Ind AS 116: Present value of future lease payments due after 12 months.",
  },

  // Current Liabilities
  "Short-Term Borrowings / Bank Overdraft": {
    section: "BS_CL",
    label: "Short-Term Borrowings & Overdraft",
    normalBalance: "Credit",
    indAsNote: "Bank Cash Credit (CC) / Overdraft facility.",
  },
  "Trade Payables (MSME Vendors - Sec 43B(h))": {
    section: "BS_CL",
    label: "Trade Payables (Micro & Small Enterprises - MSME)",
    normalBalance: "Credit",
    indAsNote: "Mandatory Schedule III disclosure & Sec 43B(h) 45-day payment tracking.",
  },
  "Trade Payables (Other Creditors)": {
    section: "BS_CL",
    label: "Trade Payables (Other Creditors)",
    normalBalance: "Credit",
    indAsNote: "Amounts due to large vendors and non-MSME suppliers.",
  },
  "Other Current Liabilities (Contract Liabilities / Customer Advances Ind AS 115)": {
    section: "BS_CL",
    label: "Contract Liabilities (Customer Advances)",
    normalBalance: "Credit",
    indAsNote: "Ind AS 115: Unearned revenue / advances received for pending performance obligations.",
  },
  "Statutory Dues Payable (Output GST / TDS Payable / PF)": {
    section: "BS_CL",
    label: "Statutory Dues Payable (GST / TDS / PF)",
    normalBalance: "Credit",
    indAsNote: "Output GST payable via Challan PMT-06 and TDS payable via Challan 281.",
  },
  "Current Tax Liabilities (Provision for Income Tax)": {
    section: "BS_CL",
    label: "Current Tax Liabilities (Provision for Tax)",
    normalBalance: "Credit",
    indAsNote: "Ind AS 12: Estimated income tax payable for the current period.",
  },

  // Revenue
  "Revenue from Operations (Sales / Services - Ind AS 115)": {
    section: "PL_REV",
    label: "Revenue from Operations (Gross Invoiced)",
    normalBalance: "Credit",
    indAsNote: "Ind AS 115: Recognised upon satisfaction of performance obligations.",
  },
  "Other Income (Interest / Discounts / Forex)": {
    section: "PL_REV",
    label: "Other Income",
    normalBalance: "Credit",
    indAsNote: "Bank interest, discount received, and non-operational gains.",
  },

  // Expenses
  "Cost of Materials Consumed / Purchases (Ind AS 2)": {
    section: "PL_EXP",
    label: "Cost of Materials & Direct Purchases",
    normalBalance: "Debit",
    indAsNote: "Ind AS 2: Direct material cost / sub-contracting expenses.",
  },
  "Employee Benefits Expense (Salaries / Wages - Ind AS 19)": {
    section: "PL_EXP",
    label: "Employee Benefits Expense",
    normalBalance: "Debit",
    indAsNote: "Ind AS 19: Gross salaries, employer PF/ESI contributions, and staff welfare.",
  },
  "Finance Costs (Bank Interest / Loan Processing - Ind AS 23)": {
    section: "PL_EXP",
    label: "Finance Costs",
    normalBalance: "Debit",
    indAsNote: "Ind AS 23: Interest on term loans, bank charges, and lease finance cost.",
  },
  "Depreciation and Amortisation Expense (Ind AS 16 / 38)": {
    section: "PL_EXP",
    label: "Depreciation & Amortisation Expense",
    normalBalance: "Debit",
    indAsNote: "Ind AS 16 & 38: Systematic allocation of depreciable asset amounts over useful life.",
  },
  "Other Operating Expenses (Rent, Professional Fees, Utilities)": {
    section: "PL_EXP",
    label: "Other Operating Expenses",
    normalBalance: "Debit",
    indAsNote: "Administrative expenses, office rent, software SaaS, and travel.",
  },

  // Tax Expense
  "Current Tax Expense (Ind AS 12)": {
    section: "PL_TAX",
    label: "Current Tax Expense",
    normalBalance: "Debit",
    indAsNote: "Ind AS 12: Corporate or business tax liability calculated under Income Tax Act.",
  },
  "Deferred Tax Expense / (Income) (Ind AS 12)": {
    section: "PL_TAX",
    label: "Deferred Tax Charge / (Credit)",
    normalBalance: "Debit",
    indAsNote: "Ind AS 12: Tax effect of temporary timing differences.",
  },
};

export const PRESET_SERVICE_SME: LedgerAccountInput[] = [
  // Balance Sheet - Non Current Assets
  {
    id: "led-1",
    accountName: "Computer Equipment & MacBooks",
    classification: "PPE (Property, Plant & Equipment - Ind AS 16)",
    balanceType: "Debit",
    amount: 650000,
    notes: "Ind AS 16 capitalised cost",
  },
  {
    id: "led-2",
    accountName: "Office Furniture & Fixtures",
    classification: "PPE (Property, Plant & Equipment - Ind AS 16)",
    balanceType: "Debit",
    amount: 180000,
    notes: "Useful life 10 years",
  },
  {
    id: "led-3",
    accountName: "Security Deposit for Leased Office",
    classification: "Non-Current Investments & Financial Assets",
    balanceType: "Debit",
    amount: 250000,
    notes: "Refundable security deposit at amortised cost",
  },

  // Balance Sheet - Current Assets
  {
    id: "led-4",
    accountName: "Sundry Debtors (Domestic Clients)",
    classification: "Trade Receivables (Sundry Debtors)",
    balanceType: "Debit",
    amount: 1420000,
    notes: "Unpaid invoices < 90 days",
  },
  {
    id: "led-5",
    accountName: "HDFC Bank Current Account",
    classification: "Bank Balances (Current / Savings)",
    balanceType: "Debit",
    amount: 885000,
    notes: "Operating bank account",
  },
  {
    id: "led-6",
    accountName: "Petty Cash in Office Safe",
    classification: "Cash and Cash Equivalents",
    balanceType: "Debit",
    amount: 25000,
  },
  {
    id: "led-7",
    accountName: "TDS Deducted by Clients (Sec 194J / 194C)",
    classification: "Current Tax Assets (TDS Receivable / Advance Tax)",
    balanceType: "Debit",
    amount: 320000,
    notes: "Visible in Form 26AS / AIS",
  },
  {
    id: "led-8",
    accountName: "Input GST Credit (IGST / CGST / SGST in GSTR-2B)",
    classification: "Other Current Assets (Input GST Credit / Prepaid Expenses)",
    balanceType: "Debit",
    amount: 145000,
    notes: "Electronic Credit Ledger",
  },

  // Balance Sheet - Equity
  {
    id: "led-9",
    accountName: "Proprietor Capital / Paid-Up Capital",
    classification: "Equity Share Capital / Owner's Capital",
    balanceType: "Credit",
    amount: 1000000,
  },
  {
    id: "led-10",
    accountName: "Retained Earnings (Opening Surplus)",
    classification: "Other Equity (Reserves & Surplus / Retained Earnings)",
    balanceType: "Credit",
    amount: 850000,
  },
  {
    id: "led-11",
    accountName: "Proprietor Personal Drawings",
    classification: "Owner's Drawings (Contra-Equity)",
    balanceType: "Debit",
    amount: 300000,
    notes: "Withdrawn during FY",
  },

  // Balance Sheet - Non-Current Liabilities
  {
    id: "led-12",
    accountName: "ICICI Bank MSME Term Loan (Long-Term)",
    classification: "Long-Term Borrowings (Term Loans)",
    balanceType: "Credit",
    amount: 500000,
    notes: "Secured business term loan",
  },

  // Balance Sheet - Current Liabilities
  {
    id: "led-13",
    accountName: "Sundry Creditors (Micro & Small Enterprises - MSME)",
    classification: "Trade Payables (MSME Vendors - Sec 43B(h))",
    balanceType: "Credit",
    amount: 280000,
    notes: "Within 45 days limit u/s 15 MSMED Act",
  },
  {
    id: "led-14",
    accountName: "Customer Advances (Software Milestone Advance)",
    classification: "Other Current Liabilities (Contract Liabilities / Customer Advances Ind AS 115)",
    balanceType: "Credit",
    amount: 180000,
    notes: "Ind AS 115 contract liability",
  },
  {
    id: "led-15",
    accountName: "Statutory Dues (Output GST & TDS Payable u/s 194J/194C)",
    classification: "Statutory Dues Payable (Output GST / TDS Payable / PF)",
    balanceType: "Credit",
    amount: 190000,
    notes: "Due on 7th & 20th",
  },

  // Profit & Loss - Revenue
  {
    id: "led-16",
    accountName: "Software & Digital Advisory Services Fees",
    classification: "Revenue from Operations (Sales / Services - Ind AS 115)",
    balanceType: "Credit",
    amount: 5400000,
    notes: "Ind AS 115 contract revenue",
  },
  {
    id: "led-17",
    accountName: "Bank Fixed Deposit Interest & Discounts",
    classification: "Other Income (Interest / Discounts / Forex)",
    balanceType: "Credit",
    amount: 60000,
  },

  // Profit & Loss - Expenses
  {
    id: "led-18",
    accountName: "Employee Salaries & Developer Compensation",
    classification: "Employee Benefits Expense (Salaries / Wages - Ind AS 19)",
    balanceType: "Debit",
    amount: 2600000,
    notes: "Gross payroll + PF contributions",
  },
  {
    id: "led-19",
    accountName: "Subcontracting & Freelance Developer Fees",
    classification: "Cost of Materials Consumed / Purchases (Ind AS 2)",
    balanceType: "Debit",
    amount: 720000,
    notes: "TDS deducted u/s 194J",
  },
  {
    id: "led-20",
    accountName: "Office Rent & Co-Working Charges",
    classification: "Other Operating Expenses (Rent, Professional Fees, Utilities)",
    balanceType: "Debit",
    amount: 480000,
  },
  {
    id: "led-21",
    accountName: "Cloud Hosting (AWS/GCP) & SaaS Subscriptions",
    classification: "Other Operating Expenses (Rent, Professional Fees, Utilities)",
    balanceType: "Debit",
    amount: 220000,
  },
  {
    id: "led-22",
    accountName: "Bank Loan Interest & Processing Fees",
    classification: "Finance Costs (Bank Interest / Loan Processing - Ind AS 23)",
    balanceType: "Debit",
    amount: 50000,
  },
  {
    id: "led-23",
    accountName: "Depreciation on Laptops & Furniture (Ind AS 16)",
    classification: "Depreciation and Amortisation Expense (Ind AS 16 / 38)",
    balanceType: "Debit",
    amount: 110000,
  },
  {
    id: "led-24",
    accountName: "Current Income Tax Provision (Estimated)",
    classification: "Current Tax Expense (Ind AS 12)",
    balanceType: "Debit",
    amount: 250000,
    notes: "Under Section 115BAA / Normal slab",
  },
  {
    id: "led-25",
    accountName: "Provision for Income Tax Liability",
    classification: "Current Tax Liabilities (Provision for Income Tax)",
    balanceType: "Credit",
    amount: 250000,
  }
];

export const PRESET_TRADING_MSME: LedgerAccountInput[] = [
  // Balance Sheet - Non Current Assets
  {
    id: "tm-1",
    accountName: "Plant & Machinery (Manufacturing Units)",
    classification: "PPE (Property, Plant & Equipment - Ind AS 16)",
    balanceType: "Debit",
    amount: 1850000,
  },
  {
    id: "tm-2",
    accountName: "Delivery Vans & Commercial Vehicles",
    classification: "PPE (Property, Plant & Equipment - Ind AS 16)",
    balanceType: "Debit",
    amount: 620000,
  },

  // Balance Sheet - Current Assets
  {
    id: "tm-3",
    accountName: "Stock in Trade / Finished Goods (Ind AS 2)",
    classification: "Inventories (Ind AS 2)",
    balanceType: "Debit",
    amount: 1450000,
    notes: "Lower of cost and NRV",
  },
  {
    id: "tm-4",
    accountName: "Sundry Debtors (Wholesalers & Distributors)",
    classification: "Trade Receivables (Sundry Debtors)",
    balanceType: "Debit",
    amount: 2100000,
  },
  {
    id: "tm-5",
    accountName: "State Bank of India CC / Current A/c",
    classification: "Bank Balances (Current / Savings)",
    balanceType: "Debit",
    amount: 430000,
  },
  {
    id: "tm-6",
    accountName: "Input Tax Credit (IGST & CGST Ledger)",
    classification: "Other Current Assets (Input GST Credit / Prepaid Expenses)",
    balanceType: "Debit",
    amount: 240000,
  },
  {
    id: "tm-7",
    accountName: "Advance Tax Paid (Challan 280)",
    classification: "Current Tax Assets (TDS Receivable / Advance Tax)",
    balanceType: "Debit",
    amount: 180000,
  },

  // Equity
  {
    id: "tm-8",
    accountName: "Partners / Share Capital",
    classification: "Equity Share Capital / Owner's Capital",
    balanceType: "Credit",
    amount: 2500000,
  },
  {
    id: "tm-9",
    accountName: "General Reserves & Retained Surplus",
    classification: "Other Equity (Reserves & Surplus / Retained Earnings)",
    balanceType: "Credit",
    amount: 1200000,
  },

  // Non-Current Liabilities
  {
    id: "tm-10",
    accountName: "Machinery Term Loan (HDFC Bank)",
    classification: "Long-Term Borrowings (Term Loans)",
    balanceType: "Credit",
    amount: 1100000,
  },

  // Current Liabilities
  {
    id: "tm-11",
    accountName: "MSME Raw Material Suppliers (Sec 43B(h))",
    classification: "Trade Payables (MSME Vendors - Sec 43B(h))",
    balanceType: "Credit",
    amount: 780000,
    notes: "Mandatory aging audit u/s 43B(h)",
  },
  {
    id: "tm-12",
    accountName: "Sundry Creditors (Non-MSME Suppliers)",
    classification: "Trade Payables (Other Creditors)",
    balanceType: "Credit",
    amount: 520000,
  },
  {
    id: "tm-13",
    accountName: "GST & Statutory Dues Payable",
    classification: "Statutory Dues Payable (Output GST / TDS Payable / PF)",
    balanceType: "Credit",
    amount: 220000,
  },

  // Profit & Loss - Revenue
  {
    id: "tm-14",
    accountName: "Domestic Goods Sales (Taxable at 18%)",
    classification: "Revenue from Operations (Sales / Services - Ind AS 115)",
    balanceType: "Credit",
    amount: 8200000,
  },

  // Profit & Loss - Expenses
  {
    id: "tm-15",
    accountName: "Raw Materials Purchases & Inward Freight",
    classification: "Cost of Materials Consumed / Purchases (Ind AS 2)",
    balanceType: "Debit",
    amount: 4850000,
  },
  {
    id: "tm-16",
    accountName: "Factory Wages & Staff Salaries",
    classification: "Employee Benefits Expense (Salaries / Wages - Ind AS 19)",
    balanceType: "Debit",
    amount: 1250000,
  },
  {
    id: "tm-17",
    accountName: "Warehouse Power, Fuel & Freight Outward",
    classification: "Other Operating Expenses (Rent, Professional Fees, Utilities)",
    balanceType: "Debit",
    amount: 420000,
  },
  {
    id: "tm-18",
    accountName: "Bank Interest on Term Loan & CC Limits",
    classification: "Finance Costs (Bank Interest / Loan Processing - Ind AS 23)",
    balanceType: "Debit",
    amount: 120000,
  },
  {
    id: "tm-19",
    accountName: "Depreciation on Machinery & Vehicles",
    classification: "Depreciation and Amortisation Expense (Ind AS 16 / 38)",
    balanceType: "Debit",
    amount: 190000,
  },
  {
    id: "tm-20",
    accountName: "Corporate Tax Provision",
    classification: "Current Tax Expense (Ind AS 12)",
    balanceType: "Debit",
    amount: 320000,
  },
  {
    id: "tm-21",
    accountName: "Tax Provision Liability",
    classification: "Current Tax Liabilities (Provision for Income Tax)",
    balanceType: "Credit",
    amount: 320000,
  },
];
