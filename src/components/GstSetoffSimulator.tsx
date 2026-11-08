import React, { useState } from "react";
import { Calculator, ArrowRight, ShieldCheck, Info, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { QuickGstCalculator } from "./QuickGstCalculator";
import { BusinessProfile } from "../types";

interface GstSetoffSimulatorProps {
  profile?: BusinessProfile;
  onPopulateVoucher?: (data: {
    taxableAmount: number;
    gstRate: number;
    isInterState: boolean;
    hsnCode: string;
    description: string;
  }) => void;
  onConsultAdvisor?: (prompt: string) => void;
}

export const GstSetoffSimulator: React.FC<GstSetoffSimulatorProps> = ({
  profile,
  onPopulateVoucher,
  onConsultAdvisor,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"calc" | "setoff">("calc");

  // Output Tax (Tax Collected on Sales)
  const [outputIgst, setOutputIgst] = useState<number>(50000);
  const [outputCgst, setOutputCgst] = useState<number>(30000);
  const [outputSgst, setOutputSgst] = useState<number>(30000);

  // Input Tax Credit (Tax Paid on Purchases)
  const [inputIgst, setInputIgst] = useState<number>(70000);
  const [inputCgst, setInputCgst] = useState<number>(25000);
  const [inputSgst, setInputSgst] = useState<number>(25000);

  // CBIC Rule 88A & Circular No. 98/17/2019 Set-off Logic
  const calculateSetOff = () => {
    let remOutputIgst = Math.max(0, outputIgst);
    let remOutputCgst = Math.max(0, outputCgst);
    let remOutputSgst = Math.max(0, outputSgst);

    let remInputIgst = Math.max(0, inputIgst);
    let remInputCgst = Math.max(0, inputCgst);
    let remInputSgst = Math.max(0, inputSgst);

    // Step 1: Utilize IGST Credit against Output IGST first
    const igstAgainstIgst = Math.min(remInputIgst, remOutputIgst);
    remInputIgst -= igstAgainstIgst;
    remOutputIgst -= igstAgainstIgst;

    // Step 2: Remaining IGST Credit against Output CGST and SGST (in equal/flexible proportion)
    let igstAgainstCgst = 0;
    let igstAgainstSgst = 0;

    if (remInputIgst > 0) {
      igstAgainstCgst = Math.min(remInputIgst, remOutputCgst);
      remInputIgst -= igstAgainstCgst;
      remOutputCgst -= igstAgainstCgst;
    }

    if (remInputIgst > 0) {
      igstAgainstSgst = Math.min(remInputIgst, remOutputSgst);
      remInputIgst -= igstAgainstSgst;
      remOutputSgst -= igstAgainstSgst;
    }

    // Step 3: Utilize CGST Credit against remaining Output CGST, then Output IGST
    const cgstAgainstCgst = Math.min(remInputCgst, remOutputCgst);
    remInputCgst -= cgstAgainstCgst;
    remOutputCgst -= cgstAgainstCgst;

    const cgstAgainstIgst = Math.min(remInputCgst, remOutputIgst);
    remInputCgst -= cgstAgainstIgst;
    remOutputIgst -= cgstAgainstIgst;

    // Step 4: Utilize SGST Credit against remaining Output SGST, then Output IGST
    const sgstAgainstSgst = Math.min(remInputSgst, remOutputSgst);
    remInputSgst -= sgstAgainstSgst;
    remOutputSgst -= sgstAgainstSgst;

    const sgstAgainstIgst = Math.min(remInputSgst, remOutputIgst);
    remInputSgst -= sgstAgainstIgst;
    remOutputIgst -= sgstAgainstIgst;

    const totalCashPayable = remOutputIgst + remOutputCgst + remOutputSgst;
    const totalItcBalance = remInputIgst + remInputCgst + remInputSgst;

    return {
      remOutputIgst,
      remOutputCgst,
      remOutputSgst,
      remInputIgst,
      remInputCgst,
      remInputSgst,
      igstAgainstIgst,
      igstAgainstCgst,
      igstAgainstSgst,
      cgstAgainstCgst,
      cgstAgainstIgst,
      sgstAgainstSgst,
      sgstAgainstIgst,
      totalCashPayable,
      totalItcBalance,
    };
  };

  const results = calculateSetOff();

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            id="subtab-quick-calc"
            onClick={() => setActiveSubTab("calc")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === "calc"
                ? "bg-white text-emerald-800 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-700" />
            <span>Quick GST Calculator (HSN & Tax Slabs)</span>
          </button>

          <button
            type="button"
            id="subtab-itc-setoff"
            onClick={() => setActiveSubTab("setoff")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === "setoff"
                ? "bg-white text-emerald-800 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            <span>Rule 88A ITC Set-Off Simulator</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2 hidden md:block">
          CBIC Standard Calculation Tools
        </div>
      </div>

      {/* View 1: Quick GST Calculator */}
      {activeSubTab === "calc" && (
        <QuickGstCalculator
          profile={profile}
          onPopulateVoucher={onPopulateVoucher}
          onConsultAdvisor={onConsultAdvisor}
        />
      )}

      {/* View 2: ITC Set-off Simulator */}
      {activeSubTab === "setoff" && (
        <>
          {/* Header Info */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-900">
                GST Input Tax Credit (ITC) Set-Off Engine
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Based on <strong>Rule 88A of CGST Rules & CBIC Circular No. 98/17/2019</strong>. Calculates the statutory order of tax credit utilization before filing GSTR-3B and paying tax via Challan PMT-06.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" /> CBIC Rule 88A
          </span>
        </div>

        {/* Inputs: Output Liability vs Input Credit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Output Tax (Liability) */}
          <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-200">
            <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>1. Output GST Liability (Sales / Outward)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                To Be Paid
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Output IGST (Interstate Sales)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={outputIgst}
                    onChange={(e) => setOutputIgst(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Output CGST (Central)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      value={outputCgst}
                      onChange={(e) => setOutputCgst(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Output SGST (State)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      value={outputSgst}
                      onChange={(e) => setOutputSgst(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-rose-200/60 flex justify-between text-xs font-bold text-rose-900">
                <span>Total Output Liability:</span>
                <span>₹{(outputIgst + outputCgst + outputSgst).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Input Tax Credit (Asset) */}
          <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>2. Input Tax Credit (ITC on Purchases / Inward)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                Available in GSTR-2B
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Input IGST (Interstate Purchases)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={inputIgst}
                    onChange={(e) => setInputIgst(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Input CGST (Central)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      value={inputCgst}
                      onChange={(e) => setInputCgst(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Input SGST (State)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      value={inputSgst}
                      onChange={(e) => setInputSgst(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-blue-200/60 flex justify-between text-xs font-bold text-blue-900">
                <span>Total ITC Available:</span>
                <span>₹{(inputIgst + inputCgst + inputSgst).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Set-off Results & Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Step by Step Set-off breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-emerald-700" />
            <span>Step-by-Step Statutory Credit Utilization Waterfall</span>
          </h3>

          <div className="space-y-3 text-xs">
            {/* Step 1 */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-semibold text-slate-800 mb-1 flex items-center justify-between">
                <span>Step 1: Exhaust IGST Credit Completely (Rule 88A Mandatory First Step)</span>
                <span className="font-mono text-indigo-700">Utilized: ₹{(results.igstAgainstIgst + results.igstAgainstCgst + results.igstAgainstSgst).toLocaleString("en-IN")}</span>
              </div>
              <ul className="list-disc ml-5 text-slate-600 space-y-0.5">
                <li>Against Output IGST: ₹{results.igstAgainstIgst.toLocaleString("en-IN")}</li>
                <li>Against Output CGST: ₹{results.igstAgainstCgst.toLocaleString("en-IN")}</li>
                <li>Against Output SGST: ₹{results.igstAgainstSgst.toLocaleString("en-IN")}</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-semibold text-slate-800 mb-1 flex items-center justify-between">
                <span>Step 2: Utilize CGST Credit</span>
                <span className="font-mono text-indigo-700">Utilized: ₹{(results.cgstAgainstCgst + results.cgstAgainstIgst).toLocaleString("en-IN")}</span>
              </div>
              <ul className="list-disc ml-5 text-slate-600 space-y-0.5">
                <li>Against remaining Output CGST: ₹{results.cgstAgainstCgst.toLocaleString("en-IN")}</li>
                <li>Against remaining Output IGST: ₹{results.cgstAgainstIgst.toLocaleString("en-IN")}</li>
                <li className="italic text-slate-400">Note: CGST credit can NEVER be set off against SGST.</li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-semibold text-slate-800 mb-1 flex items-center justify-between">
                <span>Step 3: Utilize SGST Credit</span>
                <span className="font-mono text-indigo-700">Utilized: ₹{(results.sgstAgainstSgst + results.sgstAgainstIgst).toLocaleString("en-IN")}</span>
              </div>
              <ul className="list-disc ml-5 text-slate-600 space-y-0.5">
                <li>Against remaining Output SGST: ₹{results.sgstAgainstSgst.toLocaleString("en-IN")}</li>
                <li>Against remaining Output IGST: ₹{results.sgstAgainstIgst.toLocaleString("en-IN")}</li>
                <li className="italic text-slate-400">Note: SGST credit can NEVER be set off against CGST.</li>
              </ul>
            </div>
          </div>

          {/* Month-End Double Entry Preview */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-2">
              Month-End Double-Entry Journal Entry in Books (GSTR-3B Adjustment):
            </h4>
            <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs leading-relaxed overflow-x-auto">
              <div>Output IGST A/c .................. Dr. ₹{(outputIgst - results.remOutputIgst).toLocaleString("en-IN")}</div>
              <div>Output CGST A/c .................. Dr. ₹{(outputCgst - results.remOutputCgst).toLocaleString("en-IN")}</div>
              <div>Output SGST A/c .................. Dr. ₹{(outputSgst - results.remOutputSgst).toLocaleString("en-IN")}</div>
              <div className="pl-6 text-slate-300">To Input IGST A/c .................... Cr. ₹{(inputIgst - results.remInputIgst).toLocaleString("en-IN")}</div>
              <div className="pl-6 text-slate-300">To Input CGST A/c .................... Cr. ₹{(inputCgst - results.remInputCgst).toLocaleString("en-IN")}</div>
              <div className="pl-6 text-slate-300">To Input SGST A/c .................... Cr. ₹{(inputSgst - results.remInputSgst).toLocaleString("en-IN")}</div>
              <div className="text-[11px] text-emerald-400 mt-2 font-sans italic">
                (Being adjustment of Output Tax against Input Tax Credit as per Rule 88A of CGST Rules before GSTR-3B filing)
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Net Final Summary Cards */}
        <div className="space-y-4">
          {/* Net Cash Payable Card */}
          <div className={`p-5 rounded-2xl border ${results.totalCashPayable > 0 ? "bg-amber-50/60 border-amber-300" : "bg-emerald-50/60 border-emerald-300"}`}>
            <div className="flex items-center gap-2 mb-2">
              {results.totalCashPayable > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              )}
              <h3 className="text-sm font-bold text-slate-900">
                {results.totalCashPayable > 0 ? "Net GST Cash Payable" : "No Cash Payment Needed"}
              </h3>
            </div>

            <div className="text-2xl font-bold font-mono text-slate-900 my-2">
              ₹{results.totalCashPayable.toLocaleString("en-IN")}
            </div>

            {results.totalCashPayable > 0 ? (
              <div className="text-xs text-slate-600 space-y-1">
                <p>Deposit via NetBanking on GST portal using <strong>Challan PMT-06</strong>:</p>
                <div className="grid grid-cols-3 gap-1 pt-1 font-mono font-semibold">
                  <div className="p-1 bg-white rounded border border-amber-200 text-center">
                    <span className="block text-[10px] text-slate-400">IGST</span>
                    <span>₹{results.remOutputIgst.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="p-1 bg-white rounded border border-amber-200 text-center">
                    <span className="block text-[10px] text-slate-400">CGST</span>
                    <span>₹{results.remOutputCgst.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="p-1 bg-white rounded border border-amber-200 text-center">
                    <span className="block text-[10px] text-slate-400">SGST</span>
                    <span>₹{results.remOutputSgst.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-emerald-800">
                Your available Input Tax Credit fully covers your tax liabilities for this period. Zero cash outflow!
              </p>
            )}
          </div>

          {/* ITC Carried Forward Card */}
          <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-300">
            <h3 className="text-sm font-bold text-blue-900 mb-1">
              ITC Balance Carried Forward
            </h3>
            <p className="text-xs text-blue-700 mb-3">
              Remaining in Electronic Credit Ledger for next month:
            </p>

            <div className="text-xl font-bold font-mono text-blue-950 mb-3">
              ₹{results.totalItcBalance.toLocaleString("en-IN")}
            </div>

            <div className="grid grid-cols-3 gap-1 text-xs font-mono">
              <div className="p-1.5 bg-white rounded border border-blue-200 text-center">
                <span className="block text-[10px] text-slate-400">IGST</span>
                <span className="font-semibold text-slate-800">₹{results.remInputIgst.toLocaleString("en-IN")}</span>
              </div>
              <div className="p-1.5 bg-white rounded border border-blue-200 text-center">
                <span className="block text-[10px] text-slate-400">CGST</span>
                <span className="font-semibold text-slate-800">₹{results.remInputCgst.toLocaleString("en-IN")}</span>
              </div>
              <div className="p-1.5 bg-white rounded border border-blue-200 text-center">
                <span className="block text-[10px] text-slate-400">SGST</span>
                <span className="font-semibold text-slate-800">₹{results.remInputSgst.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
