/**
 * Statutory Indian TDS & TCS Engine
 * Comprehensive implementation covering:
 * - Income-tax Act, 1961 provisions
 * - Income-tax Act, 2025 Section 393 transition provisions
 * - Section 206AA: Higher rate for non-furnishing of PAN (20% or 5%)
 * - Section 206AB: Higher deduction for non-filers of income tax returns
 * - Section 197 / 197A: Lower or Nil deduction certificates (Form 13 / 15G / 15H)
 * - Section 44AB audit eligibility for Individual / HUF deductors
 * - Single bill vs annual aggregate thresholds
 * - CBDT Circular No. 23/2017: Exclusion of GST component from TDS base
 */

import { TdsCalculationResult } from "../types";

export interface TdsInputParams {
  section: string;
  baseAmount: number;
  gstAmount?: number;
  payerType?: "Individual" | "HUF" | "Company" | "Firm" | "LLP";
  payeeType?: "Individual" | "HUF" | "Company" | "Firm" | "LLP" | "Non-Resident";
  panAvailable?: boolean;
  isNonFiler206AB?: boolean;
  hasLowerDeductionCert197?: boolean;
  lowerDeductionRate?: number; // e.g. 1%, 0%
  lowerDeductionCertNo?: string;
  isForm15Gor15H?: boolean;
  annualAggregateBeforePayment?: number;
  taxYear?: string; // e.g. "2024-25", "2025-26", "2026-27"
  isPayerSubjectToAudit?: boolean; // Required for Ind/HUF deductor liability under 194C, 194J, 194H, 194I
  paymentNature?: string;
}

export interface SectionRule {
  key: string;
  act1961Section: string;
  act2025Section: string;
  act2025TableRef: string;
  title: string;
  baseRateIndividual: number;
  baseRateCompany: number;
  singleBillThreshold: number;
  annualThreshold: number;
  challanCode: string;
  dueDayOfMonth: number;
  explanation: string;
  exemptionsNote: string;
  individualHufExemptUnlessAudit: boolean;
  category: "Professional & Technical" | "Contractor" | "Rent" | "Brokerage" | "Goods & Assets" | "Interest & Financial" | "Salary";
}

