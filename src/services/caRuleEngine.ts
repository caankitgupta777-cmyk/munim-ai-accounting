/**
 * Expert Indian Chartered Accountant Rule Engine
 * Provides deterministic, compliant double-entry journal entries and tax advisory
 * according to ICAI Ind AS / AS, Indian GST Act, Income Tax Act 1961, and Income Tax Act 2025 transition provisions.
 */

import type { StructuredVoucher, ScannedReceiptData, JournalEntryLine } from "../types";
import { calculateTDS } from "./tdsEngine";

export interface BusinessContext {
  entityType?: string;
  gstRegistered?: boolean;
  annualTurnover?: string;
  accountingBasis?: string;
}

interface ExtractedTransaction {
  amount: number;
  gstRate: number;
  isInterState: boolean;
  partyName: string;
}

function parseAmountAndGst(text: string): ExtractedTransaction {
  let amount = 10000; // default
  let gstRate = 18;
  const isInterState = text.toLowerCase().includes("igst") || text.toLowerCase().includes("inter-state") || text.toLowerCase().includes("interstate");

  // Extract lakh / crore / k
  const lakhMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs)/i);
  if (lakhMatch) {
    amount = parseFloat(lakhMatch[1]) * 100000;
  } else {
    const croreMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:crore|cr)/i);
    if (croreMatch) {
      amount = parseFloat(croreMatch[1]) * 10000000;
    } else {
      const kMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*k\b/i);
      if (kMatch) {
        amount = parseFloat(kMatch[1]) * 1000;
      } else {
        const numMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d[\d,]+(?:\.\d+)?)/i);
        if (numMatch) {
          const cleanNum = parseFloat(numMatch[1].replace(/,/g, ""));
          if (!isNaN(cleanNum) && cleanNum > 0 && cleanNum !== 18 && cleanNum !== 12 && cleanNum !== 28 && cleanNum !== 5) {
            amount = cleanNum;
          }
        }
      }
    }
  }

  // Extract GST rate
  const gstMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:gst)?/i);
  if (gstMatch) {
    const rate = parseFloat(gstMatch[1]);
    if ([0, 5, 12, 18, 28].includes(rate)) {
      gstRate = rate;
    }
  }

  // Extract party name if mentioned
  let partyName = "Vendor / Counterparty";
  const vendorMatch = text.match(/(?:from|to|by|vendor|client|party)\s+([A-Z][a-zA-Z0-9\s&.-]{2,20})/);
  if (vendorMatch) {
    partyName = vendorMatch[1].trim();
  }

  return { amount, gstRate, isInterState, partyName };
}

function formatINR(val: number): string {
  return "₹" + Math.round(val).toLocaleString("en-IN");
}

