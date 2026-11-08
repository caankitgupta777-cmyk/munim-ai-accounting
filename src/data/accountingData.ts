import { ScenarioPreset } from "../types";

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "laptop-purchase",
    title: "Office Laptops with 18% GST",
    category: "GST",
    tag: "Asset & ITC",
    prompt: "We purchased 3 office Dell laptops for ₹1,50,000 + 18% GST (CGST 9% + SGST 9%) via bank transfer. How to record this double-entry with Ind AS 16 Property, Plant & Equipment and claim GST ITC under Section 16?",
  },
  {
    id: "office-rent-tds",
    title: "Office Rent with 10% TDS (194I)",
    category: "TDS",
    tag: "Sec 194I & GST",
    prompt: "Our commercial landlord billed ₹50,000 rent + 18% GST. How to record the entry deducting 10% TDS under Section 194I, pay the net amount, and account for TDS deposit via Challan 281?",
  },
  {
    id: "consulting-invoice-tds",
    title: "Client Invoice with 10% TDS (194J)",
    category: "TDS",
    tag: "Sec 194J & Revenue",
    prompt: "We billed a corporate client ₹2,00,000 + 18% IGST for software & marketing services. The client deducted 10% TDS under Section 194J and paid the rest into our HDFC bank. What are the double entries and how do we reflect TDS Receivable for ITR?",
  },
  {
    id: "msme-43bh",
    title: "Section 43B(h) MSME 45-Day Payment",
    category: "Income Tax",
    tag: "Crucial Tax Rule",
    prompt: "We bought raw materials worth ₹3,50,000 from a registered Udyam Micro Enterprise on 15th February, but haven't paid them by 31st March (over 45 days). How does Section 43B(h) affect our books and what is the double entry if disallowed vs paid next year?",
  },
  {
    id: "customer-advance",
    title: "Advance Received (Ind AS 115)",
    category: "Ind AS",
    tag: "Revenue Standard",
    prompt: "A client paid us ₹1,18,000 advance (including 18% GST) in March for an annual AMC starting in May. Explain double-entry accounting under Ind AS 115 Revenue from Contracts with Customers. Why is it a liability and not income yet?",
  },
  {
    id: "rcm-gta",
    title: "Reverse Charge (RCM) on Transport",
    category: "GST",
    tag: "RCM Sec 9(3)",
    prompt: "We paid ₹12,000 cash freight to a local Goods Transport Agency (GTA) under Reverse Charge Mechanism (RCM at 5%). How do we record the RCM liability, pay it in GSTR-3B, and claim ITC in the same month?",
  },
  {
    id: "proprietor-capital",
    title: "Proprietor Capital & Drawings",
    category: "Day-to-Day",
    tag: "Equity & Drawings",
    prompt: "The proprietor infused ₹5,00,000 from personal savings into the business current account, and later withdrew ₹40,000 for personal household expenses. What are the double entries and how does it show on the Balance Sheet?",
  },
  {
    id: "provision-audit-fees",
    title: "Provision for Audit Fees (194J & Ind AS 37)",
    category: "Provisions",
    tag: "Ind AS 37 & TDS",
    prompt: "How do we record a year-end provision of ₹60,000 for Statutory Audit Fees on 31st March? Do we need to deduct 10% TDS under Section 194J on provisions, and what happens under Section 40(a)(ia) if TDS is not deducted? Also show the payment entry when the CA invoice arrives next year.",
  },
  {
    id: "provision-doubtful-debts",
    title: "Provision for Doubtful Debts (Ind AS 109)",
    category: "Provisions",
    tag: "ECL & Sec 36(1)(vii)",
    prompt: "We have ₹2,00,000 doubtful trade receivables from an overdue customer at year-end. How to record the Provision for Doubtful Debts under Ind AS 109 / AS 29, how is it presented on the Balance Sheet, and why does Section 36(1)(vii) disallow tax deduction until actual write-off?",
  },
  {
    id: "advance-tax",
    title: "Advance Tax & Year-End Tax Provision",
    category: "Income Tax",
    tag: "ITR & Ind AS 12",
    prompt: "We paid ₹80,000 advance tax in December via Challan 280. At year-end on 31st March, our CA calculated total tax liability as ₹1,20,000. How to do double entry for advance tax paid, create provision for tax, and settle it while filing ITR?",
  },
];

