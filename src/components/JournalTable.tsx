import React, { useState } from "react";
import { Copy, Check, Shield, FileText } from "lucide-react";
import { JournalEntryLine, StructuredVoucher } from "../types";

interface JournalTableProps {
  voucher: StructuredVoucher;
}

export const JournalTable: React.FC<JournalTableProps> = ({ voucher }) => {
  const [copied, setCopied] = useState(false);

  const copyAsTallyFormat = () => {
    let text = `=== VOUCHER TYPE: ${voucher.voucherType.toUpperCase()} ===\n`;
    text += `Date: ${new Date().toLocaleDateString("en-IN")}\n`;
    text += `Particulars\tDr/Cr\tDebit (INR)\tCredit (INR)\n`;
    text += `--------------------------------------------------------\n`;
    voucher.entries.forEach((e) => {
      const isDr = e.debitAmount > 0;
      text += `${e.accountName}\t${isDr ? "Dr." : "Cr."}\t${e.debitAmount || ""}\t${e.creditAmount || ""}\n`;
    });
    text += `--------------------------------------------------------\n`;
    text += `Total\t\t₹${voucher.totalDebit.toLocaleString("en-IN")}\t₹${voucher.totalCredit.toLocaleString("en-IN")}\n`;
    text += `Narration: ${voucher.narration}\n`;
    if (voucher.indAsReference) {
      text += `Ind AS Standard: ${voucher.indAsReference.standardCode} - ${voucher.indAsReference.title}\n`;
    }
    if (voucher.incomeTaxRule) {
      text += `Income Tax Rule: ${voucher.incomeTaxRule}\n`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Asset":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Expense":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Liability":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Revenue":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Equity":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const isBalanced = Math.abs(voucher.totalDebit - voucher.totalCredit) < 0.01;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs mt-3">
      {/* Voucher Header Bar */}
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-800 text-white tracking-wide uppercase">
            {voucher.voucherType || "Journal Voucher"}
          </span>
          {isBalanced ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Check className="w-3 h-3" /> Balanced (Dr = Cr)
            </span>
          ) : (
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-300">
              ⚠️ Unbalanced (Difference: ₹{Math.abs(voucher.totalDebit - voucher.totalCredit).toFixed(2)})
            </span>
          )}
          {voucher.validationStatus && !voucher.validationStatus.isValid && (
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
              Validation Failed ({voucher.validationStatus.errors?.length || 1} Error)
            </span>
          )}
          {voucher.validationStatus && (
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Confidence: {voucher.validationStatus.confidence}%
            </span>
          )}
        </div>

        <button
          onClick={copyAsTallyFormat}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition shadow-2xs"
          title="Copy for Tally Prime, Zoho Books, or Excel"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy for Tally / Excel</span>
            </>
          )}
        </button>
      </div>

      {/* Validation Errors & Warnings Alert Box */}
      {voucher.validationStatus && voucher.validationStatus.errors && voucher.validationStatus.errors.length > 0 && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-rose-50 border border-rose-300 text-xs text-rose-900">
          <div className="font-bold flex items-center gap-1.5 text-rose-800 mb-1">
            <span>⛔ Accounting Validation Errors (Voucher Rejected):</span>
          </div>
          <ul className="list-disc list-inside space-y-1 font-sans">
            {voucher.validationStatus.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {voucher.validationStatus && voucher.validationStatus.warnings && voucher.validationStatus.warnings.length > 0 && (
        <div className="mx-4 mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <div className="font-semibold text-amber-800 mb-1">⚠️ Accounting Review Advisory:</div>
          <ul className="list-disc list-inside space-y-0.5 font-sans">
            {voucher.validationStatus.warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Double Entry Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs sm:text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100 text-slate-800 text-xs uppercase tracking-wider font-bold">
              <th className="py-3 px-4">Account Head</th>
              <th className="py-3 px-3">Nature</th>
              <th className="py-3 px-4 text-right">Debit (₹)</th>
              <th className="py-3 px-4 text-right">Credit (₹)</th>
              <th className="py-3 px-4 hidden md:table-cell">Why this Debit/Credit?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {voucher.entries.map((entry, idx) => {
              const isDr = entry.debitAmount > 0;
              return (
                <tr key={idx} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-sans font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className={isDr ? "font-bold text-slate-950" : "pl-6 text-slate-800"}>
                        {isDr ? "" : "To "}
                        {entry.accountName}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${isDr ? "bg-blue-100 text-blue-900" : "bg-purple-100 text-purple-900"}`}>
                        {isDr ? "Dr." : "Cr."}
                      </span>
                    </div>
                    {/* Mobile visible reason */}
                    <div className="text-[11px] text-slate-500 font-sans md:hidden mt-1 pl-1">
                      {entry.reason}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getCategoryColor(
                        entry.category
                      )}`}
                    >
                      {entry.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-950">
                    {entry.debitAmount > 0
                      ? `₹${entry.debitAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-950">
                    {entry.creditAmount > 0
                      ? `₹${entry.creditAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-600 hidden md:table-cell leading-relaxed">
                    {entry.reason}
                  </td>
                </tr>
              );
            })}

            {/* Total Row */}
            <tr className="border-t-2 border-slate-300 bg-slate-100/90 font-bold text-slate-950 text-xs sm:text-sm">
              <td colSpan={2} className="py-3 px-4 font-sans uppercase tracking-wider text-right text-slate-700">
                Total
              </td>
              <td className="py-3 px-4 text-right text-emerald-900 font-mono font-bold">
                ₹{voucher.totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-3 px-4 text-right text-emerald-900 font-mono font-bold">
                ₹{voucher.totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-3 px-4 hidden md:table-cell font-sans font-normal text-xs text-emerald-700">
                {voucher.totalDebit === voucher.totalCredit ? "✓ Balanced as per Rule of Duality" : "⚠️ Unbalanced"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Narration Section */}
      <div className="px-4 py-3 bg-amber-50/40 border-t border-slate-200 text-xs">
        <div className="flex items-start gap-2">
          <FileText className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-slate-800">Narration: </span>
            <span className="italic text-slate-700 font-serif">{voucher.narration}</span>
          </div>
        </div>
      </div>

      {/* Ind AS and Indian Law Compliance Footer */}
      {(voucher.indAsReference || voucher.incomeTaxRule || voucher.gstBreakdown || voucher.tdsBreakdown) && (
        <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {voucher.indAsReference && (
            <div className="flex items-start gap-1.5 p-2 rounded bg-white border border-slate-200">
              <Shield className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">
                  {voucher.indAsReference.standardCode}: {voucher.indAsReference.title}
                </span>
                <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">
                  {voucher.indAsReference.keyPrinciple}
                </p>
              </div>
            </div>
          )}

          {voucher.incomeTaxRule && (
            <div className="flex items-start gap-1.5 p-2 rounded bg-white border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">Income Tax & ITR Rule:</span>
                <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">
                  {voucher.incomeTaxRule}
                </p>
              </div>
            </div>
          )}

          {voucher.gstBreakdown && (
            <div className="flex items-start gap-1.5 p-2 rounded bg-white border border-slate-200 text-[11px]">
              <div>
                <span className="font-bold text-slate-800">GST Breakdown: </span>
                <span>
                  CGST: ₹{voucher.gstBreakdown.cgst} | SGST: ₹{voucher.gstBreakdown.sgst} | IGST: ₹{voucher.gstBreakdown.igst}
                </span>
                <p className="text-slate-600 mt-0.5 font-medium">
                  ITC Status: {voucher.gstBreakdown.itcEligible ? "Eligible under Sec 16" : "Blocked under Sec 17(5)"}
                </p>
              </div>
            </div>
          )}

          {voucher.tdsBreakdown && voucher.tdsBreakdown.applicable && (
            <div className="flex items-start gap-1.5 p-2 rounded bg-white border border-slate-200 text-[11px]">
              <div>
                <span className="font-bold text-slate-800">TDS u/s {voucher.tdsBreakdown.section}: </span>
                <span>
                  Rate {voucher.tdsBreakdown.rate}% (₹{voucher.tdsBreakdown.tdsAmount})
                </span>
                <p className="text-slate-600 mt-0.5">
                  Challan: {voucher.tdsBreakdown.challanCode || "281"} | Due: {voucher.tdsBreakdown.dueDate || "7th of next month"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
