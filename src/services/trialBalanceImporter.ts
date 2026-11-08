import * as XLSX from "xlsx";
import { LedgerAccountInput, IndAsClassification } from "../types";

export interface ClassificationDetail {
  classification: IndAsClassification;
  confidence: "high" | "medium" | "low";
  confidenceScore: number; // 0 to 100
  reviewRequired: boolean;
  reason: string;
}

export interface ParsedTrialBalanceResult {
  accounts: LedgerAccountInput[];
  totalDebit: number;
  totalCredit: number;
  diff: number;
  isBalanced: boolean;
  warnings: string[];
  reviewNeededCount: number;
  highConfidenceCount: number;
}

/**
 * Intelligent classifier for Indian accounting heads into Ind AS classifications
 */
export function autoClassifyLedger(
  name: string,
  balanceType: "Debit" | "Credit",
  rawGroup?: string
): IndAsClassification {
  const normName = (name || "").toLowerCase().trim();
  const normGroup = (rawGroup || "").toLowerCase().trim();

  // 1. Group-based matching (e.g. from Tally / Zoho Books / QuickBooks exports)
  if (normGroup.includes("sales") || normGroup.includes("revenue") || normGroup.includes("turnover")) {
    return "Revenue from Operations (Sales / Services - Ind AS 115)";
  }
  if (normGroup.includes("purchase") || normGroup.includes("raw material") || normGroup.includes("direct expense")) {
    return "Cost of Materials Consumed / Purchases (Ind AS 2)";
  }
  if (normGroup.includes("payroll") || normGroup.includes("salary") || normGroup.includes("wage") || normGroup.includes("employee")) {
    return "Employee Benefits Expense (Salaries / Wages - Ind AS 19)";
  }
  if (normGroup.includes("finance") || normGroup.includes("interest") || normGroup.includes("borrowing cost")) {
    return "Finance Costs (Bank Interest / Loan Processing - Ind AS 23)";
  }
  if (normGroup.includes("depreciation") || normGroup.includes("amortisation")) {
    return "Depreciation and Amortisation Expense (Ind AS 16 / 38)";
  }
  if (normGroup.includes("indirect expense") || normGroup.includes("administrative") || normGroup.includes("operating expense")) {
    return "Other Operating Expenses (Rent, Professional Fees, Utilities)";
  }
  if (normGroup.includes("fixed asset") || normGroup.includes("plant") || normGroup.includes("machinery") || normGroup.includes("tangible")) {
    return "PPE (Property, Plant & Equipment - Ind AS 16)";
  }
  if (normGroup.includes("intangible")) {
    return "Intangible Assets (Ind AS 38)";
  }
  if (normGroup.includes("investment")) {
    return "Non-Current Investments & Financial Assets";
  }
  if (normGroup.includes("stock") || normGroup.includes("inventory")) {
    return "Inventories (Ind AS 2)";
  }
  if (normGroup.includes("sundry debtor") || normGroup.includes("trade receivable") || normGroup.includes("customer")) {
    return "Trade Receivables (Sundry Debtors)";
  }
  if (normGroup.includes("cash") || normGroup.includes("petty cash")) {
    return "Cash and Cash Equivalents";
  }
  if (normGroup.includes("bank account") || normGroup.includes("bank balance")) {
    return "Bank Balances (Current / Savings)";
  }
  if (normGroup.includes("capital") || normGroup.includes("owner's equity") || normGroup.includes("share capital")) {
    return balanceType === "Debit"
      ? "Owner's Drawings (Contra-Equity)"
      : "Equity Share Capital / Owner's Capital";
  }
  if (normGroup.includes("drawing")) {
    return "Owner's Drawings (Contra-Equity)";
  }
  if (normGroup.includes("reserves") || normGroup.includes("surplus") || normGroup.includes("retained")) {
    return "Other Equity (Reserves & Surplus / Retained Earnings)";
  }
  if (normGroup.includes("secured loan") || normGroup.includes("term loan") || normGroup.includes("long term")) {
    return "Long-Term Borrowings (Term Loans)";
  }
  if (normGroup.includes("bank od") || normGroup.includes("overdraft") || normGroup.includes("cash credit") || normGroup.includes("short term")) {
    return "Short-Term Borrowings / Bank Overdraft";
  }
  if (normGroup.includes("msme") || normGroup.includes("micro") || normGroup.includes("small enterprise")) {
    return "Trade Payables (MSME Vendors - Sec 43B(h))";
  }
  if (normGroup.includes("sundry creditor") || normGroup.includes("trade payable") || normGroup.includes("vendor")) {
    return "Trade Payables (Other Creditors)";
  }
  if (normGroup.includes("duties & taxes") || normGroup.includes("statutory") || normGroup.includes("tax payable") || normGroup.includes("gst payable")) {
    return "Statutory Dues Payable (Output GST / TDS Payable / PF)";
  }

  // 2. Keyword-based matching on Account Name
  // Revenue
  if (
    normName.includes("sales") ||
    normName.includes("service charge") ||
    normName.includes("professional receipt") ||
    normName.includes("revenue") ||
    normName.includes("turnover") ||
    normName.includes("consulting fee") ||
    normName.includes("retainer fee") ||
    normName.includes("freight outward income") ||
    normName.includes("commission earned") ||
    normName.includes("billing")
  ) {
    return "Revenue from Operations (Sales / Services - Ind AS 115)";
  }

  // Other Income
  if (
    normName.includes("interest received") ||
    normName.includes("interest on fd") ||
    normName.includes("interest income") ||
    normName.includes("discount received") ||
    normName.includes("dividend") ||
    normName.includes("gain on forex") ||
    normName.includes("profit on sale") ||
    normName.includes("scrap sale") ||
    normName.includes("miscellaneous income")
  ) {
    return "Other Income (Interest / Discounts / Forex)";
  }

  // Cost of Materials / Purchases
  if (
    normName.includes("purchase") ||
    normName.includes("raw material") ||
    normName.includes("consumable") ||
    normName.includes("freight inward") ||
    normName.includes("carriage inward") ||
    normName.includes("custom duty") ||
    normName.includes("packing material") ||
    normName.includes("stock in trade")
  ) {
    return "Cost of Materials Consumed / Purchases (Ind AS 2)";
  }

  // Employee Benefits
  if (
    normName.includes("salary") ||
    normName.includes("salaries") ||
    normName.includes("wages") ||
    normName.includes("bonus") ||
    normName.includes("gratuity") ||
    normName.includes("leave encashment") ||
    normName.includes("staff welfare") ||
    normName.includes("provident fund") ||
    normName.includes("pf employer") ||
    normName.includes("esi employer") ||
    normName.includes("director remuneration") ||
    normName.includes("stipend")
  ) {
    return "Employee Benefits Expense (Salaries / Wages - Ind AS 19)";
  }

  // Finance Costs
  if (
    normName.includes("bank interest") ||
    normName.includes("interest on loan") ||
    normName.includes("interest on cc") ||
    normName.includes("interest on od") ||
    normName.includes("loan processing") ||
    normName.includes("finance charge") ||
    normName.includes("bank charge") ||
    normName.includes("interest paid")
  ) {
    return "Finance Costs (Bank Interest / Loan Processing - Ind AS 23)";
  }

  // Depreciation
  if (
    normName.includes("depreciation") ||
    normName.includes("amortisation") ||
    normName.includes("amortization")
  ) {
    return "Depreciation and Amortisation Expense (Ind AS 16 / 38)";
  }

  // PPE (Fixed Assets)
  if (
    normName.includes("computer") ||
    normName.includes("laptop") ||
    normName.includes("printer") ||
    normName.includes("furniture") ||
    normName.includes("fixture") ||
    normName.includes("plant & machinery") ||
    normName.includes("machinery") ||
    normName.includes("vehicle") ||
    normName.includes("car") ||
    normName.includes("motor") ||
    normName.includes("building") ||
    normName.includes("office equipment") ||
    normName.includes("air conditioner") ||
    normName.includes("server equipment")
  ) {
    return "PPE (Property, Plant & Equipment - Ind AS 16)";
  }

  // Right-of-Use Assets
  if (
    normName.includes("right of use") ||
    normName.includes("rou asset") ||
    normName.includes("leased asset") ||
    normName.includes("leasehold property")
  ) {
    return "Right-of-Use Assets (Ind AS 116)";
  }

  // Intangibles
  if (
    normName.includes("software") ||
    normName.includes("license") ||
    normName.includes("trademark") ||
    normName.includes("patent") ||
    normName.includes("copyright") ||
    normName.includes("website development") ||
    normName.includes("goodwill")
  ) {
    return "Intangible Assets (Ind AS 38)";
  }

  // Non-Current Investments
  if (
    normName.includes("security deposit") ||
    normName.includes("fixed deposit") ||
    normName.includes("fd with") ||
    normName.includes("mutual fund") ||
    normName.includes("shares") ||
    normName.includes("bonds") ||
    normName.includes("debentures") ||
    normName.includes("long term investment")
  ) {
    return "Non-Current Investments & Financial Assets";
  }

  // Inventories
  if (
    normName.includes("closing stock") ||
    normName.includes("stock in hand") ||
    normName.includes("inventory") ||
    normName.includes("work-in-progress") ||
    normName.includes("wip") ||
    normName.includes("finished goods")
  ) {
    return "Inventories (Ind AS 2)";
  }

  // Trade Receivables (Debtors)
  if (
    normName.includes("debtor") ||
    normName.includes("customer") ||
    normName.includes("client") ||
    normName.includes("receivable") ||
    normName.includes("trade debtor")
  ) {
    return "Trade Receivables (Sundry Debtors)";
  }

  // Cash
  if (
    normName.includes("cash in hand") ||
    normName.includes("petty cash") ||
    normName === "cash" ||
    normName.startsWith("cash ")
  ) {
    return "Cash and Cash Equivalents";
  }

  // Bank Balances
  if (
    normName.includes("bank") ||
    normName.includes("hdfc") ||
    normName.includes("icici") ||
    normName.includes("sbi") ||
    normName.includes("axis") ||
    normName.includes("kotak") ||
    normName.includes("pnb") ||
    normName.includes("canara") ||
    normName.includes("current a/c") ||
    normName.includes("savings a/c") ||
    normName.includes("cheque in hand")
  ) {
    return "Bank Balances (Current / Savings)";
  }

  // Current Tax Assets (TDS Receivable / Advance Tax)
  if (
    normName.includes("tds receivable") ||
    normName.includes("tds deducted by") ||
    normName.includes("advance tax") ||
    normName.includes("self assessment tax") ||
    normName.includes("income tax refund") ||
    normName.includes("tax refund")
  ) {
    return "Current Tax Assets (TDS Receivable / Advance Tax)";
  }

  // Other Current Assets (Input GST / Prepaids)
  if (
    normName.includes("input cgst") ||
    normName.includes("input sgst") ||
    normName.includes("input igst") ||
    normName.includes("gst credit") ||
    normName.includes("itc") ||
    normName.includes("electronic credit ledger") ||
    normName.includes("prepaid") ||
    normName.includes("advance to supplier") ||
    normName.includes("advance to vendor")
  ) {
    return "Other Current Assets (Input GST Credit / Prepaid Expenses)";
  }

  // Capital / Equity
  if (
    normName.includes("capital") ||
    normName.includes("share capital") ||
    normName.includes("proprietor capital") ||
    normName.includes("partner capital")
  ) {
    return balanceType === "Debit"
      ? "Owner's Drawings (Contra-Equity)"
      : "Equity Share Capital / Owner's Capital";
  }

  // Drawings
  if (
    normName.includes("drawing") ||
    normName.includes("drawings") ||
    normName.includes("personal expense of proprietor") ||
    normName.includes("owner withdrawal")
  ) {
    return "Owner's Drawings (Contra-Equity)";
  }

  // Reserves & Surplus
  if (
    normName.includes("reserve") ||
    normName.includes("surplus") ||
    normName.includes("retained earnings") ||
    normName.includes("general reserve") ||
    normName.includes("profit and loss a/c") ||
    normName.includes("p&l a/c")
  ) {
    return "Other Equity (Reserves & Surplus / Retained Earnings)";
  }

  // Borrowings
  if (
    normName.includes("term loan") ||
    normName.includes("mortgage") ||
    normName.includes("secured loan") ||
    normName.includes("unsecured loan") ||
    normName.includes("director loan") ||
    normName.includes("vehicle loan") ||
    normName.includes("machinery loan")
  ) {
    return "Long-Term Borrowings (Term Loans)";
  }

  if (
    normName.includes("bank od") ||
    normName.includes("overdraft") ||
    normName.includes("cash credit") ||
    normName.includes("cc account") ||
    normName.includes("short term loan")
  ) {
    return "Short-Term Borrowings / Bank Overdraft";
  }

  // MSME Payables
  if (
    normName.includes("msme") ||
    normName.includes("micro enterprise") ||
    normName.includes("small enterprise") ||
    normName.includes("43b(h)") ||
    normName.includes("udyam")
  ) {
    return "Trade Payables (MSME Vendors - Sec 43B(h))";
  }

  // Creditors / Trade Payables
  if (
    normName.includes("creditor") ||
    normName.includes("supplier") ||
    normName.includes("vendor") ||
    normName.includes("payable") ||
    normName.includes("trade payable")
  ) {
    if (normName.includes("tds") || normName.includes("gst") || normName.includes("pf") || normName.includes("esi")) {
      return "Statutory Dues Payable (Output GST / TDS Payable / PF)";
    }
    return "Trade Payables (Other Creditors)";
  }

  // Customer Advances
  if (
    normName.includes("advance from customer") ||
    normName.includes("customer advance") ||
    normName.includes("unearned revenue") ||
    normName.includes("contract liability")
  ) {
    return "Other Current Liabilities (Contract Liabilities / Customer Advances Ind AS 115)";
  }

  // Statutory Dues (Output GST, TDS Payable, PF)
  if (
    normName.includes("output cgst") ||
    normName.includes("output sgst") ||
    normName.includes("output igst") ||
    normName.includes("gst payable") ||
    normName.includes("tds payable") ||
    normName.includes("tds u/s") ||
    normName.includes("pf payable") ||
    normName.includes("esi payable") ||
    normName.includes("professional tax payable") ||
    normName.includes("statutory dues")
  ) {
    return "Statutory Dues Payable (Output GST / TDS Payable / PF)";
  }

  // Current Tax Liabilities (Provision for Income Tax)
  if (
    normName.includes("provision for tax") ||
    normName.includes("provision for income tax") ||
    normName.includes("income tax payable")
  ) {
    return "Current Tax Liabilities (Provision for Income Tax)";
  }

  // Operating Expenses (Fallback for debit balances)
  if (
    normName.includes("rent") ||
    normName.includes("electricity") ||
    normName.includes("power") ||
    normName.includes("water") ||
    normName.includes("audit fee") ||
    normName.includes("legal") ||
    normName.includes("professional") ||
    normName.includes("printing") ||
    normName.includes("stationery") ||
    normName.includes("telephone") ||
    normName.includes("internet") ||
    normName.includes("broadband") ||
    normName.includes("advertising") ||
    normName.includes("marketing") ||
    normName.includes("travelling") ||
    normName.includes("travel") ||
    normName.includes("conveyance") ||
    normName.includes("fuel") ||
    normName.includes("repair") ||
    normName.includes("maintenance") ||
    normName.includes("courier") ||
    normName.includes("cleaning") ||
    normName.includes("insurance") ||
    normName.includes("software subscription") ||
    normName.includes("cloud hosting") ||
    normName.includes("license fee") ||
    normName.includes("rates & taxes")
  ) {
    return "Other Operating Expenses (Rent, Professional Fees, Utilities)";
  }

  // Entity Name Heuristic
  if (
    normName.includes("pvt") ||
    normName.includes("ltd") ||
    normName.includes("llp") ||
    normName.includes("traders") ||
    normName.includes("enterprises") ||
    normName.includes("associates") ||
    normName.includes("agency") ||
    normName.includes("industries") ||
    normName.includes("solutions") ||
    normName.includes("corporation") ||
    normName.includes("brothers")
  ) {
    return balanceType === "Debit"
      ? "Trade Receivables (Sundry Debtors)"
      : "Trade Payables (Other Creditors)";
  }

  // Defaults based on Debit vs Credit
  if (balanceType === "Debit") {
    return "Other Operating Expenses (Rent, Professional Fees, Utilities)";
  } else {
    return "Trade Payables (Other Creditors)";
  }
}

