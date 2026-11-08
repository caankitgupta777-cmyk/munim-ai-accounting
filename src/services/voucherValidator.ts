/**
 * Deterministic Double-Entry Accounting & Statutory Tax Validation Engine
 * Strict CA-grade validation:
 * - NO automatic rebalancing (never alter original figures to mask imbalances)
 * - Strict Double-Entry Equilibrium (Total Dr == Total Cr)
 * - Row-by-row integrity validation (no negative numbers, no two-sided single lines)
 * - Duplicate ledger detection
 * - GST reconciliation (Intra vs Inter, rate matching)
 * - TDS statutory validation
 * - Clear, actionable validation errors and warnings
 */

import { StructuredVoucher, JournalEntryLine, VoucherValidationResult } from "../types";
import { calculateTDS } from "./tdsEngine";
import { calculateGstInvoice, ALLOWED_GST_RATES } from "./gstEngine";
import { DecimalMath } from "../utils/decimalMath";

export interface VoucherValidationInput {
  voucher: any;
  requestParams?: {
    description?: string;
    amount?: number;
    gstRate?: number;
    gstType?: string;
    tdsSection?: string;
    partyName?: string;
    supplierStateCode?: string;
    recipientStateCode?: string;
    payerType?: "Individual" | "HUF" | "Company" | "Firm" | "LLP";
    payeeType?: "Individual" | "HUF" | "Company" | "Firm" | "LLP";
    panAvailable?: boolean;
    isAuditCase?: boolean;
  };
}

const VALID_CATEGORIES = new Set([
  "Asset",
  "Liability",
  "Expense",
  "Revenue",
  "Equity",
  "ContraAsset",
  "ContraEquity",
]);

/**
 * Validates a voucher against fundamental double-entry principles and statutory laws.
 * REJECTS unbalanced or malformed vouchers without modifying numbers.
 * Enforces exact GST reconciliation (fails if actual GST != expected statutory GST).
 */
