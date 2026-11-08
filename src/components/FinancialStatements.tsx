import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Scale, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Download, 
  Copy, 
  Sparkles, 
  Info, 
  Building2, 
  BookOpen, 
  RotateCcw,
  Check,
  Search,
  ExternalLink,
  ChevronDown,
  Upload,
  FileDown,
  Loader2,
  FileText,
  X
} from "lucide-react";
import { BusinessProfile, LedgerAccountInput, IndAsClassification } from "../types";
import { 
  IND_AS_CLASSIFICATIONS_META, 
  PRESET_SERVICE_SME, 
  PRESET_TRADING_MSME 
} from "../data/sampleLedgerPresets";
import {
  exportFinancialStatementsToExcel,
  exportFinancialStatementsToPdf
} from "../services/financialStatementsExporter";
import { TrialBalanceImportModal } from "./TrialBalanceImportModal";
import { FinancialStatementsAiChat } from "./FinancialStatementsAiChat";
import { logQueryToDatabase } from "../services/queryDatabase";

interface FinancialStatementsProps {
  profile: BusinessProfile;
  onConsultAdvisor?: (prompt: string) => void;
}

export const FinancialStatements: React.FC<FinancialStatementsProps> = ({ 
  profile, 
  onConsultAdvisor 
}) => {
  // Ledger accounts state
  const [ledgers, setLedgers] = useState<LedgerAccountInput[]>(PRESET_SERVICE_SME);
  const [activeView, setActiveView] = useState<"statements" | "ledger" | "ai-analyst">("statements");
  const [statementSubView, setStatementSubView] = useState<"all" | "tb" | "bs" | "pl" | "cf">("all");
  const [selectedFY, setSelectedFY] = useState<string>("2024-25");
  const [reportingDate, setReportingDate] = useState<string>("2025-03-31");
  const [statutoryFormat, setStatutoryFormat] = useState<"div2" | "div1" | "msme">("div2");
  const [copied, setCopied] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | null>(null);

  // Import and Export state
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState<boolean>(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | null>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Close download menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    if (showDownloadMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDownloadMenu]);

  // New account form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newAccName, setNewAccName] = useState<string>("");
  const [newAccClass, setNewAccClass] = useState<IndAsClassification>("PPE (Property, Plant & Equipment - Ind AS 16)");
  const [newAccType, setNewAccType] = useState<"Debit" | "Credit">("Debit");
  const [newAccAmount, setNewAccAmount] = useState<number>(0);
  const [newAccNotes, setNewAccNotes] = useState<string>("");

  // Handler to load preset
  const handleLoadPreset = (presetKey: "service" | "trading" | "empty") => {
    if (presetKey === "service") {
      setLedgers(PRESET_SERVICE_SME);
    } else if (presetKey === "trading") {
      setLedgers(PRESET_TRADING_MSME);
    } else {
      setLedgers([]);
    }
  };

  // Add new account
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim() || newAccAmount <= 0) return;

    const newAccount: LedgerAccountInput = {
      id: `led-${Date.now()}`,
      accountName: newAccName.trim(),
      classification: newAccClass,
      balanceType: newAccType,
      amount: newAccAmount,
      notes: newAccNotes.trim() || undefined,
    };

    setLedgers([...ledgers, newAccount]);
    setNewAccName("");
    setNewAccAmount(0);
    setNewAccNotes("");
    setShowAddForm(false);
  };

  // Delete account
  const handleDeleteAccount = (id: string) => {
    setLedgers(ledgers.filter((acc) => acc.id !== id));
  };

  // Update account balance
  const handleUpdateAmount = (id: string, newAmt: number) => {
    setLedgers(
      ledgers.map((acc) => (acc.id === id ? { ...acc, amount: Math.max(0, newAmt) } : acc))
    );
  };

  // -------------------------------------------------------------
  // Trial Balance & Mathematical Verification
  // -------------------------------------------------------------
  const trialBalance = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    ledgers.forEach((acc) => {
      if (acc.balanceType === "Debit") {
        totalDebit += acc.amount;
      } else {
        totalCredit += acc.amount;
      }
    });

    const diff = Math.abs(totalDebit - totalCredit);
    const isBalanced = diff < 1;

    return {
      totalDebit,
      totalCredit,
      diff,
      isBalanced,
    };
  }, [ledgers]);

  // -------------------------------------------------------------
  // Ind AS Statement of Profit & Loss Computations (Ind AS 1)
  // -------------------------------------------------------------
  const plStatement = useMemo(() => {
    // 1. Revenue from Operations
    const revAccounts = ledgers.filter(
      (a) => a.classification === "Revenue from Operations (Sales / Services - Ind AS 115)"
    );
    const revenueFromOperations = revAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Credit" ? a.amount : -a.amount),
      0
    );

    // 2. Other Income
    const otherIncomeAccounts = ledgers.filter(
      (a) => a.classification === "Other Income (Interest / Discounts / Forex)"
    );
    const otherIncome = otherIncomeAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Credit" ? a.amount : -a.amount),
      0
    );

    const totalIncome = revenueFromOperations + otherIncome;

    // 3. Expenses Breakdown
    const costMaterialsAccounts = ledgers.filter(
      (a) => a.classification === "Cost of Materials Consumed / Purchases (Ind AS 2)"
    );
    const costOfMaterials = costMaterialsAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const employeeBenefitsAccounts = ledgers.filter(
      (a) => a.classification === "Employee Benefits Expense (Salaries / Wages - Ind AS 19)"
    );
    const employeeBenefits = employeeBenefitsAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const financeCostsAccounts = ledgers.filter(
      (a) => a.classification === "Finance Costs (Bank Interest / Loan Processing - Ind AS 23)"
    );
    const financeCosts = financeCostsAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const depreciationAccounts = ledgers.filter(
      (a) => a.classification === "Depreciation and Amortisation Expense (Ind AS 16 / 38)"
    );
    const depreciationExpense = depreciationAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const otherExpensesAccounts = ledgers.filter(
      (a) =>
        a.classification === "Other Operating Expenses (Rent, Professional Fees, Utilities)"
    );
    const otherExpenses = otherExpensesAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const totalExpenses =
      costOfMaterials +
      employeeBenefits +
      financeCosts +
      depreciationExpense +
      otherExpenses;

    // 4. Profit Before Tax
    const profitBeforeTax = totalIncome - totalExpenses;

    // 5. Tax Expense
    const currentTaxAccounts = ledgers.filter(
      (a) => a.classification === "Current Tax Expense (Ind AS 12)"
    );
    const currentTaxExpense = currentTaxAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const deferredTaxAccounts = ledgers.filter(
      (a) => a.classification === "Deferred Tax Expense / (Income) (Ind AS 12)"
    );
    const deferredTaxExpense = deferredTaxAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const totalTaxExpense = currentTaxExpense + deferredTaxExpense;

    // 6. Profit After Tax (PAT) / Total Comprehensive Income for the period
    const profitAfterTax = profitBeforeTax - totalTaxExpense;

    return {
      revenueFromOperations,
      revAccounts,
      otherIncome,
      otherIncomeAccounts,
      totalIncome,
      costOfMaterials,
      costMaterialsAccounts,
      employeeBenefits,
      employeeBenefitsAccounts,
      financeCosts,
      financeCostsAccounts,
      depreciationExpense,
      depreciationAccounts,
      otherExpenses,
      otherExpensesAccounts,
      totalExpenses,
      profitBeforeTax,
      currentTaxExpense,
      deferredTaxExpense,
      totalTaxExpense,
      profitAfterTax,
    };
  }, [ledgers]);

  // -------------------------------------------------------------
  // Ind AS Balance Sheet Computations (Schedule III Division II)
  // -------------------------------------------------------------
  const balanceSheet = useMemo(() => {
    // A. Non-Current Assets
    const ppeAccounts = ledgers.filter(
      (a) => a.classification === "PPE (Property, Plant & Equipment - Ind AS 16)"
    );
    const ppeTotal = ppeAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const rouAccounts = ledgers.filter(
      (a) => a.classification === "Right-of-Use Assets (Ind AS 116)"
    );
    const rouTotal = rouAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const intangibleAccounts = ledgers.filter(
      (a) => a.classification === "Intangible Assets (Ind AS 38)"
    );
    const intangibleTotal = intangibleAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const nonCurrentInvestmentsAccounts = ledgers.filter(
      (a) => a.classification === "Non-Current Investments & Financial Assets"
    );
    const nonCurrentInvestmentsTotal = nonCurrentInvestmentsAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const totalNonCurrentAssets =
      ppeTotal + rouTotal + intangibleTotal + nonCurrentInvestmentsTotal;

    // B. Current Assets
    const inventoryAccounts = ledgers.filter(
      (a) => a.classification === "Inventories (Ind AS 2)"
    );
    const inventoryTotal = inventoryAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const tradeReceivablesAccounts = ledgers.filter(
      (a) => a.classification === "Trade Receivables (Sundry Debtors)"
    );
    const tradeReceivablesTotal = tradeReceivablesAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const cashAccounts = ledgers.filter(
      (a) => a.classification === "Cash and Cash Equivalents"
    );
    const cashTotal = cashAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const bankAccounts = ledgers.filter(
      (a) => a.classification === "Bank Balances (Current / Savings)"
    );
    const bankTotal = bankAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const currentTaxAssetAccounts = ledgers.filter(
      (a) => a.classification === "Current Tax Assets (TDS Receivable / Advance Tax)"
    );
    const currentTaxAssetsTotal = currentTaxAssetAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const otherCurrentAssetsAccounts = ledgers.filter(
      (a) =>
        a.classification === "Other Current Assets (Input GST Credit / Prepaid Expenses)"
    );
    const otherCurrentAssetsTotal = otherCurrentAssetsAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const totalCurrentAssets =
      inventoryTotal +
      tradeReceivablesTotal +
      cashTotal +
      bankTotal +
      currentTaxAssetsTotal +
      otherCurrentAssetsTotal;

    const totalAssets = totalNonCurrentAssets + totalCurrentAssets;

    // C. Equity
    const capitalAccounts = ledgers.filter(
      (a) => a.classification === "Equity Share Capital / Owner's Capital"
    );
    const baseCapital = capitalAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Credit" ? a.amount : -a.amount),
      0
    );

    const drawingsAccounts = ledgers.filter(
      (a) => a.classification === "Owner's Drawings (Contra-Equity)"
    );
    const totalDrawings = drawingsAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Debit" ? a.amount : -a.amount),
      0
    );

    const openingReservesAccounts = ledgers.filter(
      (a) =>
        a.classification === "Other Equity (Reserves & Surplus / Retained Earnings)"
    );
    const openingReserves = openingReservesAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Credit" ? a.amount : -a.amount),
      0
    );

    // Retained Earnings incorporates Current Period PAT
    const totalOtherEquity = openingReserves + plStatement.profitAfterTax - totalDrawings;
    const totalEquity = baseCapital + totalOtherEquity;

    // D. Non-Current Liabilities
    const longTermBorrowingsAccounts = ledgers.filter(
      (a) => a.classification === "Long-Term Borrowings (Term Loans)"
    );
    const longTermBorrowingsTotal = longTermBorrowingsAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Credit" ? a.amount : -a.amount),
      0
    );

    const deferredTaxLiabilityAccounts = ledgers.filter(
      (a) => a.classification === "Deferred Tax Liabilities (Net) (Ind AS 12)"
    );
    const deferredTaxLiabilitiesTotal = deferredTaxLiabilityAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Credit" ? a.amount : -a.amount),
      0
    );

    const nonCurrentLeaseAccounts = ledgers.filter(
      (a) => a.classification === "Lease Liabilities - Non-Current (Ind AS 116)"
    );
    const nonCurrentLeaseTotal = nonCurrentLeaseAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Credit" ? a.amount : -a.amount),
      0
    );

    const totalNonCurrentLiabilities =
      longTermBorrowingsTotal +
      deferredTaxLiabilitiesTotal +
      nonCurrentLeaseTotal;

    // E. Current Liabilities
    const shortTermBorrowingsAccounts = ledgers.filter(
      (a) => a.classification === "Short-Term Borrowings / Bank Overdraft"
    );
    const shortTermBorrowingsTotal = shortTermBorrowingsAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Credit" ? a.amount : -a.amount),
      0
    );

    const msmePayablesAccounts = ledgers.filter(
      (a) => a.classification === "Trade Payables (MSME Vendors - Sec 43B(h))"
    );
    const msmePayablesTotal = msmePayablesAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Credit" ? a.amount : -a.amount),
      0
    );

    const otherCreditorsAccounts = ledgers.filter(
      (a) => a.classification === "Trade Payables (Other Creditors)"
    );
    const otherCreditorsTotal = otherCreditorsAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Credit" ? a.amount : -a.amount),
      0
    );

    const otherCurrentLiabilitiesAccounts = ledgers.filter(
      (a) =>
        a.classification ===
        "Other Current Liabilities (Contract Liabilities / Customer Advances Ind AS 115)"
    );
    const otherCurrentLiabilitiesTotal = otherCurrentLiabilitiesAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Credit" ? a.amount : -a.amount),
      0
    );

    const statutoryDuesAccounts = ledgers.filter(
      (a) => a.classification === "Statutory Dues Payable (Output GST / TDS Payable / PF)"
    );
    const statutoryDuesTotal = statutoryDuesAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Credit" ? a.amount : -a.amount),
      0
    );

    const currentTaxLiabilityAccounts = ledgers.filter(
      (a) => a.classification === "Current Tax Liabilities (Provision for Income Tax)"
    );
    const currentTaxLiabilityTotal = currentTaxLiabilityAccounts.reduce(
      (sum, a) => sum + (a.balanceType === "Credit" ? a.amount : -a.amount),
      0
    );

    const totalCurrentLiabilities =
      shortTermBorrowingsTotal +
      msmePayablesTotal +
      otherCreditorsTotal +
      otherCurrentLiabilitiesTotal +
      statutoryDuesTotal +
      currentTaxLiabilityTotal;

    const totalEquityAndLiabilities =
      totalEquity + totalNonCurrentLiabilities + totalCurrentLiabilities;

    const bsDiff = Math.abs(totalAssets - totalEquityAndLiabilities);
    const isBsBalanced = bsDiff < 1;

    return {
      ppeTotal,
      ppeAccounts,
      rouTotal,
      intangibleTotal,
      nonCurrentInvestmentsTotal,
      totalNonCurrentAssets,
      inventoryTotal,
      tradeReceivablesTotal,
      tradeReceivablesAccounts,
      cashTotal,
      bankTotal,
      currentTaxAssetsTotal,
      otherCurrentAssetsTotal,
      totalCurrentAssets,
      totalAssets,
      baseCapital,
      totalDrawings,
      openingReserves,
      totalOtherEquity,
      totalEquity,
      longTermBorrowingsTotal,
      deferredTaxLiabilitiesTotal,
      nonCurrentLeaseTotal,
      totalNonCurrentLiabilities,
      shortTermBorrowingsTotal,
      msmePayablesTotal,
      msmePayablesAccounts,
      otherCreditorsTotal,
      otherCurrentLiabilitiesTotal,
      statutoryDuesTotal,
      currentTaxLiabilityTotal,
      totalCurrentLiabilities,
      totalEquityAndLiabilities,
      bsDiff,
      isBsBalanced,
    };
  }, [ledgers, plStatement]);

  // -------------------------------------------------------------
  // Ind AS Statement of Cash Flows (Ind AS 7 / AS 3 Indirect Method)
  // -------------------------------------------------------------
  const cashFlowStatement = useMemo(() => {
    // A. Cash Flows from Operating Activities
    const pbt = plStatement.profitBeforeTax;
    const depreciation = plStatement.depreciationExpense;
    const financeCosts = plStatement.financeCosts;
    const operatingProfitBeforeWC = pbt + depreciation + financeCosts;

    // Working Capital changes (increase in current assets is outflow; increase in current liabilities is inflow)
    const inventoryChange = -balanceSheet.inventoryTotal;
    const receivablesChange = -balanceSheet.tradeReceivablesTotal;
    const otherAssetsChange = -balanceSheet.otherCurrentAssetsTotal;
    const payablesChange = balanceSheet.msmePayablesTotal + balanceSheet.otherCreditorsTotal;
    const otherLiabilitiesChange = balanceSheet.otherCurrentLiabilitiesTotal + balanceSheet.statutoryDuesTotal;

    const workingCapitalAdjustments =
      inventoryChange + receivablesChange + otherAssetsChange + payablesChange + otherLiabilitiesChange;

    const cashGeneratedFromOperations = operatingProfitBeforeWC + workingCapitalAdjustments;
    // Taxes paid (Current tax asset / advance tax + TDS)
    const taxesPaid = balanceSheet.currentTaxAssetsTotal > 0 ? balanceSheet.currentTaxAssetsTotal : plStatement.currentTaxExpense;
    const netCashFromOperating = cashGeneratedFromOperations - taxesPaid;

    // B. Cash Flows from Investing Activities
    const ppeCapex = -balanceSheet.ppeTotal;
    const otherInvestments = -balanceSheet.nonCurrentInvestmentsTotal;
    const netCashFromInvesting = ppeCapex + otherInvestments;

    // C. Cash Flows from Financing Activities
    const capitalIntroduced = balanceSheet.baseCapital;
    const drawings = -balanceSheet.totalDrawings;
    const borrowings = balanceSheet.longTermBorrowingsTotal + balanceSheet.shortTermBorrowingsTotal;
    const financeChargesPaid = -financeCosts;
    const netCashFromFinancing = capitalIntroduced + drawings + borrowings + financeChargesPaid;

    // Net Increase / Decrease in Cash and Cash Equivalents
    const netChangeInCash = netCashFromOperating + netCashFromInvesting + netCashFromFinancing;
    const closingCashAndBank = balanceSheet.cashTotal + balanceSheet.bankTotal;
    const openingCashAndBank = closingCashAndBank - netChangeInCash;

    return {
      pbt,
      depreciation,
      financeCosts,
      operatingProfitBeforeWC,
      workingCapitalAdjustments,
      cashGeneratedFromOperations,
      taxesPaid,
      netCashFromOperating,
      ppeCapex,
      otherInvestments,
      netCashFromInvesting,
      capitalIntroduced,
      drawings,
      borrowings,
      financeChargesPaid,
      netCashFromFinancing,
      netChangeInCash,
      openingCashAndBank,
      closingCashAndBank,
    };
  }, [plStatement, balanceSheet]);

  // Copy full statement text
  const handleCopyStatements = () => {
    const text = `
DRAFT FINANCIAL STATEMENTS IN COMPLIANCE WITH IND AS (SCHEDULE III DIVISION II)
Entity: ${profile.entityType} | Basis: ${profile.accountingBasis}
=================================================================================

PART I: STATEMENT OF PROFIT AND LOSS
---------------------------------------------------------------------------------
I.   Revenue from Operations (Ind AS 115) ................. ₹ ${plStatement.revenueFromOperations.toLocaleString("en-IN")}
II.  Other Income ......................................... ₹ ${plStatement.otherIncome.toLocaleString("en-IN")}
III. TOTAL INCOME (I + II) ................................ ₹ ${plStatement.totalIncome.toLocaleString("en-IN")}

IV.  EXPENSES:
     - Cost of Materials Consumed / Purchases (Ind AS 2) .. ₹ ${plStatement.costOfMaterials.toLocaleString("en-IN")}
     - Employee Benefits Expense (Ind AS 19) .............. ₹ ${plStatement.employeeBenefits.toLocaleString("en-IN")}
     - Finance Costs (Ind AS 23) .......................... ₹ ${plStatement.financeCosts.toLocaleString("en-IN")}
     - Depreciation & Amortisation Expense (Ind AS 16) .... ₹ ${plStatement.depreciationExpense.toLocaleString("en-IN")}
     - Other Operating Expenses ........................... ₹ ${plStatement.otherExpenses.toLocaleString("en-IN")}
     TOTAL EXPENSES ....................................... ₹ ${plStatement.totalExpenses.toLocaleString("en-IN")}

V.   PROFIT BEFORE TAX (III - IV) ......................... ₹ ${plStatement.profitBeforeTax.toLocaleString("en-IN")}
VI.  Tax Expense (Ind AS 12):
     - Current Tax ........................................ ₹ ${plStatement.currentTaxExpense.toLocaleString("en-IN")}
     - Deferred Tax ....................................... ₹ ${plStatement.deferredTaxExpense.toLocaleString("en-IN")}
VII. PROFIT FOR THE PERIOD (PAT) .......................... ₹ ${plStatement.profitAfterTax.toLocaleString("en-IN")}

=================================================================================
PART II: BALANCE SHEET (EQUITY & LIABILITIES / ASSETS)
---------------------------------------------------------------------------------
I. ASSETS:
1. Non-Current Assets:
   - Property, Plant and Equipment (Ind AS 16) ............ ₹ ${balanceSheet.ppeTotal.toLocaleString("en-IN")}
   - Right-of-Use Assets (Ind AS 116) ..................... ₹ ${balanceSheet.rouTotal.toLocaleString("en-IN")}
   - Intangibles & Other Financial Assets ................. ₹ ${balanceSheet.nonCurrentInvestmentsTotal.toLocaleString("en-IN")}
   Total Non-Current Assets ............................... ₹ ${balanceSheet.totalNonCurrentAssets.toLocaleString("en-IN")}

2. Current Assets:
   - Inventories (Ind AS 2) ............................... ₹ ${balanceSheet.inventoryTotal.toLocaleString("en-IN")}
   - Trade Receivables (Sundry Debtors) ................... ₹ ${balanceSheet.tradeReceivablesTotal.toLocaleString("en-IN")}
   - Cash and Cash Equivalents ............................ ₹ ${balanceSheet.cashTotal.toLocaleString("en-IN")}
   - Bank Balances ........................................ ₹ ${balanceSheet.bankTotal.toLocaleString("en-IN")}
   - Current Tax Assets (TDS Receivable / Advance Tax) .... ₹ ${balanceSheet.currentTaxAssetsTotal.toLocaleString("en-IN")}
   - Other Current Assets (Input GST Credit) .............. ₹ ${balanceSheet.otherCurrentAssetsTotal.toLocaleString("en-IN")}
   Total Current Assets ................................... ₹ ${balanceSheet.totalCurrentAssets.toLocaleString("en-IN")}

TOTAL ASSETS .............................................. ₹ ${balanceSheet.totalAssets.toLocaleString("en-IN")}

II. EQUITY AND LIABILITIES:
1. Equity:
   - Equity Share Capital / Owner Capital ................. ₹ ${balanceSheet.baseCapital.toLocaleString("en-IN")}
   - Other Equity (Reserves + Current Period PAT) ......... ₹ ${balanceSheet.totalOtherEquity.toLocaleString("en-IN")}
   Total Equity ........................................... ₹ ${balanceSheet.totalEquity.toLocaleString("en-IN")}

2. Non-Current Liabilities:
   - Long-Term Borrowings (Term Loans) .................... ₹ ${balanceSheet.longTermBorrowingsTotal.toLocaleString("en-IN")}
   - Other Non-Current Liabilities (Ind AS 12 / 116) ...... ₹ ${(balanceSheet.deferredTaxLiabilitiesTotal + balanceSheet.nonCurrentLeaseTotal).toLocaleString("en-IN")}
   Total Non-Current Liabilities .......................... ₹ ${balanceSheet.totalNonCurrentLiabilities.toLocaleString("en-IN")}

3. Current Liabilities:
   - Short-Term Borrowings / CC ........................... ₹ ${balanceSheet.shortTermBorrowingsTotal.toLocaleString("en-IN")}
   - Trade Payables to Micro & Small Enterprises (43B(h)) . ₹ ${balanceSheet.msmePayablesTotal.toLocaleString("en-IN")}
   - Trade Payables to Other Creditors .................... ₹ ${balanceSheet.otherCreditorsTotal.toLocaleString("en-IN")}
   - Other Current Liabilities (Customer Advances 115) .... ₹ ${balanceSheet.otherCurrentLiabilitiesTotal.toLocaleString("en-IN")}
   - Statutory Dues Payable (GST / TDS / PF) .............. ₹ ${balanceSheet.statutoryDuesTotal.toLocaleString("en-IN")}
   - Current Tax Liabilities (Provision for Tax) .......... ₹ ${balanceSheet.currentTaxLiabilityTotal.toLocaleString("en-IN")}
   Total Current Liabilities .............................. ₹ ${balanceSheet.totalCurrentLiabilities.toLocaleString("en-IN")}

TOTAL EQUITY AND LIABILITIES .............................. ₹ ${balanceSheet.totalEquityAndLiabilities.toLocaleString("en-IN")}
Status: ${balanceSheet.isBsBalanced ? "BALANCED" : `IMBALANCE: ₹ ${balanceSheet.bsDiff.toLocaleString("en-IN")}`}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskAdvisorAboutStatements = () => {
    if (!onConsultAdvisor) return;
    const prompt = `Review my draft Ind AS Financial Statements:
- Gross Revenue: ₹${plStatement.revenueFromOperations.toLocaleString("en-IN")}
- Net Profit After Tax (PAT): ₹${plStatement.profitAfterTax.toLocaleString("en-IN")}
- Total Assets: ₹${balanceSheet.totalAssets.toLocaleString("en-IN")}
- Total Equity: ₹${balanceSheet.totalEquity.toLocaleString("en-IN")}
- MSME Trade Payables (Sec 43B(h)): ₹${balanceSheet.msmePayablesTotal.toLocaleString("en-IN")}
- TDS Receivable: ₹${balanceSheet.currentTaxAssetsTotal.toLocaleString("en-IN")}

Please provide:
1. A Chartered Accountant analysis of my financial ratios (EBITDA margin, Current Ratio, Debt-Equity).
2. Ind AS 115, Ind AS 16, and Section 43B(h) MSME compliance notes to be disclosed in the Annual Report.
3. Advance tax and year-end ITR reconciliation steps.`;
    onConsultAdvisor(prompt);
  };

  // Export to PDF
  const handleExportPdf = () => {
    setExportingType("pdf");
    try {
      exportFinancialStatementsToPdf({
        profile,
        plStatement,
        balanceSheet,
        ledgers,
      });
      logQueryToDatabase({
        queryType: "financials",
        title: `Exported Financial Statements PDF (${profile.entityType})`,
        queryText: `Generated draft Ind AS Financial Statements PDF with ${ledgers.length} ledgers. Net PAT: ₹${plStatement.profitAfterTax.toLocaleString("en-IN")}. Total Assets: ₹${balanceSheet.totalAssets.toLocaleString("en-IN")}.`,
        resultSummary: "Exported draft Balance Sheet and P&L statement as PDF.",
        status: "completed",
        payload: {
          exportType: "pdf",
          totalAssets: balanceSheet.totalAssets,
          pat: plStatement.profitAfterTax,
        },
      });
    } catch (err: any) {
      console.error("PDF export error:", err);
    } finally {
      setExportingType(null);
      setShowDownloadMenu(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    setExportingType("excel");
    try {
      exportFinancialStatementsToExcel({
        profile,
        plStatement,
        balanceSheet,
        ledgers,
      });
      logQueryToDatabase({
        queryType: "financials",
        title: `Exported Financial Statements Excel (${profile.entityType})`,
        queryText: `Generated draft Ind AS Financial Statements Excel (.xlsx) with ${ledgers.length} ledgers.`,
        resultSummary: "Exported draft Balance Sheet, P&L, and Trial Balance as Excel spreadsheet.",
        status: "completed",
        payload: {
          exportType: "excel",
          totalAssets: balanceSheet.totalAssets,
          pat: plStatement.profitAfterTax,
        },
      });
    } catch (err: any) {
      console.error("Excel export error:", err);
    } finally {
      setExportingType(null);
      setShowDownloadMenu(false);
    }
  };

  // Import Trial Balance handler
  const handleImportTrialBalance = (
    importedAccounts: LedgerAccountInput[],
    mode: "replace" | "append"
  ) => {
    if (mode === "replace") {
      setLedgers(importedAccounts);
    } else {
      setLedgers((prev) => [...prev, ...importedAccounts]);
    }

    const msg = `Successfully imported ${importedAccounts.length} ledger accounts! Draft Financial Statements have been prepared.`;
    setImportNotification(msg);
    setTimeout(() => setImportNotification(null), 6000);

    logQueryToDatabase({
      queryType: "financials",
      title: `Imported Trial Balance (${importedAccounts.length} Ledgers)`,
      queryText: `Imported trial balance in ${mode} mode with ${importedAccounts.length} accounts. Prepared Ind AS financial statements.`,
      resultSummary: `Calculated Revenue: ₹${plStatement.revenueFromOperations}, PAT: ₹${plStatement.profitAfterTax}, Assets: ₹${balanceSheet.totalAssets}.`,
      status: "completed",
      payload: {
        accountCount: importedAccounts.length,
        mode,
      },
    });
  };

  // Filtered ledgers for table view
  const filteredLedgers = useMemo(() => {
    if (!searchFilter.trim()) return ledgers;
    const q = searchFilter.toLowerCase();
    return ledgers.filter(
      (a) =>
        a.accountName.toLowerCase().includes(q) ||
        a.classification.toLowerCase().includes(q) ||
        (a.notes && a.notes.toLowerCase().includes(q))
    );
  }, [ledgers, searchFilter]);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Ind AS Balance Sheet & Profit & Loss Statement Engine
                </h2>
                <p className="text-xs text-slate-500">
                  Compliant with <strong>Schedule III (Division II)</strong> and Indian Accounting Standards (Ind AS 1, 16, 115, 12).
                </p>
              </div>
            </div>
          </div>

          {/* Quick presets and view toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveView("statements")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeView === "statements"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Financial Statements
              </button>
              <button
                onClick={() => setActiveView("ledger")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeView === "ledger"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Ledger Accounts ({ledgers.length})
              </button>
              <button
                onClick={() => setActiveView("ai-analyst")}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === "ai-analyst"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI Statement Analyst</span>
                {!balanceSheet.isBsBalanced && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" title="Imbalance in Balance sheet" />
                )}
              </button>
            </div>

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-xs"
              title="Import Trial Balance from Excel (.xlsx), CSV, or Tally export"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-700" />
              <span>Import Trial Balance</span>
            </button>

            {/* Download Report Dropdown Button */}
            <div className="relative" ref={downloadMenuRef}>
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                disabled={Boolean(exportingType)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-60 cursor-pointer"
                title="Download draft Balance Sheet and P&L Report as PDF or Excel"
              >
                {exportingType ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>
                  {exportingType === "pdf"
                    ? "Generating PDF..."
                    : exportingType === "excel"
                    ? "Building Excel..."
                    : "Download Report"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showDownloadMenu && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-30 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                    <span>Export Formats</span>
                    <span className="text-emerald-700 font-normal">Ind AS Compliant</span>
                  </div>

                  <button
                    onClick={handleExportPdf}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/70 flex items-start gap-2.5 text-slate-800 transition cursor-pointer group"
                  >
                    <div className="p-2 rounded-xl bg-rose-100 text-rose-700 group-hover:bg-rose-200 transition mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <span>Download as PDF</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-rose-50 text-rose-700 rounded font-semibold border border-rose-200">.pdf</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Schedule III Division II Balance Sheet & P&L with Audit & Tax Notes
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportExcel}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/70 flex items-start gap-2.5 text-slate-800 transition border-t border-slate-100 cursor-pointer group"
                  >
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200 transition mt-0.5">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <span>Download as Excel</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-800 rounded font-semibold border border-emerald-200">.xlsx</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Multi-sheet workbook: Balance Sheet, Profit & Loss, Trial Balance & Notes
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleCopyStatements}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied Draft!" : "Copy Report"}</span>
            </button>

            {onConsultAdvisor && (
              <button
                onClick={handleAskAdvisorAboutStatements}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold transition shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>Ask Munim AI</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time Trial Balance Equilibrium Indicator */}
        <div className={`mt-4 p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          trialBalance.isBalanced 
            ? "bg-emerald-50/70 border-emerald-200 text-emerald-900" 
            : "bg-amber-50/70 border-amber-300 text-amber-950"
        }`}>
          <div className="flex items-center gap-2">
            {trialBalance.isBalanced ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {trialBalance.isBalanced
                  ? "Trial Balance in Perfect Equilibrium: "
                  : "Trial Balance Imbalance Detected: "}
              </span>
              <span>
                Total Debit = <strong>₹{trialBalance.totalDebit.toLocaleString("en-IN")}</strong> | Total Credit = <strong>₹{trialBalance.totalCredit.toLocaleString("en-IN")}</strong>
              </span>
              {!trialBalance.isBalanced && (
                <span className="block sm:inline sm:ml-2 text-rose-700 font-semibold">
                  (Difference: ₹{trialBalance.diff.toLocaleString("en-IN")})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-500">Presets:</span>
            <button
              onClick={() => handleLoadPreset("service")}
              className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700"
            >
              Services SME
            </button>
            <button
              onClick={() => handleLoadPreset("trading")}
              className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700"
            >
              Trading MSME
            </button>
            <button
              onClick={() => handleLoadPreset("empty")}
              className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 text-rose-600"
            >
              Clear
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-[11px] font-bold flex items-center gap-1 shadow-2xs"
              title="Import Trial Balance spreadsheet"
            >
              <Upload className="w-3 h-3 text-emerald-200" />
              <span>Import TB</span>
            </button>
          </div>
        </div>
      </div>

      {/* Import Notification Banner */}
      {importNotification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{importNotification}</span>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-emerald-100/50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* VIEW 1: FINANCIAL STATEMENTS VIEW */}
      {activeView === "statements" && (
        <div className="space-y-6">
          {/* 5-Level CA Financial Audit Diagnostic Bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                  <Sparkles className="w-3 h-3" />
                  <span>Chartered Accountant 5-Level Audit & Balance Diagnostics</span>
                </div>
                <h4 className="text-sm font-bold text-slate-100 mt-1">
                  Financial Statement Audit Assurance & Equilibrium Engine
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  balanceSheet.isBsBalanced && trialBalance.isBalanced && !ledgers.some(l => l.reviewRequired || l.accountName.toLowerCase().includes("suspense"))
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}>
                  {balanceSheet.isBsBalanced && trialBalance.isBalanced && !ledgers.some(l => l.reviewRequired || l.accountName.toLowerCase().includes("suspense"))
                    ? "✓ CA Audit-Ready"
                    : "⚠️ Audit Review In Progress"}
                </span>
                <button
                  onClick={() => {
                    setChatInitialPrompt(
                      balanceSheet.isBsBalanced
                        ? "Please conduct a comprehensive 5-level CA diagnostic of my Balance Sheet, P&L, and Equity breakdown."
                        : `Why is there a difference of ₹${balanceSheet.bsDiff.toLocaleString("en-IN")} in my Balance Sheet? Please analyze my assets vs liabilities & equity, identify the root causes, and give me the exact adjusting journal entries to fix it.`
                    );
                    setActiveView("ai-analyst");
                  }}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Audit Diagnostics</span>
                </button>
              </div>
            </div>

            {/* 5 Levels Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-3.5 text-xs">
              {/* Level 1: Mathematical Equilibrium */}
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Level 1: Math Balance</span>
                  {balanceSheet.isBsBalanced ? (
                    <span className="text-emerald-400 font-bold">✓ Pass</span>
                  ) : (
                    <span className="text-amber-400 font-bold">⚠️ Diff</span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  {balanceSheet.isBsBalanced ? "Assets = Liab + Equity" : `Diff: ₹${balanceSheet.bsDiff.toLocaleString("en-IN")}`}
                </div>
                <p className="text-[10px] text-slate-400">
                  {balanceSheet.isBsBalanced ? "Arithmetic equilibrium confirmed" : "Double-entry imbalance detected"}
                </p>
              </div>

              {/* Level 2: Trial Balance Equilibrium */}
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Level 2: Trial Balance</span>
                  {trialBalance.isBalanced ? (
                    <span className="text-emerald-400 font-bold">✓ Pass</span>
                  ) : (
                    <span className="text-amber-400 font-bold">⚠️ Imbalance</span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  {trialBalance.isBalanced ? "Dr = Cr Balanced" : `Dr ≠ Cr (₹${trialBalance.diff.toLocaleString("en-IN")})`}
                </div>
                <p className="text-[10px] text-slate-400">
                  Source ledger equilibrium
                </p>
              </div>

              {/* Level 3: Classification Validation */}
              {(() => {
                const suspenseOrReview = ledgers.filter(l => l.reviewRequired || l.accountName.toLowerCase().includes("suspense"));
                const hasSuspense = suspenseOrReview.length > 0;
                return (
                  <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Level 3: Classification</span>
                      {!hasSuspense ? (
                        <span className="text-emerald-400 font-bold">✓ Verified</span>
                      ) : (
                        <span className="text-amber-400 font-bold">⚠️ {suspenseOrReview.length} Review</span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-200">
                      {!hasSuspense ? "Zero Suspense A/c" : `${suspenseOrReview.length} Ambiguous Heads`}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Ind AS head taxonomy
                    </p>
                  </div>
                );
              })()}

              {/* Level 4: Tax Reconciled */}
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Level 4: Tax Reconciled</span>
                  <span className="text-emerald-400 font-bold">✓ Aligned</span>
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  TDS & GST Mapped
                </div>
                <p className="text-[10px] text-slate-400">
                  Form 26AS/AIS & GSTR-2B
                </p>
              </div>

              {/* Level 5: Schedule III / Ind AS Sign-Off */}
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Level 5: Ind AS Presentation</span>
                  <span className="text-indigo-300 font-bold">Division II</span>
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  Schedule III Ready
                </div>
                <p className="text-[10px] text-slate-400">
                  Vertical format presentation
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Financial Year & Statutory Reporting Control Bar */}
          <div className="bg-white rounded-xl p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700">Financial Year:</span>
                <select
                  value={selectedFY}
                  onChange={(e) => setSelectedFY(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 font-semibold focus:outline-none focus:border-emerald-600"
                >
                  <option value="2023-24">FY 2023-24 (AY 2024-25)</option>
                  <option value="2024-25">FY 2024-25 (AY 2025-26)</option>
                  <option value="2025-26">FY 2025-26 (AY 2026-27)</option>
                  <option value="2026-27">FY 2026-27 (Income Tax Act 2025)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700">As at Date:</span>
                <input
                  type="date"
                  value={reportingDate}
                  onChange={(e) => setReportingDate(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 font-semibold focus:outline-none focus:border-emerald-600 text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700">Schedule Format:</span>
                <select
                  value={statutoryFormat}
                  onChange={(e) => setStatutoryFormat(e.target.value as any)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 font-medium focus:outline-none focus:border-emerald-600 text-xs"
                >
                  <option value="div2">Schedule III Div II (Ind AS)</option>
                  <option value="div1">Schedule III Div I (Indian GAAP / AS)</option>
                  <option value="msme">Non-Corporate MSME Format</option>
                </select>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              Entity: <strong>{profile.entityType}</strong> • {profile.accountingBasis}
            </div>
          </div>

          {/* Sub-view Filter Pills */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setStatementSubView("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  statementSubView === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Combined View
              </button>
              <button
                onClick={() => setStatementSubView("pl")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  statementSubView === "pl"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Profit & Loss (P&L)
              </button>
              <button
                onClick={() => setStatementSubView("bs")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  statementSubView === "bs"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Balance Sheet
              </button>
              <button
                onClick={() => setStatementSubView("cf")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  statementSubView === "cf"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Cash Flow Statement (Ind AS 7)
              </button>
              <button
                onClick={() => setStatementSubView("tb")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  statementSubView === "tb"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Trial Balance Detail
              </button>
            </div>

            <button
              onClick={() => setActiveView("ledger")}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Edit Ledgers ({ledgers.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* PART I: STATEMENT OF PROFIT & LOSS */}
          {(statementSubView === "all" || statementSubView === "pl") && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                    Ind AS 1 & Schedule III Part II
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    Statement of Profit and Loss for the Period
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-mono">Figures in Indian Rupees (₹)</span>
                  <span className="text-xs font-bold text-slate-700">
                    Net Margin: {plStatement.totalIncome > 0 ? ((plStatement.profitAfterTax / plStatement.totalIncome) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              {/* P&L Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[580px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3 text-left w-12">Sr.</th>
                      <th className="py-2.5 px-3 text-left">Particulars / Line Item</th>
                      <th className="py-2.5 px-3 text-left w-36">Ind AS Standard</th>
                      <th className="py-2.5 px-3 text-right w-44">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                    {/* I. Revenue */}
                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2.5 px-3 font-bold text-slate-500">I</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        Revenue from Operations (Gross Contract Billing)
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 115</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        ₹{plStatement.revenueFromOperations.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* II. Other Income */}
                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2.5 px-3 font-bold text-slate-500">II</td>
                      <td className="py-2.5 px-3">Other Income (Interest, Discounts & Forex)</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500">Other</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        ₹{plStatement.otherIncome.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* III. Total Income */}
                    <tr className="bg-emerald-50/40 font-sans font-bold text-emerald-950 border-t-2 border-b-2 border-emerald-100">
                      <td className="py-2.5 px-3">III</td>
                      <td className="py-2.5 px-3">TOTAL INCOME (I + II)</td>
                      <td className="py-2.5 px-3 text-[11px] text-emerald-700">Gross Inflow</td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm text-emerald-900">
                        ₹{plStatement.totalIncome.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* IV. Expenses header */}
                    <tr className="bg-slate-100/60 font-sans font-semibold text-slate-700">
                      <td className="py-2 px-3">IV</td>
                      <td colSpan={3} className="py-2 px-3 uppercase tracking-wider text-[11px]">
                        EXPENSES:
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans pl-4">
                      <td className="py-2 px-3 text-slate-400">(a)</td>
                      <td className="py-2 px-3">Cost of Materials Consumed / Direct Sub-contracting</td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 2</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{plStatement.costOfMaterials.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(b)</td>
                      <td className="py-2 px-3">Employee Benefits Expense (Salaries, Bonus, PF)</td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 19</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{plStatement.employeeBenefits.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(c)</td>
                      <td className="py-2 px-3">Finance Costs (Loan Interest, CC Charges)</td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 23</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{plStatement.financeCosts.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(d)</td>
                      <td className="py-2 px-3">Depreciation and Amortisation Expense</td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 16 / 38</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{plStatement.depreciationExpense.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(e)</td>
                      <td className="py-2 px-3">Other Operating Expenses (Rent, Software, Utilities)</td>
                      <td className="py-2 px-3 text-[11px] text-slate-500">Operating</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{plStatement.otherExpenses.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* Total Expenses */}
                    <tr className="bg-rose-50/30 font-sans font-bold text-rose-950 border-t border-b border-rose-100">
                      <td className="py-2 px-3"></td>
                      <td className="py-2 px-3">TOTAL EXPENSES</td>
                      <td className="py-2 px-3 text-[11px] text-rose-700">Gross Outflow</td>
                      <td className="py-2 px-3 text-right font-mono text-sm text-rose-900">
                        ₹{plStatement.totalExpenses.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* V. Profit Before Tax */}
                    <tr className="hover:bg-slate-50 font-sans font-bold">
                      <td className="py-2.5 px-3 text-slate-500">V</td>
                      <td className="py-2.5 px-3 text-slate-900">
                        PROFIT / (LOSS) BEFORE TAX (PBT) (III - IV)
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500">Operating PBT</td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm text-indigo-900">
                        ₹{plStatement.profitBeforeTax.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* VI. Tax Expense */}
                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">VI</td>
                      <td className="py-2 px-3">
                        Tax Expense: Current Tax (₹{plStatement.currentTaxExpense.toLocaleString("en-IN")}) + Deferred Tax (₹{plStatement.deferredTaxExpense.toLocaleString("en-IN")})
                      </td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 12</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        ₹{plStatement.totalTaxExpense.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* VII. Profit for the period */}
                    <tr className="bg-emerald-100/60 font-sans font-extrabold text-emerald-950 border-t-2 border-b-2 border-emerald-300">
                      <td className="py-3 px-3">VII</td>
                      <td className="py-3 px-3 text-sm">
                        PROFIT / (LOSS) FOR THE PERIOD (PAT)
                      </td>
                      <td className="py-3 px-3 text-xs text-emerald-800">Transferred to Other Equity</td>
                      <td className="py-3 px-3 text-right font-mono text-base text-emerald-950">
                        ₹{plStatement.profitAfterTax.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PART II: BALANCE SHEET */}
          {(statementSubView === "all" || statementSubView === "bs") && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                    Ind AS 1 & Schedule III Part I (Vertical Format)
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    Balance Sheet as at Current Date
                  </h3>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className="text-xs text-slate-400 block font-mono">Figures in Indian Rupees (₹)</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      balanceSheet.isBsBalanced 
                        ? "bg-emerald-100 text-emerald-800" 
                        : "bg-amber-100 text-amber-900 border border-amber-300"
                    }`}>
                      {balanceSheet.isBsBalanced ? "Assets = Equity & Liabilities (Balanced)" : `Imbalance: ₹${balanceSheet.bsDiff.toLocaleString("en-IN")}`}
                    </span>
                    <button
                      onClick={() => {
                        setChatInitialPrompt(
                          balanceSheet.isBsBalanced
                            ? "Please verify why my Balance Sheet is currently in equilibrium and explain the double-entry mechanics connecting my P&L and Balance Sheet."
                            : `Why is there a difference of ₹${balanceSheet.bsDiff.toLocaleString("en-IN")} in my Balance Sheet? Please analyze my assets vs liabilities & equity, identify the root causes, and give me the exact adjusting journal entries to fix it.`
                        );
                        setActiveView("ai-analyst");
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer ${
                        balanceSheet.isBsBalanced
                          ? "bg-emerald-800 hover:bg-emerald-900"
                          : "bg-amber-700 hover:bg-amber-800 animate-pulse"
                      }`}
                      title="Ask AI Chatbot about Balance Sheet"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>{balanceSheet.isBsBalanced ? "Ask AI: Explain" : "Ask AI: Why Diff?"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Balance Sheet Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[580px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3 text-left w-12">Sr.</th>
                      <th className="py-2.5 px-3 text-left">Particulars (Schedule III Heads)</th>
                      <th className="py-2.5 px-3 text-left w-36">Ind AS Standard</th>
                      <th className="py-2.5 px-3 text-right w-44">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                    {/* SECTION 1: ASSETS */}
                    <tr className="bg-slate-900 text-white font-sans font-bold">
                      <td className="py-2 px-3">I.</td>
                      <td colSpan={3} className="py-2 px-3 uppercase tracking-wider text-xs">
                        ASSETS
                      </td>
                    </tr>

                    {/* Non-Current Assets */}
                    <tr className="bg-slate-100/70 font-sans font-semibold text-slate-700">
                      <td className="py-1.5 px-3">(1)</td>
                      <td colSpan={3} className="py-1.5 px-3 text-[11px] uppercase">
                        Non-Current Assets
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(a)</td>
                      <td className="py-2 px-3">Property, Plant and Equipment (PPE)</td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 16</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{balanceSheet.ppeTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(b)</td>
                      <td className="py-2 px-3">Right-of-Use Assets</td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 116</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{balanceSheet.rouTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(c)</td>
                      <td className="py-2 px-3">Intangible Assets & Financial Investments</td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 38 / 109</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{balanceSheet.nonCurrentInvestmentsTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="bg-slate-50 font-sans font-semibold text-slate-900 border-t border-b">
                      <td></td>
                      <td className="py-1.5 px-3 italic">Sub-total: Non-Current Assets</td>
                      <td></td>
                      <td className="py-1.5 px-3 text-right font-mono">
                        ₹{balanceSheet.totalNonCurrentAssets.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* Current Assets */}
                    <tr className="bg-slate-100/70 font-sans font-semibold text-slate-700">
                      <td className="py-1.5 px-3">(2)</td>
                      <td colSpan={3} className="py-1.5 px-3 text-[11px] uppercase">
                        Current Assets
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(a)</td>
                      <td className="py-2 px-3">Inventories (Finished Goods & Stores)</td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 2</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{balanceSheet.inventoryTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(b)</td>
                      <td className="py-2 px-3">Trade Receivables (Sundry Debtors)</td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 109 (ECL)</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{balanceSheet.tradeReceivablesTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(c)</td>
                      <td className="py-2 px-3">Cash & Cash Equivalents + Bank Balances</td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 7</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{(balanceSheet.cashTotal + balanceSheet.bankTotal).toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(d)</td>
                      <td className="py-2 px-3">Current Tax Assets (TDS Deducted by Clients u/s 194J/C + Advance Tax)</td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 12</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{balanceSheet.currentTaxAssetsTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(e)</td>
                      <td className="py-2 px-3">Other Current Assets (Input GST Credit in GSTR-2B)</td>
                      <td className="py-2 px-3 text-[11px] text-slate-500">Statutory Asset</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{balanceSheet.otherCurrentAssetsTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="bg-slate-50 font-sans font-semibold text-slate-900 border-t border-b">
                      <td></td>
                      <td className="py-1.5 px-3 italic">Sub-total: Current Assets</td>
                      <td></td>
                      <td className="py-1.5 px-3 text-right font-mono">
                        ₹{balanceSheet.totalCurrentAssets.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* TOTAL ASSETS */}
                    <tr className="bg-emerald-100/70 font-sans font-extrabold text-emerald-950 border-t-2 border-b-2 border-emerald-400">
                      <td className="py-3 px-3"></td>
                      <td className="py-3 px-3 text-sm">TOTAL ASSETS</td>
                      <td className="py-3 px-3 text-xs text-emerald-800">Total Resources</td>
                      <td className="py-3 px-3 text-right font-mono text-base text-emerald-950">
                        ₹{balanceSheet.totalAssets.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* SECTION 2: EQUITY AND LIABILITIES */}
                    <tr className="bg-slate-900 text-white font-sans font-bold">
                      <td className="py-2 px-3">II.</td>
                      <td colSpan={3} className="py-2 px-3 uppercase tracking-wider text-xs">
                        EQUITY AND LIABILITIES
                      </td>
                    </tr>

                    {/* (1) Equity */}
                    <tr className="bg-slate-100/70 font-sans font-semibold text-slate-700">
                      <td className="py-1.5 px-3">(1)</td>
                      <td colSpan={3} className="py-1.5 px-3 text-[11px] uppercase">
                        Equity (Capital & Reserves)
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(a)</td>
                      <td className="py-2 px-3">Equity Share Capital / Owner's Capital</td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 1</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{balanceSheet.baseCapital.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400 align-top">(b)</td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-900">Other Equity (Reserves & Surplus / Retained Earnings)</div>
                        <div className="pl-3 pt-1 space-y-0.5 text-[11px] font-normal text-slate-600">
                          <div>• Opening Retained Earnings & Reserves: <span className="font-mono font-medium">₹{balanceSheet.openingReserves.toLocaleString("en-IN")}</span></div>
                          <div className="text-emerald-800">• Add: Current FY Net Profit After Tax (PAT): <span className="font-mono font-bold">+₹{plStatement.profitAfterTax.toLocaleString("en-IN")}</span></div>
                          {balanceSheet.totalDrawings > 0 && (
                            <div className="text-rose-700">• Less: Owner's Drawings / Partner Distributions: <span className="font-mono font-medium">-₹{balanceSheet.totalDrawings.toLocaleString("en-IN")}</span></div>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium align-top">Ind AS 1</td>
                      <td className="py-2 px-3 text-right font-mono font-bold align-top">
                        ₹{balanceSheet.totalOtherEquity.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="bg-slate-50 font-sans font-semibold text-slate-900 border-t border-b">
                      <td></td>
                      <td className="py-1.5 px-3 italic">Sub-total: Total Equity</td>
                      <td></td>
                      <td className="py-1.5 px-3 text-right font-mono">
                        ₹{balanceSheet.totalEquity.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* (2) Non-Current Liabilities */}
                    <tr className="bg-slate-100/70 font-sans font-semibold text-slate-700">
                      <td className="py-1.5 px-3">(2)</td>
                      <td colSpan={3} className="py-1.5 px-3 text-[11px] uppercase">
                        Non-Current Liabilities
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(a)</td>
                      <td className="py-2 px-3">Financial Liabilities: Long-Term Borrowings (Term Loans)</td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 109</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{balanceSheet.longTermBorrowingsTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(b)</td>
                      <td className="py-2 px-3">Deferred Tax Liabilities & Lease Liabilities</td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 12 / 116</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{(balanceSheet.deferredTaxLiabilitiesTotal + balanceSheet.nonCurrentLeaseTotal).toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="bg-slate-50 font-sans font-semibold text-slate-900 border-t border-b">
                      <td></td>
                      <td className="py-1.5 px-3 italic">Sub-total: Non-Current Liabilities</td>
                      <td></td>
                      <td className="py-1.5 px-3 text-right font-mono">
                        ₹{balanceSheet.totalNonCurrentLiabilities.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* (3) Current Liabilities */}
                    <tr className="bg-slate-100/70 font-sans font-semibold text-slate-700">
                      <td className="py-1.5 px-3">(3)</td>
                      <td colSpan={3} className="py-1.5 px-3 text-[11px] uppercase">
                        Current Liabilities
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(a)</td>
                      <td className="py-2 px-3">Short-Term Borrowings (Bank Cash Credit / Overdraft)</td>
                      <td className="py-2 px-3 text-[11px] text-slate-500">Working Capital</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{balanceSheet.shortTermBorrowingsTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="hover:bg-amber-50/50 font-sans">
                      <td className="py-2 px-3 text-amber-700 font-bold">(b)</td>
                      <td className="py-2 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>Trade Payables: Micro & Small Enterprises (MSEs)</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300">
                          Sec 43B(h) Mandate
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[11px] text-amber-800 font-semibold">MSMED Act 2006</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-950">
                        ₹{balanceSheet.msmePayablesTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(c)</td>
                      <td className="py-2 px-3">Trade Payables: Other Creditors</td>
                      <td className="py-2 px-3 text-[11px] text-slate-500">Normal Suppliers</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{balanceSheet.otherCreditorsTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(d)</td>
                      <td className="py-2 px-3">Contract Liabilities (Customer Milestone Advances)</td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 115</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{balanceSheet.otherCurrentLiabilitiesTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(e)</td>
                      <td className="py-2 px-3">Statutory Dues Payable (Output GST PMT-06 + TDS Challan 281)</td>
                      <td className="py-2 px-3 text-[11px] text-slate-500">Due by 7th / 20th</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{balanceSheet.statutoryDuesTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 font-sans">
                      <td className="py-2 px-3 text-slate-400">(f)</td>
                      <td className="py-2 px-3">Current Tax Liabilities (Provision for Income Tax)</td>
                      <td className="py-2 px-3 text-[11px] text-indigo-700 font-medium">Ind AS 12</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{balanceSheet.currentTaxLiabilityTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    <tr className="bg-slate-50 font-sans font-semibold text-slate-900 border-t border-b">
                      <td></td>
                      <td className="py-1.5 px-3 italic">Sub-total: Current Liabilities</td>
                      <td></td>
                      <td className="py-1.5 px-3 text-right font-mono">
                        ₹{balanceSheet.totalCurrentLiabilities.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* TOTAL EQUITY AND LIABILITIES */}
                    <tr className="bg-emerald-100/70 font-sans font-extrabold text-emerald-950 border-t-2 border-b-2 border-emerald-400">
                      <td className="py-3 px-3"></td>
                      <td className="py-3 px-3 text-sm">TOTAL EQUITY AND LIABILITIES</td>
                      <td className="py-3 px-3 text-xs text-emerald-800">Total Financing</td>
                      <td className="py-3 px-3 text-right font-mono text-base text-emerald-950">
                        ₹{balanceSheet.totalEquityAndLiabilities.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PART III: STATEMENT OF CASH FLOWS (Ind AS 7 / AS 3) */}
          {(statementSubView === "all" || statementSubView === "cf") && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Ind AS 7 / AS 3 • Indirect Method
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    Statement of Cash Flows for the Financial Year {selectedFY}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Reconciliation of net profit to operating, investing, and financing cash flows.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700">Cash Equilibrium: </span>
                  <span className="font-mono text-sm font-bold text-emerald-800">
                    ₹{cashFlowStatement.closingCashAndBank.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/80 text-slate-800 text-xs uppercase tracking-wider font-bold">
                      <th className="py-2.5 px-4">Particulars</th>
                      <th className="py-2.5 px-4 text-center">Reference</th>
                      <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* SECTION A: OPERATING */}
                    <tr className="bg-slate-900 text-white font-bold text-xs uppercase">
                      <td colSpan={2} className="py-2 px-4">A. Cash Flows from Operating Activities</td>
                      <td className="py-2 px-4 text-right font-mono"></td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-4">Net Profit Before Tax (from P&L)</td>
                      <td className="py-2 px-4 text-center text-xs text-slate-500">P&L</td>
                      <td className="py-2 px-4 text-right font-mono font-semibold">
                        ₹{cashFlowStatement.pbt.toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 text-slate-600">
                      <td className="py-2 px-4 pl-6">Adjustments: Depreciation & Amortisation Expense</td>
                      <td className="py-2 px-4 text-center text-xs text-indigo-600">Ind AS 16</td>
                      <td className="py-2 px-4 text-right font-mono">
                        +₹{cashFlowStatement.depreciation.toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 text-slate-600">
                      <td className="py-2 px-4 pl-6">Adjustments: Finance Costs (Interest Expense)</td>
                      <td className="py-2 px-4 text-center text-xs text-indigo-600">Ind AS 23</td>
                      <td className="py-2 px-4 text-right font-mono">
                        +₹{cashFlowStatement.financeCosts.toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/70 font-semibold text-slate-800">
                      <td className="py-2 px-4">Operating Profit Before Working Capital Changes</td>
                      <td className="py-2 px-4 text-center text-xs">Sub-total</td>
                      <td className="py-2 px-4 text-right font-mono">
                        ₹{cashFlowStatement.operatingProfitBeforeWC.toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 text-slate-600">
                      <td className="py-2 px-4 pl-6">Working Capital Changes (Debtors, Creditors, Inventory & Other)</td>
                      <td className="py-2 px-4 text-center text-xs text-slate-500">Balance Sheet</td>
                      <td className="py-2 px-4 text-right font-mono">
                        {cashFlowStatement.workingCapitalAdjustments >= 0 ? "+" : ""}
                        ₹{cashFlowStatement.workingCapitalAdjustments.toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 text-slate-600">
                      <td className="py-2 px-4 pl-6">Less: Direct Taxes Paid (Advance Tax & TDS)</td>
                      <td className="py-2 px-4 text-center text-xs text-rose-600">Ind AS 12</td>
                      <td className="py-2 px-4 text-right font-mono text-rose-700">
                        -₹{cashFlowStatement.taxesPaid.toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/80 font-bold text-emerald-950 border-t border-b">
                      <td className="py-2 px-4">Net Cash from / (used in) Operating Activities (A)</td>
                      <td className="py-2 px-4 text-center text-xs text-emerald-700">Ind AS 7</td>
                      <td className="py-2 px-4 text-right font-mono font-bold">
                        ₹{cashFlowStatement.netCashFromOperating.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* SECTION B: INVESTING */}
                    <tr className="bg-slate-900 text-white font-bold text-xs uppercase">
                      <td colSpan={2} className="py-2 px-4">B. Cash Flows from Investing Activities</td>
                      <td className="py-2 px-4 text-right font-mono"></td>
                    </tr>
                    <tr className="hover:bg-slate-50 text-slate-600">
                      <td className="py-2 px-4">Capital Expenditure on PPE & Fixed Assets</td>
                      <td className="py-2 px-4 text-center text-xs text-indigo-600">Ind AS 16</td>
                      <td className="py-2 px-4 text-right font-mono text-rose-700">
                        ₹{cashFlowStatement.ppeCapex.toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/80 font-bold text-emerald-950 border-t border-b">
                      <td className="py-2 px-4">Net Cash from / (used in) Investing Activities (B)</td>
                      <td className="py-2 px-4 text-center text-xs text-emerald-700">Ind AS 7</td>
                      <td className="py-2 px-4 text-right font-mono font-bold">
                        ₹{cashFlowStatement.netCashFromInvesting.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* SECTION C: FINANCING */}
                    <tr className="bg-slate-900 text-white font-bold text-xs uppercase">
                      <td colSpan={2} className="py-2 px-4">C. Cash Flows from Financing Activities</td>
                      <td className="py-2 px-4 text-right font-mono"></td>
                    </tr>
                    <tr className="hover:bg-slate-50 text-slate-600">
                      <td className="py-2 px-4">Capital Introduced / Share Capital</td>
                      <td className="py-2 px-4 text-center text-xs">Equity</td>
                      <td className="py-2 px-4 text-right font-mono">
                        ₹{cashFlowStatement.capitalIntroduced.toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 text-slate-600">
                      <td className="py-2 px-4">Less: Owner's Drawings / Partner Remuneration Withdrawals</td>
                      <td className="py-2 px-4 text-center text-xs text-rose-600">Equity</td>
                      <td className="py-2 px-4 text-right font-mono text-rose-700">
                        ₹{cashFlowStatement.drawings.toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 text-slate-600">
                      <td className="py-2 px-4">Net Borrowings (Term Loans & Overdraft Movement)</td>
                      <td className="py-2 px-4 text-center text-xs">Debt</td>
                      <td className="py-2 px-4 text-right font-mono">
                        ₹{cashFlowStatement.borrowings.toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/80 font-bold text-emerald-950 border-t border-b">
                      <td className="py-2 px-4">Net Cash from / (used in) Financing Activities (C)</td>
                      <td className="py-2 px-4 text-center text-xs text-emerald-700">Ind AS 7</td>
                      <td className="py-2 px-4 text-right font-mono font-bold">
                        ₹{cashFlowStatement.netCashFromFinancing.toLocaleString("en-IN")}
                      </td>
                    </tr>

                    {/* NET INCREASE / DECREASE & CLOSING CASH RECONCILIATION */}
                    <tr className="bg-blue-50/90 font-bold text-blue-950 border-t-2">
                      <td className="py-2.5 px-4">Net Increase / (Decrease) in Cash and Cash Equivalents (A + B + C)</td>
                      <td className="py-2.5 px-4 text-center text-xs text-blue-700">Net Flow</td>
                      <td className="py-2.5 px-4 text-right font-mono text-base font-bold">
                        {cashFlowStatement.netChangeInCash >= 0 ? "+" : ""}
                        ₹{cashFlowStatement.netChangeInCash.toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-semibold text-slate-700">
                      <td className="py-2 px-4">Add: Cash and Cash Equivalents at Beginning of the Financial Year</td>
                      <td className="py-2 px-4 text-center text-xs">Opening</td>
                      <td className="py-2 px-4 text-right font-mono">
                        ₹{cashFlowStatement.openingCashAndBank.toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr className="bg-emerald-100 font-extrabold text-emerald-950 border-t-2 border-b-2 border-emerald-400">
                      <td className="py-3 px-4 text-sm">Cash and Cash Equivalents at End of the Period (As per Balance Sheet)</td>
                      <td className="py-3 px-4 text-center text-xs text-emerald-800">Closing Cash & Bank</td>
                      <td className="py-3 px-4 text-right font-mono text-base font-bold">
                        ₹{cashFlowStatement.closingCashAndBank.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PART IV: TRIAL BALANCE DETAIL VIEW */}
          {statementSubView === "tb" && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Source General Ledger
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    Complete Trial Balance Breakdown ({ledgers.length} Accounts)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Full debit and credit equilibrium audit trail mapped to Ind AS taxonomy.
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${trialBalance.isBalanced ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                    {trialBalance.isBalanced ? "✓ Equilibrium Verified" : `⚠️ Imbalance ₹${trialBalance.diff.toLocaleString("en-IN")}`}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/80 text-slate-800 text-xs uppercase tracking-wider font-bold">
                      <th className="py-2.5 px-4">Account Head</th>
                      <th className="py-2.5 px-4">Ind AS Classification</th>
                      <th className="py-2.5 px-4 text-right">Debit (₹)</th>
                      <th className="py-2.5 px-4 text-right">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {ledgers.map((acc) => (
                      <tr key={acc.id} className="hover:bg-slate-50">
                        <td className="py-2 px-4 font-sans font-medium text-slate-900">
                          {acc.accountName}
                        </td>
                        <td className="py-2 px-4 font-sans text-xs text-slate-600">
                          {acc.classification}
                        </td>
                        <td className="py-2 px-4 text-right font-bold text-slate-900">
                          {acc.balanceType === "Debit" ? `₹${acc.amount.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="py-2 px-4 text-right font-bold text-slate-900">
                          {acc.balanceType === "Credit" ? `₹${acc.amount.toLocaleString("en-IN")}` : "—"}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-950 text-sm">
                      <td colSpan={2} className="py-3 px-4 font-sans uppercase tracking-wider text-right">
                        Total
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-900 font-mono">
                        ₹{trialBalance.totalDebit.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-900 font-mono">
                        ₹{trialBalance.totalCredit.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ind AS Mandatory Disclosure Notes Accordion */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>Mandatory Ind AS Notes & Disclosures for Indian Tax Audit (Form 3CD)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                <span className="font-bold text-amber-950 block mb-1">
                  1. MSME Section 43B(h) Dues Note
                </span>
                <p className="text-amber-900/90 leading-relaxed text-[11px]">
                  Total outstanding to Micro & Small Enterprises is <strong>₹{balanceSheet.msmePayablesTotal.toLocaleString("en-IN")}</strong>. Ensure all invoices are paid within 45 days (or 15 days without agreement) to avoid disallowance from taxable profits under Section 43B(h).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                <span className="font-bold text-blue-950 block mb-1">
                  2. Ind AS 115 Revenue Disaggregation
                </span>
                <p className="text-blue-900/90 leading-relaxed text-[11px]">
                  Gross Revenue of <strong>₹{plStatement.revenueFromOperations.toLocaleString("en-IN")}</strong> recognized upon performance satisfaction. Customer advances of <strong>₹{balanceSheet.otherCurrentLiabilitiesTotal.toLocaleString("en-IN")}</strong> are segregated as Contract Liabilities until invoices are raised.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">
                  3. Ind AS 12 Tax & TDS Assets
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  TDS Receivable asset of <strong>₹{balanceSheet.currentTaxAssetsTotal.toLocaleString("en-IN")}</strong> must be reconciled with AIS and Form 26AS. Current tax provision of <strong>₹{plStatement.currentTaxExpense.toLocaleString("en-IN")}</strong> will be adjusted against advance tax challans in ITR.
                </p>
              </div>
            </div>
          </div>

          {/* AI Financial Chatbot Interactive Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 rounded-2xl p-5 text-white shadow-md border border-emerald-800/40 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center font-serif text-2xl font-bold text-emerald-300 shadow-inner shrink-0">
                मु
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Have questions about your P&L or Balance Sheet?</h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-semibold border border-emerald-400/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI Analyst Ready
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  {balanceSheet.isBsBalanced
                    ? "Ask our AI CA why your statements balance, explore net margin drivers, or get working capital advice."
                    : `Your balance sheet has an imbalance of ₹${balanceSheet.bsDiff.toLocaleString("en-IN")}. Ask our AI CA to diagnose why and generate the exact adjusting entries.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <button
                onClick={() => {
                  setChatInitialPrompt(
                    !balanceSheet.isBsBalanced
                      ? `Why is there a difference of ₹${balanceSheet.bsDiff.toLocaleString("en-IN")} in my Balance Sheet? Please analyze my assets vs liabilities & equity, identify the root causes, and give me the exact adjusting journal entries to fix it.`
                      : "Analyze my Profit & Loss performance: What are our margins, top cost drivers, and key CA recommendations?"
                  );
                  setActiveView("ai-analyst");
                }}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                  !balanceSheet.isBsBalanced
                    ? "bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-amber-900/30 animate-pulse"
                    : "bg-emerald-400 hover:bg-emerald-300 text-emerald-950 shadow-emerald-900/30"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {!balanceSheet.isBsBalanced
                    ? `Ask AI: Why Diff in BS (₹${balanceSheet.bsDiff.toLocaleString("en-IN")})?`
                    : "Chat with AI Financial Analyst"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: LEDGER BALANCES EDITOR */}
      {activeView === "ledger" && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Underlying Ledger Accounts & Trial Balance
              </h3>
              <p className="text-xs text-slate-500">
                Enter your trial balance balances. Any changes automatically flow into your Ind AS Balance Sheet and P&L above.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Ledger Head</span>
              </button>
            </div>
          </div>

          {/* Add Ledger Head Form */}
          {showAddForm && (
            <form onSubmit={handleAddAccount} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Create New Ledger Account
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Cloud Hosting / ICICI CC"
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Ind AS Classification</label>
                  <select
                    value={newAccClass}
                    onChange={(e) => {
                      const val = e.target.value as IndAsClassification;
                      setNewAccClass(val);
                      // Auto-suggest normal balance
                      const meta = IND_AS_CLASSIFICATIONS_META[val];
                      if (meta) {
                        setNewAccType(meta.normalBalance);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 text-xs"
                  >
                    {Object.keys(IND_AS_CLASSIFICATIONS_META).map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Balance Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewAccType("Debit")}
                      className={`py-2 rounded-lg font-bold border transition ${
                        newAccType === "Debit"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-700 border-slate-300"
                      }`}
                    >
                      Debit (Dr)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAccType("Credit")}
                      className={`py-2 rounded-lg font-bold border transition ${
                        newAccType === "Credit"
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-slate-700 border-slate-300"
                      }`}
                    >
                      Credit (Cr)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newAccAmount || ""}
                      onChange={(e) => setNewAccAmount(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <input
                  type="text"
                  placeholder="Optional compliance note (e.g. MSME vendor, Udyam registered)"
                  value={newAccNotes}
                  onChange={(e) => setNewAccNotes(e.target.value)}
                  className="w-2/3 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white"
                  >
                    Save to Trial Balance
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Search bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter ledger name or standard..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="text-xs text-slate-500">
              Showing {filteredLedgers.length} of {ledgers.length} ledger heads
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left min-w-[580px]">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Account Head</th>
                  <th className="py-2.5 px-3">Ind AS Classification</th>
                  <th className="py-2.5 px-3 w-28">Type</th>
                  <th className="py-2.5 px-3 text-right w-40">Amount (₹)</th>
                  <th className="py-2.5 px-3 w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                {filteredLedgers.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50 font-sans">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{acc.accountName}</div>
                      {acc.notes && (
                        <div className="text-[11px] text-slate-400 italic">{acc.notes}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs text-slate-700 block">{acc.classification}</span>
                      <span className="text-[10px] text-indigo-700 font-medium">
                        {IND_AS_CLASSIFICATIONS_META[acc.classification]?.indAsNote}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        acc.balanceType === "Debit"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {acc.balanceType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <input
                        type="number"
                        value={acc.amount}
                        onChange={(e) => handleUpdateAmount(acc.id, Number(e.target.value))}
                        className="w-32 px-2 py-1 text-right text-xs font-mono font-bold rounded border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteAccount(acc.id)}
                        title="Delete Account"
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: AI FINANCIAL & AUDIT ANALYST CHATBOT */}
      {activeView === "ai-analyst" && (
        <FinancialStatementsAiChat
          statementsData={{ profile, plStatement, balanceSheet, ledgers }}
          initialPrompt={chatInitialPrompt}
          onClearInitialPrompt={() => setChatInitialPrompt(null)}
        />
      )}

      {/* Trial Balance Import Modal */}
      <TrialBalanceImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportTrialBalance}
      />
    </div>
  );
};