/**
 * Intelligent CA classifier providing confidence score, audit flag, and classification reason
 */
export function autoClassifyLedgerDetailed(
  name: string,
  balanceType: "Debit" | "Credit",
  rawGroup?: string
): ClassificationDetail {
  const normName = (name || "").toLowerCase().trim();
  const normGroup = (rawGroup || "").toLowerCase().trim();

  // Suspense / Difference in TB / Unreconciled accounts - Mandatory CA Review
  if (
    normName.includes("suspense") ||
    normName.includes("diff in tb") ||
    normName.includes("difference in tb") ||
    normName.includes("trial balance difference") ||
    normName.includes("unreconciled") ||
    normName.includes("error account")
  ) {
    return {
      classification:
        balanceType === "Debit"
          ? "Other Current Assets (Input GST Credit / Prepaid Expenses)"
          : "Other Current Liabilities (Contract Liabilities / Customer Advances Ind AS 115)",
      confidence: "low",
      confidenceScore: 30,
      reviewRequired: true,
      reason: "⚠️ Suspense / TB Difference Account: Mandatory CA audit scrutiny required before finalizing financial statements!",
    };
  }

  const classification = autoClassifyLedger(name, balanceType, rawGroup);

  // High confidence groups
  if (normGroup) {
    return {
      classification,
      confidence: "high",
      confidenceScore: 98,
      reviewRequired: false,
      reason: `Matched standard ERP Group: "${rawGroup}"`,
    };
  }

  // High confidence standard keyword patterns
  if (
    normName.includes("bank") ||
    normName.includes("cash") ||
    normName.includes("gst") ||
    normName.includes("tds") ||
    normName.includes("advance tax") ||
    normName.includes("depreciation") ||
    normName.includes("salary") ||
    normName.includes("sales") ||
    normName.includes("purchase") ||
    normName.includes("security deposit") ||
    normName.includes("electricity deposit") ||
    normName.includes("rent") ||
    normName.includes("capital") ||
    normName.includes("drawing")
  ) {
    return {
      classification,
      confidence: "high",
      confidenceScore: 96,
      reviewRequired: false,
      reason: `High confidence match on standard accounting head: "${name}"`,
    };
  }

  // Commercial Counterparty heuristic
  if (
    normName.includes("pvt") ||
    normName.includes("ltd") ||
    normName.includes("llp") ||
    normName.includes("traders") ||
    normName.includes("enterprises") ||
    normName.includes("associates") ||
    normName.includes("agency") ||
    normName.includes("industries") ||
    normName.includes("solutions") ||
    normName.includes("corporation") ||
    normName.includes("brothers")
  ) {
    return {
      classification,
      confidence: "medium",
      confidenceScore: 82,
      reviewRequired: true,
      reason: `Counterparty entity name detected (${balanceType === "Debit" ? "Debtor" : "Creditor"}). Verification recommended.`,
    };
  }

  // Low confidence fallback
  return {
    classification,
    confidence: "low",
    confidenceScore: 55,
    reviewRequired: true,
    reason: `Unclassified ${balanceType.toLowerCase()} balance. Defaulted to ${classification.split(" (")[0]}; please review.`,
  };
}