export function generateRuleBasedAccountingAdvice(query: string, context?: BusinessContext): string {
  const q = query.toLowerCase();
  const { amount, gstRate, isInterState, partyName } = parseAmountAndGst(query);
  const gstMultiplier = gstRate / 100;
  const gstAmount = amount * gstMultiplier;
  const halfGst = gstAmount / 2;
  const totalAmount = amount + gstAmount;

  // 0. Provisions in Books of Accounts (Ind AS 37 / AS 29, Ind AS 12, Ind AS 109, Ind AS 19 & Income Tax Act)
  if (q.includes("provision") || q.includes("outstanding expense") || q.includes("accrual") || q.includes("year-end provision")) {
    const isTaxProvision = q.includes("income tax") || (q.includes("tax") && !q.includes("audit") && !q.includes("tds"));
    const isDoubtfulDebts = q.includes("doubtful") || q.includes("bad debt") || q.includes("ecl") || q.includes("debtor");
    const isAuditOrExpense = q.includes("audit") || q.includes("ca fee") || q.includes("professional") || q.includes("expense") || q.includes("electricity") || q.includes("rent");

    if (isTaxProvision) {
      return `### 💡 Plain English Explanation
A **Provision for Income Tax** represents the estimated corporate / business income tax payable to the Government of India for the profits earned during the current financial year. Under **Ind AS 12 / AS 22 (Income Taxes)**, taxes must be recognized as an expense in the Profit & Loss statement of the same year the income was generated, even though the final ITR is filed months later.

---

### 📋 The Journal Entry (Tally / Zoho Books Ready)

**1. Year-End Creation Entry (31st March):**
| Account Head | Nature | Dr (₹) | Cr (₹) |
|---|---|---|---|
| Current Tax Expense (P&L) | Nominal / Tax Expense | ${formatINR(amount).replace("₹", "")} | - |
| Provision for Income Tax A/c | Current Liability | - | ${formatINR(amount).replace("₹", "")} |

*(Narration: Being provision for current income tax created for the financial year ended 31st March based on estimated taxable profits as per Ind AS 12 / AS 22)*

**2. Settlement upon Filing ITR (Adjusting Advance Tax & TDS):**
| Account Head | Nature | Dr (₹) | Cr (₹) |
|---|---|---|---|
| Provision for Income Tax A/c | Current Liability (Cleared) | ${formatINR(amount).replace("₹", "")} | - |
| Advance Tax A/c (Challan 280) | Current Asset (Settled) | - | ${formatINR(Math.round(amount * 0.7)).replace("₹", "")} |
| TDS Receivable A/c (Form 26AS/AIS) | Current Asset (Settled) | - | ${formatINR(Math.round(amount * 0.2)).replace("₹", "")} |
| Bank A/c (Self-Assessment Tax u/s 140A) | Current Asset | - | ${formatINR(Math.round(amount * 0.1)).replace("₹", "")} |

*(Narration: Being provision for tax adjusted against advance tax paid and TDS receivable, with balance paid via Self-Assessment Tax under Section 140A)*

---

### ⚖️ Why this Debit & Credit
- **Debit Current Tax Expense:** P&L account is debited to reduce net profit by the tax attributable to the year's earnings.
- **Credit Provision for Income Tax:** Appears under **Short-Term Provisions / Current Liabilities** on the Balance Sheet until the return is assessed and finalized.
- **Credit Advance Tax & TDS:** Converts pre-paid tax assets into tax settled against the provision.

---

### 🇮🇳 Indian Tax & Ind AS Compliance Note
1. **Advance Tax Mandate (Section 208):** If net tax liability after TDS exceeds ₹10,000, advance tax must be deposited in 4 quarterly installments (15% by 15 June, 45% by 15 Sep, 75% by 15 Dec, 100% by 15 Mar). Shortfalls attract mandatory interest under **Sections 234B & 234C**.
2. **Ind AS 12 / AS 22:** Distinguish between *Current Tax* (actual tax on current ITR profit) and *Deferred Tax* (timing differences between book depreciation and tax depreciation block).

---

### ⚠️ Pro Tip for the Business Owner
Always verify your actual TDS credits in **Form 26AS and AIS (Annual Information Statement)** on the Income Tax Portal before finalizing the tax provision, ensuring no unclaimed TDS is forfeited!`;
    }

    if (isDoubtfulDebts) {
      return `### 💡 Plain English Explanation
A **Provision for Doubtful Debts** (or Expected Credit Loss allowance under **Ind AS 109**) is created when an enterprise estimates that certain customer receivables may not be collected in full due to business insolvency or payment disputes. Under the **Prudence Concept**, anticipated losses must be provided for immediately.

---

### 📋 The Journal Entry (Tally / Zoho Books Ready)

| Account Head | Nature | Dr (₹) | Cr (₹) |
|---|---|---|---|
| Provision for Doubtful Debts (P&L) | Nominal / Expense | ${formatINR(amount).replace("₹", "")} | - |
| Provision for Doubtful Debts A/c | Contra-Asset (Debtors deduction) | - | ${formatINR(amount).replace("₹", "")} |

*(Narration: Being provision created for estimated doubtful trade receivables as per Ind AS 109 / AS 29)*

**Presentation in Balance Sheet:**
- Sundry Debtors (Gross): ₹10,00,000
- *Less: Provision for Doubtful Debts*: (${formatINR(amount)})
- **Net Trade Receivables**: ₹${(1000000 - amount).toLocaleString("en-IN")}

**Subsequent Entry when Customer is Actually Written Off:**
| Account Head | Nature | Dr (₹) | Cr (₹) |
|---|---|---|---|
| Provision for Doubtful Debts A/c | Contra-Asset | ${formatINR(amount).replace("₹", "")} | - |
| Sundry Debtors - Specific Customer A/c | Current Asset (Written off) | - | ${formatINR(amount).replace("₹", "")} |

---

### ⚖️ Why this Debit & Credit
- **Debit Nominal Account:** Expensed to P&L to match expected credit losses against the revenue recognized from those sales.
- **Credit Contra-Asset:** Shows trade receivables on the Balance Sheet at their realistic Net Realisable Value (NRV).

---

### 🇮🇳 Indian Tax & Ind AS Compliance Note
1. **CRITICAL TAX RULE — Section 36(1)(vii):** Under the Income Tax Act, a mere *provision* for doubtful debts is **NOT tax-deductible**! The expense is added back to taxable profit in your ITR.
2. **Actual Write-Off Required:** The tax deduction can only be claimed in the financial year when the specific customer account is **actually written off as bad debt** in the books.
3. **Deferred Tax Asset (DTA):** Because the provision is disallowed for tax now but deductible upon actual write-off in future, it creates a deductible temporary difference leading to a **Deferred Tax Asset (DTA) under Ind AS 12 / AS 22**.

---

### ⚠️ Pro Tip for the Business Owner
Do not write off the debtor in your sales ledger until recovery efforts (legal notices, IBC filings) are exhausted. Keep the provision in books to reflect true profitability without losing your legal claim against the defaulting customer!`;
    }

    // Provision for Audit Fees / Operating Expenses / General Provision
    const feeName = isAuditOrExpense ? (q.includes("audit") ? "Audit Fees" : "Professional & Legal Charges") : "Operating Expenses";
    const tdsRateVal = 10; // Section 194J 10%
    const tdsAmt = Math.round((amount * tdsRateVal) / 100);
    const netProv = amount - tdsAmt;

    return `### 💡 Plain English Explanation
Under **Ind AS 37 / AS 29 (Provisions, Contingent Liabilities and Contingent Assets)**, a **Provision** is a liability of uncertain timing or amount. It must be recognized when three criteria are met:
1. The business has a **present obligation** (legal or constructive) resulting from a past event.
2. It is **probable** (more likely than not) that an outflow of economic resources will be required.
3. A **reliable estimate** can be made of the amount.

At financial year-end (31st March), businesses must book provisions for services already consumed (such as Statutory Audit, CA consultation, unpaid rent, or electricity) under the **Accrual (Mercantile) System of Accounting**.

---

### 📋 The Journal Entry (Tally / Zoho Books Ready)

**1. Year-End Provision Booking on 31st March (with TDS):**
| Account Head | Nature | Dr (₹) | Cr (₹) |
|---|---|---|---|
| ${feeName} Expense A/c | Nominal / Expense | ${formatINR(amount).replace("₹", "")} | - |
| TDS Payable u/s 194J [ITA 2025: Sec 393] (10%) | Current Liability (Govt) | - | ${formatINR(tdsAmt).replace("₹", "")} |
| Provision for ${feeName} A/c | Current Liability | - | ${formatINR(netProv).replace("₹", "")} |

*(Narration: Being year-end provision made for ${feeName.toLowerCase()} for the FY ended 31st March after deducting 10% TDS under Section 194J (Income Tax Act 1961) / Section 393 (Income Tax Act 2025) as per Ind AS 37)*

**2. Subsequent FY Entry when Actual Tax Invoice is Received & Settled:**
| Account Head | Nature | Dr (₹) | Cr (₹) |
|---|---|---|---|
| Provision for ${feeName} A/c | Current Liability (Cleared) | ${formatINR(netProv).replace("₹", "")} | - |
| Input CGST (9%) | Current Asset (ITC) | ${formatINR(Math.round(amount * 0.09)).replace("₹", "")} | - |
| Input SGST (9%) | Current Asset (ITC) | ${formatINR(Math.round(amount * 0.09)).replace("₹", "")} | - |
| Bank / Sundry Creditor A/c | Current Asset / Liability | - | ${formatINR(netProv + Math.round(amount * 0.18)).replace("₹", "")} |

*(Narration: Being provision settled upon receipt of tax invoice with GST ITC claimed under Section 16)*

---

### ⚖️ Why this Debit & Credit
- **Debit Expense:** Expensed in the current fiscal year to adhere to the **Matching Principle** (revenues of the year must be matched with expenses incurred to generate them).
- **Credit TDS Payable:** Under Sections 194J/194C (ITA 1961) and Section 393 (ITA 2025), tax must be deducted at the time of credit to the payee or to any account called "Provision / Suspense Account" if the payee is identifiable.
- **Credit Provision:** Appears under **Current Liabilities > Short-Term Provisions** on the Balance Sheet.

---

### 🇮🇳 Indian Tax & Ind AS Compliance Note
1. **HIGH-STAKES TDS MANDATE — Section 40(a)(ia) / Section 35 Disallowance:** If the payee is identifiable (e.g. your Statutory Auditor), TDS **must** be deducted on the provision! Failure to deduct TDS results in **30% disallowance** of the entire expense in your Income Tax computation under Section 40(a)(ia) of the Income Tax Act 1961 (transitioning under Section 35 / general deduction provisions of the Income Tax Act 2025).
2. **Special Deposit Due Date (Rule 30):** While TDS for April-February is deposited by the 7th of the following month, **TDS deducted on 31st March provisions has an extended due date of 30th April** via Challan 281.
3. **No GST on Provisions:** GST is only accounted when the actual GST tax invoice is issued by the vendor, because Input Tax Credit (ITC) requires a valid tax invoice under Section 16(2)(a).

---

### ⚠️ Pro Tip for the Business Owner
If you create a general ad-hoc provision for unbilled expenses where vendors are not yet identifiable, TDS cannot be deducted due to absence of PAN. However, ensure such provisions are reversed on 1st April or adjusted against actual bills, to avoid queries from the Tax Auditor in Form 3CD!`;
  }

  // 1. MSME Section 43B(h) 45-Day Payment Rule (ITA 1961 Sec 43B(h) / ITA 2025 Sec 35)
  if (q.includes("43b") || (q.includes("msme") && (q.includes("45") || q.includes("day") || q.includes("unpaid") || q.includes("disallow")))) {
    return `### 💡 Plain English Explanation
Under **Section 43B(h)** of the Income Tax Act 1961 (and corresponding statutory deduction rules under **Section 35 of the Income Tax Act 2025**), payments owed to registered **Micro & Small Enterprises (MSEs)** must be paid within:
- **15 days** if there is no written agreement.
- Up to **45 days** if a written agreement exists (cannot exceed 45 days even if agreed).

If ${formatINR(amount)} owed to an MSME remains unpaid on 31st March past this limit, the deduction is **disallowed** for the financial year and added back to your taxable net profit. You can only claim it in the subsequent year when payment is actually executed.

---

### 📋 The Journal Entry (Tally / Zoho Books Ready)

| Account Head | Nature | Dr (₹) | Cr (₹) |
|---|---|---|---|
| Purchase A/c / Expense A/c | Nominal / Expense | ${formatINR(amount).replace("₹", "")} | - |
| Input CGST (9%) | Current Asset | ${formatINR(halfGst).replace("₹", "")} | - |
| Input SGST (9%) | Current Asset | ${formatINR(halfGst).replace("₹", "")} | - |
| Sundry Creditors - ${partyName} (MSME) | Current Liability | - | ${formatINR(totalAmount).replace("₹", "")} |

*(Narration: Being purchase from registered MSME supplier recorded on credit term adhering to Section 43B(h) [ITA 2025: Sec 35])*

**When Paid in subsequent year:**
| Account Head | Nature | Dr (₹) | Cr (₹) |
|---|---|---|---|
| Sundry Creditors - ${partyName} (MSME) | Current Liability | ${formatINR(totalAmount).replace("₹", "")} | - |
| Bank / HDFC Current A/c | Current Asset | - | ${formatINR(totalAmount).replace("₹", "")} |

---

### ⚖️ Why this Debit & Credit
- **Debit Expenses & Assets:** In your accounting books, the expense is booked immediately under the Accrual (Mercantile) system.
- **Credit Liability:** Creates an obligation to pay the MSME supplier.
- **Income Tax Impact:** While the accounting entry remains unchanged, the ₹${amount.toLocaleString("en-IN")} is added back in your computation of taxable income in **ITR / Tax Audit Form 3CD (Clause 22)** if paid after the 45-day window.

---

### 🇮🇳 Indian Tax & Ind AS Compliance Note
1. **Section 43B(h) [ITA 1961] / Section 35 [ITA 2025]:** Only applies to suppliers registered under **Udyam as Micro or Small enterprises** (Manufacturing & Service). It does **NOT** apply to Medium enterprises or Wholesale/Retail Traders.
2. **Compound Interest Mandate:** Under Section 16 of the MSMED Act 2006, delayed payment attracts mandatory compound interest at **3 times the RBI Bank Rate**, which is expressly disallowed as a business expense under Section 23 of the MSMED Act.

---

### ⚠️ Pro Tip for the Business Owner
Always collect the supplier's **Udyam Registration Certificate** at onboarding. Maintain an **MSME Aging Tracker** in Tally/Zoho to flag invoices approaching day 35 so your finance team releases payments before the 45-day deadline!`;
  }

  // 2. Office Rent with TDS Section 194I / ITA 2025 Sec 393
  if (q.includes("rent") || q.includes("194i") || q.includes("landlord")) {
    const tdsRate = q.includes("machinery") || q.includes("equipment") ? 0.02 : 0.10; // 10% for land/building, 2% for plant/machinery
    const tdsAmount = amount * tdsRate;
    const netPayable = (amount + gstAmount) - tdsAmount;

    return `### 💡 Plain English Explanation
When paying commercial office rent, you must deduct **TDS under Section 194I of Income Tax Act 1961** (transitioning under **Section 393 of Income Tax Act 2025**) at 10% on land/building or 2% on plant/equipment if total annual rent exceeds ₹2,40,000. 
Important: **TDS is calculated on the base rent amount excluding GST**, and the deducted tax must be deposited with the government by the 7th of the following month via **Challan 281**.

---

### 📋 The Journal Entry (Tally / Zoho Books Ready)

| Account Head | Nature | Dr (₹) | Cr (₹) |
|---|---|---|---|
| Rent Expense A/c | Nominal / Expense | ${formatINR(amount).replace("₹", "")} | - |
| Input CGST (${gstRate / 2}%) | Current Asset (ITC) | ${formatINR(halfGst).replace("₹", "")} | - |
| Input SGST (${gstRate / 2}%) | Current Asset (ITC) | ${formatINR(halfGst).replace("₹", "")} | - |
| TDS Payable on Rent (Sec 194I / Sec 393) | Current Liability | - | ${formatINR(tdsAmount).replace("₹", "")} |
| Landlord / Creditor A/c | Current Liability | - | ${formatINR(netPayable).replace("₹", "")} |

*(Narration: Being commercial office rent for the month booked after deducting 10% TDS under Section 194I [ITA 2025: Sec 393] on base rent ₹${amount.toLocaleString("en-IN")})*

**Payment Entry:**
| Account Head | Nature | Dr (₹) | Cr (₹) |
|---|---|---|---|
| Landlord / Creditor A/c | Current Liability | ${formatINR(netPayable).replace("₹", "")} | - |
| Bank / Current A/c | Current Asset | - | ${formatINR(netPayable).replace("₹", "")} |

---

### ⚖️ Why this Debit & Credit
- **Debit Rent Expense:** Nominal Account rule — Debit all expenses and losses.
- **Debit Input GST:** Current asset because your business can claim Input Tax Credit (ITC) under Section 16 if the office is used for business purposes.
- **Credit TDS Payable:** Current liability owed to the Government under Sec 194I / Sec 393.
- **Credit Landlord / Bank:** The net cash outflow to the property owner.

---

### 🇮🇳 Indian Tax & Ind AS Compliance Note
1. **Section 194I [ITA 1961] / Section 393 [ITA 2025] Threshold:** ₹2,40,000 per financial year per payee.
2. **Ind AS 116 (Leases):** If your company has a long-term lease (>12 months), you must recognize a **Right-of-Use (ROU) Asset** and a **Lease Liability** rather than straight expensing rent.
3. **Challan 281:** Deposit TDS before 7th of next month (30th April for March rent). File quarterly **Form 26Q** and issue **Form 16A** to the landlord.

---

### ⚠️ Pro Tip for the Business Owner
Ensure the landlord's PAN is active and verified. If the landlord does not provide a valid PAN, TDS must be deducted at **20% under Section 206AA**!`;
  }

  // 3. Purchase of Laptops / Computers / Office Equipment (Fixed Assets)
  if (q.includes("laptop") || q.includes("computer") || q.includes("furniture") || q.includes("asset") || q.includes("machine") || q.includes("equipment") || q.includes("ac") || q.includes("chair")) {
    const assetName = q.includes("laptop") || q.includes("computer") ? "Computers & Laptops A/c" : q.includes("furniture") || q.includes("chair") ? "Furniture & Fixtures A/c" : "Plant & Machinery A/c";

    return `### 💡 Plain English Explanation
Purchasing business hardware such as laptops or office furniture is a **Capital Expenditure** (CapEx). Under **Ind AS 16 (Property, Plant and Equipment)**, the base asset price is capitalised on the Balance Sheet, while the GST paid is claimed as **Input Tax Credit (ITC)** under Section 16 of the CGST Act (not added to asset cost, provided you don't claim tax depreciation on the GST component).

---

### 📋 The Journal Entry (Tally / Zoho Books Ready)

| Account Head | Nature | Dr (₹) | Cr (₹) |
|---|---|---|---|
| ${assetName} | Tangible Fixed Asset | ${formatINR(amount).replace("₹", "")} | - |
| Input CGST (${gstRate / 2}%) | Current Asset (ITC) | ${formatINR(halfGst).replace("₹", "")} | - |
| Input SGST (${gstRate / 2}%) | Current Asset (ITC) | ${formatINR(halfGst).replace("₹", "")} | - |
| Bank / Creditor A/c | Current Asset / Liability | - | ${formatINR(totalAmount).replace("₹", "")} |

*(Narration: Being purchase of ${assetName.toLowerCase()} for ₹${amount.toLocaleString("en-IN")} plus ${gstRate}% GST for office business operations capitalised under Ind AS 16)*

---

### ⚖️ Why this Debit & Credit
- **Debit Fixed Asset:** Real Account rule — *Debit what comes in*. Increases economic resources of the business.
- **Debit Input GST:** Current Asset — Claimable against output GST liabilities in GSTR-3B (matches in GSTR-2B).
- **Credit Bank / Creditor:** Reduces bank balance or records trade payable to vendor.

---

### 🇮🇳 Indian Tax & Ind AS Compliance Note
1. **Section 16(2) CGST Act:** To claim ITC, ensure:
   - Vendor has uploaded invoice in GSTR-1 and it reflects in your **GSTR-2B**.
   - You have possession of tax invoice and goods have been received.
   - Payment made within **180 days** to avoid ITC reversal with 18% interest under Rule 37.
2. **Depreciation (Income Tax vs Companies Act):**
   - Income Tax Act: 40% WDV for Computers/Laptops (Block of Assets). If put to use for < 180 days in FY, claim 50% of normal rate (20%).
   - Ind AS 16: Useful life basis (typically 3 years for laptops, 10 years for furniture).

---

### ⚠️ Pro Tip for the Business Owner
Do **NOT** capitalize the GST amount into the asset value if you are claiming ITC. Under Section 16(10) of the CGST Act, if depreciation is claimed on the tax component, ITC is strictly disallowed!`;
  }

  // 4. Professional / Consultancy / CA Fees (Section 194J / ITA 2025 Sec 393)
  if (q.includes("194j") || q.includes("consult") || q.includes("legal") || q.includes("advocate") || q.includes("professional") || q.includes("software")) {
    const isAdvocate = q.includes("advocate") || q.includes("lawyer");
    const tdsRate = q.includes("tech") || q.includes("call center") ? 0.02 : 0.10;
    const tdsAmount = amount * tdsRate;
    const netPayable = (amount + gstAmount) - tdsAmount;

    return `### 💡 Plain English Explanation
Professional or technical services (like CA fees, software consulting, or marketing services) attract **TDS under Section 194J of the Income Tax Act 1961** (transitioning under **Section 393 of the Income Tax Act 2025**) at 10% for professional fees, or 2% for technical services, if aggregate payments exceed ₹30,000 in a financial year.
${isAdvocate ? "Note: Legal services provided by individual advocates are under **Reverse Charge Mechanism (RCM)** where the service recipient pays GST directly." : "GST is charged by the service provider and eligible for 100% ITC."}

---

### 📋 The Journal Entry (Tally / Zoho Books Ready)

| Account Head | Nature | Dr (₹) | Cr (₹) |
|---|---|---|---|
| Legal & Professional Fees A/c | Nominal / Expense | ${formatINR(amount).replace("₹", "")} | - |
| Input CGST (${gstRate / 2}%) | Current Asset (ITC) | ${formatINR(halfGst).replace("₹", "")} | - |
| Input SGST (${gstRate / 2}%) | Current Asset (ITC) | ${formatINR(halfGst).replace("₹", "")} | - |
| TDS Payable (Sec 194J / Sec 393) | Current Liability | - | ${formatINR(tdsAmount).replace("₹", "")} |
| Vendor / Consultant A/c | Current Liability | - | ${formatINR(netPayable).replace("₹", "")} |

*(Narration: Being professional consulting fees booked with 10% TDS deduction under Section 194J [ITA 2025: Sec 393] on base amount ₹${amount.toLocaleString("en-IN")})*

---

### ⚖️ Why this Debit & Credit
- **Debit Professional Fees:** Nominal Account — Debit all expenses.
- **Debit Input GST:** Valid business expense with eligible Input Tax Credit under Section 16.
- **Credit TDS Payable:** Statutory liability payable to Income Tax Dept by 7th of following month via Challan 281.
- **Credit Consultant:** Net amount payable to the consultant.

---

### 🇮🇳 Indian Tax & Ind AS Compliance Note
1. **Section 194J [ITA 1961] / Section 393 [ITA 2025]:** Threshold is ₹30,000 per financial year per category.
2. **Disallowance Protection:** Failure to deduct or deposit TDS invokes **30% expense disallowance under Section 40(a)(ia) of ITA 1961** (transitioning under Section 35 of ITA 2025).
3. **Form 26Q & Form 16A:** Report this deduction in quarterly TDS return and issue quarterly certificate to consultant.

---

### ⚠️ Pro Tip for the Business Owner
Deduct TDS on the **base value before GST**. If your consultant is an individual or proprietorship, verify if Section 43B(h) applies (if they hold Udyam registration, payment must be released within 45 days)!`;
  }

  // 5. Customer Advances & Revenue Recognition (Ind AS 115)
  if (q.includes("advance") || q.includes("ind as 115") || q.includes("contract liability")) {
    return `### 💡 Plain English Explanation
Under **Ind AS 115 (Revenue from Contracts with Customers)**, receiving cash in advance from a client does **NOT** constitute revenue. Revenue can only be recognized when the **performance obligation is satisfied** (goods delivered or services rendered). Until then, the money is a **Contract Liability (Advance from Customer)** on your Balance Sheet.
Under GST, advances received for **Services** attract GST liability at the time of receipt via a Receipt Voucher, whereas advances for **Goods** are exempt from GST at the advance stage (Notification No. 66/2017-Central Tax).

---

### 📋 The Journal Entry (Tally / Zoho Books Ready)

**1. On Receiving Advance (For Services):**
| Account Head | Nature | Dr (₹) | Cr (₹) |
|---|---|---|---|
| Bank / HDFC Current A/c | Current Asset | ${formatINR(totalAmount).replace("₹", "")} | - |
| Advance from Customers A/c | Current Liability | - | ${formatINR(amount).replace("₹", "")} |
| Output CGST Payable (${gstRate / 2}%) | Current Liability | - | ${formatINR(halfGst).replace("₹", "")} |
| Output SGST Payable (${gstRate / 2}%) | Current Liability | - | ${formatINR(halfGst).replace("₹", "")} |

*(Narration: Being advance received for services with GST liability created under Ind AS 115)*

**2. When Service is Executed (Invoice Issued):**
| Account Head | Nature | Dr (₹) | Cr (₹) |
|---|---|---|---|
| Advance from Customers A/c | Current Liability | ${formatINR(amount).replace("₹", "")} | - |
| Revenue / Sales A/c | Revenue / Income | - | ${formatINR(amount).replace("₹", "")} |

---

### ⚖️ Why this Debit & Credit
- **Debit Bank:** Cash inflow increases liquid assets.
- **Credit Contract Liability:** You have a performance obligation to the customer. It is a debt until fulfilled.
- **Recognize Revenue only when delivered:** Follows the 5-step model under Ind AS 115.

---

### 🇮🇳 Indian Tax & Ind AS Compliance Note
- Issue a **Receipt Voucher** under Section 31(3)(d) of the CGST Act when accepting advance for services.

---

### ⚠️ Pro Tip for the Business Owner
Do not inflate your current month's turnover in your P&L with customer advances, as this prematurely increases your income tax liability before the service cost is matched!`;
  }

  // 6. Reverse Charge Mechanism (RCM on GTA Transport)
  if (q.includes("rcm") || q.includes("gta") || q.includes("freight") || q.includes("transport")) {
    const rcmRate = 0.05; // 5% GTA RCM
    const rcmGst = amount * rcmRate;

    return `### 💡 Plain English Explanation
When you hire an unregistered Goods Transport Agency (GTA) or a GTA opting for 5% RCM, **Reverse Charge Mechanism (Section 9(3) CGST Act)** applies. The transport agency does not charge GST on the consignment note; instead, **you (the recipient) must pay 5% GST directly to the government** in cash via the Electronic Cash Ledger in GSTR-3B, and simultaneously claim 100% Input Tax Credit in the same tax period.

---

### 📋 The Journal Entry (Tally / Zoho Books Ready)

**1. Booking Freight Expense & RCM Liability:**
| Account Head | Nature | Dr (₹) | Cr (₹) |
|---|---|---|---|
| Freight & Cartage Expense A/c | Nominal / Expense | ${formatINR(amount).replace("₹", "")} | - |
| Input GST RCM (CGST 2.5% + SGST 2.5%) | Current Asset | ${formatINR(rcmGst).replace("₹", "")} | - |
| RCM Tax Payable A/c | Current Liability | - | ${formatINR(rcmGst).replace("₹", "")} |
| Transporter / Cash A/c | Current Asset / Liability | - | ${formatINR(amount).replace("₹", "")} |

*(Narration: Being freight paid to GTA under Section 9(3) RCM at 5% with simultaneous ITC booking)*

---

### ⚖️ Why this Debit & Credit
- **Debit Freight Expense:** Nominal Account — business carriage expense.
- **Credit RCM Tax Payable:** Obligation to discharge tax via electronic cash ledger.
- **Debit Input GST RCM:** Tax paid under RCM is eligible for immediate ITC in Table 4(A)(3) of GSTR-3B.

---

### 🇮🇳 Indian Tax & Ind AS Compliance Note
- **Cash Discharge Mandatory:** RCM liability CANNOT be paid using existing Input Tax Credit. You must deposit cash into the Electronic Cash Ledger first.
- Self-invoicing is required under Section 31(3)(f) of the CGST Act for RCM inward supplies.

---

### ⚠️ Pro Tip for the Business Owner
Always ensure the Consignment Note (Bilty) mentions whether the GTA has opted to pay tax under forward charge (12%) or reverse charge (5%) to prevent audit disputes!`;
  }

  // 7. General Balanced Journal Entry for Sales / Purchases / Expenses
  const isSale = q.includes("sale") || q.includes("sold") || q.includes("customer") || q.includes("client");
  const expenseOrAsset = q.includes("purchase") || q.includes("bought") ? "Purchase A/c" : "Operating Expense A/c";

  if (isSale) {
    return `### 💡 Plain English Explanation
Recording a sales transaction of ${formatINR(amount)} with ${gstRate}% ${isInterState ? "IGST" : "CGST + SGST"}. Sales represents operating revenue credited to the Profit & Loss statement under **Ind AS 115**, while GST collected from the customer is an output tax liability owed to the Government via GSTR-3B.

---

### 📋 The Journal Entry (Tally / Zoho Books Ready)

| Account Head | Nature | Dr (₹) | Cr (₹) |
|---|---|---|---|
| Sundry Debtors / Bank A/c | Current Asset | ${formatINR(totalAmount).replace("₹", "")} | - |
| Sales / Revenue A/c | Nominal / Revenue | - | ${formatINR(amount).replace("₹", "")} |
${isInterState ? `| Output IGST (${gstRate}%) | Current Liability | - | ${formatINR(gstAmount).replace("₹", "")} |` : `| Output CGST (${gstRate / 2}%) | Current Liability | - | ${formatINR(halfGst).replace("₹", "")} |
| Output SGST (${gstRate / 2}%) | Current Liability | - | ${formatINR(halfGst).replace("₹", "")} |`}

*(Narration: Being sales of goods/services for ₹${amount.toLocaleString("en-IN")} with ${gstRate}% GST recorded on ${isInterState ? "inter-state" : "intra-state"} basis)*

---

### ⚖️ Why this Debit & Credit
- **Debit Sundry Debtors / Bank:** Asset increases. The customer owes or has paid the gross invoice amount.
- **Credit Sales:** Modern Accounting rule — Credit increases in Revenue.
- **Credit Output GST:** Liability to the Government to be remitted on or before the 20th of the following month in GSTR-3B.

---

### 🇮🇳 Indian Tax & Ind AS Compliance Note
1. Report this invoice in **GSTR-1** by the 11th of the following month so your customer can view it in their GSTR-2B.
2. If turnover exceeds ₹5 Crore, generate **e-Invoice** (IRN) via the IRP portal prior to delivery.

---

### ⚠️ Pro Tip for the Business Owner
Ensure the customer's GSTIN is verified as active on the GST portal before generating the tax invoice to avoid e-way bill and input tax credit rejections.`;
  }

  // Default Purchase / Expense Entry
  return `### 💡 Plain English Explanation
Recording a business transaction of ${formatINR(amount)} with ${gstRate}% ${isInterState ? "IGST" : "CGST + SGST"}. The base expenditure is debited to Profit & Loss, while the GST paid is booked as **Input Tax Credit (ITC)** in the Balance Sheet to be offset against your monthly output tax liability in GSTR-3B.

---

### 📋 The Journal Entry (Tally / Zoho Books Ready)

| Account Head | Nature | Dr (₹) | Cr (₹) |
|---|---|---|---|
| ${expenseOrAsset} | Nominal / Expense | ${formatINR(amount).replace("₹", "")} | - |
${isInterState ? `| Input IGST (${gstRate}%) | Current Asset (ITC) | ${formatINR(gstAmount).replace("₹", "")} | - |` : `| Input CGST (${gstRate / 2}%) | Current Asset (ITC) | ${formatINR(halfGst).replace("₹", "")} | - |
| Input SGST (${gstRate / 2}%) | Current Asset (ITC) | ${formatINR(halfGst).replace("₹", "")} | - |`}
| Sundry Creditors / Bank A/c | Current Asset / Liability | - | ${formatINR(totalAmount).replace("₹", "")} |

*(Narration: Being ${expenseOrAsset.toLowerCase()} booked for ₹${amount.toLocaleString("en-IN")} with ${gstRate}% GST)*

---

### ⚖️ Why this Debit & Credit
- **Debit Expense / Purchase:** Nominal Account rule — *Debit all expenses and losses*.
- **Debit Input GST:** Current Asset — claimable under Section 16 of the CGST Act against output taxes.
- **Credit Bank / Creditor:** Settlement via bank or creation of an obligation to pay the supplier.

---

### 🇮🇳 Indian Tax & Ind AS Compliance Note
1. Ensure the vendor reflects the invoice in **GSTR-2B** before claiming ITC in Table 4(A)(5) of GSTR-3B.
2. Adhere to **Section 43B(h)**: If the supplier is a registered Micro/Small enterprise, settle within 45 days.

---

### ⚠️ Pro Tip for the Business Owner
Always check whether the expense falls under **Section 17(5) Blocked Credits** (e.g., motor vehicles, food & beverages, outdoor catering, employee health insurance unless mandatory) — if blocked, the GST must be added directly to the expense cost!`;
}

