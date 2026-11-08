/**
 * Comprehensive Indian GST Engine (CGST, SGST, IGST, UTGST, RCM, ITC & Valuation)
 * Compliant with CGST Act 2017, IGST Act 2017, and relevant CBIC Circulars.
 */

import { GstLineItem, GstCalculationResult } from "../types";

export interface GstCalculationInput {
  supplierStateCode: string; // e.g. "07" for Delhi, "27" for Maharashtra
  recipientStateCode: string; // e.g. "07" or "27"
  items: Array<{
    id?: string;
    description: string;
    hsnSac: string;
    taxableAmount: number;
    gstRate: number; // 0, 0.25, 3, 5, 12, 18, 28
    isRcm?: boolean;
    isBlockedItc?: boolean;
    blockedItcReason?: string;
  }>;
  isCreditNote?: boolean;
  isDebitNote?: boolean;
}

// State Code mapping as per Indian GST Standard
export const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
};

// Recognized GST tax rates
export const ALLOWED_GST_RATES = [0, 0.25, 3, 5, 12, 18, 28];

/**
 * Validate HSN (Goods) or SAC (Services)
 * Goods HSN: 4, 6, or 8 digits
 * Services SAC: 6 digits starting with '99'
 */
export function validateHsnSac(code: string): { isValid: boolean; type: "HSN" | "SAC" | "Unknown"; message?: string } {
  const cleaned = (code || "").trim().replace(/\s/g, "");
  if (!cleaned) {
    return { isValid: false, type: "Unknown", message: "HSN/SAC code cannot be blank." };
  }

  if (/^99\d{4}$/.test(cleaned)) {
    return { isValid: true, type: "SAC", message: "Valid 6-digit Services Accounting Code (SAC)." };
  }

  if (/^\d{4}$/.test(cleaned) || /^\d{6}$/.test(cleaned) || /^\d{8}$/.test(cleaned)) {
    return { isValid: true, type: "HSN", message: `Valid ${cleaned.length}-digit HSN Goods Code.` };
  }

  return {
    isValid: false,
    type: "Unknown",
    message: "Invalid HSN/SAC format. HSN must be 4, 6, or 8 digits; SAC must be 6 digits starting with 99.",
  };
}

/**
 * Check if an expense / procurement falls under Blocked ITC (Section 17(5) of CGST Act)
 */
export function evaluateBlockedItc(
  description: string,
  hsnSac?: string
): { isBlocked: boolean; section: string; reason: string } {
  const d = (description || "").toLowerCase();

  // 1. Motor vehicles for transportation of persons (capacity <= 13 seats)
  if (
    d.includes("motor car") ||
    d.includes("passenger vehicle") ||
    d.includes("car rental") ||
    d.includes("cab service") ||
    d.includes("sedan") ||
    d.includes("suv purchase") ||
    d.includes("car insurance") ||
    d.includes("car maintenance") ||
    d.includes("vehicle servicing")
  ) {
    return {
      isBlocked: true,
      section: "Section 17(5)(a)",
      reason: "Blocked ITC u/s 17(5)(a): Motor vehicles for transportation of persons having approved seating capacity ≤ 13 persons (including driver), and related insurance/repair services.",
    };
  }

  // 2. Food, beverages, outdoor catering, beauty, health
  if (
    d.includes("food") ||
    d.includes("catering") ||
    d.includes("restaurant") ||
    d.includes("lunch") ||
    d.includes("dinner") ||
    d.includes("beverage") ||
    d.includes("snacks") ||
    d.includes("health insurance") ||
    d.includes("gym membership") ||
    d.includes("beauty treatment") ||
    d.includes("cosmetic surgery")
  ) {
    return {
      isBlocked: true,
      section: "Section 17(5)(b)(i)",
      reason: "Blocked ITC u/s 17(5)(b)(i): Food & beverages, outdoor catering, beauty treatment, health services, and club membership.",
    };
  }

  // 3. Travel benefits to employees on vacation (LTA)
  if (d.includes("leave travel") || d.includes("lta") || d.includes("vacation ticket") || d.includes("holiday package")) {
    return {
      isBlocked: true,
      section: "Section 17(5)(b)(iii)",
      reason: "Blocked ITC u/s 17(5)(b)(iii): Travel benefits extended to employees on vacation.",
    };
  }

  // 4. Works contract for construction of immovable property
  if (
    (d.includes("works contract") || d.includes("civil construction") || d.includes("building construction")) &&
    !d.includes("plant and machinery")
  ) {
    return {
      isBlocked: true,
      section: "Section 17(5)(c)",
      reason: "Blocked ITC u/s 17(5)(c): Works contract services for construction of immovable property (other than plant and machinery).",
    };
  }

  // 5. Personal consumption
  if (d.includes("personal use") || d.includes("director personal") || d.includes("proprietor home")) {
    return {
      isBlocked: true,
      section: "Section 17(5)(g)",
      reason: "Blocked ITC u/s 17(5)(g): Goods or services used for personal consumption.",
    };
  }

  // 6. Goods lost, stolen, destroyed, written off, or given as gift / free sample
  if (d.includes("gift") || d.includes("free sample") || d.includes("lost goods") || d.includes("stolen") || d.includes("write-off inventory")) {
    return {
      isBlocked: true,
      section: "Section 17(5)(h)",
      reason: "Blocked ITC u/s 17(5)(h): Goods lost, stolen, destroyed, written off, or disposed of by way of gift or free samples.",
    };
  }

  return { isBlocked: false, section: "Section 16(1)", reason: "Eligible for ITC in course or furtherance of business." };
}