/**
 * Parse Trial Balance data from Excel/CSV ArrayBuffer
 */
export function parseTrialBalanceBuffer(buffer: ArrayBuffer): ParsedTrialBalanceResult {
  const wb = XLSX.read(buffer, { type: "array" });
  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error("The uploaded file does not contain any readable sheets.");
  }

  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (!rows || rows.length === 0) {
    throw new Error("The uploaded sheet is empty.");
  }

  return processRawSheetRows(rows);
}

/**
 * Parse Trial Balance text (pasted from clipboard, Tally, or CSV)
 */
export function parseTrialBalanceText(text: string): ParsedTrialBalanceResult {
  if (!text || !text.trim()) {
    throw new Error("No trial balance text provided.");
  }

  // Split lines
  const lines = text.trim().split(/\r?\n/);
  const rows: string[][] = lines.map((line) => {
    // Detect delimiter: tab, comma, or pipe
    if (line.includes("\t")) {
      return line.split("\t").map((c) => c.trim());
    } else if (line.includes(",")) {
      // Split by comma ignoring commas inside quotes
      return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
    } else if (line.includes("|")) {
      return line.split("|").map((c) => c.trim()).filter(Boolean);
    } else {
      // Space separated (e.g. 2 or more spaces)
      return line.split(/\s{2,}/).map((c) => c.trim());
    }
  });

  return processRawSheetRows(rows);
}

