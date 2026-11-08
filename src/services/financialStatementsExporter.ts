import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { BusinessProfile, LedgerAccountInput } from "../types";

export interface StatementsExportData {
  profile: BusinessProfile;
  plStatement: {
    revenueFromOperations: number;
    otherIncome: number;
    totalIncome: number;
    costOfMaterials: number;
    employeeBenefits: number;
    financeCosts: number;
    depreciationExpense: number;
    otherExpenses: number;
    totalExpenses: number;
    profitBeforeTax: number;
    currentTaxExpense: number;
    deferredTaxExpense: number;
    totalTaxExpense: number;
    profitAfterTax: number;
  };
  balanceSheet: {
    ppeTotal: number;
    rouTotal: number;
    intangibleTotal: number;
    nonCurrentInvestmentsTotal: number;
    totalNonCurrentAssets: number;
    inventoryTotal: number;
    tradeReceivablesTotal: number;
    cashTotal: number;
    bankTotal: number;
    currentTaxAssetsTotal: number;
    otherCurrentAssetsTotal: number;
    totalCurrentAssets: number;
    totalAssets: number;
    baseCapital: number;
    totalDrawings: number;
    openingReserves: number;
    totalOtherEquity: number;
    totalEquity: number;
    longTermBorrowingsTotal: number;
    deferredTaxLiabilitiesTotal: number;
    nonCurrentLeaseTotal: number;
    totalNonCurrentLiabilities: number;
    shortTermBorrowingsTotal: number;
    msmePayablesTotal: number;
    otherCreditorsTotal: number;
    otherCurrentLiabilitiesTotal: number;
    statutoryDuesTotal: number;
    currentTaxLiabilityTotal: number;
    totalCurrentLiabilities: number;
    totalEquityAndLiabilities: number;
    bsDiff: number;
    isBsBalanced: boolean;
  };
  ledgers: LedgerAccountInput[];
}