export const VERSIONED_TDS_RULES: Record<string, SectionRule> = {
  "194j-prof-10": {
    key: "194j-prof-10",
    act1961Section: "194J(1)(a)",
    act2025Section: "393",
    act2025TableRef: "Table to Section 393, Item 11 (Fees for Professional Services)",
    title: "Fees for Professional Services (Legal, Medical, Engineering, CA, Architecture)",
    baseRateIndividual: 10,
    baseRateCompany: 10,
    singleBillThreshold: 30000,
    annualThreshold: 30000,
    challanCode: "ITNS 281 (Minor Head 200)",
    dueDayOfMonth: 7,
    explanation: "10% TDS on professional fees where aggregate payments to a professional exceed ₹30,000 in the financial year.",
    exemptionsNote: "Individual/HUF not liable to tax audit u/s 44AB in preceding FY is exempt (covered under Sec 194M if aggregate exceeds ₹50 Lakhs).",
    individualHufExemptUnlessAudit: true,
    category: "Professional & Technical",
  },
  "194j-tech-2": {
    key: "194j-tech-2",
    act1961Section: "194J(1)(b)",
    act2025Section: "393",
    act2025TableRef: "Table to Section 393, Item 12 (Fees for Technical Services)",
    title: "Fees for Technical Services / IT Support / Software Dev / Call Centers",
    baseRateIndividual: 2,
    baseRateCompany: 2,
    singleBillThreshold: 30000,
    annualThreshold: 30000,
    challanCode: "ITNS 281 (Minor Head 200)",
    dueDayOfMonth: 7,
    explanation: "Concessional 2% TDS on technical services, routine IT support, and call center fees exceeding ₹30,000 annual aggregate.",
    exemptionsNote: "Lower rate applies to technical services under Finance Act amendments.",
    individualHufExemptUnlessAudit: true,
    category: "Professional & Technical",
  },
  "194c-contractor-1": {
    key: "194c-contractor-1",
    act1961Section: "194C(1)",
    act2025Section: "393",
    act2025TableRef: "Table to Section 393, Item 4 (Payments to Individual / HUF Contractors)",
    title: "Payment to Individual / HUF Contractors & Subcontractors",
    baseRateIndividual: 1,
    baseRateCompany: 1,
    singleBillThreshold: 30000,
    annualThreshold: 100000,
    challanCode: "ITNS 281 (Minor Head 200)",
    dueDayOfMonth: 7,
    explanation: "1% TDS on works contract/advertising/catering/transport to Individuals/HUFs if single bill > ₹30,000 or annual aggregate > ₹1,00,000.",
    exemptionsNote: "No TDS on goods transport operators (GTA) owning ≤ 10 goods carriages on furnishing declaration with valid PAN.",
    individualHufExemptUnlessAudit: true,
    category: "Contractor",
  },
  "194c-contractor-2": {
    key: "194c-contractor-2",
    act1961Section: "194C(2)",
    act2025Section: "393",
    act2025TableRef: "Table to Section 393, Item 4 (Payments to Corporate Contractors)",
    title: "Payment to Corporate / Firm / LLP Contractors",
    baseRateIndividual: 2,
    baseRateCompany: 2,
    singleBillThreshold: 30000,
    annualThreshold: 100000,
    challanCode: "ITNS 281 (Minor Head 200)",
    dueDayOfMonth: 7,
    explanation: "2% TDS on works contract payments to Companies/Partnerships if single bill > ₹30,000 or annual aggregate > ₹1,00,000.",
    exemptionsNote: "Contract for supply of materials according to buyer specifications without materials provided by buyer is sales of goods, not contract.",
    individualHufExemptUnlessAudit: true,
    category: "Contractor",
  },
  "194i-rent-10": {
    key: "194i-rent-10",
    act1961Section: "194I(a)",
    act2025Section: "393",
    act2025TableRef: "Table to Section 393, Item 9 (Rent for Land, Commercial Building & Furniture)",
    title: "Rent for Land, Commercial Office, Factory Building & Furniture",
    baseRateIndividual: 10,
    baseRateCompany: 10,
    singleBillThreshold: 240000,
    annualThreshold: 240000,
    challanCode: "ITNS 281 (Minor Head 200)",
    dueDayOfMonth: 7,
    explanation: "10% TDS on commercial office / building rent where total annual rent credited or paid to a payee exceeds ₹2,40,000 p.a.",
    exemptionsNote: "TDS is calculated strictly on base rent excluding GST (CBDT Circular 23/2017). Non-audit Ind/HUF covered under 194-IB if rent > ₹50,000/month.",
    individualHufExemptUnlessAudit: true,
    category: "Rent",
  },
  "194i-rent-2": {
    key: "194i-rent-2",
    act1961Section: "194I(b)",
    act2025Section: "393",
    act2025TableRef: "Table to Section 393, Item 10 (Rent for Plant, Machinery & Equipment)",
    title: "Rent for Machinery, Industrial Equipment, Vehicles & DG Sets",
    baseRateIndividual: 2,
    baseRateCompany: 2,
    singleBillThreshold: 240000,
    annualThreshold: 240000,
    challanCode: "ITNS 281 (Minor Head 200)",
    dueDayOfMonth: 7,
    explanation: "2% TDS on hiring / lease of plant, machinery, or equipment exceeding ₹2,40,000 annual aggregate.",
    exemptionsNote: "Excludes vehicle rentals with fuel and driver where composite contract is under 194C.",
    individualHufExemptUnlessAudit: true,
    category: "Rent",
  },
  "194h-commission-5": {
    key: "194h-commission-5",
    act1961Section: "194H",
    act2025Section: "393",
    act2025TableRef: "Table to Section 393, Item 8 (Commission or Brokerage)",
    title: "Commission or Brokerage Services",
    baseRateIndividual: 5,
    baseRateCompany: 5,
    singleBillThreshold: 15000,
    annualThreshold: 15000,
    challanCode: "ITNS 281 (Minor Head 200)",
    dueDayOfMonth: 7,
    explanation: "5% TDS on commission or brokerage exceeding ₹15,000 in aggregate during the financial year.",
    exemptionsNote: "Underwriting commission and insurance commission (covered separately u/s 194D) are excluded.",
    individualHufExemptUnlessAudit: true,
    category: "Brokerage",
  },
  "194q-goods-0.1": {
    key: "194q-goods-0.1",
    act1961Section: "194Q",
    act2025Section: "393",
    act2025TableRef: "Table to Section 393, Item 19 (Purchase of Goods exceeding ₹50 Lakhs)",
    title: "TDS on Purchase of Goods exceeding ₹50 Lakhs",
    baseRateIndividual: 0.1,
    baseRateCompany: 0.1,
    singleBillThreshold: 5000000,
    annualThreshold: 5000000,
    challanCode: "ITNS 281 (Minor Head 200)",
    dueDayOfMonth: 7,
    explanation: "0.1% TDS on value of goods purchased from a resident seller exceeding ₹50 Lakhs in the FY by buyers with preceding year turnover > ₹10 Cr.",
    exemptionsNote: "Transactions where TCS u/s 206C(1H) is collected or on recognized stock exchanges are exempt.",
    individualHufExemptUnlessAudit: false,
    category: "Goods & Assets",
  },
  "194a-interest-10": {
    key: "194a-interest-10",
    act1961Section: "194A",
    act2025Section: "393",
    act2025TableRef: "Table to Section 393, Item 2 (Interest other than Interest on Securities)",
    title: "Interest on Unsecured Loans / NBFCs / Inter-Corporate Deposits",
    baseRateIndividual: 10,
    baseRateCompany: 10,
    singleBillThreshold: 5000,
    annualThreshold: 5000,
    challanCode: "ITNS 281 (Minor Head 200)",
    dueDayOfMonth: 7,
    explanation: "10% TDS on interest paid on loans, advances, and inter-corporate deposits exceeding ₹5,000 p.a. (Bank interest threshold is ₹40,000 / ₹50,000 for seniors).",
    exemptionsNote: "Interest paid to banking companies, financial institutions, or cooperative banks is exempt.",
    individualHufExemptUnlessAudit: true,
    category: "Interest & Financial",
  },
  "194r-benefit-10": {
    key: "194r-benefit-10",
    act1961Section: "194R",
    act2025Section: "393",
    act2025TableRef: "Table to Section 393, Item 20 (Benefit or Perquisite in respect of Business / Profession)",
    title: "Business Perquisites, Dealer Gifts, Incentives & Sponsorships",
    baseRateIndividual: 10,
    baseRateCompany: 10,
    singleBillThreshold: 20000,
    annualThreshold: 20000,
    challanCode: "ITNS 281 (Minor Head 200)",
    dueDayOfMonth: 7,
    explanation: "10% TDS on value of any benefit or perquisite arising from business or profession provided to a resident exceeding ₹20,000 in the year.",
    exemptionsNote: "Only applicable if payer turnover exceeded ₹1 Crore (business) or ₹50 Lakhs (profession) in preceding FY.",
    individualHufExemptUnlessAudit: true,
    category: "Goods & Assets",
  },
  "194m-others-5": {
    key: "194m-others-5",
    act1961Section: "194M",
    act2025Section: "393",
    act2025TableRef: "Table to Section 393, Item 15 (Contractual & Professional Payments by Individuals/HUFs)",
    title: "Payment to Contractors & Professionals by Individuals/HUFs not liable to Tax Audit",
    baseRateIndividual: 5,
    baseRateCompany: 5,
    singleBillThreshold: 5000000,
    annualThreshold: 5000000,
    challanCode: "Challan-cum-Return Form 26QD",
    dueDayOfMonth: 30,
    explanation: "5% TDS on contractual or professional payments by Individuals/HUFs not covered u/s 194C/194J when aggregate exceeds ₹50 Lakhs in a FY.",
    exemptionsNote: "Deductor does not require TAN. Tax deposited using PAN-based Form 26QD.",
    individualHufExemptUnlessAudit: false,
    category: "Contractor",
  },
};