/**
 * Check if a transaction is covered under Reverse Charge Mechanism (RCM - Section 9(3) / 9(4))
 */
export function evaluateRcm(
  description: string
): { isRcm: boolean; category: string; rate: number; reason: string } {
  const d = (description || "").toLowerCase();

  if (d.includes("gta") || d.includes("goods transport agency") || d.includes("truck freight") || d.includes("lorry freight")) {
    return {
      isRcm: true,
      category: "GTA (Goods Transport Agency)",
      rate: 5,
      reason: "Notification 13/2017-CT(R) Item 1: Supply of services by GTA (not paying @ 12% forward charge) is taxable under RCM @ 5%.",
    };
  }

  if (d.includes("advocate") || d.includes("legal fee") || d.includes("law firm") || d.includes("senior counsel")) {
    return {
      isRcm: true,
      category: "Legal Services by Advocate / Firm",
      rate: 18,
      reason: "Notification 13/2017-CT(R) Item 2: Services provided by an individual advocate or firm of advocates to any business entity.",
    };
  }

  if (d.includes("director remuneration") || d.includes("director sitting fee") || d.includes("director fee")) {
    return {
      isRcm: true,
      category: "Services by Director to Company",
      rate: 18,
      reason: "Notification 13/2017-CT(R) Item 6: Services supplied by a director of a company or a body corporate to the said company/body corporate.",
    };
  }

  if (d.includes("sponsorship") || d.includes("sports sponsorship")) {
    return {
      isRcm: true,
      category: "Sponsorship Services",
      rate: 18,
      reason: "Notification 13/2017-CT(R) Item 4: Services provided by way of sponsorship to any body corporate or partnership firm.",
    };
  }

  return { isRcm: false, category: "Forward Charge", rate: 0, reason: "Normal forward charge mechanism." };
}

import { DecimalMath } from "../utils/decimalMath";

/**
 * Deterministically compute GST breakdown for single or multiple items
 * including state determination, rounding, RCM, and ITC evaluation.
 * Never silently defaults missing rates to 18%.
 */