const formatInr = (val: number): string => {
  return "₹ " + (val || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

const formatInrPlain = (val: number): number => {
  return Number((val || 0).toFixed(2));
};

/**
 * Export Financial Statements as a professional multi-sheet Excel workbook (.xlsx)
 */
export function exportFinancialStatementsToExcel(data: StatementsExportData): void {
  const { profile, plStatement, balanceSheet, ledgers } = data;
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: Balance Sheet (Schedule III Division II)
  // -------------------------------------------------------------
  const bsRows: (string | number)[][] = [
    ["DRAFT BALANCE SHEET IN COMPLIANCE WITH IND AS (SCHEDULE III DIVISION II)"],
    [`Entity: ${profile.entityType}`, `Accounting Basis: ${profile.accountingBasis}`, `GSTIN: ${profile.gstin || "N/A"}`],
    [`As at: 31st March 2026 (FY 2025-26)`, `Currency: Indian Rupee (INR)`],
    [],
    ["Particulars", "Ind AS Standard Reference", "Amount (INR)"],
    ["I. ASSETS", "", ""],
    ["(1) Non-Current Assets", "", ""],
    ["  (a) Property, Plant and Equipment", "Ind AS 16", formatInrPlain(balanceSheet.ppeTotal)],
    ["  (b) Right-of-Use Assets", "Ind AS 116", formatInrPlain(balanceSheet.rouTotal)],
    ["  (c) Intangible Assets", "Ind AS 38", formatInrPlain(balanceSheet.intangibleTotal)],
    ["  (d) Non-Current Investments & Financial Assets", "Ind AS 109", formatInrPlain(balanceSheet.nonCurrentInvestmentsTotal)],
    ["Total Non-Current Assets", "", formatInrPlain(balanceSheet.totalNonCurrentAssets)],
    [],
    ["(2) Current Assets", "", ""],
    ["  (a) Inventories", "Ind AS 2", formatInrPlain(balanceSheet.inventoryTotal)],
    ["  (b) Trade Receivables (Sundry Debtors)", "Ind AS 109", formatInrPlain(balanceSheet.tradeReceivablesTotal)],
    ["  (c) Cash and Cash Equivalents", "Ind AS 7", formatInrPlain(balanceSheet.cashTotal)],
    ["  (d) Bank Balances (Current / Savings)", "Schedule III", formatInrPlain(balanceSheet.bankTotal)],
    ["  (e) Current Tax Assets (TDS Receivable / Advance Tax)", "Ind AS 12", formatInrPlain(balanceSheet.currentTaxAssetsTotal)],
    ["  (f) Other Current Assets (Input GST / Prepaids)", "Schedule III", formatInrPlain(balanceSheet.otherCurrentAssetsTotal)],
    ["Total Current Assets", "", formatInrPlain(balanceSheet.totalCurrentAssets)],
    [],
    ["TOTAL ASSETS", "", formatInrPlain(balanceSheet.totalAssets)],
    [],
    ["II. EQUITY AND LIABILITIES", "", ""],
    ["(1) Equity", "", ""],
    ["  (a) Equity Share Capital / Owner's Capital", "Ind AS 1", formatInrPlain(balanceSheet.baseCapital)],
    ["  (b) Other Equity (Reserves & Current Period PAT)", "Ind AS 1", formatInrPlain(balanceSheet.totalOtherEquity)],
    ["Total Equity", "", formatInrPlain(balanceSheet.totalEquity)],
    [],
    ["(2) Non-Current Liabilities", "", ""],
    ["  (a) Long-Term Borrowings (Term Loans)", "Ind AS 109", formatInrPlain(balanceSheet.longTermBorrowingsTotal)],
    ["  (b) Deferred Tax Liabilities (Net)", "Ind AS 12", formatInrPlain(balanceSheet.deferredTaxLiabilitiesTotal)],
    ["  (c) Lease Liabilities - Non-Current", "Ind AS 116", formatInrPlain(balanceSheet.nonCurrentLeaseTotal)],
    ["Total Non-Current Liabilities", "", formatInrPlain(balanceSheet.totalNonCurrentLiabilities)],
    [],
    ["(3) Current Liabilities", "", ""],
    ["  (a) Short-Term Borrowings / Bank Overdraft", "Ind AS 109", formatInrPlain(balanceSheet.shortTermBorrowingsTotal)],
    ["  (b) Trade Payables (MSME Vendors - Sec 43B(h))", "MSMED Act / 43B(h)", formatInrPlain(balanceSheet.msmePayablesTotal)],
    ["  (c) Trade Payables (Other Creditors)", "Schedule III", formatInrPlain(balanceSheet.otherCreditorsTotal)],
    ["  (d) Other Current Liabilities (Customer Advances / Contract Liabilities)", "Ind AS 115", formatInrPlain(balanceSheet.otherCurrentLiabilitiesTotal)],
    ["  (e) Statutory Dues Payable (Output GST / TDS / PF)", "Statutory Acts", formatInrPlain(balanceSheet.statutoryDuesTotal)],
    ["  (f) Current Tax Liabilities (Provision for Income Tax)", "Ind AS 12", formatInrPlain(balanceSheet.currentTaxLiabilityTotal)],
    ["Total Current Liabilities", "", formatInrPlain(balanceSheet.totalCurrentLiabilities)],
    [],
    ["TOTAL EQUITY AND LIABILITIES", "", formatInrPlain(balanceSheet.totalEquityAndLiabilities)],
    ["Equilibrium Verification", balanceSheet.isBsBalanced ? "PERFECTLY BALANCED" : "IMBALANCE", formatInrPlain(balanceSheet.bsDiff)],
  ];

  const wsBS = XLSX.utils.aoa_to_sheet(bsRows);
  wsBS["!cols"] = [{ wch: 60 }, { wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsBS, "Balance Sheet");

  // -------------------------------------------------------------
  // Sheet 2: Statement of Profit & Loss (Ind AS 1)
  // -------------------------------------------------------------
  const plRows: (string | number)[][] = [
    ["STATEMENT OF PROFIT AND LOSS IN COMPLIANCE WITH IND AS 1"],
    [`Entity: ${profile.entityType}`, `Turnover Bracket: ${profile.turnoverBracket}`],
    [`For the Period Ended: 31st March 2026`, `Currency: Indian Rupee (INR)`],
    [],
    ["Particulars", "Ind AS Standard Reference", "Amount (INR)"],
    ["I. Revenue from Operations", "Ind AS 115", formatInrPlain(plStatement.revenueFromOperations)],
    ["II. Other Income", "Schedule III", formatInrPlain(plStatement.otherIncome)],
    ["III. TOTAL INCOME (I + II)", "", formatInrPlain(plStatement.totalIncome)],
    [],
    ["IV. EXPENSES", "", ""],
    ["  (a) Cost of Materials Consumed / Purchases", "Ind AS 2", formatInrPlain(plStatement.costOfMaterials)],
    ["  (b) Employee Benefits Expense", "Ind AS 19", formatInrPlain(plStatement.employeeBenefits)],
    ["  (c) Finance Costs", "Ind AS 23", formatInrPlain(plStatement.financeCosts)],
    ["  (d) Depreciation & Amortisation Expense", "Ind AS 16 / 38", formatInrPlain(plStatement.depreciationExpense)],
    ["  (e) Other Operating Expenses", "Schedule III", formatInrPlain(plStatement.otherExpenses)],
    ["TOTAL EXPENSES", "", formatInrPlain(plStatement.totalExpenses)],
    [],
    ["V. PROFIT BEFORE TAX (PBT) (III - IV)", "", formatInrPlain(plStatement.profitBeforeTax)],
    [],
    ["VI. Tax Expense:", "", ""],
    ["  (a) Current Tax", "Ind AS 12", formatInrPlain(plStatement.currentTaxExpense)],
    ["  (b) Deferred Tax", "Ind AS 12", formatInrPlain(plStatement.deferredTaxExpense)],
    ["Total Tax Expense", "", formatInrPlain(plStatement.totalTaxExpense)],
    [],
    ["VII. PROFIT FOR THE PERIOD (PAT)", "Ind AS 1", formatInrPlain(plStatement.profitAfterTax)],
  ];

  const wsPL = XLSX.utils.aoa_to_sheet(plRows);
  wsPL["!cols"] = [{ wch: 55 }, { wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsPL, "Profit & Loss");

  // -------------------------------------------------------------
  // Sheet 3: Trial Balance Ledger Accounts
  // -------------------------------------------------------------
  let totalDr = 0;
  let totalCr = 0;
  const tbRows: (string | number)[][] = [
    ["TRIAL BALANCE LEDGER ACCOUNTS"],
    [`Total Ledgers: ${ledgers.length}`],
    [],
    ["S.No.", "Account Name", "Ind AS Classification", "Balance Type", "Debit (INR)", "Credit (INR)", "Notes / Remarks"],
  ];

  ledgers.forEach((acc, idx) => {
    const dr = acc.balanceType === "Debit" ? formatInrPlain(acc.amount) : 0;
    const cr = acc.balanceType === "Credit" ? formatInrPlain(acc.amount) : 0;
    totalDr += dr;
    totalCr += cr;
    tbRows.push([
      idx + 1,
      acc.accountName,
      acc.classification,
      acc.balanceType,
      dr > 0 ? dr : "",
      cr > 0 ? cr : "",
      acc.notes || "",
    ]);
  });

  tbRows.push([]);
  tbRows.push([
    "",
    "TOTAL",
    "",
    "",
    formatInrPlain(totalDr),
    formatInrPlain(totalCr),
    Math.abs(totalDr - totalCr) < 1 ? "Equilibrium Verified" : `Diff: ${formatInrPlain(Math.abs(totalDr - totalCr))}`,
  ]);

  const wsTB = XLSX.utils.aoa_to_sheet(tbRows);
  wsTB["!cols"] = [
    { wch: 8 },
    { wch: 35 },
    { wch: 45 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTB, "Trial Balance");

  // -------------------------------------------------------------
  // Sheet 4: Statutory Compliance & Notes to Accounts
  // -------------------------------------------------------------
  const notesRows = [
    ["NOTES TO ACCOUNTS & STATUTORY COMPLIANCE DISCLOSURES"],
    ["Prepared by Munim AI (Chartered Accountant Accounting Agent)"],
    [],
    ["Rule / Standard", "Statutory Provision", "Applicability / Action"],
    [
      "Section 43B(h) MSME Mandate",
      "Payments to registered Micro and Small enterprises must be made within 15 days (or agreed terms up to 45 days).",
      `Current MSME Payables recorded: ${formatInr(balanceSheet.msmePayablesTotal)}. Unpaid dues past 45 days at year-end are disallowed for income tax!`,
    ],
    [
      "Ind AS 115 Revenue Recognition",
      "Revenue recognized when control of goods/services transfers. Advances received are Contract Liabilities.",
      `Current Customer Advances: ${formatInr(balanceSheet.otherCurrentLiabilitiesTotal)}. Not booked to P&L until delivery.`,
    ],
    [
      "Ind AS 16 Property, Plant & Equipment",
      "Capitalized at cost. Depreciation computed over estimated useful lives under Companies Act 2013 / IT Rules.",
      `Current PPE Carrying Value: ${formatInr(balanceSheet.ppeTotal)}. Current Period Depreciation: ${formatInr(plStatement.depreciationExpense)}.`,
    ],
    [
      "Section 40A(3) Cash Restriction",
      "Any expenditure exceeding ₹10,000 paid in cash in a single day is 100% disallowed under Income Tax Act.",
      "All vendor payouts must be routed through banking channels (NEFT / RTGS / UPI / Cheque).",
    ],
    [
      "GST Input Tax Credit (ITC)",
      "ITC can only be claimed if tax invoice is reflected in GSTR-2B and supplier files GSTR-1 & GSTR-3B.",
      `Current Input GST Credit in Electronic Credit Ledger: ${formatInr(balanceSheet.otherCurrentAssetsTotal)}.`,
    ],
  ];

  const wsNotes = XLSX.utils.aoa_to_sheet(notesRows);
  wsNotes["!cols"] = [{ wch: 30 }, { wch: 50 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsNotes, "Compliance & Notes");

  // Write and trigger download
  const cleanEntity = profile.entityType.replace(/[^a-zA-Z0-9]/g, "_");
  const fileName = `Financial_Statements_IndAS_${cleanEntity}_FY2025-26.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export Financial Statements as a beautifully formatted PDF document (.pdf)
 */
export function exportFinancialStatementsToPdf(data: StatementsExportData): void {
  const { profile, plStatement, balanceSheet, ledgers } = data;

  // Initialize PDF in Portrait A4
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryEmerald: [number, number, number] = [4, 120, 87]; // #047857
  const darkSlate: [number, number, number] = [30, 41, 59]; // #1e293b
  const lightGray: [number, number, number] = [248, 250, 252]; // #f8fafc

  let currentY = 15;

  // 1. Header Banner
  doc.setFillColor(...primaryEmerald);
  doc.rect(14, currentY, 182, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("DRAFT IND AS FINANCIAL STATEMENTS", 18, currentY + 8);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Compliant with Schedule III Division II & Ind AS (1, 16, 115, 12) | Generated by Munim AI",
    18,
    currentY + 16
  );

  currentY += 26;

  // 2. Entity Details Card
  doc.setTextColor(...darkSlate);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Entity: ${profile.entityType}`, 14, currentY);
  doc.text(`Accounting Basis: ${profile.accountingBasis}`, 110, currentY);
  currentY += 5;

  doc.setFont("helvetica", "normal");
  doc.text(`Turnover Bracket: ${profile.turnoverBracket}`, 14, currentY);
  doc.text(`GST Status: ${profile.gstRegistered ? "Registered (" + (profile.gstin || "GSTIN Verified") + ")" : "Unregistered"}`, 110, currentY);
  currentY += 5;

  doc.text(`Reporting Period: FY 2025-26 (As at 31st March 2026)`, 14, currentY);
  doc.text(`Jurisdiction: Republic of India | Standards: Ind AS`, 110, currentY);
  currentY += 7;

  // 3. Statement of Profit & Loss Table
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryEmerald);
  doc.text("PART I: STATEMENT OF PROFIT AND LOSS (Ind AS 1)", 14, currentY);
  currentY += 3;

  const plBody: (string | number)[][] = [
    ["I. Revenue from Operations (Sales & Services)", "Ind AS 115", formatInr(plStatement.revenueFromOperations)],
    ["II. Other Income (Interest, Discounts, Forex)", "Schedule III", formatInr(plStatement.otherIncome)],
    ["III. TOTAL INCOME (I + II)", "", formatInr(plStatement.totalIncome)],
    ["IV. EXPENSES:", "", ""],
    ["  - Cost of Materials Consumed / Purchases", "Ind AS 2", formatInr(plStatement.costOfMaterials)],
    ["  - Employee Benefits Expense (Salaries & Wages)", "Ind AS 19", formatInr(plStatement.employeeBenefits)],
    ["  - Finance Costs (Bank Interest & Processing)", "Ind AS 23", formatInr(plStatement.financeCosts)],
    ["  - Depreciation & Amortisation Expense", "Ind AS 16 / 38", formatInr(plStatement.depreciationExpense)],
    ["  - Other Operating Expenses (Rent, Professional, Utilities)", "Schedule III", formatInr(plStatement.otherExpenses)],
    ["TOTAL EXPENSES", "", formatInr(plStatement.totalExpenses)],
    ["V. PROFIT BEFORE TAX (PBT) (III - IV)", "", formatInr(plStatement.profitBeforeTax)],
    ["VI. Tax Expense (Current Tax + Deferred Tax)", "Ind AS 12", formatInr(plStatement.totalTaxExpense)],
    ["VII. PROFIT FOR THE PERIOD (PAT)", "Ind AS 1", formatInr(plStatement.profitAfterTax)],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["Particulars", "Ind AS Standard", "Amount (INR)"]],
    body: plBody,
    theme: "striped",
    headStyles: {
      fillColor: primaryEmerald,
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: darkSlate,
    },
    alternateRowStyles: {
      fillColor: lightGray,
    },
    columnStyles: {
      0: { cellWidth: 105 },
      1: { cellWidth: 40 },
      2: { cellWidth: 37, halign: "right", fontStyle: "bold" },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      // Highlight total rows
      const rowRaw = data.row.raw as any;
      const rowText = String(rowRaw?.[0] || "");
      if (
        rowText.startsWith("III. TOTAL") ||
        rowText.startsWith("TOTAL EXPENSES") ||
        rowText.startsWith("V. PROFIT") ||
        rowText.startsWith("VII. PROFIT")
      ) {
        data.cell.styles.fontStyle = "bold";
        if (rowText.startsWith("VII. PROFIT")) {
          data.cell.styles.fillColor = [209, 250, 229]; // light emerald
          data.cell.styles.textColor = [6, 78, 59];
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 9;

  // Check if we need page break for Balance Sheet
  if (currentY > 230) {
    doc.addPage();
    currentY = 15;
  }

  // 4. Balance Sheet Table - Assets
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryEmerald);
  doc.text("PART II: BALANCE SHEET - ASSETS (Schedule III Division II)", 14, currentY);
  currentY += 3;

  const bsAssetsBody: (string | number)[][] = [
    ["1. Non-Current Assets:", "", ""],
    ["  - Property, Plant and Equipment (PPE)", "Ind AS 16", formatInr(balanceSheet.ppeTotal)],
    ["  - Right-of-Use Assets", "Ind AS 116", formatInr(balanceSheet.rouTotal)],
    ["  - Intangibles & Non-Current Financial Assets", "Ind AS 38 / 109", formatInr(balanceSheet.nonCurrentInvestmentsTotal + balanceSheet.intangibleTotal)],
    ["Total Non-Current Assets", "", formatInr(balanceSheet.totalNonCurrentAssets)],
    ["2. Current Assets:", "", ""],
    ["  - Inventories (Valued at Lower of Cost or NRV)", "Ind AS 2", formatInr(balanceSheet.inventoryTotal)],
    ["  - Trade Receivables (Sundry Debtors)", "Ind AS 109", formatInr(balanceSheet.tradeReceivablesTotal)],
    ["  - Cash and Cash Equivalents", "Ind AS 7", formatInr(balanceSheet.cashTotal)],
    ["  - Bank Balances (Current & Savings)", "Schedule III", formatInr(balanceSheet.bankTotal)],
    ["  - Current Tax Assets (TDS Receivable / Advance Tax)", "Ind AS 12", formatInr(balanceSheet.currentTaxAssetsTotal)],
    ["  - Other Current Assets (Input GST Credit / Prepaids)", "Schedule III", formatInr(balanceSheet.otherCurrentAssetsTotal)],
    ["Total Current Assets", "", formatInr(balanceSheet.totalCurrentAssets)],
    ["TOTAL ASSETS", "", formatInr(balanceSheet.totalAssets)],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["Assets Particulars", "Standard", "Amount (INR)"]],
    body: bsAssetsBody,
    theme: "striped",
    headStyles: {
      fillColor: [30, 58, 138], // Royal blue
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: darkSlate,
    },
    alternateRowStyles: {
      fillColor: lightGray,
    },
    columnStyles: {
      0: { cellWidth: 105 },
      1: { cellWidth: 40 },
      2: { cellWidth: 37, halign: "right", fontStyle: "bold" },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      const rowRaw = data.row.raw as any;
      const rowText = String(rowRaw?.[0] || "");
      if (rowText === "TOTAL ASSETS" || rowText.startsWith("Total Non-Current") || rowText.startsWith("Total Current")) {
        data.cell.styles.fontStyle = "bold";
        if (rowText === "TOTAL ASSETS") {
          data.cell.styles.fillColor = [224, 231, 255]; // light indigo
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // New Page for Equity & Liabilities + Compliance Notes
  doc.addPage();
  currentY = 15;

  // 5. Balance Sheet Table - Equity & Liabilities
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryEmerald);
  doc.text("PART III: BALANCE SHEET - EQUITY & LIABILITIES", 14, currentY);
  currentY += 3;

  const bsLiabBody: (string | number)[][] = [
    ["1. Equity:", "", ""],
    ["  - Equity Share Capital / Owner's Capital", "Ind AS 1", formatInr(balanceSheet.baseCapital)],
    ["  - Other Equity (Reserves & Current Period PAT)", "Ind AS 1", formatInr(balanceSheet.totalOtherEquity)],
    ["Total Equity", "", formatInr(balanceSheet.totalEquity)],
    ["2. Non-Current Liabilities:", "", ""],
    ["  - Long-Term Borrowings (Term Loans)", "Ind AS 109", formatInr(balanceSheet.longTermBorrowingsTotal)],
    ["  - Deferred Tax Liabilities & Leases", "Ind AS 12 / 116", formatInr(balanceSheet.deferredTaxLiabilitiesTotal + balanceSheet.nonCurrentLeaseTotal)],
    ["Total Non-Current Liabilities", "", formatInr(balanceSheet.totalNonCurrentLiabilities)],
    ["3. Current Liabilities:", "", ""],
    ["  - Short-Term Borrowings / Bank Overdraft", "Ind AS 109", formatInr(balanceSheet.shortTermBorrowingsTotal)],
    ["  - Trade Payables to Micro & Small Enterprises (Sec 43B(h))", "Sec 43B(h)", formatInr(balanceSheet.msmePayablesTotal)],
    ["  - Trade Payables to Other Creditors", "Schedule III", formatInr(balanceSheet.otherCreditorsTotal)],
    ["  - Other Current Liabilities (Customer Advances / Contract Liab.)", "Ind AS 115", formatInr(balanceSheet.otherCurrentLiabilitiesTotal)],
    ["  - Statutory Dues Payable (Output GST / TDS / PF)", "Statutory", formatInr(balanceSheet.statutoryDuesTotal)],
    ["  - Current Tax Liabilities (Provision for Income Tax)", "Ind AS 12", formatInr(balanceSheet.currentTaxLiabilityTotal)],
    ["Total Current Liabilities", "", formatInr(balanceSheet.totalCurrentLiabilities)],
    ["TOTAL EQUITY AND LIABILITIES", "", formatInr(balanceSheet.totalEquityAndLiabilities)],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["Equity & Liabilities Particulars", "Standard", "Amount (INR)"]],
    body: bsLiabBody,
    theme: "striped",
    headStyles: {
      fillColor: [67, 56, 202], // Indigo
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: darkSlate,
    },
    alternateRowStyles: {
      fillColor: lightGray,
    },
    columnStyles: {
      0: { cellWidth: 105 },
      1: { cellWidth: 40 },
      2: { cellWidth: 37, halign: "right", fontStyle: "bold" },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      const rowRaw = data.row.raw as any;
      const rowText = String(rowRaw?.[0] || "");
      if (
        rowText === "TOTAL EQUITY AND LIABILITIES" ||
        rowText.startsWith("Total Equity") ||
        rowText.startsWith("Total Non-Current") ||
        rowText.startsWith("Total Current")
      ) {
        data.cell.styles.fontStyle = "bold";
        if (rowText === "TOTAL EQUITY AND LIABILITIES") {
          data.cell.styles.fillColor = [224, 231, 255];
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 6. Trial Balance Equilibrium Box
  const isBalanced = balanceSheet.isBsBalanced;
  doc.setFillColor(isBalanced ? 236 : 254, isBalanced ? 253 : 242, isBalanced ? 245 : 242);
  doc.setDrawColor(isBalanced ? 167 : 248, isBalanced ? 243 : 113, isBalanced ? 208 : 113);
  doc.roundedRect(14, currentY, 182, 14, 2, 2, "FD");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(isBalanced ? 6 : 153, isBalanced ? 78 : 27, isBalanced ? 59 : 27);
  doc.text(
    isBalanced
      ? "EQUILIBRIUM VERIFICATION: Balance Sheet is perfectly balanced (Total Assets = Total Equity & Liabilities)."
      : `EQUILIBRIUM WARNING: Imbalance detected of ${formatInr(balanceSheet.bsDiff)}. Review suspense account entries.`,
    18,
    currentY + 6
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    `Total Ledgers Processed: ${ledgers.length} | Net PAT for Period: ${formatInr(plStatement.profitAfterTax)} transferred to Other Equity.`,
    18,
    currentY + 11
  );

  currentY += 19;

  // 7. Compliance & Statutory Disclosures Table
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryEmerald);
  doc.text("PART IV: STATUTORY AUDIT & TAX COMPLIANCE DISCLOSURES", 14, currentY);
  currentY += 2;

  const notesTableBody = [
    [
      "Section 43B(h) MSMED Act",
      `MSME Payables: ${formatInr(balanceSheet.msmePayablesTotal)}. Disallowance triggers if payment delayed beyond 15/45 days.`,
    ],
    [
      "Ind AS 115 Revenue & Advances",
      `Customer Advances: ${formatInr(balanceSheet.otherCurrentLiabilitiesTotal)} retained in Contract Liabilities until performance satisfied.`,
    ],
    [
      "Section 40A(3) Cash Restriction",
      "No single day cash payment > ₹10,000 permitted. All business expenditures cleared via banking channels.",
    ],
    [
      "Advance Tax & 26AS Matching",
      `TDS Receivable: ${formatInr(balanceSheet.currentTaxAssetsTotal)}. Reconcile with Form 26AS & Annual Information Statement (AIS) before filing ITR.`,
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["Compliance Clause", "Statutory Rule & Current Status"]],
    body: notesTableBody,
    theme: "plain",
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: darkSlate,
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [71, 85, 105],
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: "bold" },
      1: { cellWidth: 127 },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Footer Disclaimer
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Disclaimer: This draft report is prepared for internal management, review, and accounting compliance purposes by Munim AI. Final statutory financial statements must be verified and audited by a practicing Chartered Accountant under ICAI guidelines.",
    14,
    currentY,
    { maxWidth: 182 }
  );

  const cleanEntity = profile.entityType.replace(/[^a-zA-Z0-9]/g, "_");
  const fileName = `Financial_Statements_IndAS_${cleanEntity}_FY2025-26.pdf`;
  doc.save(fileName);
}