/**
 * Deterministically compute statutory TDS with threshold, PAN validation,
 * payer eligibility, Section 206AA/206AB, Section 197 certificates, and Act versioning.
 */
export function calculateTDS(input: TdsInputParams): TdsCalculationResult {
  let normKey = (input.section || "").toLowerCase().trim();
  
  // Section code normalization mapping
  if (normKey === "194c" || normKey === "sec 194c" || normKey === "section 194c") {
    normKey = (input.payeeType === "Company" || input.payeeType === "Firm" || input.payeeType === "LLP")
      ? "194c-contractor-2"
      : "194c-contractor-1";
  } else if (normKey === "194j" || normKey === "sec 194j" || normKey === "section 194j") {
    normKey = "194j-prof-10";
  } else if (normKey === "194i" || normKey === "sec 194i" || normKey === "section 194i") {
    normKey = "194i-rent-10";
  } else if (normKey === "194h" || normKey === "sec 194h" || normKey === "section 194h") {
    normKey = "194h-commission-5";
  } else if (normKey === "194q" || normKey === "sec 194q" || normKey === "section 194q") {
    normKey = "194q-goods-0.1";
  }

  const rule = VERSIONED_TDS_RULES[normKey];

  if (!rule || normKey === "none" || input.baseAmount <= 0) {
    return {
      applicable: false,
      section: "None",
      rate: 0,
      threshold: 0,
      thresholdExceeded: false,
      taxableTdsBase: 0,
      tdsAmount: 0,
      reason: "No statutory TDS section applicable or transaction value is zero.",
      lawVersion: "Income-tax Act, 1961",
      sectionDisplay: "None",
      challanCode: "N/A",
      dueDate: "N/A",
    };
  }

  // Version framework: Determine applicable Act based on tax year
  // Income-tax Act, 2025 applies for Tax Year 2026-27 onwards (from 1 April 2026)
  const isAct2025 = input.taxYear && (input.taxYear.includes("2026-27") || input.taxYear.includes("2027-28"));
  const lawVersion = isAct2025 ? "Income-tax Act, 2025" : "Income-tax Act, 1961";
  const sectionDisplay = isAct2025
    ? `Sec ${rule.act2025Section} (${rule.act2025TableRef})`
    : `Section ${rule.act1961Section} (Income-tax Act, 1961)`;

  // Check Deductor Eligibility:
  // For Individuals and HUFs, sections 194C, 194J, 194H, 194I require deductor to be liable to tax audit u/s 44AB
  // in preceding FY. If not liable to audit, they are legally exempt from deducting TDS under these sections.
  if (
    rule.individualHufExemptUnlessAudit &&
    (input.payerType === "Individual" || input.payerType === "HUF") &&
    input.isPayerSubjectToAudit === false
  ) {
    return {
      applicable: false,
      section: rule.act1961Section,
      rate: 0,
      threshold: rule.annualThreshold,
      thresholdExceeded: false,
      taxableTdsBase: input.baseAmount,
      tdsAmount: 0,
      reason: `Payer is an ${input.payerType} not liable to tax audit under Section 44AB in preceding financial year. Exempt from deduction under ${sectionDisplay} (Subject to Sec 194M if annual aggregate exceeds ₹50 Lakhs).`,
      lawVersion,
      sectionDisplay,
      challanCode: rule.challanCode,
      dueDate: "N/A",
    };
  }

  // Check Lower / Nil Deduction Certificate under Section 197 / 197A
  if (input.hasLowerDeductionCert197) {
    const certRate = input.lowerDeductionRate !== undefined ? Math.max(0, input.lowerDeductionRate) : 0;
    const certAmount = Math.round((input.baseAmount * certRate) / 100);
    return {
      applicable: certRate > 0,
      section: rule.act1961Section,
      rate: certRate,
      threshold: rule.annualThreshold,
      thresholdExceeded: true,
      taxableTdsBase: input.baseAmount,
      tdsAmount: certAmount,
      reason: `Lower deduction certificate u/s 197 applied (Certificate No: ${input.lowerDeductionCertNo || "Verified"}). Concessional rate of ${certRate}% enforced.`,
      lawVersion,
      sectionDisplay: `${sectionDisplay} [Lower Cert u/s 197]`,
      challanCode: rule.challanCode,
      dueDate: "7th of following month via Challan 281",
    };
  }

  // Check Form 15G / 15H Self-Declaration
  if (input.isForm15Gor15H) {
    return {
      applicable: false,
      section: rule.act1961Section,
      rate: 0,
      threshold: rule.annualThreshold,
      thresholdExceeded: false,
      taxableTdsBase: input.baseAmount,
      tdsAmount: 0,
      reason: "Form 15G / 15H self-declaration furnished by payee stating estimated total income is below basic exemption limit. Nil TDS deducted.",
      lawVersion,
      sectionDisplay: `${sectionDisplay} [Form 15G/15H Nil]`,
      challanCode: rule.challanCode,
      dueDate: "N/A",
    };
  }

  // Standard statutory rate based on payee constitution
  let applicableRate = input.payeeType === "Company" || input.payeeType === "Firm"
    ? rule.baseRateCompany
    : rule.baseRateIndividual;

  let reasonNote = "";

  // 1. Check Section 206AA (Higher rate for non-furnishing of PAN)
  const panAvailable = input.panAvailable !== false;
  if (!panAvailable) {
    // 20% standard, or 5% for 194Q
    applicableRate = rule.key === "194q-goods-0.1" ? 5 : 20;
    reasonNote = ` [CRITICAL WARNING: Elevated ${applicableRate}% TDS applied under Section 206AA due to missing/invalid payee PAN!]`;
  } else if (input.isNonFiler206AB) {
    // 2. Check Section 206AB (Higher rate for non-filers of income tax returns)
    // Rate is twice the specified rate or 5%, whichever is higher
    const higherRate = Math.max(applicableRate * 2, 5);
    applicableRate = higherRate;
    reasonNote = ` [CRITICAL WARNING: Elevated ${applicableRate}% TDS applied under Section 206AB for non-filer of ITR (twice normal rate or 5%, whichever higher).]`;
  }

  // Threshold Evaluation: Single bill vs Annual aggregate
  const prevAggregate = input.annualAggregateBeforePayment || 0;
  const newCumulativeAggregate = prevAggregate + input.baseAmount;
  const singleExceeded = input.baseAmount >= rule.singleBillThreshold;
  const annualExceeded = newCumulativeAggregate >= rule.annualThreshold;
  const thresholdExceeded = singleExceeded || annualExceeded;

  if (!thresholdExceeded) {
    return {
      applicable: false,
      section: rule.act1961Section,
      rate: applicableRate,
      threshold: rule.annualThreshold,
      thresholdExceeded: false,
      taxableTdsBase: input.baseAmount,
      tdsAmount: 0,
      reason: `Current payment ₹${input.baseAmount.toLocaleString("en-IN")} (Cumulative FY payment ₹${newCumulativeAggregate.toLocaleString("en-IN")}) is below statutory threshold of ₹${rule.annualThreshold.toLocaleString("en-IN")} under ${sectionDisplay}. No TDS required.`,
      lawVersion,
      sectionDisplay,
      challanCode: rule.challanCode,
      dueDate: "N/A",
    };
  }

  // Calculate TDS on base amount strictly EXCLUDING GST as per CBDT Circular No. 23/2017
  const tdsAmount = Math.round((input.baseAmount * applicableRate) / 100);

  return {
    applicable: true,
    section: rule.act1961Section,
    rate: applicableRate,
    threshold: rule.annualThreshold,
    thresholdExceeded: true,
    taxableTdsBase: input.baseAmount,
    tdsAmount,
    reason: `${rule.explanation}${reasonNote}`,
    lawVersion,
    sectionDisplay,
    challanCode: rule.challanCode,
    dueDate: "7th of following month via Challan 281 (30th April for March provisions)",
  };
}
