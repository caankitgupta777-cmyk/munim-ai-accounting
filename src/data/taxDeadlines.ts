import { TaxDeadline, BusinessProfile } from "../types";

/**
 * Official Indian Statutory Tax Deadlines (Financial Year 2026-27 / Assessment Year 2026-27)
 * Sourced directly from:
 * 1. Income Tax Department of India (https://www.incometax.gov.in & https://eportal.incometax.gov.in)
 * 2. Goods and Services Tax Network Portal (https://www.gst.gov.in)
 * 3. TRACES TDS CPC (https://www.tdscpc.gov.in)
 */
export const TAX_DEADLINES_DATA: TaxDeadline[] = [
  // 1. Tax Audit Report under Section 44AB
  {
    id: "tax-audit-report-sep-2026",
    category: "ITR & Audit",
    formOrChallan: "Form 3CA/3CB-3CD & 10B",
    title: "Tax Audit Report u/s 44AB (Form 3CD) - Last Day: 07 Oct 2026",
    dueDate: "2026-10-07",
    frequency: "Annual",
    periodCovered: "Assessment Year 2026-27 (Financial Year 2025-26)",
    applicableCondition: "Businesses with turnover > ₹1 Cr (> ₹10 Cr if cash transactions ≤ 5%), professionals with gross receipts > ₹50 Lakhs. Note: For Transfer Pricing cases u/s 92E, the tax audit deadline is 31st October.",
    interestOrPenaltyNote: "Penalty u/s 271B: 0.5% of total turnover or gross receipts, subject to maximum of ₹1,50,000 for failure to furnish report by due date.",
    portalLinkText: "Income Tax e-Filing Portal (Audit Forms)",
    portalUrl: "https://eportal.incometax.gov.in",
    actionSummary: "Furnish CA-certified Tax Audit Report (Form 3CA/3CB with Form 3CD) on the e-filing portal and ensure taxpayer acceptance. Extended from 30th September to 7th October by CBDT Circular (and 31st October for Transfer Pricing).",
    isEligibleForProfile: (p: BusinessProfile) =>
      p.entityType === "Private Limited Company" ||
      p.entityType === "LLP (Limited Liability Partnership)" ||
      p.turnoverBracket === "Medium (₹5 - ₹25 Crores)" ||
      p.turnoverBracket === "Growth (> ₹25 Crores)",
  },

  // 2. TDS Monthly Payment for September 2026
  {
    id: "tds-challan-281-sep-2026",
    category: "TDS",
    formOrChallan: "Challan ITNS 281",
    title: "TDS / TCS Monthly Deposit for September 2026",
    dueDate: "2026-10-07",
    frequency: "Monthly",
    periodCovered: "Deductions made in September 2026 (Salaries, Rent, Contractor, Professional Fees)",
    applicableCondition: "All corporate & non-corporate deductors under Section 192, 194C, 194J, 194I, 194H, 194Q",
    interestOrPenaltyNote: "Mandatory interest of 1.5% per month u/s 201(1A) from the date of deduction till actual deposit in government account.",
    portalLinkText: "Income Tax e-Pay Tax (Challan 281)",
    portalUrl: "https://eportal.incometax.gov.in",
    actionSummary: "Deposit tax deducted from contractors, professionals, rent, and salaries via Challan 281 under designated Minor Head (200 / 400).",
    isEligibleForProfile: () => true,
  },

  // 3. GST GSTR-7 & GSTR-8 (TDS & TCS under GST)
  {
    id: "gstr7-gstr8-sep-2026",
    category: "GST",
    formOrChallan: "GSTR-7 / GSTR-8",
    title: "Monthly GSTR-7 (TDS) & GSTR-8 (e-Commerce TCS) for September 2026",
    dueDate: "2026-10-10",
    frequency: "Monthly",
    periodCovered: "September 2026 GST TDS / TCS supplies",
    applicableCondition: "Government departments, PSUs deducting TDS under Sec 51, and e-Commerce operators collecting TCS under Sec 52",
    interestOrPenaltyNote: "Late fee of ₹50/day (₹25 CGST + ₹25 SGST) under Section 47 subject to statutory caps.",
    portalLinkText: "GST Common Portal (TDS/TCS Returns)",
    portalUrl: "https://www.gst.gov.in",
    actionSummary: "File monthly statement of tax deducted or collected at source on net value of taxable supplies made through platforms.",
    isEligibleForProfile: (p: BusinessProfile) => p.gstRegistered,
  },

  // 4. GST Monthly GSTR-1
  {
    id: "gstr1-sep-2026",
    category: "GST",
    formOrChallan: "GSTR-1",
    title: "Monthly Statement of Outward Supplies (Sales) for September 2026",
    dueDate: "2026-10-11",
    frequency: "Monthly",
    periodCovered: "September 2026 B2B Invoices, B2C Summary, Debit/Credit Notes, Exports",
    applicableCondition: "Regular GST registered taxpayers not opted into QRMP scheme (Turnover > ₹5 Cr or monthly filers)",
    interestOrPenaltyNote: "Late fee of ₹50/day (₹20/day for Nil return) u/s 47. Delays restrict your business buyers from viewing ITC in GSTR-2B.",
    portalLinkText: "GST Common Portal (Services > Returns)",
    portalUrl: "https://www.gst.gov.in",
    actionSummary: "Upload all B2B sales invoices and credit notes to ensure your clients can claim timely Input Tax Credit in GSTR-2B.",
    isEligibleForProfile: (p: BusinessProfile) => p.gstRegistered && (p.turnoverBracket !== "Micro (< ₹1 Crore)"),
  },

  // 5. GST QRMP IFF (Invoice Furnishing Facility) & GSTR-6 (ISD)
  {
    id: "gst-iff-gstr6-sep-2026",
    category: "GST",
    formOrChallan: "IFF / GSTR-6",
    title: "QRMP Invoice Furnishing Facility (IFF) & GSTR-6 (ISD) for Sep 2026",
    dueDate: "2026-10-13",
    frequency: "Monthly",
    periodCovered: "B2B sales of Month 2/3 for QRMP and ISD credit distributions",
    applicableCondition: "Small taxpayers with turnover up to ₹5 Cr enrolled in QRMP scheme & Input Service Distributors",
    interestOrPenaltyNote: "Optional for QRMP taxpayers; however, buyers cannot claim GSTR-2B credit without uploading before the 13th.",
    portalLinkText: "GST Common Portal (IFF)",
    portalUrl: "https://www.gst.gov.in",
    actionSummary: "Upload B2B sales invoices for the month so recipients can take immediate ITC without waiting for quarterly GSTR-1.",
    isEligibleForProfile: (p: BusinessProfile) => p.gstRegistered && (p.turnoverBracket === "Micro (< ₹1 Crore)" || p.turnoverBracket === "Small (₹1 - ₹5 Crores)"),
  },

  // 6. GST CMP-08 (Composition Scheme Quarterly Challan)
  {
    id: "gst-cmp08-q2-2026",
    category: "GST",
    formOrChallan: "Form CMP-08",
    title: "Quarterly Statement-cum-Challan for Composition Dealers (Q2 Jul-Sep 2026)",
    dueDate: "2026-10-18",
    frequency: "Quarterly",
    periodCovered: "Quarter 2 (July to September 2026)",
    applicableCondition: "Taxpayers registered under Section 10 Composition Scheme (Manufacturers, Traders @ 1%, Restaurants @ 5%)",
    interestOrPenaltyNote: "Interest @ 18% p.a. under Section 50 on delayed tax payment + late fees on annual GSTR-4.",
    portalLinkText: "GST Portal (CMP-08)",
    portalUrl: "https://www.gst.gov.in",
    actionSummary: "Declare quarterly turnover, compute concessional GST liability, and pay net tax without Input Tax Credit.",
    isEligibleForProfile: (p: BusinessProfile) => !p.gstRegistered || p.turnoverBracket === "Micro (< ₹1 Crore)",
  },

  // 7. GST GSTR-3B Monthly Return & Tax Payment
  {
    id: "gstr3b-sep-2026",
    category: "GST",
    formOrChallan: "GSTR-3B (Monthly)",
    title: "Monthly Summary Return & Statutory Tax Payment for September 2026",
    dueDate: "2026-10-20",
    frequency: "Monthly",
    periodCovered: "September 2026 Inward & Outward Tax, Rule 88A Setoff",
    applicableCondition: "Regular GST registered taxpayers with turnover > ₹5 Crores or monthly filers; also GSTR-5 / 5A",
    interestOrPenaltyNote: "18% p.a. interest u/s 50 on net cash liability deposited via Challan PMT-06 + Late fee ₹50/day (₹20 for Nil).",
    portalLinkText: "GST Portal (Return Dashboard)",
    portalUrl: "https://www.gst.gov.in",
    actionSummary: "Reconcile eligible ITC from auto-generated GSTR-2B, set off liabilities under Rule 88A, and pay cash balance.",
    isEligibleForProfile: (p: BusinessProfile) => p.gstRegistered && (p.turnoverBracket !== "Micro (< ₹1 Crore)"),
  },

  // 8. GST QRMP Quarterly GSTR-3B (Group A States)
  {
    id: "gstr3b-qrmp-q2-groupa-2026",
    category: "GST",
    formOrChallan: "GSTR-3B (QRMP Group A)",
    title: "Quarterly GSTR-3B for Q2 (Group A: MH, GJ, KA, GA, KL, TN, TS, AP, MP, CG)",
    dueDate: "2026-10-22",
    frequency: "Quarterly",
    periodCovered: "Quarter 2 (July to September 2026)",
    applicableCondition: "Small taxpayers (turnover ≤ ₹5 Cr) under QRMP in Western & Southern States",
    interestOrPenaltyNote: "18% p.a. interest on delayed tax dues + late fee under Section 47 capped by turnover slabs.",
    portalLinkText: "GST Portal (QRMP)",
    portalUrl: "https://www.gst.gov.in",
    actionSummary: "Consolidate 3 months of supplies and ITC, adjust monthly advance PMT-06 challans, and finalize Q2 GSTR-3B.",
    isEligibleForProfile: (p: BusinessProfile) => p.gstRegistered && (p.turnoverBracket === "Micro (< ₹1 Crore)" || p.turnoverBracket === "Small (₹1 - ₹5 Crores)"),
  },

  // 9. GST QRMP Quarterly GSTR-3B (Group B States)
  {
    id: "gstr3b-qrmp-q2-groupb-2026",
    category: "GST",
    formOrChallan: "GSTR-3B (QRMP Group B)",
    title: "Quarterly GSTR-3B for Q2 (Group B: DL, RJ, UP, PB, HR, WB, BR, OD, JH, HP, NE)",
    dueDate: "2026-10-24",
    frequency: "Quarterly",
    periodCovered: "Quarter 2 (July to September 2026)",
    applicableCondition: "Small taxpayers (turnover ≤ ₹5 Cr) under QRMP in Northern, Eastern & North-Eastern States",
    interestOrPenaltyNote: "18% p.a. interest on delayed tax dues + late fee under Section 47.",
    portalLinkText: "GST Portal (QRMP)",
    portalUrl: "https://www.gst.gov.in",
    actionSummary: "Consolidate quarterly inward/outward supplies, adjust PMT-06 deposits, and file final Q2 summary return.",
    isEligibleForProfile: (p: BusinessProfile) => p.gstRegistered && (p.turnoverBracket === "Micro (< ₹1 Crore)" || p.turnoverBracket === "Small (₹1 - ₹5 Crores)"),
  },

  // 10. GST PMT-06 (QRMP Monthly Tax Deposit)
  {
    id: "gst-pmt06-oct-2026",
    category: "GST",
    formOrChallan: "Challan PMT-06",
    title: "Monthly Tax Payment Challan under QRMP Scheme for Month 1 (October 2026)",
    dueDate: "2026-10-25",
    frequency: "Monthly",
    periodCovered: "October 2026 monthly GST liability (Month 1 of Q3)",
    applicableCondition: "Taxpayers enrolled in QRMP scheme depositing tax via 35% Fixed Sum Method or Self-Assessment Method",
    interestOrPenaltyNote: "Interest under Section 50 at 18% p.a. if monthly tax deposit falls below 35% of preceding quarter cash liability.",
    portalLinkText: "GST Portal (Challan Generation)",
    portalUrl: "https://www.gst.gov.in",
    actionSummary: "Generate Challan PMT-06 on the GST portal and pay either 35% auto-calculated sum or actual net cash tax.",
    isEligibleForProfile: (p: BusinessProfile) => p.gstRegistered && (p.turnoverBracket === "Micro (< ₹1 Crore)" || p.turnoverBracket === "Small (₹1 - ₹5 Crores)"),
  },

  // 11. Corporate / Audited Entity Income Tax Return (AY 2026-27 / FY 2025-26)
  {
    id: "corporate-audited-itr-ay-2026",
    category: "ITR & Audit",
    formOrChallan: "ITR-6 / ITR-5 / ITR-3",
    title: "Corporate & Audited Entity Income Tax Return Filing for AY 2026-27",
    dueDate: "2026-10-31",
    frequency: "Annual",
    periodCovered: "Assessment Year 2026-27 (Financial Year 2025-26)",
    applicableCondition: "Companies, LLPs, firms, and proprietary businesses required to get accounts audited under Section 44AB",
    interestOrPenaltyNote: "1% per month interest u/s 234A on unpaid tax + Late fee up to ₹5,000 u/s 234F + Forfeiture of business loss carry-forward.",
    portalLinkText: "Income Tax e-Filing Portal (File ITR)",
    portalUrl: "https://eportal.incometax.gov.in",
    actionSummary: "File complete audited balance sheet, profit and loss, Schedule MAT/AMT, and audited financials before statutory close.",
    isEligibleForProfile: (p: BusinessProfile) =>
      p.entityType === "Private Limited Company" ||
      p.entityType === "LLP (Limited Liability Partnership)" ||
      p.turnoverBracket === "Medium (₹5 - ₹25 Crores)" ||
      p.turnoverBracket === "Growth (> ₹25 Crores)",
  },

  // 12. TDS Quarterly Return (Q2 - Jul to Sep 2026)
  {
    id: "tds-return-q2-2026",
    category: "TDS",
    formOrChallan: "Form 24Q / 26Q / 27Q",
    title: "Quarterly TDS / TCS Return Statement for Q2 (July - Sept 2026)",
    dueDate: "2026-10-31",
    frequency: "Quarterly",
    periodCovered: "Deductions made between 1st July 2026 and 30th September 2026",
    applicableCondition: "All deductors who deducted tax under Sec 192 (Salaries - 24Q) or commercial sections (26Q / 27EQ)",
    interestOrPenaltyNote: "Mandatory fee of ₹200/day u/s 234E until return is furnished + Penalty up to ₹1,00,000 u/s 271H.",
    portalLinkText: "NSDL / Income Tax TRACES Portal",
    portalUrl: "https://www.tdscpc.gov.in",
    actionSummary: "File quarterly statement containing PAN-wise breakdown of deductees, challan BSR codes, and payment CINs.",
    isEligibleForProfile: () => true,
  },

  // 13. TDS Certificate Issuance (Form 16A)
  {
    id: "tds-form16a-q2-2026",
    category: "TDS",
    formOrChallan: "Form 16A",
    title: "Issue TDS Certificates to Vendors (Form 16A) for Q2",
    dueDate: "2026-11-15",
    frequency: "Quarterly",
    periodCovered: "Quarter 2 (July to September 2026)",
    applicableCondition: "All deductors who furnished Form 26Q for payments to contractors, professionals, landlords",
    interestOrPenaltyNote: "Penalty of ₹100 per day of default under Section 272A(2)(g).",
    portalLinkText: "TRACES Portal (Deductor Login)",
    portalUrl: "https://www.tdscpc.gov.in",
    actionSummary: "Download digitally signed Form 16A certificates from TRACES and email them to your vendors and landlords.",
    isEligibleForProfile: () => true,
  },

  // 14. Section 16(4) GST ITC Statutory Cutoff & Credit Note Deadline
  {
    id: "gst-sec16-4-cutoff-fy-2025-26",
    category: "GST",
    formOrChallan: "Section 16(4) Reconciliation",
    title: "Statutory Cutoff to Claim Missing FY 2025-26 ITC & Issue Credit Notes",
    dueDate: "2026-11-30",
    frequency: "Annual",
    periodCovered: "Invoices and Debit Notes pertaining to Financial Year 2025-26",
    applicableCondition: "All GST registered taxpayers claiming missed input credits or issuing credit notes for FY 2025-26 supplies",
    interestOrPenaltyNote: "Strict statutory bar under Section 16(4) of CGST Act. No ITC for FY 2025-26 can be claimed after this date under any circumstances!",
    portalLinkText: "GST Portal (GSTR-3B / GSTR-1)",
    portalUrl: "https://www.gst.gov.in",
    actionSummary: "Perform thorough reconciliation between Purchase Register and GSTR-2B. Claim all missing valid ITCs in November GSTR-3B.",
    isEligibleForProfile: (p: BusinessProfile) => p.gstRegistered,
  },

  // 15. Transfer Pricing ITR Filing (Section 92E)
  {
    id: "transfer-pricing-itr-ay-2026",
    category: "ITR & Audit",
    formOrChallan: "Form 3CEB & ITR-6",
    title: "Transfer Pricing Report (Form 3CEB) & ITR for International Transactions",
    dueDate: "2026-11-30",
    frequency: "Annual",
    periodCovered: "Assessment Year 2026-27 (Financial Year 2025-26)",
    applicableCondition: "Taxpayers entering into international transactions or specified domestic transactions under Section 92BA",
    interestOrPenaltyNote: "Penalty of ₹1,00,000 u/s 271BA for failure to furnish report + 2% transaction value penalty u/s 271AA.",
    portalLinkText: "Income Tax e-Filing Portal",
    portalUrl: "https://eportal.incometax.gov.in",
    actionSummary: "Obtain accountant's report in Form 3CEB proving arm's length price and file corresponding corporate ITR.",
    isEligibleForProfile: (p: BusinessProfile) =>
      p.entityType === "Private Limited Company" &&
      (p.turnoverBracket === "Medium (₹5 - ₹25 Crores)" || p.turnoverBracket === "Growth (> ₹25 Crores)"),
  },

  // 16. Advance Tax Installment 3 (75% Cumulative)
  {
    id: "advance-tax-q3-2026",
    category: "Advance Tax",
    formOrChallan: "Challan ITNS 280",
    title: "3rd Installment of Advance Tax (75% Cumulative Liability)",
    dueDate: "2026-12-15",
    frequency: "Quarterly",
    periodCovered: "Financial Year 2026-27 (Cumulative estimated income)",
    applicableCondition: "All taxpayers whose estimated net tax liability for FY exceeds ₹10,000",
    interestOrPenaltyNote: "1% simple interest per month under Section 234C on shortfall below 75% threshold.",
    portalLinkText: "Income Tax e-Pay Tax (Challan 280)",
    portalUrl: "https://eportal.incometax.gov.in",
    actionSummary: "Estimate full year's taxable income, deduct TDS credits, and deposit cumulative 75% of tax payable.",
    isEligibleForProfile: () => true,
  },

  // 17. Annual GST Return (GSTR-9 & GSTR-9C) for FY 2025-26
  {
    id: "gstr9-fy-2025-26",
    category: "GST",
    formOrChallan: "GSTR-9 / GSTR-9C",
    title: "Annual GST Return (GSTR-9) & Reconciliation (GSTR-9C) for FY 2025-26",
    dueDate: "2026-12-31",
    frequency: "Annual",
    periodCovered: "Financial Year 2025-26 (1st April 2025 - 31st March 2026)",
    applicableCondition: "GSTR-9 mandatory if aggregate turnover > ₹2 Cr; GSTR-9C self-certified reconciliation if turnover > ₹5 Cr",
    interestOrPenaltyNote: "Late fee under Section 47 (₹50-₹200 per day subject to 0.04% of turnover limit in state/UT).",
    portalLinkText: "GST Portal (Annual Return)",
    portalUrl: "https://www.gst.gov.in",
    actionSummary: "Consolidate entire fiscal year's inward, outward, and ITC figures; reconcile with audited financial statements.",
    isEligibleForProfile: (p: BusinessProfile) => p.gstRegistered && (p.turnoverBracket !== "Micro (< ₹1 Crore)"),
  },

  // 18. Belated / Revised Income Tax Return for AY 2026-27
  {
    id: "belated-revised-itr-ay-2026",
    category: "ITR & Audit",
    formOrChallan: "ITR-1 to ITR-7 (u/s 139(4) / 139(5))",
    title: "Last Date for Filing Belated / Revised ITR for AY 2026-27",
    dueDate: "2026-12-31",
    frequency: "Annual",
    periodCovered: "Assessment Year 2026-27 (Financial Year 2025-26)",
    applicableCondition: "Taxpayers who missed July 31 / Oct 31 deadlines or need to revise omissions in original returns",
    interestOrPenaltyNote: "Late filing fee u/s 234F of ₹5,000 (₹1,000 if taxable income ≤ ₹5,00,000) + Interest u/s 234A/B.",
    portalLinkText: "Income Tax e-Filing Portal",
    portalUrl: "https://eportal.incometax.gov.in",
    actionSummary: "Final chance to submit income tax returns for FY 2025-26. No return can be filed after December 31 without condonation.",
    isEligibleForProfile: () => true,
  },

  // 19. Advance Tax Final Installment (100% Tax Dues)
  {
    id: "advance-tax-q4-2027",
    category: "Advance Tax",
    formOrChallan: "Challan ITNS 280",
    title: "4th & Final Installment of Advance Tax (100% Tax Dues)",
    dueDate: "2027-03-15",
    frequency: "Quarterly",
    periodCovered: "Financial Year 2026-27 (100% full tax)",
    applicableCondition: "All taxpayers liable to advance tax (including Sec 44AD/44ADA presumptive filers who pay 100% by 15th March)",
    interestOrPenaltyNote: "1% per month under Section 234B & 234C on unremitted tax liability exceeding ₹10,000.",
    portalLinkText: "Income Tax e-Pay Tax (Challan 280)",
    portalUrl: "https://eportal.incometax.gov.in",
    actionSummary: "Finalize actual financial numbers, compute total tax liability, and pay 100% of remaining tax dues before year-end.",
    isEligibleForProfile: () => true,
  },

  // 20. MSME Year-End Section 43B(h) Checklist Deadline
  {
    id: "msme-section-43bh-cutoff",
    category: "ITR & Audit",
    formOrChallan: "Section 43B(h) Reconciliation",
    title: "Financial Year-End MSME Outstanding Dues Cutoff",
    dueDate: "2027-03-31",
    frequency: "Annual",
    periodCovered: "All invoices from Micro & Small Enterprises in FY 2026-27",
    applicableCondition: "All business entities buying goods or availing services from registered Micro/Small enterprises",
    interestOrPenaltyNote: "Full expense disallowed from P&L under Sec 43B(h), adding directly to taxable profit + 3x bank rate compound interest.",
    portalLinkText: "UDYAM Portal / CA Audit Verification",
    portalUrl: "https://udyamregistration.gov.in",
    actionSummary: "Audit Sundry Creditors ledger. Ensure all MSE vendor invoices older than 15 or 45 days are cleared before March 31.",
    isEligibleForProfile: () => true,
  },
];