/**
 * Universal processor for 2D array of rows
 */
function processRawSheetRows(rows: any[][]): ParsedTrialBalanceResult {
  const warnings: string[] = [];
  const accounts: LedgerAccountInput[] = [];

  // 1. Locate header row
  let headerRowIndex = -1;
  let colAccount = -1;
  let colDebit = -1;
  let colCredit = -1;
  let colGroup = -1;
  let colBalance = -1;
  let colAmount = -1;

  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] || "").toLowerCase().trim();

      if (
        val.includes("particular") ||
        val.includes("ledger") ||
        val.includes("account") ||
        val.includes("head") ||
        val === "name"
      ) {
        if (colAccount === -1) colAccount = c;
      } else if (
        val === "debit" ||
        val === "dr" ||
        val.includes("debit (") ||
        val.includes("dr (") ||
        val.startsWith("debit") ||
        val.startsWith("dr")
      ) {
        if (colDebit === -1) colDebit = c;
      } else if (
        val === "credit" ||
        val === "cr" ||
        val.includes("credit (") ||
        val.includes("cr (") ||
        val.startsWith("credit") ||
        val.startsWith("cr")
      ) {
        if (colCredit === -1) colCredit = c;
      } else if (val.includes("group") || val.includes("classification") || val.includes("parent")) {
        if (colGroup === -1) colGroup = c;
      } else if (val === "type" || val === "balance type" || val === "dr/cr" || val === "dr / cr") {
        if (colBalance === -1) colBalance = c;
      } else if (val === "amount" || val.includes("balance") || val.includes("total")) {
        if (colAmount === -1) colAmount = c;
      }
    }

    if (colAccount !== -1 && (colDebit !== -1 || (colBalance !== -1 && colAmount !== -1) || colCredit !== -1)) {
      headerRowIndex = r;
      break;
    }
  }

  // Fallback defaults if no explicit header recognized
  if (colAccount === -1) colAccount = 0;
  if (colDebit === -1 && colCredit === -1) {
    if (colAmount !== -1 && colBalance !== -1) {
      // Amount + Balance column format
    } else {
      // Default to Column 1 = Debit, Column 2 = Credit
      colDebit = 1;
      colCredit = 2;
    }
  }

  const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rawName = String(row[colAccount] || "").trim();
    if (!rawName) continue;

    const lowerName = rawName.toLowerCase();
    // Skip summary / total rows
    if (
      lowerName === "total" ||
      lowerName === "grand total" ||
      lowerName.startsWith("total ") ||
      lowerName === "difference" ||
      lowerName.includes("opening balance") && !row[colDebit] && !row[colCredit]
    ) {
      continue;
    }

    let debitAmt = 0;
    let creditAmt = 0;

    // Check separate Debit / Credit columns
    if (colDebit !== -1 && colDebit < row.length) {
      debitAmt = parseAmountCell(row[colDebit]);
    }
    if (colCredit !== -1 && colCredit < row.length) {
      creditAmt = parseAmountCell(row[colCredit]);
    }

    // Check Balance Type + Amount format (e.g. Type = "Dr", Amount = 50000)
    if (colBalance !== -1 && colAmount !== -1 && debitAmt === 0 && creditAmt === 0) {
      const typeVal = String(row[colBalance] || "").toLowerCase().trim();
      const amtVal = parseAmountCell(row[colAmount]);
      if (typeVal.includes("dr") || typeVal.includes("debit")) {
        debitAmt = amtVal;
      } else if (typeVal.includes("cr") || typeVal.includes("credit")) {
        creditAmt = amtVal;
      } else {
        if (amtVal > 0) debitAmt = amtVal;
      }
    }

    if (debitAmt === 0 && creditAmt === 0) {
      // Skip empty amount rows
      continue;
    }

    const rawGroup = colGroup !== -1 && colGroup < row.length ? String(row[colGroup] || "").trim() : undefined;
    const balanceType: "Debit" | "Credit" = debitAmt >= creditAmt ? "Debit" : "Credit";
    const netAmount = Math.abs(debitAmt - creditAmt);

    if (netAmount === 0) continue;

    const detail = autoClassifyLedgerDetailed(rawName, balanceType, rawGroup);

    accounts.push({
      id: `tb-${Date.now()}-${accounts.length}-${Math.random().toString(36).substring(2, 6)}`,
      accountName: rawName,
      classification: detail.classification,
      balanceType,
      amount: netAmount,
      confidence: detail.confidence,
      confidenceScore: detail.confidenceScore,
      reviewRequired: detail.reviewRequired,
      classificationReason: detail.reason,
      notes: rawGroup ? `Imported Group: ${rawGroup}` : undefined,
    });
  }

  if (accounts.length === 0) {
    throw new Error(
      "No valid ledger account rows could be extracted. Please check that your file or text has columns for Account Name and Debit / Credit amounts."
    );
  }

  let totalDebit = 0;
  let totalCredit = 0;
  let reviewNeededCount = 0;
  let highConfidenceCount = 0;

  accounts.forEach((acc) => {
    if (acc.balanceType === "Debit") {
      totalDebit += acc.amount;
    } else {
      totalCredit += acc.amount;
    }
    if (acc.reviewRequired) {
      reviewNeededCount++;
    } else {
      highConfidenceCount++;
    }
  });

  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = diff < 1;

  if (!isBalanced) {
    warnings.push(
      `Trial Balance has an imbalance of ₹ ${diff.toLocaleString("en-IN")}. Total Debit: ₹ ${totalDebit.toLocaleString(
        "en-IN"
      )}, Total Credit: ₹ ${totalCredit.toLocaleString("en-IN")}.`
    );
  }

  if (reviewNeededCount > 0) {
    warnings.push(
      `${reviewNeededCount} ledger account(s) require verification or contain suspense/unrecognized items.`
    );
  }

  return {
    accounts,
    totalDebit,
    totalCredit,
    diff,
    isBalanced,
    warnings,
    reviewNeededCount,
    highConfidenceCount,
  };
}

