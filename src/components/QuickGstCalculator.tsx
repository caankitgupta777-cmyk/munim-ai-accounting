import React, { useState, useMemo } from "react";
import {
  Calculator,
  Search,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Hash,
  Layers,
  ArrowUpDown,
  Tag,
  Database,
} from "lucide-react";
import { POPULAR_HSN_SAC_CODES, STANDARD_GST_SLABS, HsnSacItem } from "../data/hsnCodes";
import { BusinessProfile } from "../types";
import { logQueryToDatabase } from "../services/queryDatabase";

interface QuickGstCalculatorProps {
  profile?: BusinessProfile;
  onPopulateVoucher?: (data: {
    taxableAmount: number;
    gstRate: number;
    isInterState: boolean;
    hsnCode: string;
    description: string;
  }) => void;
  onConsultAdvisor?: (prompt: string) => void;
  onClose?: () => void;
  compact?: boolean;
}

export const QuickGstCalculator: React.FC<QuickGstCalculatorProps> = ({
  profile,
  onPopulateVoucher,
  onConsultAdvisor,
  onClose,
  compact = false,
}) => {
  // Input Amount
  const [amount, setAmount] = useState<number>(50000);
  const [calculationMode, setCalculationMode] = useState<"exclusive" | "inclusive">("exclusive");

  // HSN / SAC selection
  const [selectedHsn, setSelectedHsn] = useState<HsnSacItem>(POPULAR_HSN_SAC_CODES[0]); // IT Software
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showHsnDropdown, setShowHsnDropdown] = useState<boolean>(false);

  // Custom HSN and override mode
  const [isCustomHsn, setIsCustomHsn] = useState<boolean>(false);
  const [customHsnCode, setCustomHsnCode] = useState<string>("");
  const [customGstRate, setCustomGstRate] = useState<number>(18);
  const [customDescription, setCustomDescription] = useState<string>("");

  // Supply Type
  const [isInterState, setIsInterState] = useState<boolean>(false);

  // Quantity / Multiplier (Optional)
  const [quantity, setQuantity] = useState<number>(1);
  const [includeQuantity, setIncludeQuantity] = useState<boolean>(false);

  // Copy feedback state
  const [copied, setCopied] = useState<boolean>(false);
  const [loggedToDb, setLoggedToDb] = useState<boolean>(false);

  // Filter HSN codes based on search
  const filteredHsnCodes = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_HSN_SAC_CODES;
    const q = searchQuery.toLowerCase();
    return POPULAR_HSN_SAC_CODES.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Active Rate and Code
  const activeGstRate = isCustomHsn ? customGstRate : selectedHsn.gstRate;
  const activeCode = isCustomHsn ? customHsnCode || "CUSTOM" : selectedHsn.code;
  const activeDesc = isCustomHsn
    ? customDescription || "Custom Goods / Services"
    : selectedHsn.description;
  const activeCessRate = !isCustomHsn && selectedHsn.cessRate ? selectedHsn.cessRate : 0;

  // Calculation Logic
  const calculations = useMemo(() => {
    const rawTotalAmount = Math.max(0, amount) * (includeQuantity ? Math.max(1, quantity) : 1);
    const rate = activeGstRate;
    const cessRate = activeCessRate;
    const totalTaxRate = rate + cessRate;

    let taxableAmount = 0;
    let totalGst = 0;
    let cessAmount = 0;
    let grossTotal = 0;

    if (calculationMode === "exclusive") {
      // Add GST on top of taxable amount
      taxableAmount = rawTotalAmount;
      totalGst = (taxableAmount * rate) / 100;
      cessAmount = (taxableAmount * cessRate) / 100;
      grossTotal = taxableAmount + totalGst + cessAmount;
    } else {
      // Amount is inclusive of tax: extract base and tax
      // grossTotal = taxable * (1 + totalTaxRate / 100)
      if (totalTaxRate > 0) {
        taxableAmount = rawTotalAmount / (1 + totalTaxRate / 100);
        totalGst = (taxableAmount * rate) / 100;
        cessAmount = (taxableAmount * cessRate) / 100;
        grossTotal = rawTotalAmount;
      } else {
        taxableAmount = rawTotalAmount;
        totalGst = 0;
        cessAmount = 0;
        grossTotal = rawTotalAmount;
      }
    }

    // Split based on supply type
    const cgstRate = !isInterState ? rate / 2 : 0;
    const sgstRate = !isInterState ? rate / 2 : 0;
    const igstRate = isInterState ? rate : 0;

    const cgstAmount = !isInterState ? totalGst / 2 : 0;
    const sgstAmount = !isInterState ? totalGst / 2 : 0;
    const igstAmount = isInterState ? totalGst : 0;

    return {
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      cgstRate,
      cgstAmount: Math.round(cgstAmount * 100) / 100,
      sgstRate,
      sgstAmount: Math.round(sgstAmount * 100) / 100,
      igstRate,
      igstAmount: Math.round(igstAmount * 100) / 100,
      cessRate,
      cessAmount: Math.round(cessAmount * 100) / 100,
      totalTax: Math.round((totalGst + cessAmount) * 100) / 100,
      grossTotal: Math.round(grossTotal * 100) / 100,
    };
  }, [amount, calculationMode, activeGstRate, activeCessRate, isInterState, includeQuantity, quantity]);

  const handleLogToDatabase = () => {
    logQueryToDatabase({
      queryType: "gst_calc",
      title: `GST Calc: HSN ${activeCode} - ₹${calculations.grossTotal.toLocaleString("en-IN")}`,
      queryText: `HSN/SAC: ${activeCode} (${activeDesc}), Base: ₹${calculations.taxableAmount}, Rate: ${activeGstRate}%, Mode: ${calculationMode}, Supply: ${isInterState ? "Inter-state (IGST)" : "Intra-state (CGST+SGST)"}`,
      resultSummary: `Taxable: ₹${calculations.taxableAmount}, CGST: ₹${calculations.cgstAmount}, SGST: ₹${calculations.sgstAmount}, IGST: ₹${calculations.igstAmount}, Total Tax: ₹${calculations.totalTax}, Gross: ₹${calculations.grossTotal}`,
      payload: {
        hsnCode: activeCode,
        hsnDescription: activeDesc,
        amount,
        calculationMode,
        gstRate: activeGstRate,
        isInterState,
        calculations,
      },
      status: "completed",
      tags: ["gst_calc", activeCode, isInterState ? "IGST" : "CGST-SGST"],
    }).catch((e) => console.warn("Failed to log calculation query:", e));

    setLoggedToDb(true);
    setTimeout(() => setLoggedToDb(false), 2500);
  };

  const handleCopySummary = () => {
    const text = `--- GST Calculation Summary (Munim AI) ---
HSN/SAC: ${activeCode} - ${activeDesc}
GST Rate: ${activeGstRate}% (${isInterState ? "Inter-State / IGST" : "Intra-State / CGST + SGST"})
Calculation Mode: ${calculationMode === "exclusive" ? "Tax Exclusive (Base + GST)" : "Tax Inclusive (Reverse Extraction)"}
-------------------------------------------
Base Taxable Amount: ₹${calculations.taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
${
  !isInterState
    ? `CGST (${calculations.cgstRate}%): ₹${calculations.cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
SGST/UTGST (${calculations.sgstRate}%): ₹${calculations.sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
    : `IGST (${calculations.igstRate}%): ₹${calculations.igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
}
${calculations.cessAmount > 0 ? `Compensation Cess (${calculations.cessRate}%): ₹${calculations.cessAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n` : ""}Total GST Tax: ₹${calculations.totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
Total Invoice Amount: ₹${calculations.grossTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
-------------------------------------------
Generated via Munim AI - CA Ankit Gupta`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    // Also auto-save to query database
    handleLogToDatabase();
  };

  const handleSelectHsn = (item: HsnSacItem) => {
    setSelectedHsn(item);
    setIsCustomHsn(false);
    setShowHsnDropdown(false);
    setSearchQuery("");
  };

  const handleSendToVoucher = () => {
    if (onPopulateVoucher) {
      onPopulateVoucher({
        taxableAmount: calculations.taxableAmount,
        gstRate: activeGstRate,
        isInterState,
        hsnCode: activeCode,
        description: activeDesc,
      });
    }
  };

  const handleConsultAi = () => {
    if (onConsultAdvisor) {
      const prompt = `What are the GST rates, HSN classification rules, and Input Tax Credit (ITC) eligibility for HSN/SAC code ${activeCode} (${activeDesc}) under Indian GST Law?`;
      onConsultAdvisor(prompt);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Banner Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-slate-50 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Quick GST Calculator</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  HSN & Tax Components
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Instant CGST, SGST, IGST tax breakdown based on transaction value and Indian HSN / SAC codes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Calculation Mode Toggle (Exclusive vs Inclusive) */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs text-xs font-medium">
              <button
                type="button"
                id="btn-mode-exclusive"
                onClick={() => setCalculationMode("exclusive")}
                className={`px-3 py-1.5 rounded-md transition ${
                  calculationMode === "exclusive"
                    ? "bg-emerald-700 text-white font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                + Add GST (Exclusive)
              </button>
              <button
                type="button"
                id="btn-mode-inclusive"
                onClick={() => setCalculationMode("inclusive")}
                className={`px-3 py-1.5 rounded-md transition ${
                  calculationMode === "inclusive"
                    ? "bg-emerald-700 text-white font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Extract base taxable amount from final MRP or invoice value"
              >
                Reverse / Extract (Inclusive)
              </button>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Main Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Input Form (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Input Amount Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="gst-amount-input" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {calculationMode === "exclusive"
                    ? "Base Taxable Value (₹)"
                    : "Total Invoice Amount / MRP (₹ Inclusive)"}
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  {calculationMode === "exclusive"
                    ? "Tax will be added on top"
                    : "Base value will be back-calculated"}
                </span>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-base">
                  ₹
                </span>
                <input
                  id="gst-amount-input"
                  type="number"
                  min="0"
                  step="any"
                  value={amount === 0 ? "" : amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 50000"
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-2xs"
                />
              </div>

              {/* Quick Amount Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Quick:</span>
                {[5000, 10000, 25000, 50000, 100000, 500000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={`px-2 py-0.5 rounded text-xs transition border cursor-pointer ${
                      amount === preset
                        ? "bg-emerald-700 text-white border-emerald-700 font-semibold"
                        : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-800"
                    }`}
                  >
                    ₹{preset >= 100000 ? `${preset / 100000}L` : `${preset / 1000}k`}
                  </button>
                ))}
              </div>

              {/* Optional Quantity Multiplier */}
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={includeQuantity}
                    onChange={(e) => setIncludeQuantity(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                  />
                  <span>Multiply by Quantity / Units</span>
                </label>

                {includeQuantity && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-18 px-2 py-1 border border-slate-300 rounded bg-white font-bold text-slate-900 text-center text-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* HSN / SAC Code Selector Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    HSN / SAC Code & GST Slab
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCustomHsn(!isCustomHsn)}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold hover:underline"
                >
                  {isCustomHsn ? "Choose from Standard HSNs" : "+ Custom HSN / Rate"}
                </button>
              </div>

              {!isCustomHsn ? (
                <div className="space-y-2">
                  {/* Selected HSN Display & Search Trigger */}
                  <div className="relative">
                    <button
                      type="button"
                      id="btn-select-hsn"
                      onClick={() => setShowHsnDropdown(!showHsnDropdown)}
                      className="w-full text-left p-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100/70 transition flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                            {selectedHsn.code}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {selectedHsn.type}
                          </span>
                          <span className="ml-auto font-bold text-xs px-2 py-0.5 rounded bg-slate-900 text-white">
                            {selectedHsn.gstRate}% GST
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 truncate mt-1">
                          {selectedHsn.description}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          Category: {selectedHsn.category}
                        </p>
                      </div>

                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                          showHsnDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* HSN Dropdown Menu */}
                    {showHsnDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white rounded-xl border border-slate-200 shadow-xl max-h-72 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                        {/* Search Input inside Dropdown */}
                        <div className="p-2 border-b border-slate-100 bg-slate-50">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search HSN code, service, or commodity..."
                              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto divide-y divide-slate-100 p-1">
                          {filteredHsnCodes.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-500">
                              No matching HSN / SAC found. You can switch to Custom HSN mode above.
                            </div>
                          ) : (
                            filteredHsnCodes.map((item) => (
                              <button
                                key={item.code}
                                type="button"
                                onClick={() => handleSelectHsn(item)}
                                className={`w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 hover:bg-emerald-50/70 transition ${
                                  selectedHsn.code === item.code ? "bg-emerald-50" : ""
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                      {item.code}
                                    </span>
                                    <span className="text-[10px] text-slate-400">{item.type}</span>
                                  </div>
                                  <div className="font-medium text-slate-800 truncate mt-0.5">
                                    {item.description}
                                  </div>
                                </div>
                                <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded text-xs shrink-0">
                                  {item.gstRate}%
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected HSN Statutory Compliance Note */}
                  {selectedHsn.complianceNote && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">Statutory Tax Note: </strong>
                        {selectedHsn.complianceNote}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Custom HSN Entry */
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase">
                        HSN / SAC Code (4-8 Digits)
                      </label>
                      <input
                        type="text"
                        value={customHsnCode}
                        onChange={(e) => setCustomHsnCode(e.target.value.trim())}
                        placeholder="e.g. 84713010"
                        className="mt-1 w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase">
                        GST Tax Slab
                      </label>
                      <select
                        value={customGstRate}
                        onChange={(e) => setCustomGstRate(parseFloat(e.target.value))}
                        className="mt-1 w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      >
                        {STANDARD_GST_SLABS.map((slab) => (
                          <option key={slab.rate} value={slab.rate}>
                            {slab.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase">
                      Commodity / Service Description
                    </label>
                    <input
                      type="text"
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="e.g. Consulting, spare parts, raw material..."
                      className="mt-1 w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Supply Type Card (Intra vs Inter-State) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Place of Supply / Transaction Type
                </span>
                <span className="text-[11px] text-slate-500">
                  {isInterState ? "Integrated Tax (IGST)" : "Dual Tax (CGST + SGST)"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-supply-intra"
                  onClick={() => setIsInterState(false)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 cursor-pointer ${
                    !isInterState
                      ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Intra-State Supply</span>
                    {!isInterState && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Buyer & Seller in same State/UT
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-800 mt-1">
                    CGST ({activeGstRate / 2}%) + SGST ({activeGstRate / 2}%)
                  </span>
                </button>

                <button
                  type="button"
                  id="btn-supply-inter"
                  onClick={() => setIsInterState(true)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 cursor-pointer ${
                    isInterState
                      ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Inter-State Supply</span>
                    {isInterState && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Across different States or Export
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-800 mt-1">
                    IGST ({activeGstRate}%)
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Calculated Results & Tax Components (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Tax Breakdown & Summary
                </span>
                <span className="font-mono text-xs text-slate-400">HSN: {activeCode}</span>
              </div>

              {/* Total Invoice Gross Display */}
              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 text-center">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Total Gross Invoice Amount
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                  ₹{calculations.grossTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <div className="mt-1 text-xs text-emerald-400 font-medium">
                  Includes ₹{calculations.totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })} Total Tax
                </div>
              </div>

              {/* Tax Components Breakdown Table */}
              <div className="space-y-2.5 text-xs">
                {/* Taxable Base */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800 text-slate-300">
                  <span className="font-medium">Taxable Base Value:</span>
                  <span className="font-bold font-mono text-white text-sm">
                    ₹{calculations.taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* CGST Component */}
                {!isInterState ? (
                  <>
                    <div className="flex items-center justify-between py-1 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Central Tax (CGST @ {calculations.cgstRate}%):</span>
                      </div>
                      <span className="font-bold font-mono text-emerald-400">
                        ₹{calculations.cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-400" />
                        <span>State/UT Tax (SGST @ {calculations.sgstRate}%):</span>
                      </div>
                      <span className="font-bold font-mono text-teal-400">
                        ₹{calculations.sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                ) : (
                  /* IGST Component */
                  <div className="flex items-center justify-between py-1 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Integrated Tax (IGST @ {calculations.igstRate}%):</span>
                    </div>
                    <span className="font-bold font-mono text-emerald-400">
                      ₹{calculations.igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* Compensation Cess if any */}
                {calculations.cessAmount > 0 && (
                  <div className="flex items-center justify-between py-1 text-amber-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>Compensation Cess ({calculations.cessRate}%):</span>
                    </div>
                    <span className="font-bold font-mono text-amber-400">
                      ₹{calculations.cessAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* Total Tax Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-slate-200 font-bold">
                  <span>Total Tax Payable:</span>
                  <span className="font-mono text-emerald-300 text-sm">
                    ₹{calculations.totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="btn-copy-gst-breakdown"
                    onClick={handleCopySummary}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-300" />
                        <span>Copy Summary</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    id="btn-log-gst-to-db"
                    onClick={handleLogToDatabase}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    {loggedToDb ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Saved to DB!</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Save to DB</span>
                      </>
                    )}
                  </button>
                </div>

                {onPopulateVoucher && (
                  <button
                    type="button"
                    id="btn-send-to-voucher"
                    onClick={handleSendToVoucher}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Create Journal Voucher</span>
                  </button>
                )}

                {onConsultAdvisor && (
                  <button
                    type="button"
                    id="btn-ask-ai-hsn"
                    onClick={handleConsultAi}
                    className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ask AI CA about HSN {activeCode} Rules</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick CBIC Guideline Pill */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong>CBIC HSN Rule:</strong> Businesses with aggregate turnover &gt; ₹5 Crores must declare 6-digit HSN codes on B2B invoices. Businesses &le; ₹5 Crores must declare 4-digit codes for B2B supplies.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