export function generateRuleBasedVoucher(params: {
  description?: string;
  amount?: number | string;
  gstRate?: number | string;
  gstType?: string;
  tdsSection?: string;
  partyName?: string;
  businessContext?: BusinessContext;
}): StructuredVoucher {
  const baseAmount = Math.max(1, Number(params.amount) || 10000);
  const rate = Math.max(0, Number(params.gstRate) || 0);
  const isInterState = (params.gstType || "").toLowerCase().includes("inter");
  const desc = (params.description || "Business transaction").trim();
  const lowerDesc = desc.toLowerCase();
  const party = (params.partyName || "").trim() || "Vendor / Party";

  // Calculate GST
  const gstTotal = Math.round((baseAmount * rate) / 100);
  const cgst = isInterState ? 0 : Math.round(gstTotal / 2);
  const sgst = isInterState ? 0 : Math.round(gstTotal / 2);
  const igst = isInterState ? gstTotal : 0;

  // Map TDS Section using Statutory Engine with Threshold Evaluation
  const tdsKey = (params.tdsSection || "none").toLowerCase();
  const tdsCalculation = calculateTDS({
    section: tdsKey,
    baseAmount,
  });

  const tdsAmount = tdsCalculation.applicable ? tdsCalculation.tdsAmount : 0;
  const tdsRate = tdsCalculation.rate;
  const tdsLabel = tdsCalculation.sectionDisplay;
  const challanCode = tdsCalculation.challanCode;

  // Classify transaction nature
  const isCustomerAdvance = !lowerDesc.includes("provision") && (
    lowerDesc.includes("advance from customer") ||
    lowerDesc.includes("customer advance") ||
    lowerDesc.includes("advance received") ||
    lowerDesc.includes("unearned revenue") ||
    lowerDesc.includes("contract liability")
  );
  const isVendorAdvance = !lowerDesc.includes("provision") && !isCustomerAdvance && (
    lowerDesc.includes("advance to vendor") ||
    lowerDesc.includes("advance to supplier") ||
    lowerDesc.includes("supplier advance") ||
    lowerDesc.includes("advance payment to")
  );

  const isProvision = lowerDesc.includes("provision") || lowerDesc.includes("outstanding") || party.toLowerCase().includes("provision");
  const isTaxProvision = isProvision && (lowerDesc.includes("tax") || lowerDesc.includes("income tax") || lowerDesc.includes("advance tax"));
  const isDoubtfulDebtProvision = isProvision && (lowerDesc.includes("doubtful") || lowerDesc.includes("bad debt") || lowerDesc.includes("ecl") || lowerDesc.includes("debtor"));
  const isAuditFeeProvision = isProvision && (lowerDesc.includes("audit") || lowerDesc.includes("ca fee") || lowerDesc.includes("professional") || lowerDesc.includes("194j"));

  const isSale = !isProvision && !isCustomerAdvance && !isVendorAdvance && (lowerDesc.includes("sale") || lowerDesc.includes("revenue") || lowerDesc.includes("billing") || lowerDesc.includes("invoice to"));
  const isRent = !isProvision && !isCustomerAdvance && !isVendorAdvance && (lowerDesc.includes("rent") || tdsKey.includes("194i"));
  const isProf = !isProvision && !isCustomerAdvance && !isVendorAdvance && (lowerDesc.includes("professional") || lowerDesc.includes("legal") || lowerDesc.includes("consult") || tdsKey.includes("194j"));
  const isAsset = !isProvision && !isCustomerAdvance && !isVendorAdvance && (lowerDesc.includes("laptop") || lowerDesc.includes("computer") || lowerDesc.includes("equipment") || lowerDesc.includes("furniture") || lowerDesc.includes("asset"));
  const isSalary = !isProvision && !isCustomerAdvance && !isVendorAdvance && (lowerDesc.includes("salary") || lowerDesc.includes("wages") || lowerDesc.includes("payroll"));

  const netPartyAmount = isCustomerAdvance
    ? baseAmount + gstTotal
    : isSale
    ? baseAmount + gstTotal - tdsAmount
    : baseAmount + gstTotal - tdsAmount;

  let voucherType = "Journal Voucher";
  let expenseHead = "Operating Expenses A/c";
  let indAsStandard = "Ind AS 1";
  let indAsTitle = "Presentation of Financial Statements";
  let indAsPrinciple = "Recognize transactions in the period they occur under accrual concept.";
  let taxRule = "Keep original invoice records for 6 years under Section 44AA of Income Tax Act.";

  if (isCustomerAdvance) {
    voucherType = "Receipt Voucher";
    indAsStandard = "Ind AS 115";
    indAsTitle = "Revenue from Contracts with Customers - Contract Liabilities";
    indAsPrinciple = "Customer advances are recognized as Contract Liabilities on the balance sheet, not revenue, until performance obligations are satisfied.";
    taxRule = "Issue statutory Receipt Voucher under GST Section 31(3)(d). Note: GST on advances applies to service supplies; advance on supply of goods is exempted under Notification 66/2017.";
  } else if (isVendorAdvance) {
    voucherType = "Payment Voucher";
    expenseHead = "Advance to Suppliers & Vendors A/c";
    indAsStandard = "Ind AS 1";
    indAsTitle = "Presentation of Financial Statements - Current Assets";
    indAsPrinciple = "Amounts paid to vendors prior to delivery of goods or services are classified under Other Current Assets (Advances).";
    taxRule = "Obtain receipt voucher from vendor. GST Input Tax Credit (ITC) can only be claimed upon actual receipt of tax invoice and goods/services under Section 16(2).";
  } else if (isProvision) {
    voucherType = "Journal Voucher";
    if (isTaxProvision) {
      expenseHead = "Current Tax Expense (P&L) A/c";
      indAsStandard = "Ind AS 12";
      indAsTitle = "Income Taxes";
      indAsPrinciple = "Current tax for current and prior periods shall be recognized as a liability to the extent unpaid.";
      taxRule = "Calculate on taxable profits under Chapter IV/VI-A. Settle on ITR filing against Advance Tax and TDS receivable.";
    } else if (isDoubtfulDebtProvision) {
      expenseHead = "Provision for Doubtful Debts (P&L) A/c";
      indAsStandard = "Ind AS 109 / AS 29";
      indAsTitle = "Financial Instruments - Expected Credit Loss (ECL)";
      indAsPrinciple = "Recognize loss allowance for expected credit losses on financial assets.";
      taxRule = "Section 36(1)(vii): Mere provision is NOT tax-deductible until actual write-off against debtor. Creates DTA under Ind AS 12.";
    } else if (isAuditFeeProvision) {
      expenseHead = "Audit Fees Expense A/c";
      indAsStandard = "Ind AS 37 / AS 29";
      indAsTitle = "Provisions, Contingent Liabilities and Contingent Assets";
      indAsPrinciple = "A provision is recognized when there is a present obligation resulting from past event, probable outflow, and reliable estimate.";
      taxRule = "TDS mandatory at credit if payee is identifiable. 30% disallowance under Section 40(a)(ia) applies if omitted.";
    } else {
      expenseHead = "Provision for Operating Expenses A/c";
      indAsStandard = "Ind AS 37 / AS 29";
      indAsTitle = "Provisions, Contingent Liabilities and Contingent Assets";
      indAsPrinciple = "Present obligation from past event, probable outflow of resources, and reliable estimate.";
      taxRule = "Accrual basis under mercantile system. Deduct TDS if payee is identified, deposit by 30th April for March provisions.";
    }
  } else if (isSale) {
    voucherType = "Sales Voucher";
    indAsStandard = "Ind AS 115";
    indAsTitle = "Revenue from Contracts with Customers";
    indAsPrinciple = "Recognize revenue upon satisfaction of performance obligation.";
    taxRule = "File GSTR-1 by 11th of subsequent month and deposit GST via GSTR-3B by 20th.";
  } else if (isRent) {
    voucherType = "Payment Voucher";
    expenseHead = "Office Rent Expense A/c";
    indAsStandard = "Ind AS 116";
    indAsTitle = "Leases";
    indAsPrinciple = "Operating lease payments expensed systematically over the lease term.";
    taxRule = "TDS u/s 194I applicable if annual rent exceeds ₹2,40,000 threshold. Deposit via Challan 281.";
  } else if (isProf) {
    voucherType = "Payment Voucher";
    expenseHead = "Legal & Professional Charges A/c";
    indAsStandard = "Ind AS 1";
    indAsTitle = "Presentation of Financial Statements";
    indAsPrinciple = "Match professional fees against business revenue earned in the same fiscal year.";
    taxRule = "TDS u/s 194J mandatory if annual fees exceed ₹30,000 threshold. 30% disallowance under Sec 40(a)(ia) if omitted.";
  } else if (isAsset) {
    voucherType = "Journal Voucher";
    expenseHead = "Office Equipment & Computers A/c";
    indAsStandard = "Ind AS 16";
    indAsTitle = "Property, Plant and Equipment";
    indAsPrinciple = "Capitalize asset cost; charge depreciation over useful economic life.";
    taxRule = "Claim block depreciation under Section 32 at applicable rates (e.g. 40% on computers).";
  } else if (isSalary) {
    voucherType = "Payment Voucher";
    expenseHead = "Salaries & Wages Expense A/c";
    indAsStandard = "Ind AS 19";
    indAsTitle = "Employee Benefits";
    indAsPrinciple = "Recognize short-term employee benefits in the period employee renders service.";
    taxRule = "Deduct TDS u/s 192 if employee salary exceeds basic exemption limit.";
  }

  const entries: JournalEntryLine[] = [];

  if (isCustomerAdvance) {
    entries.push({
      accountName: "Current Bank A/c / Payment Gateway",
      category: "Asset",
      debitAmount: baseAmount + (rate > 0 ? gstTotal : 0),
      creditAmount: 0,
      reason: "Real Account: Debit what comes into bank from customer advance",
    });
    entries.push({
      accountName: `Advance from Customer (${party}) / Contract Liability A/c`,
      category: "Liability",
      debitAmount: 0,
      creditAmount: baseAmount,
      reason: "Personal Account: Credit the giver / obligation to supply goods/services under Ind AS 115",
    });
    if (rate > 0) {
      if (isInterState) {
        entries.push({
          accountName: `Output IGST on Advance (${rate}%) A/c`,
          category: "Liability",
          debitAmount: 0,
          creditAmount: igst,
          reason: "Statutory Liability: IGST due on service advances under Section 13(2)",
        });
      } else {
        entries.push({
          accountName: `Output CGST on Advance (${rate / 2}%) A/c`,
          category: "Liability",
          debitAmount: 0,
          creditAmount: cgst,
          reason: "Statutory Liability: CGST due on service advances under Section 13(2)",
        });
        entries.push({
          accountName: `Output SGST on Advance (${rate / 2}%) A/c`,
          category: "Liability",
          debitAmount: 0,
          creditAmount: sgst,
          reason: "Statutory Liability: SGST due on service advances under Section 13(2)",
        });
      }
    }
  } else if (isVendorAdvance) {
    entries.push({
      accountName: `Advance to Vendor (${party}) A/c`,
      category: "Asset",
      debitAmount: baseAmount,
      creditAmount: 0,
      reason: "Current Asset: Prepayment to supplier recorded under Other Current Assets pending invoice delivery",
    });
    entries.push({
      accountName: "Current Bank A/c",
      category: "Asset",
      debitAmount: 0,
      creditAmount: baseAmount,
      reason: "Real Account: Credit bank for outflow of funds",
    });
  } else if (isProvision) {
    if (isTaxProvision) {
      entries.push({
        accountName: "Current Tax Expense (P&L)",
        category: "Expense",
        debitAmount: baseAmount,
        creditAmount: 0,
        reason: "Nominal Account: Charge current tax expense against current year accounting profit under Ind AS 12",
      });
      entries.push({
        accountName: "Provision for Income Tax A/c",
        category: "Liability",
        debitAmount: 0,
        creditAmount: baseAmount,
        reason: "Current Liability: Short-term provision for income tax payable to Government until ITR assessment",
      });
    } else if (isDoubtfulDebtProvision) {
      entries.push({
        accountName: "Provision for Doubtful Debts (P&L)",
        category: "Expense",
        debitAmount: baseAmount,
        creditAmount: 0,
        reason: "Nominal Account: Debit expected credit loss under Prudence Concept / Ind AS 109",
      });
      entries.push({
        accountName: "Provision for Doubtful Debts A/c",
        category: "ContraAsset",
        debitAmount: 0,
        creditAmount: baseAmount,
        reason: "Contra-Asset: Deducted from Sundry Debtors on Balance Sheet to present realistic NRV",
      });
    } else {
      entries.push({
        accountName: expenseHead,
        category: "Expense",
        debitAmount: baseAmount,
        creditAmount: 0,
        reason: "Nominal Account: Debit all business expenses incurred in the financial year under Accrual Concept",
      });

      if (tdsAmount > 0) {
        entries.push({
          accountName: `TDS Payable u/s ${tdsLabel} A/c`,
          category: "Liability",
          debitAmount: 0,
          creditAmount: tdsAmount,
          reason: `Current Liability: Statutory TDS deduction deposited by 7th of subsequent month via Challan ${challanCode}`,
        });
        entries.push({
          accountName: `Provision for ${isAuditFeeProvision ? "Audit Fees" : "Expenses"} A/c`,
          category: "Liability",
          debitAmount: 0,
          creditAmount: baseAmount - tdsAmount,
          reason: "Current Liability: Net amount provided for year-end settlement upon receipt of vendor invoice",
        });
      } else {
        entries.push({
          accountName: `Provision for ${isAuditFeeProvision ? "Audit Fees" : "Expenses"} A/c`,
          category: "Liability",
          debitAmount: 0,
          creditAmount: baseAmount,
          reason: "Current Liability: Short-term provision for outstanding business expenses at year-end under Ind AS 37",
        });
      }
    }
  } else if (isSale) {
    // Sales Voucher Entries
    entries.push({
      accountName: `${party} / Current Bank A/c`,
      category: "Asset",
      debitAmount: netPartyAmount,
      creditAmount: 0,
      reason: "Asset: Receivables or cash collection from customer for supplied goods/services",
    });

    if (tdsAmount > 0) {
      entries.push({
        accountName: "TDS Receivable A/c (Asset)",
        category: "Asset",
        debitAmount: tdsAmount,
        creditAmount: 0,
        reason: "Current Tax Asset: Tax deducted at source by customer to be claimed in ITR via Form 26AS/AIS",
      });
    }

    entries.push({
      accountName: "Sales & Services Revenue A/c",
      category: "Revenue",
      debitAmount: 0,
      creditAmount: baseAmount,
      reason: "Revenue: Credit increases in operating income under Ind AS 115",
    });

    if (isInterState && igst > 0) {
      entries.push({
        accountName: `Output IGST (${rate}%) A/c`,
        category: "Liability",
        debitAmount: 0,
        creditAmount: igst,
        reason: "Statutory Liability: Integrated GST collected on interstate supply payable in GSTR-3B",
      });
    } else if (!isInterState && (cgst > 0 || sgst > 0)) {
      entries.push({
        accountName: `Output CGST (${rate / 2}%) A/c`,
        category: "Liability",
        debitAmount: 0,
        creditAmount: cgst,
        reason: "Statutory Liability: Central GST collected to be remitted to Government",
      });
      entries.push({
        accountName: `Output SGST (${rate / 2}%) A/c`,
        category: "Liability",
        debitAmount: 0,
        creditAmount: sgst,
        reason: "Statutory Liability: State GST collected to be remitted to Government",
      });
    }
  } else {
    // Purchase / Expense Voucher Entries
    entries.push({
      accountName: expenseHead,
      category: isAsset ? "Asset" : "Expense",
      debitAmount: baseAmount,
      creditAmount: 0,
      reason: isAsset
        ? "Real Account: Debit what comes into business (capital asset capitalization)"
        : "Nominal Account: Debit all business expenses and losses incurred in generating revenue",
    });

    if (isInterState && igst > 0) {
      entries.push({
        accountName: `Input IGST (${rate}%) A/c`,
        category: "Asset",
        debitAmount: igst,
        creditAmount: 0,
        reason: "Current Asset: Input Tax Credit claimable against output liabilities under Section 16",
      });
    } else if (!isInterState && (cgst > 0 || sgst > 0)) {
      entries.push({
        accountName: `Input CGST (${rate / 2}%) A/c`,
        category: "Asset",
        debitAmount: cgst,
        creditAmount: 0,
        reason: "Current Asset: Central GST Input Credit claimable in GSTR-3B Table 4(A)(5)",
      });
      entries.push({
        accountName: `Input SGST (${rate / 2}%) A/c`,
        category: "Asset",
        debitAmount: sgst,
        creditAmount: 0,
        reason: "Current Asset: State GST Input Credit claimable in GSTR-3B Table 4(A)(5)",
      });
    }

    if (tdsAmount > 0) {
      entries.push({
        accountName: `TDS Payable u/s ${tdsLabel} A/c`,
        category: "Liability",
        debitAmount: 0,
        creditAmount: tdsAmount,
        reason: "Current Liability: Statutory deduction to be deposited to Government by 7th of subsequent month via Challan 281",
      });
    }

    entries.push({
      accountName: `${party} (Sundry Creditor) / Bank A/c`,
      category: "Liability",
      debitAmount: 0,
      creditAmount: netPartyAmount,
      reason: "Personal Account: Credit the giver / vendor liability after statutory TDS withholding",
    });
  }

  const totalDebit = entries.reduce((s, e) => s + e.debitAmount, 0);
  const totalCredit = entries.reduce((s, e) => s + e.creditAmount, 0);

  const plainSummary = isProvision
    ? `Created ${voucherType} for ${desc} of ₹${baseAmount.toLocaleString("en-IN")}${tdsAmount > 0 ? ` after deducting ₹${tdsAmount.toLocaleString("en-IN")} TDS u/s ${tdsLabel}` : ""} under ${indAsStandard} (${indAsTitle}).`
    : isSale
    ? `Booked sales/billing of ₹${baseAmount.toLocaleString("en-IN")} with ₹${gstTotal.toLocaleString("en-IN")} ${isInterState ? "IGST" : "CGST/SGST"}. Net receivable from ${party} is ₹${netPartyAmount.toLocaleString("en-IN")}.`
    : `Recorded ${desc} for ₹${baseAmount.toLocaleString("en-IN")}. Added ₹${gstTotal.toLocaleString("en-IN")} GST ITC${tdsAmount > 0 ? `, deducted ₹${tdsAmount.toLocaleString("en-IN")} TDS u/s ${tdsLabel}` : ""}, and net ₹${netPartyAmount.toLocaleString("en-IN")} payable to ${party}.`;

  const narration = isProvision
    ? `Being ${desc} booked for ₹${baseAmount.toLocaleString("en-IN")}${tdsAmount > 0 ? ` after deducting TDS under Section ${tdsLabel}` : ""} created under ${indAsStandard} (${indAsTitle}).`
    : `Being ${desc} booked for ₹${baseAmount.toLocaleString("en-IN")} with ${rate}% GST (${isInterState ? "interstate" : "intrastate"})${tdsAmount > 0 ? ` and TDS withheld under Section ${tdsLabel}` : ""} as per Indian Accounting Standards.`;

  return {
    voucherType,
    plainSummary,
    entries,
    totalDebit,
    totalCredit,
    narration,
    gstBreakdown: {
      taxableValue: baseAmount,
      cgst,
      sgst,
      igst,
      itcEligible: !isSale,
      itcNote: isSale
        ? "Output tax collected payable to Government."
        : "ITC eligible under Section 16 subject to vendor invoice appearing in GSTR-2B.",
    },
    tdsBreakdown: {
      applicable: tdsAmount > 0,
      section: tdsLabel,
      rate: tdsRate,
      tdsAmount,
      challanCode,
      dueDate: "7th of succeeding month",
    },
    indAsReference: {
      standardCode: indAsStandard,
      title: indAsTitle,
      keyPrinciple: indAsPrinciple,
    },
    incomeTaxRule: taxRule,
  };
}