/**
 * Safely parse amount strings (e.g. "₹ 1,50,000.00", "(25,000)", "-500")
 */
function parseAmountCell(val: any): number {
  if (typeof val === "number") {
    return isNaN(val) ? 0 : Math.abs(val);
  }
  if (!val) return 0;

  let s = String(val).trim();
  // Check for parenthesis representing negative/debit in accounting
  const isParen = s.startsWith("(") && s.endsWith(")");
  s = s.replace(/[₹$,() ]/g, "").replace(/-/g, "");

  const parsed = parseFloat(s);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Generate a sample Trial Balance Excel file (.xlsx) for users to download as a template
 */
export function downloadSampleTrialBalanceExcel(): void {
  const wb = XLSX.utils.book_new();

  const sampleRows: (string | number)[][] = [
    ["SAMPLE TRIAL BALANCE TEMPLATE - MUNIM AI"],
    ["Note: Fill in your ledger accounts, debit/credit amounts, and optional group. Then import this file."],
    [],
    ["Account Name", "Group / Category", "Debit (INR)", "Credit (INR)", "Notes / Remarks"],
    ["Sales of Services (Domestic)", "Sales Accounts", "", 7500000, "Gross GST billed revenue"],
    ["Export Consulting Services", "Sales Accounts", "", 1200000, "Zero-rated export services"],
    ["Interest on Fixed Deposits", "Other Income", "", 85000, "TDS deducted by bank u/s 194A"],
    ["Salaries & Wages", "Employee Benefits", 2800000, "", "Direct staff compensation"],
    ["Staff Welfare & Training", "Employee Benefits", 140000, "", "Tea, snacks, medical insurance"],
    ["Office Rent", "Operating Expenses", 720000, "", "Subject to TDS u/s 194I"],
    ["Electricity & Utility Charges", "Operating Expenses", 185000, "", "Commercial premises bill"],
    ["Legal & Professional Fees", "Operating Expenses", 340000, "", "CA audit fees & legal counsel"],
    ["Advertising & Digital Marketing", "Operating Expenses", 260000, "", "Google Ads & campaigns"],
    ["Software & Cloud Hosting", "Operating Expenses", 195000, "", "AWS & Zoho subscriptions"],
    ["Traveling & Conveyance", "Operating Expenses", 120000, "", "Client site visits"],
    ["Bank Charges & Processing", "Finance Costs", 18000, "", "NEFT charges & payment gateway"],
    ["Interest on Working Capital Loan", "Finance Costs", 92000, "", "Bank CC interest"],
    ["Depreciation on Office Assets", "Depreciation", 240000, "", "Straight line method"],
    ["Computers, Laptops & Servers", "Fixed Assets", 850000, "", "Ind AS 16 PPE"],
    ["Office Furniture & Fixtures", "Fixed Assets", 450000, "", "Ind AS 16 PPE"],
    ["Sundry Debtors (Receivables)", "Current Assets", 1850000, "", "Customer unpaid invoices"],
    ["HDFC Bank Current Account", "Bank Accounts", 1420000, "", "Primary operating account"],
    ["Cash in Hand", "Cash Equivalents", 45000, "", "Office petty cash fund"],
    ["TDS Receivable u/s 194J", "Current Tax Assets", 420000, "", "Advance tax credit in 26AS"],
    ["Input CGST / SGST Credit", "Current Assets", 165000, "", "Electronic Credit Ledger balance"],
    ["Share Capital / Owner's Capital", "Capital Account", "", 1500000, "Initial contributed capital"],
    ["Reserves & Surplus (Retained Earnings)", "Reserves & Surplus", "", 950000, "Accumulated past profits"],
    ["Bank Term Loan (Machinery)", "Long-Term Borrowings", "", 600000, "Secured bank term loan"],
    ["Trade Payables - MSME Vendors", "Sundry Creditors", "", 240000, "Sec 43B(h) MSME compliance"],
    ["Trade Payables - Other Vendors", "Sundry Creditors", "", 380000, "Regular suppliers"],
    ["Output GST Payable", "Duties & Taxes", "", 125000, "GSTR-3B monthly tax liability"],
    ["TDS Payable u/s 194C / 194J", "Duties & Taxes", "", 35000, "Due by 7th of next month"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleRows);
  ws["!cols"] = [{ wch: 35 }, { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, ws, "Trial Balance");

  XLSX.writeFile(wb, "Munim_AI_Sample_Trial_Balance_Template.xlsx");
}

/**
 * Generate a sample Trial Balance CSV file for quick text editing
 */
export function downloadSampleTrialBalanceCsv(): void {
  const csvContent = `Account Name,Group / Category,Debit (INR),Credit (INR),Notes / Remarks
Sales of Services (Domestic),Sales Accounts,,7500000,Gross GST billed revenue
Export Consulting Services,Sales Accounts,,1200000,Zero-rated export services
Interest on Fixed Deposits,Other Income,,85000,TDS deducted by bank u/s 194A
Salaries & Wages,Employee Benefits,2800000,,Direct staff compensation
Staff Welfare & Training,Employee Benefits,140000,,Tea snacks medical insurance
Office Rent,Operating Expenses,720000,,Subject to TDS u/s 194I
Electricity & Utility Charges,Operating Expenses,185000,,Commercial premises bill
Legal & Professional Fees,Operating Expenses,340000,,CA audit fees & legal counsel
Advertising & Digital Marketing,Operating Expenses,260000,,Google Ads & campaigns
Software & Cloud Hosting,Operating Expenses,195000,,AWS & Zoho subscriptions
Traveling & Conveyance,Operating Expenses,120000,,Client site visits
Bank Charges & Processing,Finance Costs,18000,,NEFT charges & payment gateway
Interest on Working Capital Loan,Finance Costs,92000,,Bank CC interest
Depreciation on Office Assets,Depreciation,240000,,Straight line method
Computers Laptops & Servers,Fixed Assets,850000,,Ind AS 16 PPE
Office Furniture & Fixtures,Fixed Assets,450000,,Ind AS 16 PPE
Sundry Debtors (Receivables),Current Assets,1850000,,Customer unpaid invoices
HDFC Bank Current Account,Bank Accounts,1420000,,Primary operating account
Cash in Hand,Cash Equivalents,45000,,Office petty cash fund
TDS Receivable u/s 194J,Current Tax Assets,420000,,Advance tax credit in 26AS
Input CGST / SGST Credit,Current Assets,165000,,Electronic Credit Ledger balance
Share Capital / Owner's Capital,Capital Account,,1500000,Initial contributed capital
Reserves & Surplus (Retained Earnings),Reserves & Surplus,,950000,Accumulated past profits
Bank Term Loan (Machinery),Long-Term Borrowings,,600000,Secured bank term loan
Trade Payables - MSME Vendors,Sundry Creditors,,240000,Sec 43B(h) MSME compliance
Trade Payables - Other Vendors,Sundry Creditors,,380000,Regular suppliers
Output GST Payable,Duties & Taxes,,125000,GSTR-3B monthly tax liability
TDS Payable u/s 194C / 194J,Duties & Taxes,,35000,Due by 7th of next month`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Munim_AI_Sample_Trial_Balance_Template.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