export const TDS_SECTIONS_GUIDE = [
  {
    section: "194C",
    section2025: "Sec 393 (Contractors)",
    nature: "Payment to Contractors / Subcontractors",
    threshold: "Single bill > ₹30,000 or Aggregate > ₹1,00,000 p.a.",
    rate: "1% (Individual / HUF) | 2% (Companies / Firms)",
    keyRule: "Deduct at credit or payment. Excludes material cost if billed separately. Non-deduction triggers 30% disallowance under Sec 40(a)(ia) (ITA 1961) / Sec 35 (ITA 2025).",
  },
  {
    section: "194J",
    section2025: "Sec 393 (Professional & Tech)",
    nature: "Professional or Technical Services, Royalty, Director Fees",
    threshold: "₹30,000 per financial year",
    rate: "10% for Professional & Director Fees | 2% for Technical Services / Call Centers",
    keyRule: "Applies to CA, legal, IT consultants, engineers. Mandatory on year-end provisions for audit fees if payee is identifiable. Disallowance: Sec 40(a)(ia) / Sec 35.",
  },
  {
    section: "194I",
    section2025: "Sec 393 (Rent)",
    nature: "Rent of Land, Building or Machinery",
    threshold: "₹2,40,000 per financial year",
    rate: "10% on Land, Building, Furniture | 2% on Plant & Machinery",
    keyRule: "GST portion is excluded from TDS calculation as per CBDT Circular No. 23/2017. Deposit via Challan 281 by 7th next month.",
  },
  {
    section: "194H",
    section2025: "Sec 393 (Commission & Brokerage)",
    nature: "Commission or Brokerage",
    threshold: "₹15,000 per financial year",
    rate: "5% (or 2% for certain notified services)",
    keyRule: "Deduct on sales commission, agent brokerage. Excludes insurance commission (Sec 194D).",
  },
  {
    section: "194Q",
    section2025: "Sec 393 (Goods Purchase)",
    nature: "Purchase of Goods (Buyer TDS)",
    threshold: "Aggregate purchases > ₹50 Lakhs from a seller in FY",
    rate: "0.1% on amount exceeding ₹50 Lakhs (5% if no PAN)",
    keyRule: "Applies only if buyer's turnover in preceding FY exceeded ₹10 Crores. Overrides TCS u/s 206C(1H).",
  },
  {
    section: "192",
    section2025: "Sec 393 (Salaries)",
    nature: "Salary to Employees",
    threshold: "Basic exemption limit under Old / New Tax Regime",
    rate: "Average income tax rate slab of the employee",
    keyRule: "Deducted monthly from payroll and deposited via Challan 281 by 7th of next month.",
  },
];

export const GST_ITC_RULES = [
  {
    rule: "Section 16 Eligibility Criteria",
    detail: "To claim ITC: (1) Possess valid Tax Invoice/Debit Note; (2) Received goods/services; (3) Tax paid to Govt by supplier (reflected in GSTR-2B); (4) Filed GSTR-3B.",
  },
  {
    rule: "180-Day Payment Rule",
    detail: "Under Section 16(2) second proviso, if buyer fails to pay the supplier within 180 days from invoice date, the ITC claimed must be reversed along with 18% interest.",
  },
  {
    rule: "Section 17(5) Blocked Credits (No ITC allowed)",
    detail: "Motor vehicles for passenger seating ≤13 seats (unless in transport/training business), Food & beverages, outdoor catering, beauty treatment, health club memberships, personal travel, and lost/stolen/destroyed goods.",
  },
  {
    rule: "CBIC Set-off Order (Circular No. 98/17/2019)",
    detail: "IGST credit must be completely exhausted first: against Output IGST, then against Output CGST or SGST in any proportion. Only then can CGST credit (against CGST/IGST) and SGST credit (against SGST/IGST) be used.",
  },
];

export const IND_AS_OVERVIEW = [
  {
    code: "Ind AS 1",
    title: "Presentation of Financial Statements",
    coreEssence: "Requires accrual basis of accounting, faithful representation, going concern assumption, and clear separation between current and non-current assets & liabilities.",
  },
  {
    code: "Ind AS 2",
    title: "Inventories Valuation",
    coreEssence: "Valued at the lower of Cost (FIFO or Weighted Average) and Net Realisable Value (NRV). Standard cost or retail method allowed if results approximate cost.",
  },
  {
    code: "Ind AS 16",
    title: "Property, Plant and Equipment (PPE)",
    coreEssence: "Capitalize purchase price + direct installation costs. Component depreciation required if major parts have different useful lives. Annual review of residual value.",
  },
  {
    code: "Ind AS 115",
    title: "Revenue from Contracts with Customers",
    coreEssence: "5-Step Revenue Model: Recognize revenue only when performance obligations are satisfied by transferring control of goods/services to the customer.",
  },
  {
    code: "Ind AS 116",
    title: "Leases",
    coreEssence: "Eliminates operating vs finance lease distinction for lessees. Recognizes Right-of-Use (ROU) Asset and Lease Liability on Balance Sheet (with short-term/low-value exemptions).",
  },
  {
    code: "Ind AS 12",
    title: "Income Taxes",
    coreEssence: "Comprehensive balance sheet liability method for Deferred Tax Assets (DTA) and Deferred Tax Liabilities (DTL) arising from temporary differences between accounting and tax bases.",
  },
];
