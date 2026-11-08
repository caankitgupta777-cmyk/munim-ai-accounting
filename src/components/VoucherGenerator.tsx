import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Calculator,
  Check,
  AlertCircle,
  ArrowRight,
  Camera,
  Receipt,
  X,
  Image as ImageIcon,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { BusinessProfile, StructuredVoucher, ScannedReceiptData } from "../types";
import { JournalTable } from "./JournalTable";
import { ReceiptScanner } from "./ReceiptScanner";
import { logQueryToDatabase } from "../services/queryDatabase";
import { validateAndEnforceVoucher } from "../services/voucherValidator";
import { getAuthToken } from "../lib/firebase";

interface VoucherGeneratorProps {
  profile: BusinessProfile;
  initialData?: {
    taxableAmount?: number;
    gstRate?: number;
    isInterState?: boolean;
    hsnCode?: string;
    description?: string;
  } | null;
  onClearInitialData?: () => void;
}

export const VoucherGenerator: React.FC<VoucherGeneratorProps> = ({
  profile,
  initialData,
  onClearInitialData,
}) => {
  // Form State
  const [transactionType, setTransactionType] = useState<string>("purchase-fixed-asset");
  const [description, setDescription] = useState<string>("Purchase of office computers for accounts department");
  const [partyName, setPartyName] = useState<string>("Dell India Pvt Ltd");
  const [amount, setAmount] = useState<number>(100000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [gstType, setGstType] = useState<"intra" | "inter">("intra");
  const [tdsSection, setTdsSection] = useState<string>("none");
  const [paymentMode, setPaymentMode] = useState<"bank" | "credit" | "cash">("bank");

  // Populate from external initialData (e.g. Quick GST Calculator)
  React.useEffect(() => {
    if (initialData) {
      if (initialData.taxableAmount !== undefined) setAmount(initialData.taxableAmount);
      if (initialData.gstRate !== undefined) setGstRate(initialData.gstRate);
      if (initialData.isInterState !== undefined) setGstType(initialData.isInterState ? "inter" : "intra");
      if (initialData.description || initialData.hsnCode) {
        const desc = initialData.description || "Supply of Goods/Services";
        const hsnText = initialData.hsnCode ? ` [HSN/SAC: ${initialData.hsnCode}]` : "";
        setDescription(`${desc}${hsnText}`);
        setPartyName(`Vendor / Party (HSN ${initialData.hsnCode || ""})`);
      }
      if (onClearInitialData) {
        onClearInitialData();
      }
    }
  }, [initialData, onClearInitialData]);

  const [generatedVoucher, setGeneratedVoucher] = useState<StructuredVoucher | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to output display whenever a voucher is generated
  useEffect(() => {
    if (generatedVoucher && outputRef.current) {
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [generatedVoucher]);

  // Camera Receipt Scanner State
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [scannedReceiptNotice, setScannedReceiptNotice] = useState<string | null>(null);
  const [scannedReceiptImage, setScannedReceiptImage] = useState<string | null>(null);
  const [showReceiptImageModal, setShowReceiptImageModal] = useState<boolean>(false);

  // Quick preset templates
  const applyTemplate = (type: string) => {
    setTransactionType(type);
    if (type === "purchase-fixed-asset") {
      setDescription("Purchase of office computers for accounts department");
      setPartyName("Dell India Pvt Ltd");
      setAmount(100000);
      setGstRate(18);
      setGstType("intra");
      setTdsSection("none");
      setPaymentMode("bank");
    } else if (type === "rent-expense") {
      setDescription("Monthly commercial office rent for corporate office");
      setPartyName("Mr. Rajesh Sharma (Landlord)");
      setAmount(60000);
      setGstRate(18);
      setGstType("intra");
      setTdsSection("194I-rent-10");
      setPaymentMode("bank");
    } else if (type === "professional-fees") {
      setDescription("Legal advisory & Chartered Accountant professional consultation");
      setPartyName("Gupta & Associates, CAs");
      setAmount(50000);
      setGstRate(18);
      setGstType("intra");
      setTdsSection("194J-prof-10");
      setPaymentMode("credit");
    } else if (type === "sale-services") {
      setDescription("Software consulting and technical support services billed to client");
      setPartyName("Apex Global Tech Solutions");
      setAmount(200000);
      setGstRate(18);
      setGstType("inter");
      setTdsSection("194J-prof-10");
      setPaymentMode("bank");
    } else if (type === "msme-purchase") {
      setDescription("Raw materials procured from registered Micro Enterprise under Sec 43B(h)");
      setPartyName("Shree Ram Packaging (Udyam Micro)");
      setAmount(150000);
      setGstRate(18);
      setGstType("intra");
      setTdsSection("none");
      setPaymentMode("credit");
    } else if (type === "customer-advance") {
      setDescription("Customer advance received for future software delivery under Ind AS 115");
      setPartyName("Pinnacle Enterprises");
      setAmount(118000);
      setGstRate(18);
      setGstType("intra");
      setTdsSection("none");
      setPaymentMode("bank");
    } else if (type === "provision-audit-fees") {
      setDescription("Year-end provision for statutory audit fees under Ind AS 37 with TDS");
      setPartyName("Statutory Auditors (Provision)");
      setAmount(60000);
      setGstRate(0);
      setGstType("intra");
      setTdsSection("194J-prof-10");
      setPaymentMode("credit");
    } else if (type === "provision-income-tax") {
      setDescription("Provision for current income tax liability for FY ended 31st March");
      setPartyName("Income Tax Department (Provision)");
      setAmount(125000);
      setGstRate(0);
      setGstType("intra");
      setTdsSection("none");
      setPaymentMode("credit");
    } else if (type === "provision-doubtful-debts") {
      setDescription("Provision for doubtful debts / Expected Credit Loss allowance under Ind AS 109");
      setPartyName("Sundry Debtors (Allowance)");
      setAmount(75000);
      setGstRate(0);
      setGstType("intra");
      setTdsSection("none");
      setPaymentMode("credit");
    }
  };

  // Local fallback calculation engine if offline or for immediate preview
  const generateInstantPreview = () => {
    const baseAmount = Number(amount) || 0;
    const rate = Number(gstRate) || 0;
    const gstTotal = (baseAmount * rate) / 100;
    const cgst = gstType === "intra" ? gstTotal / 2 : 0;
    const sgst = gstType === "intra" ? gstTotal / 2 : 0;
    const igst = gstType === "inter" ? gstTotal : 0;

    let tdsRateVal = 0;
    let tdsSecLabel = "None";
    if (tdsSection === "194C-contractor-1") {
      tdsRateVal = 1;
      tdsSecLabel = "194C (1% Ind/HUF) / Sec 393";
    } else if (tdsSection === "194C-contractor-2") {
      tdsRateVal = 2;
      tdsSecLabel = "194C (2% Firm/Co) / Sec 393";
    } else if (tdsSection === "194J-prof-10") {
      tdsRateVal = 10;
      tdsSecLabel = "194J (10% Prof) / Sec 393";
    } else if (tdsSection === "194J-tech-2") {
      tdsRateVal = 2;
      tdsSecLabel = "194J (2% Tech) / Sec 393";
    } else if (tdsSection === "194I-rent-10") {
      tdsRateVal = 10;
      tdsSecLabel = "194I (10% Land/Bldg) / Sec 393";
    } else if (tdsSection === "194I-machine-2") {
      tdsRateVal = 2;
      tdsSecLabel = "194I (2% Plant/Mach) / Sec 393";
    } else if (tdsSection === "194H-comm-5") {
      tdsRateVal = 5;
      tdsSecLabel = "194H (5% Comm) / Sec 393";
    }

    // TDS is calculated strictly on base value excluding GST as per Circular No. 23/2017
    const tdsAmount = (baseAmount * tdsRateVal) / 100;

    let entries: any[] = [];
    let voucherType = "Journal Voucher";
    let plainSummary = "";
    let narration = "";
    let indAs = {
      standardCode: "Ind AS 1",
      title: "Presentation of Financial Statements",
      keyPrinciple: "Accrual basis of accounting applied.",
    };
    let taxRule = "General Income Tax rules apply.";

    if (transactionType === "purchase-fixed-asset") {
      voucherType = "Purchase / Asset Voucher";
      plainSummary = `You purchased office capital equipment for ₹${baseAmount.toLocaleString("en-IN")}. GST of ₹${gstTotal.toLocaleString("en-IN")} is claimed as Input Tax Credit (ITC) under Section 16, and the net payment goes from your Bank.`;
      indAs = {
        standardCode: "Ind AS 16",
        title: "Property, Plant and Equipment (PPE)",
        keyPrinciple: "Capitalize purchase price into Asset account. Do not capitalize GST if ITC is claimed.",
      };
      taxRule = "Depreciation under Income Tax Act Section 32 (40% block for computers) will apply at year-end.";

      entries.push({
        accountName: "Office Computers & Laptops A/c",
        category: "Asset",
        debitAmount: baseAmount,
        creditAmount: 0,
        reason: "Ind AS 16: Capital asset coming into business (Real A/c - Debit what comes in)",
      });

      if (gstType === "intra") {
        entries.push({
          accountName: "Input CGST A/c",
          category: "Asset",
          debitAmount: cgst,
          creditAmount: 0,
          reason: "Section 16 CGST Act: Input credit available to set off against output GST",
        });
        entries.push({
          accountName: "Input SGST A/c",
          category: "Asset",
          debitAmount: sgst,
          creditAmount: 0,
          reason: "Section 16 SGST Act: State GST input tax credit",
        });
      } else if (igst > 0) {
        entries.push({
          accountName: "Input IGST A/c",
          category: "Asset",
          debitAmount: igst,
          creditAmount: 0,
          reason: "Section 16 IGST Act: Integrated GST input credit on interstate supply",
        });
      }

      const totalPayable = baseAmount + gstTotal;
      entries.push({
        accountName: paymentMode === "bank" ? "HDFC / Current Bank A/c" : `${partyName} (Creditor)`,
        category: paymentMode === "bank" ? "Asset" : "Liability",
        debitAmount: 0,
        creditAmount: totalPayable,
        reason: paymentMode === "bank" ? "Money going out of bank (Real A/c - Credit what goes out)" : "Personal A/c - Credit the giver / vendor",
      });

      narration = `Being purchase of ${description} from ${partyName} vide Tax Invoice, GST ITC claimed under Sec 16 and payment settled via ${paymentMode.toUpperCase()}.`;
    } else if (transactionType === "rent-expense" || transactionType === "professional-fees") {
      voucherType = "Payment Voucher";
      const isRent = transactionType === "rent-expense";
      plainSummary = `You booked ${isRent ? "office rent" : "professional fees"} of ₹${baseAmount.toLocaleString("en-IN")}. GST of ₹${gstTotal.toLocaleString("en-IN")} is added, TDS of ₹${tdsAmount.toLocaleString("en-IN")} is deducted as a liability to pay the Govt by 7th next month, and net ₹${(baseAmount + gstTotal - tdsAmount).toLocaleString("en-IN")} is paid/credited.`;
      
      indAs = {
        standardCode: isRent ? "Ind AS 116 / Ind AS 1" : "Ind AS 1",
        title: isRent ? "Leases & Operating Expense" : "Presentation of Financial Statements",
        keyPrinciple: isRent ? "Short-term / small-business rent expensed on straight-line basis." : "Recognize expense in the period services are consumed.",
      };
      taxRule = isRent
        ? "TDS u/s 194I (ITA 1961) / Sec 393 (ITA 2025) mandatory if annual rent > ₹2.4 Lakhs. CBDT Circular 23/2017: TDS deducted on base amount excluding GST. Non-deduction disallowance: Sec 40(a)(ia) / Sec 35."
        : "TDS u/s 194J (ITA 1961) / Sec 393 (ITA 2025) mandatory if professional fees > ₹30,000 in FY. Failure to deduct attracts 30% expense disallowance u/s 40(a)(ia) [ITA 1961] / Sec 35 [ITA 2025].";

      entries.push({
        accountName: isRent ? "Office Rent Expense A/c" : "Legal & Professional Charges A/c",
        category: "Expense",
        debitAmount: baseAmount,
        creditAmount: 0,
        reason: "Nominal Account: Debit all expenses and losses",
      });

      if (gstType === "intra" && cgst > 0) {
        entries.push({
          accountName: "Input CGST A/c",
          category: "Asset",
          debitAmount: cgst,
          creditAmount: 0,
          reason: "ITC eligible under Section 16 for commercial premises / services",
        });
        entries.push({
          accountName: "Input SGST A/c",
          category: "Asset",
          debitAmount: sgst,
          creditAmount: 0,
          reason: "State GST input credit",
        });
      } else if (igst > 0) {
        entries.push({
          accountName: "Input IGST A/c",
          category: "Asset",
          debitAmount: igst,
          creditAmount: 0,
          reason: "Interstate IGST input credit",
        });
      }

      if (tdsAmount > 0) {
        entries.push({
          accountName: `TDS Payable u/s ${tdsSecLabel} A/c`,
          category: "Liability",
          debitAmount: 0,
          creditAmount: tdsAmount,
          reason: "Current Liability: Statutory deduction deposited to Govt via Challan 281 by 7th of next month",
        });
      }

      const netToParty = baseAmount + gstTotal - tdsAmount;
      entries.push({
        accountName: paymentMode === "bank" ? "Bank Current A/c" : `${partyName} (Creditor)`,
        category: paymentMode === "bank" ? "Asset" : "Liability",
        debitAmount: 0,
        creditAmount: netToParty,
        reason: paymentMode === "bank" ? "Net payment made via Bank transfer" : "Net amount payable to vendor",
      });

      narration = `Being ${isRent ? "rent" : "professional charges"} booked for ${description}, GST added, TDS deducted u/s ${tdsSecLabel} [ITA 2025: Sec 393] and net settled.`;
    } else if (transactionType === "provision-audit-fees" || description.toLowerCase().includes("provision for audit") || description.toLowerCase().includes("audit fee provision")) {
      voucherType = "Journal Voucher";
      plainSummary = `Recorded year-end provision for audit fees of ₹${baseAmount.toLocaleString("en-IN")}. Deducted TDS of ₹${tdsAmount.toLocaleString("en-IN")} u/s ${tdsSecLabel}, and credited Provision for Audit Fees of ₹${(baseAmount - tdsAmount).toLocaleString("en-IN")} under Ind AS 37.`;
      indAs = {
        standardCode: "Ind AS 37 / AS 29",
        title: "Provisions, Contingent Liabilities and Contingent Assets",
        keyPrinciple: "A provision is recognized when there is a present obligation as a result of past events, probable outflow, and reliable estimate.",
      };
      taxRule = "TDS u/s 194J (ITA 1961) / Sec 393 (ITA 2025) is mandatory at time of credit to provision account if payee is identifiable. Disallowance of 30% u/s 40(a)(ia) / Sec 35 applies if omitted. Deposit TDS by 30th April via Challan 281.";

      entries.push({
        accountName: "Statutory Audit Fees Expense A/c",
        category: "Expense",
        debitAmount: baseAmount,
        creditAmount: 0,
        reason: "Nominal Account: Debit expense incurred for current year audit under Accrual Concept",
      });

      if (tdsAmount > 0) {
        entries.push({
          accountName: `TDS Payable u/s ${tdsSecLabel} A/c`,
          category: "Liability",
          debitAmount: 0,
          creditAmount: tdsAmount,
          reason: "Current Liability: Statutory tax deduction deposited by 30th April via Challan 281",
        });
        entries.push({
          accountName: "Provision for Audit Fees A/c",
          category: "Liability",
          debitAmount: 0,
          creditAmount: baseAmount - tdsAmount,
          reason: "Current Liability: Net amount provided for year-end settlement upon CA invoice receipt",
        });
      } else {
        entries.push({
          accountName: "Provision for Audit Fees A/c",
          category: "Liability",
          debitAmount: 0,
          creditAmount: baseAmount,
          reason: "Current Liability: Short-term provision for audit fees as per Ind AS 37",
        });
      }
      narration = `Being year-end provision made for statutory audit fees for FY ended 31st March, TDS deducted u/s ${tdsSecLabel} as per Ind AS 37.`;
    } else if (transactionType === "provision-income-tax" || description.toLowerCase().includes("provision for tax") || description.toLowerCase().includes("income tax provision")) {
      voucherType = "Journal Voucher";
      plainSummary = `Recorded provision for current income tax of ₹${baseAmount.toLocaleString("en-IN")} under Ind AS 12 / AS 22 based on estimated taxable profits.`;
      indAs = {
        standardCode: "Ind AS 12 / AS 22",
        title: "Income Taxes",
        keyPrinciple: "Current tax for current and prior periods shall be recognized as a liability to the extent unpaid.",
      };
      taxRule = "Computed on taxable income after Chapter VI-A deductions. Settled on filing ITR against Advance Tax (Challan 280) and TDS credit.";

      entries.push({
        accountName: "Current Tax Expense (P&L)",
        category: "Expense",
        debitAmount: baseAmount,
        creditAmount: 0,
        reason: "Nominal Account: Charge estimated current income tax against current year accounting profit",
      });
      entries.push({
        accountName: "Provision for Income Tax A/c",
        category: "Liability",
        debitAmount: 0,
        creditAmount: baseAmount,
        reason: "Current Liability: Short-term provision for income tax payable to Government until ITR assessment",
      });
      narration = `Being provision for current year income tax created for the financial year ended 31st March as per Ind AS 12 / AS 22.`;
    } else if (transactionType === "provision-doubtful-debts" || description.toLowerCase().includes("doubtful debt") || description.toLowerCase().includes("bad debt provision")) {
      voucherType = "Journal Voucher";
      plainSummary = `Created provision for doubtful debts / ECL allowance of ₹${baseAmount.toLocaleString("en-IN")} under Ind AS 109 / AS 29 to reflect trade receivables at net realisable value.`;
      indAs = {
        standardCode: "Ind AS 109 / AS 29",
        title: "Financial Instruments - Expected Credit Loss (ECL)",
        keyPrinciple: "Recognize loss allowance for expected credit losses on trade receivables under the Prudence Concept.",
      };
      taxRule = "Crucial Section 36(1)(vii) rule: Mere provision is NOT deductible for Income Tax until actual write-off against debtor account. Creates Deferred Tax Asset (DTA) under Ind AS 12.";

      entries.push({
        accountName: "Provision for Doubtful Debts (P&L)",
        category: "Expense",
        debitAmount: baseAmount,
        creditAmount: 0,
        reason: "Nominal Account: Expensed to P&L under Prudence Concept to reflect expected credit loss",
      });
      entries.push({
        accountName: "Provision for Doubtful Debts A/c",
        category: "Asset",
        debitAmount: 0,
        creditAmount: baseAmount,
        reason: "Contra-Asset: Deducted from Sundry Debtors on Balance Sheet to show realistic NRV",
      });
      narration = `Being provision for doubtful debts created for estimated irrecoverable customer receivables as per Ind AS 109 / AS 29.`;
    } else {
      // General Fallback
      voucherType = "Journal Voucher";
      plainSummary = `Transaction for ₹${baseAmount.toLocaleString("en-IN")} recorded with balanced double entry.`;
      entries.push({
        accountName: "Business Expense / Asset A/c",
        category: "Expense",
        debitAmount: baseAmount,
        creditAmount: 0,
        reason: "Debit what comes in / Debit expense",
      });
      if (gstTotal > 0) {
        entries.push({
          accountName: "Input GST (CGST/SGST) A/c",
          category: "Asset",
          debitAmount: gstTotal,
          creditAmount: 0,
          reason: "Input Tax Credit",
        });
      }
      entries.push({
        accountName: paymentMode === "bank" ? "Bank Current A/c" : "Sundry Creditors A/c",
        category: paymentMode === "bank" ? "Asset" : "Liability",
        debitAmount: 0,
        creditAmount: baseAmount + gstTotal,
        reason: "Credit giver / Outflow",
      });
      narration = `Being transaction for ${description} recorded under Indian Accounting Standards.`;
    }

    const totalDebit = entries.reduce((s, e) => s + e.debitAmount, 0);
    const totalCredit = entries.reduce((s, e) => s + e.creditAmount, 0);

    const voucher: StructuredVoucher = {
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
        itcEligible: true,
        itcNote: "ITC eligible under Section 16 subject to vendor reporting in GSTR-2B.",
      },
      tdsBreakdown: {
        applicable: tdsAmount > 0,
        section: tdsSecLabel,
        rate: tdsRateVal,
        tdsAmount,
        challanCode: "281",
        dueDate: "7th of succeeding month",
      },
      indAsReference: indAs,
      incomeTaxRule: taxRule,
    };

    // Run strict deterministic CA validation
    const validatedVoucher = validateAndEnforceVoucher({
      voucher,
      requestParams: {
        description,
        amount: baseAmount,
        gstRate: rate,
        gstType: gstType === "intra" ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)",
        tdsSection,
        partyName,
      },
    });

    setGeneratedVoucher(validatedVoucher);

    // Log voucher generation to query database
    logQueryToDatabase({
      queryType: "voucher",
      title: `Voucher: ${partyName || "Journal"} - ₹${baseAmount.toLocaleString("en-IN")}`,
      queryText: `Description: ${description}, Amount: ₹${baseAmount}, GST: ${rate}% (${gstType}), TDS: ${tdsSecLabel}`,
      resultSummary: validatedVoucher.plainSummary,
      payload: {
        amount: baseAmount,
        gstRate: rate,
        isInterState: gstType === "inter",
        voucherType: validatedVoucher.voucherType,
        totalDebit: validatedVoucher.totalDebit,
        narration: validatedVoucher.narration,
        entriesCount: validatedVoucher.entries.length,
      },
      status: "completed",
      tags: ["voucher", validatedVoucher.voucherType, gstType],
    }).catch((e) => console.warn("Failed to log voucher query:", e));
  };

  // Call Gemini Backend for advanced CA-grade voucher analysis
  const handleGenerateAiVoucher = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/generate-voucher", {
        method: "POST",
        headers,
        body: JSON.stringify({
          description: `${description} (Type: ${transactionType}, Settlement: ${paymentMode})`,
          amount,
          gstRate,
          gstType: gstType === "intra" ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)",
          tdsSection,
          partyName,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const rawData = await res.json();
      // Enforce deterministic validation on AI generated voucher
      const validatedData = validateAndEnforceVoucher({
        voucher: rawData,
        requestParams: {
          description,
          amount,
          gstRate,
          gstType: gstType === "intra" ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)",
          tdsSection,
          partyName,
        },
      });

      setGeneratedVoucher(validatedData);

      // Log AI generated voucher to query database
      logQueryToDatabase({
        queryType: "voucher",
        title: `AI Voucher: ${partyName || "Journal"} - ₹${Number(amount).toLocaleString("en-IN")}`,
        queryText: `AI Analysis for ${description}, Amount: ₹${amount}, GST: ${gstRate}%, TDS: ${tdsSection}`,
        resultSummary: validatedData.plainSummary,
        payload: {
          amount,
          gstRate,
          isInterState: gstType === "inter",
          voucherType: validatedData.voucherType,
          totalDebit: validatedData.totalDebit,
          narration: validatedData.narration,
        },
        status: "completed",
        tags: ["voucher", "ai-voucher", validatedData.voucherType],
      }).catch((e) => console.warn("Failed to log voucher query:", e));
    } catch (err: any) {
      console.warn("AI generation failed, falling back to local calculation:", err);
      generateInstantPreview();
    } finally {
      setLoading(false);
    }
  };

  // Handle population from camera receipt scanner
  const handlePopulateFromScanner = (data: ScannedReceiptData, receiptImage?: string) => {
    setScannedReceiptImage(receiptImage || null);
    setPartyName(data.merchant);

    // Calculate base taxable amount
    const rate = data.gstRate ?? 18;
    const taxable =
      data.taxableAmount && data.taxableAmount > 0
        ? data.taxableAmount
        : rate > 0
        ? Math.round(data.amount / (1 + rate / 100))
        : data.amount;

    setAmount(taxable);
    setGstRate(rate);

    const isInter = data.gstType?.toLowerCase().includes("inter") ?? false;
    setGstType(isInter ? "inter" : "intra");

    const isCash = data.paymentMode === "Cash";
    setPaymentMode(isCash ? "cash" : "bank");

    if (data.tdsSection && data.tdsSection !== "none") {
      setTdsSection(data.tdsSection);
    } else {
      setTdsSection("none");
    }

    const billRef = data.invoiceNumber ? ` vide Bill #${data.invoiceNumber}` : "";
    const cleanAccount = data.suggestedExpenseAccount.replace(" A/c", "");
    const generatedDesc = `${cleanAccount} (${data.category}) from ${data.merchant}${billRef}`;
    setDescription(generatedDesc);

    setScannedReceiptNotice(
      `Receipt from "${data.merchant}" (₹${Number(data.amount).toLocaleString("en-IN")}) on ${data.date} digitized! Form auto-filled and double-entry voucher calculated below.`
    );

    setShowScanner(false);

    // Immediately generate balanced voucher from the digitized data
    const gstTotal = (taxable * rate) / 100;
    const cgst = !isInter ? gstTotal / 2 : 0;
    const sgst = !isInter ? gstTotal / 2 : 0;
    const igst = isInter ? gstTotal : 0;

    const entries: any[] = [];
    entries.push({
      accountName: data.suggestedExpenseAccount,
      category: "Expense",
      debitAmount: taxable,
      creditAmount: 0,
      reason: "Nominal Account: Debit all business expenses incurred",
    });

    if (!isInter && cgst > 0) {
      entries.push({
        accountName: "Input CGST A/c",
        category: "Asset",
        debitAmount: cgst,
        creditAmount: 0,
        reason: "Sec 16 CGST Act: Eligible Input Tax Credit",
      });
      entries.push({
        accountName: "Input SGST A/c",
        category: "Asset",
        debitAmount: sgst,
        creditAmount: 0,
        reason: "Sec 16 SGST Act: State GST input tax credit",
      });
    } else if (igst > 0) {
      entries.push({
        accountName: "Input IGST A/c",
        category: "Asset",
        debitAmount: igst,
        creditAmount: 0,
        reason: "Sec 16 IGST Act: Integrated GST input credit",
      });
    }

    entries.push({
      accountName: isCash ? "Petty Cash A/c" : "Current Bank A/c",
      category: "Asset",
      debitAmount: 0,
      creditAmount: taxable + gstTotal,
      reason: isCash ? "Real A/c: Credit cash paid out" : "Real A/c: Credit bank outflow",
    });

    const voucher: StructuredVoucher = {
      voucherType: isCash ? "Cash Payment Voucher" : "Bank Payment Voucher",
      plainSummary: `Digitized paper receipt from ${data.merchant}. Recorded ₹${taxable.toLocaleString("en-IN")} to ${data.suggestedExpenseAccount} with ₹${gstTotal.toLocaleString("en-IN")} GST, settled via ${data.paymentMode}.`,
      entries,
      totalDebit: taxable + gstTotal,
      totalCredit: taxable + gstTotal,
      narration: `Being ${generatedDesc}, settled via ${data.paymentMode}.`,
      gstBreakdown: {
        taxableValue: taxable,
        cgst,
        sgst,
        igst,
        itcEligible: data.gstin && data.gstin.length === 15 ? true : false,
        itcNote: data.complianceNotes || "Verify invoice in GSTR-2B before claiming ITC.",
      },
      indAsReference: {
        standardCode: "Ind AS 1",
        title: "Presentation of Financial Statements",
        keyPrinciple: "Accrual basis: Recognize expense in the period the goods or services were delivered.",
      },
      incomeTaxRule: data.complianceNotes || "Ensure invoice is retained for 6 years under Section 44AA.",
    };

    setGeneratedVoucher(voucher);
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      {/* Scanner Modal / Drawer when active */}
      {showScanner && (
        <div className="mb-6">
          <ReceiptScanner
            profile={profile}
            onPopulateVoucher={handlePopulateFromScanner}
            onClose={() => setShowScanner(false)}
          />
        </div>
      )}

      {/* Scanned Receipt Success Notice Banner */}
      {scannedReceiptNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-950 text-xs sm:text-sm">
                Receipt Digitized & Auto-Populated
              </span>
              <p className="text-xs text-emerald-800 mt-0.5">{scannedReceiptNotice}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {scannedReceiptImage && (
              <button
                type="button"
                onClick={() => setShowReceiptImageModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>View Receipt</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setScannedReceiptNotice(null);
                setScannedReceiptImage(null);
              }}
              className="p-1 text-emerald-700 hover:text-emerald-900 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Image Modal Preview */}
      {showReceiptImageModal && scannedReceiptImage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <span>Original Scanned Paper Receipt</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowReceiptImageModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="my-3 max-h-[70vh] overflow-y-auto rounded-xl bg-slate-950 flex items-center justify-center p-2">
              <img
                src={scannedReceiptImage}
                alt="Scanned receipt"
                className="max-h-[65vh] w-auto object-contain rounded"
              />
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowReceiptImageModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header and Template Selector */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-700" />
              <span>Indian Double-Entry Voucher Generator</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter any small business transaction or scan a paper bill with your camera to produce a balanced, Tally-ready Dr/Cr voucher.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-scan-receipt"
              onClick={() => setShowScanner(!showScanner)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{showScanner ? "Close Scanner" : "Scan Paper Receipt (Camera)"}</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600 hidden sm:inline">Templates:</span>
              <select
                value={transactionType}
                onChange={(e) => applyTemplate(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 py-1.5 px-2 bg-slate-50 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="purchase-fixed-asset">Laptops / Fixed Asset (Ind AS 16 + GST)</option>
                <option value="rent-expense">Commercial Rent (TDS 194I / Sec 393 + GST)</option>
                <option value="professional-fees">CA / Legal Fee (TDS 194J / Sec 393 + GST)</option>
                <option value="sale-services">Client Invoice (IGST + TDS Receivable)</option>
                <option value="msme-purchase">MSME Vendor Bill (Sec 43B(h) / Sec 35 Rule)</option>
                <option value="customer-advance">Customer Advance (Ind AS 115)</option>
                <option value="provision-audit-fees">Audit Fees Provision (TDS 194J / Sec 393 + Ind AS 37)</option>
                <option value="provision-income-tax">Income Tax Provision (Ind AS 12 / AS 22)</option>
                <option value="provision-doubtful-debts">Provision for Doubtful Debts (Ind AS 109)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Input Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Transaction Description</label>
            <input
              id="input-voucher-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Purchase of office furniture"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Party / Counterparty Name</label>
            <input
              id="input-voucher-party"
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="e.g. ABC Tech Solutions"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Base / Taxable Amount (₹)</label>
            <input
              id="input-voucher-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">GST Rate</label>
            <select
              id="select-gst-rate"
              value={gstRate}
              onChange={(e) => setGstRate(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
            >
              <option value={0}>0% (Nil / Exempted)</option>
              <option value={5}>5% (Transport, Essential goods)</option>
              <option value={12}>12% (Specified goods/services)</option>
              <option value={18}>18% (Standard commercial rate)</option>
              <option value={28}>28% (Luxury / Automobiles)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">GST Supply Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGstType("intra")}
                className={`py-2 px-2 rounded-lg border text-center font-medium transition ${
                  gstType === "intra"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Intra-state (CGST+SGST)
              </button>
              <button
                type="button"
                onClick={() => setGstType("inter")}
                className={`py-2 px-2 rounded-lg border text-center font-medium transition ${
                  gstType === "inter"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Inter-state (IGST)
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">TDS Section (Dual: ITA 1961 / ITA 2025)</label>
              <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-medium">
                Sec 393 Ready
              </span>
            </div>
            <select
              id="select-tds-section"
              value={tdsSection}
              onChange={(e) => setTdsSection(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white font-medium"
            >
              <option value="none">No TDS Applicable</option>
              <option value="194C-contractor-1">Sec 194C: Contractor (1% Ind/HUF) [ITA 2025: Sec 393]</option>
              <option value="194C-contractor-2">Sec 194C: Contractor (2% Co/Firm) [ITA 2025: Sec 393]</option>
              <option value="194J-prof-10">Sec 194J: Professional Fees / CA / Legal (10%) [ITA 2025: Sec 393]</option>
              <option value="194J-tech-2">Sec 194J: Technical Services / IT Call Center (2%) [ITA 2025: Sec 393]</option>
              <option value="194I-rent-10">Sec 194I: Rent on Land / Building (10%) [ITA 2025: Sec 393]</option>
              <option value="194I-machine-2">Sec 194I: Rent on Plant & Machinery (2%) [ITA 2025: Sec 393]</option>
              <option value="194H-comm-5">Sec 194H: Commission or Brokerage (5%) [ITA 2025: Sec 393]</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700">Settlement Method:</span>
              <div className="flex items-center gap-2">
                {[
                  { id: "bank", label: "Bank (NEFT/RTGS/UPI)" },
                  { id: "credit", label: "On Credit (Sundry Creditor/Debtor)" },
                  { id: "cash", label: "Cash (Limit ₹10,000 u/s 40A(3))" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPaymentMode(mode.id as any)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                      paymentMode === mode.id
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-instant-calc"
                type="button"
                onClick={generateInstantPreview}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
              >
                Instant Math Preview
              </button>
              <button
                id="btn-ai-voucher"
                type="button"
                onClick={handleGenerateAiVoucher}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Laws...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate CA-Grade Voucher</span>
                  </>
                )}
              </button>

              {generatedVoucher && (
                <button
                  type="button"
                  onClick={() => outputRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <span>View Calculated Output Below</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generated Voucher Output */}
      {generatedVoucher && (
        <div
          id="voucher-output-display"
          ref={outputRef}
          className="animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-4 pt-2 scroll-mt-6"
        >
          {/* Prominent CA Verification Header */}
          <div className="bg-emerald-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-800 text-emerald-200 shrink-0 mt-0.5">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Double-Entry Journal Voucher (Balanced)
                  </h3>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                    Arithmetic Validated • Review Facts
                  </span>
                </div>
                <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                  {generatedVoucher.plainSummary}
                </p>
                <div className="text-[11px] text-emerald-200/80 mt-1 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Double-entry arithmetic passed. Commercial and statutory facts require professional review before ledger posting.</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="self-end sm:self-center text-xs text-emerald-200 hover:text-white bg-emerald-800/80 hover:bg-emerald-800 px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Back to Form</span>
              <ArrowRight className="w-3.5 h-3.5 -rotate-90" />
            </button>
          </div>

          {/* Render The Complete Journal Voucher Table */}
          <JournalTable voucher={generatedVoucher} />
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Confidence Indicator */}
      <div className="px-3 py-2 bg-[#102A43] rounded-xl border border-[#1E3A56] text-[11px] text-slate-300 text-left flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-cyan-300 font-semibold">✓ Based on available transaction data</span>
          <span className="text-slate-400 hidden sm:inline">• Golden Rules & Schedule III Compliant</span>
        </div>
        <span className="text-slate-400 text-[10px]">
          Statutory disclaimer in footer
        </span>
      </div>
    </div>
  );
};