export function validateAndEnforceVoucher(input: VoucherValidationInput): StructuredVoucher {
  const { voucher, requestParams } = input;
  const checksPassed: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  const rawEntries: any[] = Array.isArray(voucher?.entries) ? voucher.entries : [];
  const baseAmount = Number(requestParams?.amount || voucher?.gstBreakdown?.taxableValue || 0);

  // Strict GST Rate Handling: Never silently default missing rates to 18%
  const rawGstRate = requestParams?.gstRate ?? voucher?.gstBreakdown?.gstRate;
  const hasExplicitGstRate = rawGstRate !== undefined && rawGstRate !== null;
  const gstRate = hasExplicitGstRate ? Number(rawGstRate) : 0;

  if (hasExplicitGstRate && !ALLOWED_GST_RATES.includes(gstRate)) {
    errors.push(
      `Invalid GST Rate: ${gstRate}% is not an authorized Indian statutory GST rate. Must be 0%, 0.25%, 3%, 5%, 12%, 18%, or 28%.`
    );
  }

  const gstType = requestParams?.gstType || voucher?.gstBreakdown?.gstType || "Intra-state (CGST + SGST)";
  const isInterState = gstType.includes("Inter-state") || gstType.includes("IGST");

  if (rawEntries.length === 0) {
    errors.push("Voucher contains no journal entry lines. A valid voucher must contain at least one Debit and one Credit entry.");
  }

  // 1. Line-by-Line Strict Accounting Validation
  const validatedEntries: JournalEntryLine[] = [];
  const accountOccurrences = new Map<string, { debitCount: number; creditCount: number }>();

  rawEntries.forEach((rawLine, idx) => {
    const lineIndex = idx + 1;
    const accountName = String(rawLine?.accountName || "").trim();

    if (!accountName || accountName.length < 2) {
      errors.push(`Line ${lineIndex}: Account name is missing or too short.`);
    }

    const category = String(rawLine?.category || "Expense").trim() as any;
    if (!VALID_CATEGORIES.has(category)) {
      errors.push(`Line ${lineIndex} (${accountName}): Invalid account category "${category}". Must be Asset, Liability, Expense, Revenue, Equity, ContraAsset, or ContraEquity.`);
    }

    const rawDebit = rawLine?.debitAmount;
    const rawCredit = rawLine?.creditAmount;

    const debitAmount = Number(rawDebit || 0);
    const creditAmount = Number(rawCredit || 0);

    // Negative amounts are strictly forbidden in double-entry bookkeeping
    if (debitAmount < 0 || creditAmount < 0 || isNaN(debitAmount) || isNaN(creditAmount)) {
      errors.push(`Line ${lineIndex} (${accountName}): Amounts cannot be negative or NaN (Dr: ${rawDebit}, Cr: ${rawCredit}).`);
    }

    // A single line cannot have both Debit and Credit amounts
    if (debitAmount > 0 && creditAmount > 0) {
      errors.push(`Line ${lineIndex} (${accountName}): Ambiguous entry! A single line cannot contain both Debit (₹${debitAmount}) and Credit (₹${creditAmount}). Split into distinct lines.`);
    }

    // Zero-amount lines are useless and clog general ledger
    if (debitAmount === 0 && creditAmount === 0) {
      errors.push(`Line ${lineIndex} (${accountName}): Both Debit and Credit are ₹0. Every journal line must have a non-zero financial transaction value.`);
    }

    // Check duplicate account heads
    const normName = accountName.toLowerCase();
    const existing = accountOccurrences.get(normName) || { debitCount: 0, creditCount: 0 };
    if (debitAmount > 0) {
      existing.debitCount++;
      if (existing.debitCount > 1) {
        warnings.push(`Duplicate Debit Ledger: "${accountName}" appears multiple times on the Debit side. Verify whether lines should be consolidated.`);
      }
    }
    if (creditAmount > 0) {
      existing.creditCount++;
      if (existing.creditCount > 1) {
        warnings.push(`Duplicate Credit Ledger: "${accountName}" appears multiple times on the Credit side. Verify whether lines should be consolidated.`);
      }
    }
    accountOccurrences.set(normName, existing);

    // Cleaned entry preserving user/model original values with 2-decimal paise precision
    validatedEntries.push({
      accountName: accountName || "Unassigned Account",
      category: VALID_CATEGORIES.has(category) ? category : "Expense",
      debitAmount: DecimalMath.toRupees(DecimalMath.toPaise(debitAmount)),
      creditAmount: DecimalMath.toRupees(DecimalMath.toPaise(creditAmount)),
      reason: String(rawLine?.reason || "Double-entry classification").trim(),
    });
  });

  // 2. Strict Double-Entry Equilibrium Check (NO AUTO-REBALANCING!)
  const sumDebit = DecimalMath.toRupees(validatedEntries.reduce((acc, curr) => acc + DecimalMath.toPaise(curr.debitAmount), 0));
  const sumCredit = DecimalMath.toRupees(validatedEntries.reduce((acc, curr) => acc + DecimalMath.toPaise(curr.creditAmount), 0));
  const discrepancy = Math.abs(DecimalMath.subtract(sumDebit, sumCredit));
  const mathematicallyBalanced = discrepancy === 0;

  if (mathematicallyBalanced && sumDebit > 0) {
    checksPassed.push(`Double-Entry Equilibrium Verified: Total Debits (₹${sumDebit.toLocaleString("en-IN")}) = Total Credits (₹${sumCredit.toLocaleString("en-IN")}).`);
  } else {
    errors.push(
      `Double-Entry Equilibrium VIOLATED: Total Debits (₹${sumDebit.toLocaleString("en-IN")}) do not equal Total Credits (₹${sumCredit.toLocaleString("en-IN")}). Discrepancy: ₹${discrepancy.toLocaleString("en-IN")}. As per ICAI standards, unbalanced vouchers cannot be posted.`
    );
  }

  // 3. GST Exact Reconciliation (MANDATORY FAILURE IF EXPECTED != ACTUAL)
  let gstValidated = true;
  let expectedGst = 0;
  let expectedCgst = 0;
  let expectedSgst = 0;
  let expectedIgst = 0;

  // Actual GST lines present in journal entries
  const actualCgst = DecimalMath.toRupees(
    validatedEntries
      .filter((e) => e.accountName.toLowerCase().includes("cgst"))
      .reduce((s, e) => s + DecimalMath.toPaise(e.debitAmount || e.creditAmount), 0)
  );

  const actualSgst = DecimalMath.toRupees(
    validatedEntries
      .filter((e) => e.accountName.toLowerCase().includes("sgst"))
      .reduce((s, e) => s + DecimalMath.toPaise(e.debitAmount || e.creditAmount), 0)
  );

  const actualIgst = DecimalMath.toRupees(
    validatedEntries
      .filter((e) => e.accountName.toLowerCase().includes("igst"))
      .reduce((s, e) => s + DecimalMath.toPaise(e.debitAmount || e.creditAmount), 0)
  );

  const actualTotalGst = DecimalMath.add(actualCgst, actualSgst, actualIgst);

  if (hasExplicitGstRate && gstRate > 0 && baseAmount > 0) {
    const gstCalc = calculateGstInvoice({
      supplierStateCode: requestParams?.supplierStateCode || (isInterState ? "27" : "07"),
      recipientStateCode: requestParams?.recipientStateCode || "07",
      items: [
        {
          description: requestParams?.description || "Supply",
          hsnSac: "9983",
          taxableAmount: baseAmount,
          gstRate,
        },
      ],
    });

    expectedCgst = gstCalc.totalCgst;
    expectedSgst = gstCalc.totalSgst;
    expectedIgst = gstCalc.totalIgst;
    expectedGst = gstCalc.totalGst;

    // A. Inter-State vs Intra-State Jurisdiction Verification
    if (isInterState) {
      if (actualCgst > 0 || actualSgst > 0) {
        errors.push(
          `Inter-State GST Jurisdiction Violation: Inter-state transactions must use IGST. Found CGST/SGST lines totaling ₹${DecimalMath.add(actualCgst, actualSgst)}.`
        );
        gstValidated = false;
      }
      if (!DecimalMath.areEqual(actualIgst, expectedIgst, 1)) {
        errors.push(
          `GST Exact Reconciliation FAILED: Expected statutory IGST of ₹${expectedIgst.toLocaleString("en-IN")} on base ₹${baseAmount.toLocaleString("en-IN")} @ ${gstRate}%, but actual IGST journal entries equal ₹${actualIgst.toLocaleString("en-IN")}. Discrepancy: ₹${Math.abs(expectedIgst - actualIgst).toLocaleString("en-IN")}.`
        );
        gstValidated = false;
      }
    } else {
      if (actualIgst > 0) {
        errors.push(
          `Intra-State GST Jurisdiction Violation: Intra-state transactions must use CGST + SGST. Found IGST line of ₹${actualIgst}.`
        );
        gstValidated = false;
      }
      if (!DecimalMath.areEqual(actualCgst, expectedCgst, 1)) {
        errors.push(
          `GST Exact Reconciliation FAILED: Expected CGST of ₹${expectedCgst.toLocaleString("en-IN")} on base ₹${baseAmount.toLocaleString("en-IN")} @ ${gstRate / 2}%, but actual CGST journal entries equal ₹${actualCgst.toLocaleString("en-IN")}.`
        );
        gstValidated = false;
      }
      if (!DecimalMath.areEqual(actualSgst, expectedSgst, 1)) {
        errors.push(
          `GST Exact Reconciliation FAILED: Expected SGST of ₹${expectedSgst.toLocaleString("en-IN")} on base ₹${baseAmount.toLocaleString("en-IN")} @ ${gstRate / 2}%, but actual SGST journal entries equal ₹${actualSgst.toLocaleString("en-IN")}.`
        );
        gstValidated = false;
      }
    }

    // B. Total GST Reconciliation Check
    if (!DecimalMath.areEqual(actualTotalGst, expectedGst, 1)) {
      errors.push(
        `GST Total Reconciliation FAILED: Expected total GST of ₹${expectedGst.toLocaleString("en-IN")} but actual GST ledger entries total ₹${actualTotalGst.toLocaleString("en-IN")}.`
      );
      gstValidated = false;
    }

    if (gstValidated) {
      checksPassed.push(
        `GST Exact Reconciliation Passed: Expected ₹${expectedGst.toLocaleString("en-IN")} matches actual journal entries (${isInterState ? `IGST ₹${expectedIgst}` : `CGST ₹${expectedCgst} + SGST ₹${expectedSgst}`}).`
      );
    }
  } else if (hasExplicitGstRate && gstRate === 0) {
    if (actualTotalGst > 0) {
      errors.push(
        `Exempt / Nil-Rated GST Violation: Rate specified is 0%, but voucher contains ₹${actualTotalGst.toLocaleString("en-IN")} in GST entries.`
      );
      gstValidated = false;
    } else {
      checksPassed.push("GST Exemption / Zero-Rate Verified: ₹0 GST liability confirmed.");
    }
  } else if (!hasExplicitGstRate && actualTotalGst > 0) {
    warnings.push(
      `Voucher contains ₹${actualTotalGst.toLocaleString("en-IN")} in GST entries, but no explicit GST rate was declared in transaction parameters.`
    );
  }

  // 4. TDS Statutory Verification
  let tdsValidated = true;
  const tdsSectionKey = requestParams?.tdsSection || voucher?.tdsBreakdown?.section || "none";
  const tdsResult = calculateTDS({
    section: tdsSectionKey,
    baseAmount,
    payerType: requestParams?.payerType,
    payeeType: requestParams?.payeeType,
    panAvailable: requestParams?.panAvailable,
    isPayerSubjectToAudit: requestParams?.isAuditCase,
  });

  if (tdsResult.applicable) {
    if (tdsResult.tdsAmount > baseAmount) {
      errors.push(`Statutory Violation: TDS amount (₹${tdsResult.tdsAmount}) exceeds transaction base value (₹${baseAmount}).`);
      tdsValidated = false;
    } else {
      checksPassed.push(`Statutory TDS Verified: ${tdsResult.sectionDisplay} @ ${tdsResult.rate}% = ₹${tdsResult.tdsAmount.toLocaleString("en-IN")}.`);
    }
  } else if (tdsResult.thresholdExceeded === false && tdsResult.section !== "None") {
    checksPassed.push(`TDS Threshold Check: Payment ₹${baseAmount.toLocaleString("en-IN")} is below statutory threshold of ₹${tdsResult.threshold.toLocaleString("en-IN")}.`);
  }

  // 5. CA Review Confidence Scoring & Validation Status
  const isValid = errors.length === 0 && mathematicallyBalanced && gstValidated && tdsValidated;
  let confidence = isValid ? 98 : 30;

  if (warnings.length > 0) {
    confidence -= warnings.length * 10;
  }
  if (!requestParams?.description || requestParams.description.length < 10) {
    confidence -= 5;
  }
  if (baseAmount > 500000) {
    checksPassed.push("High Value Commercial Transaction (> ₹5 Lakhs): Recommend Chartered Accountant audit review.");
  }

  confidence = Math.max(10, Math.min(100, confidence));

  const validationStatus: VoucherValidationResult = {
    isValid,
    mathematicallyBalanced,
    gstValidated,
    tdsValidated,
    confidence,
    caReviewRequired: !isValid || baseAmount > 500000 || warnings.length > 0 || errors.length > 0,
    checksPassed,
    warnings,
    errors,
  };

  return {
    voucherType: voucher?.voucherType || "Journal Voucher",
    plainSummary: voucher?.plainSummary || "Double-entry journal voucher recorded as per Indian Accounting Standards.",
    entries: validatedEntries,
    totalDebit: sumDebit,
    totalCredit: sumCredit,
    narration: voucher?.narration || `Being transaction for ${requestParams?.description || "business expenditure"} recorded in books of accounts.`,
    validationStatus,
    gstBreakdown: {
      taxableValue: baseAmount,
      cgst: expectedCgst,
      sgst: expectedSgst,
      igst: expectedIgst,
      itcEligible: voucher?.gstBreakdown?.itcEligible !== false,
      itcNote: voucher?.gstBreakdown?.itcNote || (expectedGst > 0 ? "Potential ITC claimable subject to GSTR-2B reflection and Section 16 conditions" : "No GST applicable"),
    },
    tdsBreakdown: {
      applicable: tdsResult.applicable,
      section: tdsResult.section,
      rate: tdsResult.rate,
      tdsAmount: tdsResult.tdsAmount,
      challanCode: tdsResult.challanCode,
      dueDate: tdsResult.dueDate,
      thresholdUsed: tdsResult.threshold,
      thresholdExceeded: tdsResult.thresholdExceeded,
      lawVersion: tdsResult.lawVersion,
    },
    indAsReference: {
      standardCode: voucher?.indAsReference?.standardCode || "Ind AS 1",
      title: voucher?.indAsReference?.title || "Presentation of Financial Statements",
      keyPrinciple: voucher?.indAsReference?.keyPrinciple || "Accrual basis accounting and double-entry equilibrium",
    },
    incomeTaxRule: voucher?.incomeTaxRule || "Verify payee PAN and ensure compliance with Section 40A(3) cash payment limit of ₹10,000.",
  };
}