export function calculateGstInvoice(input: GstCalculationInput): GstCalculationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const complianceNotes: string[] = [];

  const supplierState = (input.supplierStateCode || "").trim();
  const recipientState = (input.recipientStateCode || "").trim();

  if (!supplierState) {
    warnings.push("Supplier state code is missing. Intra-state vs Inter-state jurisdiction cannot be confirmed without GSTIN/State.");
  }
  if (!recipientState) {
    warnings.push("Recipient place of supply state code is missing. Intra-state vs Inter-state jurisdiction cannot be confirmed.");
  }

  // Intra-state when supplier and recipient are in the same state/UT
  const effectiveSupplierState = supplierState || "07";
  const effectiveRecipientState = recipientState || effectiveSupplierState;
  const isInterState = effectiveSupplierState !== effectiveRecipientState;

  if (isInterState) {
    complianceNotes.push(
      `Inter-State Supply: Supplier State ${effectiveSupplierState} (${GST_STATE_CODES[effectiveSupplierState] || "State"}) → Place of Supply ${effectiveRecipientState} (${GST_STATE_CODES[effectiveRecipientState] || "State"}). IGST applies.`
    );
  } else {
    complianceNotes.push(
      `Intra-State Supply: Supplier & Place of Supply in State ${effectiveSupplierState} (${GST_STATE_CODES[effectiveSupplierState] || "State"}). CGST + SGST apply.`
    );
  }

  let taxableValue = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalGst = 0;
  let rcmTaxAmount = 0;
  let hasRcm = false;
  let itcClaimable = 0;
  let itcBlocked = 0;

  const processedItems: GstLineItem[] = [];

  (input.items || []).forEach((item, idx) => {
    const rawTaxable = Number(item.taxableAmount || 0);
    if (rawTaxable < 0) {
      errors.push(`Line ${idx + 1}: Taxable amount cannot be negative (₹${rawTaxable}).`);
    }
    const cleanTaxable = Math.max(0, DecimalMath.toRupees(DecimalMath.toPaise(rawTaxable)));

    // Strict GST Rate Validation: Never silently assume 18% if missing or invalid!
    let rate = 0;
    if (typeof item.gstRate === "number" && ALLOWED_GST_RATES.includes(item.gstRate)) {
      rate = item.gstRate;
    } else {
      errors.push(
        `Line ${idx + 1} (${item.description || "Item"}): Missing or invalid GST rate (${item.gstRate}%). Statutory GST rates are: 0%, 0.25%, 3%, 5%, 12%, 18%, 28%. Silent 18% fallback is prohibited under CA audit rules.`
      );
    }

    // Evaluate RCM
    const rcmEval = evaluateRcm(item.description);
    const isRcm = item.isRcm ?? rcmEval.isRcm;
    if (isRcm) {
      hasRcm = true;
      complianceNotes.push(`Line ${idx + 1} (${item.description}): Subject to Reverse Charge Mechanism (RCM). Tax payable in cash.`);
    }

    // Evaluate Blocked ITC
    const itcEval = evaluateBlockedItc(item.description, item.hsnSac);
    const isBlocked = item.isBlockedItc ?? itcEval.isBlocked;
    const blockedReason = item.blockedItcReason || (isBlocked ? itcEval.reason : undefined);

    // Compute line GST using integer-paise arithmetic
    const lineGstTotal = DecimalMath.calculatePercentage(cleanTaxable, rate);
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (rate > 0) {
      if (isInterState) {
        igst = lineGstTotal;
      } else {
        const split = DecimalMath.splitIntraStateGst(lineGstTotal);
        cgst = split.cgst;
        sgst = split.sgst;
      }
    }

    const lineTotal = DecimalMath.add(cleanTaxable, lineGstTotal);

    taxableValue = DecimalMath.add(taxableValue, cleanTaxable);
    totalCgst = DecimalMath.add(totalCgst, cgst);
    totalSgst = DecimalMath.add(totalSgst, sgst);
    totalIgst = DecimalMath.add(totalIgst, igst);
    totalGst = DecimalMath.add(totalGst, lineGstTotal);

    if (isRcm) {
      rcmTaxAmount = DecimalMath.add(rcmTaxAmount, lineGstTotal);
    }

    if (isBlocked) {
      itcBlocked = DecimalMath.add(itcBlocked, lineGstTotal);
      warnings.push(`Line ${idx + 1}: ITC is BLOCKED under ${itcEval.section}. Cannot claim input credit.`);
    } else {
      itcClaimable = DecimalMath.add(itcClaimable, lineGstTotal);
    }

    processedItems.push({
      id: item.id || `item_${idx + 1}`,
      description: item.description,
      hsnSac: item.hsnSac,
      taxableAmount: cleanTaxable,
      gstRate: rate,
      isRcm,
      isBlockedItc: isBlocked,
      blockedItcReason: blockedReason,
      cgst,
      sgst,
      igst,
      total: lineTotal,
    });
  });

  const invoiceTotal = DecimalMath.add(taxableValue, totalGst);

  // Rounding Rule as per Section 170 of CGST Act (to nearest rupee)
  const roundResult = DecimalMath.roundSection170(invoiceTotal);
  const roundedInvoiceTotal = roundResult.roundedAmount;
  const roundingDifference = roundResult.roundingDifference;

  if (roundingDifference !== 0) {
    complianceNotes.push(
      `Section 170 Rounding: Unrounded invoice total ₹${invoiceTotal.toFixed(2)} rounded to ₹${roundedInvoiceTotal.toFixed(2)} (Round-off adjustment: ₹${roundingDifference > 0 ? "+" : ""}${roundingDifference.toFixed(2)}).`
    );
  }

  if (input.isCreditNote) {
    complianceNotes.push("Credit Note issued u/s 34(1): Reverses tax liability and supplier output GST.");
  } else if (input.isDebitNote) {
    complianceNotes.push("Debit Note issued u/s 34(3): Increases tax liability and supplier output GST.");
  }

  return {
    supplierStateCode: effectiveSupplierState,
    recipientStateCode: effectiveRecipientState,
    isInterState,
    taxableValue,
    totalCgst,
    totalSgst,
    totalIgst,
    totalGst,
    invoiceTotal,
    roundedInvoiceTotal,
    roundingDifference,
    rcmApplicable: hasRcm,
    rcmTaxAmount,
    itcClaimable,
    itcBlocked,
    items: processedItems,
    warnings,
    complianceNotes,
    errors: errors.length > 0 ? errors : undefined,
  };
}
