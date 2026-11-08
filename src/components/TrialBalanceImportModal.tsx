import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  Download,
  Sparkles,
  ArrowRight,
  Info,
  RefreshCw
} from "lucide-react";
import { LedgerAccountInput, IndAsClassification } from "../types";
import { IND_AS_CLASSIFICATIONS_META } from "../data/sampleLedgerPresets";
import {
  parseTrialBalanceBuffer,
  parseTrialBalanceText,
  ParsedTrialBalanceResult,
  downloadSampleTrialBalanceExcel,
  downloadSampleTrialBalanceCsv,
} from "../services/trialBalanceImporter";

interface TrialBalanceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (accounts: LedgerAccountInput[], mode: "replace" | "append") => void;
}

const ALL_CLASSIFICATIONS = Object.keys(
  IND_AS_CLASSIFICATIONS_META
) as IndAsClassification[];

export const TrialBalanceImportModal: React.FC<TrialBalanceImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Parsed state
  const [parsedData, setParsedData] = useState<ParsedTrialBalanceResult | null>(null);
  const [stagedAccounts, setStagedAccounts] = useState<LedgerAccountInput[]>([]);
  const [importMode, setImportMode] = useState<"replace" | "append">("replace");

  // Text paste input
  const [pastedText, setPastedText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setParsedData(null);
    setStagedAccounts([]);
    setErrorMsg(null);
    setPastedText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (file: File) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const res = parseTrialBalanceBuffer(buffer);
      setParsedData(res);
      setStagedAccounts(res.accounts);
    } catch (err: any) {
      console.error("Trial balance parse error:", err);
      setErrorMsg(err.message || "Failed to parse file. Please verify column headers and file format.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleParseText = () => {
    setErrorMsg(null);
    if (!pastedText.trim()) {
      setErrorMsg("Please paste trial balance ledger data first.");
      return;
    }
    setLoading(true);
    try {
      const res = parseTrialBalanceText(pastedText);
      setParsedData(res);
      setStagedAccounts(res.accounts);
    } catch (err: any) {
      console.error("Pasted text parse error:", err);
      setErrorMsg(err.message || "Could not parse text. Ensure columns have account names and numbers.");
    } finally {
      setLoading(false);
    }
  };

  // Update classification for a staged account
  const handleUpdateClassification = (id: string, newClass: IndAsClassification) => {
    setStagedAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, classification: newClass } : acc))
    );
  };

  // Update amount for a staged account
  const handleUpdateAmount = (id: string, newAmount: number) => {
    setStagedAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, amount: Math.max(0, newAmount) } : acc))
    );
  };

  // Toggle Debit / Credit
  const handleToggleType = (id: string) => {
    setStagedAccounts((prev) =>
      prev.map((acc) =>
        acc.id === id
          ? { ...acc, balanceType: acc.balanceType === "Debit" ? "Credit" : "Debit" }
          : acc
      )
    );
  };

  // Delete staged row
  const handleDeleteRow = (id: string) => {
    setStagedAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  // Calculate live equilibrium of staged accounts
  let currentDebit = 0;
  let currentCredit = 0;
  stagedAccounts.forEach((acc) => {
    if (acc.balanceType === "Debit") {
      currentDebit += acc.amount;
    } else {
      currentCredit += acc.amount;
    }
  });
  const currentDiff = Math.abs(currentDebit - currentCredit);
  const isCurrentBalanced = currentDiff < 1;

  const handleApplyImport = () => {
    if (stagedAccounts.length === 0) {
      setErrorMsg("No ledger accounts to import.");
      return;
    }
    onImport(stagedAccounts, importMode);
    onClose();
    handleReset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Import Trial Balance & Generate Statements
              </h3>
              <p className="text-xs text-slate-500">
                Import from Excel (.xlsx, .xls), CSV, or paste from Tally Prime / Zoho Books to prepare your draft Ind AS Balance Sheet & P&L.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              handleReset();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Import Error: </span>
                {errorMsg}
              </div>
            </div>
          )}

          {/* STEP 1: Upload or Paste (Show if not parsed yet) */}
          {stagedAccounts.length === 0 ? (
            <div className="space-y-4">
              {/* Method Switcher Tabs */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("file")}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                      activeTab === "file"
                        ? "bg-emerald-800 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Spreadsheet (.xlsx, .csv)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("text")}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                      activeTab === "text"
                        ? "bg-emerald-800 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Paste Text / Tally Data</span>
                  </button>
                </div>

                {/* Sample Download Links */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="hidden sm:inline">Templates:</span>
                  <button
                    onClick={downloadSampleTrialBalanceExcel}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 rounded-md font-medium text-slate-700 transition border border-slate-200"
                    title="Download Excel format template"
                  >
                    <Download className="w-3 h-3 text-emerald-600" />
                    <span>Sample Excel</span>
                  </button>
                  <button
                    onClick={downloadSampleTrialBalanceCsv}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 rounded-md font-medium text-slate-700 transition border border-slate-200"
                    title="Download CSV format template"
                  >
                    <Download className="w-3 h-3 text-slate-500" />
                    <span>Sample CSV</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: File Upload */}
              {activeTab === "file" && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                    dragActive
                      ? "border-emerald-600 bg-emerald-50/50 scale-[0.99]"
                      : "border-slate-300 hover:border-emerald-500 bg-slate-50/40"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
                      <Upload className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Drag and drop your Trial Balance here
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Supports <strong>.xlsx, .xls, or .csv</strong> files exported from Tally Prime, Zoho Books, Busy, or QuickBooks.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold transition shadow-xs disabled:opacity-50"
                    >
                      {loading ? "Analyzing Spreadsheet..." : "Browse File on Device"}
                    </button>

                    <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-slate-400">
                      <span>✓ Automatic Debit/Credit Detection</span>
                      <span>✓ Smart Ind AS Classification</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Paste Text */}
              {activeTab === "text" && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-600 flex items-center justify-between">
                    <span>
                      Paste rows directly from a spreadsheet, Tally export, or text file:
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Format: Account Name [Tab or Comma] Debit [Tab or Comma] Credit
                    </span>
                  </div>

                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Example format:\nSales of Services\t\t5000000\nSalaries & Wages\t1800000\t\nOffice Rent\t360000\t\nComputers & Laptops\t450000\t\nHDFC Bank Current A/c\t950000\t\nSundry Debtors\t850000\t\nShare Capital\t\t1500000\nTrade Payables (MSME)\t\t240000`}
                    className="w-full text-xs font-mono p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-slate-50/50"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setPastedText("")}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      disabled={loading || !pastedText.trim()}
                      onClick={handleParseText}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Parsing Rows...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Parse & Review Ledgers</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Informative Guidance Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800">
                    How Munim AI prepares Financial Statements from your Trial Balance:
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    1. Each ledger account is matched against Indian Accounting Standards (Ind AS 1, 2, 16, 115, 12) using our smart CA taxonomy engine.<br />
                    2. Profit & Loss statement calculates Gross Turnover, Expenses, PBT, Tax, and Net Profit After Tax (PAT).<br />
                    3. Net PAT automatically rolls into <strong>Other Equity (Reserves & Surplus)</strong> to verify Balance Sheet equilibrium.<br />
                    4. You can review and adjust any classification before applying!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: Review & Override Classifications */
            <div className="space-y-4">
              {/* Equilibrium Status Banner */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  isCurrentBalanced
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-amber-50 border-amber-300 text-amber-950"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isCurrentBalanced ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-sm">
                      {isCurrentBalanced
                        ? "Trial Balance in Equilibrium! Ready to Generate Statements."
                        : "Trial Balance Imbalance Detected:"}
                    </span>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Extracted <strong>{stagedAccounts.length}</strong> ledger accounts | Total Dr:{" "}
                      <strong>₹{currentDebit.toLocaleString("en-IN")}</strong> | Total Cr:{" "}
                      <strong>₹{currentCredit.toLocaleString("en-IN")}</strong>
                      {!isCurrentBalanced && (
                        <span className="ml-2 font-bold text-rose-700">
                          (Difference: ₹{currentDiff.toLocaleString("en-IN")})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleReset}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition"
                  >
                    Upload Different File
                  </button>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">Import Mode:</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === "replace"}
                      onChange={() => setImportMode("replace")}
                      className="text-emerald-700 focus:ring-emerald-600"
                    />
                    <span className="text-slate-800 font-medium">Replace all existing ledgers (Recommended)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === "append"}
                      onChange={() => setImportMode("append")}
                      className="text-emerald-700 focus:ring-emerald-600"
                    />
                    <span className="text-slate-800 font-medium">Append to current ledgers</span>
                  </label>
                </div>
              </div>

              {/* Staged Accounts Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="max-h-[360px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-10">#</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Ledger Account Name</th>
                        <th className="py-2.5 px-3 w-24 text-center">Dr / Cr</th>
                        <th className="py-2.5 px-3 w-32 text-right">Amount (₹)</th>
                        <th className="py-2.5 px-3 min-w-[280px]">Ind AS Classification (Review / Override)</th>
                        <th className="py-2.5 px-3 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stagedAccounts.map((acc, idx) => (
                        <tr key={acc.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2 px-3 text-slate-400 text-center font-mono">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                              <span>{acc.accountName}</span>
                              {acc.reviewRequired ? (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-200"
                                  title={acc.classificationReason || "Review classification"}
                                >
                                  ⚠️ Review ({acc.confidenceScore || 60}%)
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700"
                                  title={acc.classificationReason || "High confidence mapping"}
                                >
                                  ✓ Auto ({acc.confidenceScore || 98}%)
                                </span>
                              )}
                            </div>
                            {acc.classificationReason && (
                              <div className="text-[10px] text-slate-500 font-normal mt-0.5 line-clamp-1" title={acc.classificationReason}>
                                {acc.classificationReason}
                              </div>
                            )}
                            {acc.notes && !acc.classificationReason && (
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {acc.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => handleToggleType(acc.id)}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                                acc.balanceType === "Debit"
                                    ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                    : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                              }`}
                              title="Click to toggle Debit / Credit"
                            >
                              {acc.balanceType}
                            </button>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              value={acc.amount}
                              onChange={(e) => handleUpdateAmount(acc.id, parseFloat(e.target.value) || 0)}
                              className="w-28 text-right font-mono text-xs px-2 py-1 border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-600"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={acc.classification}
                              onChange={(e) =>
                                handleUpdateClassification(acc.id, e.target.value as IndAsClassification)
                              }
                              className="w-full text-[11px] py-1 px-2 border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-emerald-600 text-slate-800 font-medium"
                            >
                              {ALL_CLASSIFICATIONS.map((c) => (
                                <option key={c} value={c}>
                                  {IND_AS_CLASSIFICATIONS_META[c]?.label || c}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => handleDeleteRow(acc.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition"
                              title="Remove ledger account"
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
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
          <button
            type="button"
            onClick={() => {
              onClose();
              handleReset();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
          >
            Cancel
          </button>

          {stagedAccounts.length > 0 && (
            <button
              type="button"
              onClick={handleApplyImport}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Apply & Generate Financial Statements ({stagedAccounts.length} Ledgers)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
