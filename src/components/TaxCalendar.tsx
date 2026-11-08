import React, { useState, useMemo } from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  Filter, 
  Building2, 
  ShieldAlert, 
  FileText, 
  Receipt, 
  ChevronRight,
  Sparkles,
  Info,
  CalendarDays
} from "lucide-react";
import { BusinessProfile, TaxDeadline } from "../types";
import { TAX_DEADLINES_DATA } from "../data/taxDeadlines";

interface TaxCalendarProps {
  profile: BusinessProfile;
  onSelectAction?: (actionPrompt: string) => void;
}

export const TaxCalendar: React.FC<TaxCalendarProps> = ({ profile, onSelectAction }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [onlyProfileSpecific, setOnlyProfileSpecific] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDeadline, setSelectedDeadline] = useState<TaxDeadline | null>(null);
  const [selectedTaxYear, setSelectedTaxYear] = useState<string>("2026-27");
  const [selectedFrequency, setSelectedFrequency] = useState<string>("All");
  const [selectedTaxpayerType, setSelectedTaxpayerType] = useState<string>("All");

  // Dynamic reference date from system runtime (supports current real-world date)
  const today = useMemo(() => new Date(), []);

  // Filter deadlines based on business profile eligibility, category, search, frequency, and tax year
  const filteredDeadlines = useMemo(() => {
    return TAX_DEADLINES_DATA.filter((deadline) => {
      // 1. Profile eligibility check
      if (onlyProfileSpecific && !deadline.isEligibleForProfile(profile)) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== "All" && deadline.category !== selectedCategory) {
        return false;
      }

      // 3. Frequency filter
      if (selectedFrequency !== "All" && deadline.frequency !== selectedFrequency) {
        return false;
      }

      // 4. Taxpayer Type filter
      if (selectedTaxpayerType !== "All") {
        if (selectedTaxpayerType === "Corporate" && !deadline.applicableCondition.toLowerCase().includes("company") && !deadline.applicableCondition.toLowerCase().includes("corporate")) {
          return false;
        }
        if (selectedTaxpayerType === "MSME" && !deadline.applicableCondition.toLowerCase().includes("msme") && !deadline.title.toLowerCase().includes("msme")) {
          return false;
        }
      }

      // 5. Search query
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const matches = 
          deadline.title.toLowerCase().includes(query) ||
          deadline.formOrChallan.toLowerCase().includes(query) ||
          deadline.applicableCondition.toLowerCase().includes(query) ||
          deadline.actionSummary.toLowerCase().includes(query);
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [profile, onlyProfileSpecific, selectedCategory, selectedFrequency, selectedTaxpayerType, searchTerm]);

  // Utility to calculate days remaining
  const getDaysRemaining = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format date readable in Indian format: e.g. "07 Oct 2026 (Wednesday)"
  const formatIndianDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      weekday: "short",
    });
  };

  // Group stats
  const stats = useMemo(() => {
    const eligibleAll = TAX_DEADLINES_DATA.filter(d => d.isEligibleForProfile(profile));
    const gstCount = eligibleAll.filter(d => d.category === "GST").length;
    const tdsCount = eligibleAll.filter(d => d.category === "TDS").length;
    const advanceTaxCount = eligibleAll.filter(d => d.category === "Advance Tax").length;
    
    // Nearest deadline
    const nearest = eligibleAll
      .map(d => ({ ...d, daysLeft: getDaysRemaining(d.dueDate) }))
      .filter(d => d.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft)[0];

    return {
      total: eligibleAll.length,
      gstCount,
      tdsCount,
      advanceTaxCount,
      nearest,
    };
  }, [profile]);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      {/* Top Banner / Context Overview */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <CalendarIcon className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Indian Statutory Tax & Filing Calendar
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time statutory timeline for GST, TDS/TCS, Advance Tax, and Tax Audits tuned to your profile.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span><strong>{profile.entityType}</strong></span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-emerald-700" />
              <span>{profile.gstRegistered ? "Regular GST Filer" : "Composition / Exempt"}</span>
            </div>

            {stats.nearest && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  Next: <strong>{stats.nearest.formOrChallan}</strong> in <strong>{stats.nearest.daysLeft} days</strong> ({stats.nearest.dueDate})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Official Portal Verification & Government Links */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Statutory compliance dates synchronized with official portals:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://www.incometax.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200 transition"
            >
              <span>🏛️ incometax.gov.in</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.gst.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 transition"
            >
              <span>🧾 gst.gov.in</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.tdscpc.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold border border-purple-200 transition"
            >
              <span>📂 tdscpc.gov.in (TRACES)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Personalized Compliance Impact Alert */}
        <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-900">Personalized Compliance Filter Active: </strong>
            Showing filings tailored for a <strong>{profile.turnoverBracket}</strong> enterprise under <strong>{profile.accountingBasis}</strong> in <strong>{profile.state}</strong>. 
            {!profile.gstRegistered ? (
              <span className="text-amber-800 ml-1">
                Because GST is marked Non-Registered/Composition, monthly regular GSTR-1 and GSTR-3B filings are excluded from your primary list.
              </span>
            ) : profile.turnoverBracket === "Micro (< ₹1 Crore)" ? (
              <span className="text-emerald-800 ml-1">
                Eligible for the QRMP (Quarterly Returns and Monthly Payment) scheme, allowing quarterly GSTR-3B filings with monthly PMT-06 challans.
              </span>
            ) : (
              <span className="text-emerald-800 ml-1">
                Subject to mandatory monthly GSTR-1 (due 11th) and monthly GSTR-3B with Rule 88A set-off (due 20th).
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {["All", "GST", "TDS", "Advance Tax", "ITR & Audit"].map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? "bg-emerald-800 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                  {cat === "GST" && ` (${stats.gstCount})`}
                  {cat === "TDS" && ` (${stats.tdsCount})`}
                  {cat === "Advance Tax" && ` (${stats.advanceTaxCount})`}
                </button>
              );
            })}
          </div>

          {/* Search input & Profile toggle */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="relative flex-1 sm:w-60">
              <input
                type="text"
                placeholder="Search form, challan, section..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              />
            </div>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={onlyProfileSpecific}
                onChange={(e) => setOnlyProfileSpecific(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span className="font-medium">My Profile Only</span>
            </label>
          </div>
        </div>

        {/* Dynamic Tax Regime & Filing Frequency Selectors */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="font-semibold text-slate-700">Tax Regime / Year:</span>
            <select
              value={selectedTaxYear}
              onChange={(e) => setSelectedTaxYear(e.target.value)}
              className="py-1 px-2 border border-slate-200 rounded-md bg-slate-50 text-slate-800 font-medium"
            >
              <option value="2026-27">Tax Year 2026-27 (Income-tax Act, 2025 Transition)</option>
              <option value="2025-26">FY 2025-26 / AY 2026-27 (Income-tax Act, 1961)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="font-semibold text-slate-700">Filing Cycle:</span>
            <select
              value={selectedFrequency}
              onChange={(e) => setSelectedFrequency(e.target.value)}
              className="py-1 px-2 border border-slate-200 rounded-md bg-slate-50 text-slate-800 font-medium"
            >
              <option value="All">All Frequencies (Monthly + Quarterly + Annual)</option>
              <option value="Monthly">Monthly Regular (GSTR-1, GSTR-3B, TDS)</option>
              <option value="Quarterly">Quarterly / QRMP (IFF, CMP-08, PMT-06)</option>
              <option value="Annual">Annual / Audits (Form 3CA/3CD, GSTR-9)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="font-semibold text-slate-700">Assessee Class:</span>
            <select
              value={selectedTaxpayerType}
              onChange={(e) => setSelectedTaxpayerType(e.target.value)}
              className="py-1 px-2 border border-slate-200 rounded-md bg-slate-50 text-slate-800 font-medium"
            >
              <option value="All">All Taxpayer Entities</option>
              <option value="Corporate">Corporate / Companies</option>
              <option value="MSME">MSME Registered Enterprises</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Deadlines Timeline / Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Deadlines List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Upcoming Deadlines ({filteredDeadlines.length})
            </h3>
            <span className="text-[11px] text-slate-400">Sorted chronologically</span>
          </div>

          {filteredDeadlines.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No deadlines match your filter</p>
              <p className="text-xs text-slate-500 mt-1">
                Try unchecking "My Profile Only" or resetting the search filter.
              </p>
            </div>
          ) : (
            filteredDeadlines.map((deadline) => {
              const daysLeft = getDaysRemaining(deadline.dueDate);
              const isUrgent = daysLeft <= 15 && daysLeft >= 0;
              const isSelected = selectedDeadline?.id === deadline.id;

              return (
                <div
                  key={deadline.id}
                  onClick={() => setSelectedDeadline(deadline)}
                  className={`bg-white rounded-xl p-4 border transition cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? "border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs"
                      : isUrgent
                      ? "border-amber-300 hover:border-amber-400 shadow-2xs"
                      : "border-slate-200 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          deadline.category === "GST"
                            ? "bg-blue-100 text-blue-800"
                            : deadline.category === "TDS"
                            ? "bg-purple-100 text-purple-800"
                            : deadline.category === "Advance Tax"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {deadline.formOrChallan}
                        </span>

                        <span className="text-[11px] font-medium text-slate-500 px-2 py-0.5 bg-slate-100 rounded">
                          {deadline.frequency}
                        </span>

                        {isUrgent && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3" /> Due Soon ({daysLeft} days)
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 pt-0.5">
                        {deadline.title}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {deadline.actionSummary}
                      </p>
                    </div>

                    {/* Date Badge */}
                    <div className="text-right shrink-0 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 min-w-[90px]">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">
                        Due Date
                      </span>
                      <span className="block text-base font-extrabold text-slate-900 font-mono">
                        {deadline.dueDate.slice(8, 10)} {new Date(deadline.dueDate).toLocaleString('en', { month: 'short' })}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-medium">
                        {deadline.dueDate.slice(0, 4)}
                      </span>
                    </div>
                  </div>

                  {/* Footnote details */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate pr-2">
                      <strong>Period:</strong> {deadline.periodCovered}
                    </span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-0.5 shrink-0 hover:underline">
                      <span>View Compliance Guide</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Drilldown & Statutory Penalties */}
        <div className="space-y-4">
          {/* Card: Selected or Recommended Action */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs sticky top-20">
            {selectedDeadline ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Selected Filing Detail
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {selectedDeadline.formOrChallan}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    {formatIndianDate(selectedDeadline.dueDate)}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">Full Description</label>
                    <p className="text-slate-600 leading-relaxed">{selectedDeadline.title}</p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">Applicability & Condition</label>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      {selectedDeadline.applicableCondition}
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-rose-900 flex items-center gap-1 mb-0.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      <span>Statutory Interest & Late Fees for Non-Compliance</span>
                    </label>
                    <p className="text-rose-900/90 bg-rose-50 p-2.5 rounded-lg border border-rose-200 leading-snug">
                      {selectedDeadline.interestOrPenaltyNote}
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">Recommended Action</label>
                    <p className="text-slate-600 leading-relaxed">
                      {selectedDeadline.actionSummary}
                    </p>
                  </div>

                  <div className="pt-2">
                    <label className="font-bold text-slate-700 block mb-1">Official Portal</label>
                    <a
                      href={selectedDeadline.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg border border-emerald-200 transition w-full justify-center"
                    >
                      <span>File on {selectedDeadline.portalLinkText}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {onSelectAction && (
                    <button
                      onClick={() => onSelectAction(`Explain the statutory double-entry accounting entries, ledger reconciliations, and penalty calculations for ${selectedDeadline.formOrChallan} due on ${selectedDeadline.dueDate}.`)}
                      className="w-full mt-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ask Munim AI about {selectedDeadline.formOrChallan}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Select a deadline to view breakdown
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Click any card on the left to inspect statutory rules, Section 234/Section 47 interest, portal links, and audit actions.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Golden Rules of Filing Card */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 text-xs space-y-2.5">
            <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>CA Golden Rules for GST & TDS Returns</span>
            </h4>
            <ul className="space-y-1.5 text-slate-300 leading-relaxed text-[11px] list-disc ml-4">
              <li><strong>TDS Deposit:</strong> Always deposit TDS by the 7th via Challan 281 before filing quarterly 26Q/24Q returns.</li>
              <li><strong>GSTR-2B Matching:</strong> Never claim ITC without confirming invoice appearance in auto-drafted GSTR-2B.</li>
              <li><strong>Rule 88A Optimization:</strong> Exhaust IGST credit completely before touching CGST or SGST ledgers.</li>
              <li><strong>45-Day MSME Rule:</strong> Clear MSE vendor bills within 45 days (or 15 days without agreement) to protect business expense deductions u/s 43B(h).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
