import React, { useState } from "react";
import { BookOpen, ShieldAlert, FileSpreadsheet, CheckCircle, Scale, AlertTriangle, Layers, Calendar } from "lucide-react";
import { TDS_SECTIONS_GUIDE, GST_ITC_RULES, IND_AS_OVERVIEW } from "../data/accountingData";

export const ComplianceGuide: React.FC = () => {
  const [subTab, setSubTab] = useState<"indas" | "tds" | "msme" | "gst" | "itr">("msme");

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      {/* Navigation Sub-Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "msme", label: "Section 43B(h) MSME Rule", icon: ShieldAlert },
          { id: "tds", label: "TDS Sections & Rates", icon: FileSpreadsheet },
          { id: "indas", label: "Ind AS Standards vs AS", icon: Scale },
          { id: "gst", label: "GST ITC & Blocked Credits", icon: Layers },
          { id: "itr", label: "ITR Form & Presumptive Tax", icon: Calendar },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. MSME Section 43B(h) Guide */}
      {subTab === "msme" && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-600 text-white shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-950">
                  Section 43B(h) MSME 45-Day Payment Mandate (Finance Act 2023)
                </h3>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  To ensure timely payments to Micro and Small Enterprises (MSEs), any sum payable to an MSE supplier beyond the time limit specified in Section 15 of the MSMED Act 2006 will be <strong>disallowed as an expense in that financial year</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                1. Statutory Deadlines
              </h4>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc ml-4">
                <li><strong>No Written Agreement:</strong> Must pay within <strong>15 days</strong> from delivery of goods/services.</li>
                <li><strong>With Written Agreement:</strong> Allowed up to agreed period, but <strong>cannot exceed 45 days</strong>.</li>
                <li>Any agreement clause claiming &gt;45 days is legally void.</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                2. Who is Covered?
              </h4>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc ml-4">
                <li><strong>Applicable To:</strong> Registered <strong>Micro</strong> (Investment ≤ ₹1 Cr, Turnover ≤ ₹5 Cr) and <strong>Small</strong> (Investment ≤ ₹10 Cr, Turnover ≤ ₹50 Cr) enterprises with active Udyam registration.</li>
                <li><strong>Not Applicable:</strong> Medium enterprises and Traders/Retailers (NIC codes 45, 46, 47) unless specified.</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                3. Tax Impact & Remedy
              </h4>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc ml-4">
                <li><strong>Disallowance:</strong> If unpaid by March 31 beyond the 15/45-day window, added back to net profit. Tax must be paid on this amount!</li>
                <li><strong>Subsequent Deduction:</strong> Allowed as deduction in the next financial year in which actual payment is made.</li>
              </ul>
            </div>
          </div>

          {/* Double Entry Accounting Impact */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              Accounting & Audit Procedure:
            </h4>
            <div className="space-y-2 text-xs text-slate-700">
              <p>1. <strong>Udyam Declaration:</strong> Collect Udyam Registration Certificates from all vendors at onboarding to identify Micro/Small enterprises.</p>
              <p>2. <strong>Year-End Reconciliation:</strong> Prepare an aging schedule of outstanding Sundry Creditors as of 31st March, flagging any invoices exceeding 15 or 45 days.</p>
              <p>3. <strong>Tax Audit Disclosure (Form 3CD Clause 22):</strong> The Statutory Auditor must report all disallowances and compound interest payable under Section 16 of the MSMED Act (3 times bank rate).</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. TDS Guide */}
      {subTab === "tds" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Key TDS Sections for Indian Small Businesses (FY 2024-25 & 2025-26)
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                Challan 281 Due Date: 7th of following month
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700 uppercase">
                    <th className="py-2.5 px-3">ITA 1961</th>
                    <th className="py-2.5 px-3">ITA 2025 Transition</th>
                    <th className="py-2.5 px-3">Nature of Payment</th>
                    <th className="py-2.5 px-3">Threshold Limit</th>
                    <th className="py-2.5 px-3">TDS Rate</th>
                    <th className="py-2.5 px-3">Key Accounting Rule & Disallowance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {TDS_SECTIONS_GUIDE.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-emerald-800">Sec {item.section}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.section2025 || "Sec 393"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{item.nature}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">{item.threshold}</td>
                      <td className="py-2.5 px-3 font-semibold text-indigo-700">{item.rate}</td>
                      <td className="py-2.5 px-3 text-slate-600 leading-snug">{item.keyRule}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              <strong>Crucial Circular (CBDT No. 23/2017):</strong> If GST on services has been indicated separately in the invoice, TDS is deducted <em>only on the base value excluding GST</em>. If GST is not separately shown, TDS must be deducted on the gross total.
            </div>
          </div>
        </div>
      )}

      {/* 3. Ind AS vs AS Standards */}
      {subTab === "indas" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Ind AS (Indian Accounting Standards) Framework vs AS for MSMEs
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Ind AS</strong> are converged with IFRS (International Financial Reporting Standards) and are mandatory for listed companies and unlisted companies with net worth ≥ ₹250 Crores. Non-corporate small entities (proprietorships, partnerships, LLPs) follow ICAI Accounting Standards (AS), but applying Ind AS principles ensures that your books are compliant with institutional investors and high-growth benchmarks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {IND_AS_OVERVIEW.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                      {item.code}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                    {item.coreEssence}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. GST ITC & Blocked Credits */}
      {subTab === "gst" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              GST Input Tax Credit (ITC) Rules & Section 17(5) Blocked Credits
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Claiming eligible ITC reduces your tax bill, while erroneously claiming blocked credits under Section 17(5) attracts penalty and 18% interest under Section 50.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GST_ITC_RULES.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{item.rule}</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Income Tax & ITR Guide */}
      {subTab === "itr" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Income Tax Returns (ITR) & Presumptive Taxation Guide
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50/30">
                <span className="font-bold text-emerald-900 text-sm block mb-1">
                  Section 44AD (Small Businesses & Traders)
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Turnover up to <strong>₹2 Crores</strong> (enhanced to <strong>₹3 Crores</strong> if 95% receipts are digital). Declare net income at <strong>6%</strong> on digital turnover and <strong>8%</strong> on cash turnover. No requirement to maintain regular books of accounts or undergo tax audit under Section 44AB.
                </p>
                <div className="mt-2 text-slate-600 font-semibold">Form: ITR-4 (Sugam)</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-blue-50/30">
                <span className="font-bold text-blue-900 text-sm block mb-1">
                  Section 44ADA (Specified Professionals)
                </span>
                <p className="text-slate-700 leading-relaxed">
                  For freelance professionals, CAs, lawyers, doctors, engineers, and interior decorators with gross receipts up to <strong>₹50 Lakhs</strong> (enhanced to <strong>₹75 Lakhs</strong> if 95% receipts are digital). Deemed profit is <strong>50%</strong> of gross receipts.
                </p>
                <div className="mt-2 text-slate-600 font-semibold">Form: ITR-4 (Sugam)</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-900 text-sm block mb-1">
                  Regular Books & Audit (ITR-3 / ITR-5 / ITR-6)
                </span>
                <p className="text-slate-700 leading-relaxed">
                  For businesses with turnover &gt; ₹10 Crores (if 95% transactions are digital) or &gt; ₹1 Crore (if cash transactions exceed 5%). Full double-entry balance sheet and profit & loss statement prepared and audited by a Chartered Accountant under Section 44AB.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-900 text-sm block mb-1">
                  Advance Tax Schedule (Quarterly Deadlines)
                </span>
                <p className="text-slate-700 leading-relaxed">
                  If tax liability exceeds ₹10,000 in FY:
                </p>
                <ul className="list-disc ml-4 mt-1 space-y-0.5 text-slate-600">
                  <li>By 15th June: 15%</li>
                  <li>By 15th September: 45%</li>
                  <li>By 15th December: 75%</li>
                  <li>By 15th March: 100%</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