export function generateRuleBasedReceiptScan(params: {
  imageBase64?: string;
  mimeType?: string;
  businessContext?: BusinessContext;
}): ScannedReceiptData {
  return {
    merchant: "",
    date: "",
    yearUncertain: true,
    amount: 0,
    taxableAmount: 0,
    invoiceNumber: "",
    gstin: "",
    gstRate: 0,
    gstType: "Intra-state (CGST + SGST)",
    cgst: 0,
    sgst: 0,
    igst: 0,
    category: "Office Supplies & Stationery",
    suggestedExpenseAccount: "Operating Expenses A/c",
    paymentMode: "Bank / UPI / Card",
    tdsSection: "none",
    section43BhRelevant: false,
    complianceNotes: "⚠️ Vision OCR could not reliably decipher this receipt image. Manual entry of merchant, invoice date, and amounts is required. Potential GST Input Tax Credit (ITC) is subject to Section 16/17 and GSTR-2B reconciliation.",
    confidence: "low",
    items: [],
  };
}

/**
 * Intelligent Rule-based financial analyst for Balance Sheet & P&L
 */
export function generateRuleBasedFinancialStatementsAdvice(
  userQuery: string,
  statementsData: any
): string {
  const query = (userQuery || "").toLowerCase();
  const bs = statementsData?.balanceSheet || {};
  const pl = statementsData?.plStatement || {};
  const profile = statementsData?.profile || {};
  const ledgers = statementsData?.ledgers || [];

  const fmt = (n: number) => "₹ " + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const rev = pl.revenueFromOperations || 0;
  const pat = pl.profitAfterTax || 0;
  const pbt = pl.profitBeforeTax || 0;
  const totAssets = bs.totalAssets || 0;
  const totEquityLiab = bs.totalEquityAndLiabilities || 0;
  const bsDiff = bs.bsDiff || Math.abs(totAssets - totEquityLiab) || 0;
  const isBalanced = bs.isBsBalanced ?? (bsDiff < 1);
  const curAssets = bs.totalCurrentAssets || 0;
  const curLiab = bs.totalCurrentLiabilities || 0;
  const currentRatio = curLiab > 0 ? (curAssets / curLiab).toFixed(2) : "N/A";
  const msmeDues = bs.msmePayablesTotal || 0;
  const netMargin = rev > 0 ? ((pat / rev) * 100).toFixed(2) : "0.00";

  // 1. Difference / Imbalance in Balance Sheet query
  if (
    query.includes("difference") ||
    query.includes("imbalance") ||
    query.includes("not match") ||
    query.includes("tally") ||
    query.includes("why is there a difference") ||
    query.includes("balance sheet difference") ||
    query.includes("not balancing")
  ) {
    if (isBalanced) {
      return `### ⚖️ Balance Sheet Equilibrium Status: PERFECTLY BALANCED!
      
Congratulations! Your Balance Sheet is in **complete double-entry equilibrium**:
* **Total Assets:** ${fmt(totAssets)}
* **Total Equity & Liabilities:** ${fmt(totEquityLiab)}
* **Difference:** ₹ 0.00 (Balanced)

#### 🔍 Why it is balanced:
1. Every debit entry across your ${ledgers.length} ledger accounts has a corresponding credit entry.
2. The current period's **Net Profit After Tax (PAT) of ${fmt(pat)}** has been properly transferred into **Other Equity (Reserves & Surplus)** under Ind AS 1.
3. Owner's Drawings (if any) are deducted against equity rather than leaving floating balances.
4. Total Resources (Assets) exactly equal Total Claims (Equity + Liabilities).`;
    }

    return `### ⚠️ Balance Sheet Imbalance Analysis & CA Diagnostic

Your draft Balance Sheet currently has an imbalance of **${fmt(bsDiff)}**:
* **Total Assets:** ${fmt(totAssets)}
* **Total Equity & Liabilities:** ${fmt(totEquityLiab)}
* **Variance / Net Difference:** ${fmt(bsDiff)} (${totAssets > totEquityLiab ? "Assets exceed Liabilities" : "Liabilities exceed Assets"})

---

#### 🔍 Root Causes for Balance Sheet Differences in Double-Entry Accounting:

1. **Unlinked Net Profit After Tax (PAT):**
   * In double-entry accounting, the Profit & Loss statement is closed to Equity.
   * If your current period PAT of **${fmt(pat)}** is not credited to **Reserves & Surplus / Retained Earnings** (or if a loss is not debited), the Balance Sheet will be off by that exact amount.

2. **Trial Balance Asymmetry (Debit ≠ Credit):**
   * In your trial balance, the sum of all debit balances must equal the sum of all credit balances.
   * Check if any transaction had only one leg recorded (e.g., Cash debited without crediting Customer, or Purchase debited without Vendor).

3. **Owner's Drawings Treatment:**
   * Drawings of **${fmt(bs.totalDrawings || 0)}** are a *Contra-Equity* item (reducing Owner Capital).
   * If drawings were posted as an asset instead of deducted from capital, it inflates assets and creates a mismatch.

4. **Closing Stock / Inventory Adjustment:**
   * If Closing Stock of **${fmt(bs.inventoryTotal || 0)}** is shown on the Assets side, ensure it was credited to Trading / P&L (or reduced from Cost of Materials Consumed).

5. **Customer Advances (Ind AS 115):**
   * Unearned advances must be credited to *Contract Liabilities* (Current Liabilities), not direct revenue.

---

#### 🛠️ Recommended Action to Fix the Difference:
- If the difference is a legacy opening balance discrepancy, record a balancing entry to the **Owner's Capital / Partner's Current Account** or a **Suspense Account**:
  - **Debit:** Suspense / Balancing Adjustment A/c — ${fmt(bsDiff)}
  - **Credit:** Owner Capital A/c — ${fmt(bsDiff)}
- Or click **"Import Trial Balance"** above to automatically upload your verified trial balance spreadsheet from Tally or Zoho Books!`;
  }

  // 2. Profit & Loss / Margin query
  if (
    query.includes("profit") ||
    query.includes("p&l") ||
    query.includes("margin") ||
    query.includes("revenue") ||
    query.includes("income") ||
    query.includes("turnover") ||
    query.includes("loss")
  ) {
    return `### 📈 Profit & Loss Performance Breakdown (Ind AS 1)

Here is a financial review of your operating performance for FY 2025-26:

| Financial Metric | Amount | % of Revenue |
| :--- | :---: | :---: |
| **Revenue from Operations** | ${fmt(rev)} | 100.00% |
| **Other Income** | ${fmt(pl.otherIncome || 0)} | ${rev > 0 ? (((pl.otherIncome || 0) / rev) * 100).toFixed(1) : 0}% |
| **Cost of Materials / Direct Purchases** | ${fmt(pl.costOfMaterials || 0)} | ${rev > 0 ? (((pl.costOfMaterials || 0) / rev) * 100).toFixed(1) : 0}% |
| **Employee Benefits Expense** | ${fmt(pl.employeeBenefits || 0)} | ${rev > 0 ? (((pl.employeeBenefits || 0) / rev) * 100).toFixed(1) : 0}% |
| **Finance Costs (Bank Interest)** | ${fmt(pl.financeCosts || 0)} | ${rev > 0 ? (((pl.financeCosts || 0) / rev) * 100).toFixed(1) : 0}% |
| **Depreciation & Amortisation** | ${fmt(pl.depreciationExpense || 0)} | ${rev > 0 ? (((pl.depreciationExpense || 0) / rev) * 100).toFixed(1) : 0}% |
| **Other Operating Expenses** | ${fmt(pl.otherExpenses || 0)} | ${rev > 0 ? (((pl.otherExpenses || 0) / rev) * 100).toFixed(1) : 0}% |
| **Profit Before Tax (PBT)** | ${fmt(pbt)} | ${rev > 0 ? ((pbt / rev) * 100).toFixed(1) : 0}% |
| **Total Tax Expense** | ${fmt(pl.totalTaxExpense || 0)} | ${rev > 0 ? (((pl.totalTaxExpense || 0) / rev) * 100).toFixed(1) : 0}% |
| **Net Profit After Tax (PAT)** | **${fmt(pat)}** | **${netMargin}%** |

#### 💡 CA Key Insights:
* **Net Margin Health:** Your net profit margin is **${netMargin}%**. For ${profile.entityType || "small businesses"}, a margin above 10-15% indicates healthy profitability.
* **Cost Drivers:** Your employee benefits represent ${rev > 0 ? (((pl.employeeBenefits || 0) / rev) * 100).toFixed(1) : 0}% and operating overheads represent ${rev > 0 ? (((pl.otherExpenses || 0) / rev) * 100).toFixed(1) : 0}% of turnover.`;
  }

  // 3. Working Capital & Liquidity query
  if (
    query.includes("working capital") ||
    query.includes("current ratio") ||
    query.includes("liquidity") ||
    query.includes("cash") ||
    query.includes("debtor") ||
    query.includes("receivable")
  ) {
    const netWorkingCapital = curAssets - curLiab;
    return `### 💧 Working Capital & Liquidity Analysis

* **Total Current Assets:** ${fmt(curAssets)}
* **Total Current Liabilities:** ${fmt(curLiab)}
* **Net Working Capital (CA - CL):** ${fmt(netWorkingCapital)}
* **Current Ratio:** **${currentRatio} : 1** (Standard Benchmark in India: 1.33:1 to 2:1)

#### 📊 Liquid Components:
* **Cash & Bank Balances:** ${fmt((bs.cashTotal || 0) + (bs.bankTotal || 0))}
* **Trade Receivables (Sundry Debtors):** ${fmt(bs.tradeReceivablesTotal || 0)}
* **Inventories:** ${fmt(bs.inventoryTotal || 0)}
* **Statutory & Tax Assets (TDS / Advance Tax):** ${fmt(bs.currentTaxAssetsTotal || 0)}

#### 💡 Liquidity Assessment:
${
  parseFloat(currentRatio) >= 1.33
    ? `✅ **Strong Liquidity:** Your Current Ratio of ${currentRatio} indicates that you have sufficient current assets to cover short-term debts and vendor commitments comfortably.`
    : `⚠️ **Working Capital Attention Needed:** Your Current Ratio of ${currentRatio} is below the 1.33 benchmark. Monitor debtor collections and avoid locking short-term funds into fixed assets.`
}`;
  }

  // 4. MSME 43B(h) & Tax Audit Compliance
  if (
    query.includes("msme") ||
    query.includes("43b") ||
    query.includes("tax") ||
    query.includes("audit") ||
    query.includes("compliance") ||
    query.includes("tds")
  ) {
    return `### 🇮🇳 Statutory Audit & Tax Compliance Review

1. **Section 43B(h) MSME Mandate (High Risk):**
   * Current recorded MSME Trade Payables: **${fmt(msmeDues)}**.
   * Under Section 43B(h) of the Income Tax Act, payments to registered Micro and Small enterprises must be settled within **15 days** (or agreed terms up to **45 days**).
   * **Tax Impact:** Any amount remaining unpaid past 45 days as of 31st March is **disallowed as an expense** in this FY, artificially raising taxable income and tax liability!

2. **Section 40A(3) Cash Restriction:**
   * Ensure no expense or vendor payment exceeding **₹10,000** in a single day is made via cash. Always use UPI, NEFT, RTGS, or Account Payee cheques.

3. **Advance Tax & Form 26AS Matching:**
   * Current Tax Assets (TDS Receivable / Advance Tax): **${fmt(bs.currentTaxAssetsTotal || 0)}**.
   * Cross-reference this amount against your **Form 26AS** and **Annual Information Statement (AIS)** on the Income Tax Portal before filing ITR.

4. **Ind AS 115 Contract Liabilities:**
   * Customer advances of **${fmt(bs.otherCurrentLiabilitiesTotal || 0)}** must remain in current liabilities until service delivery or invoice issuance.`;
  }

  // Default general financial assistant reply
  return `### 📊 Munim AI Financial Statement Overview

Here is a summary of your financial position:
* **Entity Type:** ${profile.entityType || "Business"} (${profile.accountingBasis || "Accrual Basis"})
* **Turnover (Revenue):** ${fmt(rev)}
* **Net Profit After Tax (PAT):** ${fmt(pat)} (Net Margin: ${netMargin}%)
* **Total Assets:** ${fmt(totAssets)}
* **Total Equity & Liabilities:** ${fmt(totEquityLiab)}
* **Equilibrium:** ${isBalanced ? "✅ Perfectly Balanced (Diff: ₹0)" : `⚠️ Imbalance of ${fmt(bsDiff)}`}

Ask me anything about:
- *"Why is there a difference in my Balance Sheet and how to fix it?"*
- *"Detailed Profit & Loss expense analysis"*
- *"Current Ratio & Working Capital health"*
- *"Section 43B(h) MSME compliance & tax audit flags"*`;
}

