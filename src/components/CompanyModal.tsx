import React, { useState, useEffect } from "react";
import { Building2, Plus, Check, Trash2, Calendar, ShieldCheck, X, AlertCircle } from "lucide-react";
import { BusinessProfile, CompanyMaster } from "../types";
import { fetchUserCompanies, saveCompany, deleteCompany, companyToProfile } from "../services/companyService";
import { GST_STATE_CODES } from "../services/gstEngine";
import { getCurrentFinancialYear, getSupportedFinancialYears } from "../utils/financialYear";

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: BusinessProfile;
  onSelectCompany: (profile: BusinessProfile) => void;
  userId?: string;
  isOnboarding?: boolean;
}

export const INDIAN_STATES_LIST = Object.entries(GST_STATE_CODES).map(([code, name]) => ({
  code,
  name,
  displayName: `${name} (${code})`,
}));

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSelectCompany,
  userId,
  isOnboarding = false,
}) => {
  const [companies, setCompanies] = useState<CompanyMaster[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string>(currentProfile.companyId || "");
  const [isAddingNew, setIsAddingNew] = useState(isOnboarding);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New company form state — ZERO default assumptions
  const [name, setName] = useState("");
  const [legalConstitution, setLegalConstitution] = useState<any>("Private Limited Company");
  const [gstRegistered, setGstRegistered] = useState(true);
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [state, setState] = useState("");
  const [accountingBasis, setAccountingBasis] = useState<any>("Accrual (Mercantile) Basis");
  const [turnoverBracket, setTurnoverBracket] = useState<any>("Small (₹1 - ₹5 Crores)");
  const [activeFY, setActiveFY] = useState(getCurrentFinancialYear());

  const supportedFYs = getSupportedFinancialYears();

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen]);

  const loadCompanies = async () => {
    setLoading(true);
    const list = await fetchUserCompanies();
    setCompanies(list);
    setLoading(false);
    if (list.length === 0 || isOnboarding) {
      setIsAddingNew(true);
    }
  };

  const handleStateSelect = (code: string) => {
    setStateCode(code);
    const found = INDIAN_STATES_LIST.find((s) => s.code === code);
    setState(found ? found.displayName : "");
  };

  const handleGstinChange = (val: string) => {
    const upper = val.toUpperCase().trim();
    setGstin(upper);
    if (upper.length >= 2) {
      const code = upper.substring(0, 2);
      if (GST_STATE_CODES[code]) {
        setStateCode(code);
        setState(`${GST_STATE_CODES[code]} (${code})`);
      }
    }
    if (upper.length >= 12) {
      setPan(upper.substring(2, 12));
    }
  };

  const handleSelect = (comp: CompanyMaster) => {
    setActiveCompanyId(comp.id);
    const updatedProfile = companyToProfile(comp);
    onSelectCompany(updatedProfile);
    onClose();
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter the business name.");
      return;
    }

    if (!stateCode || !state) {
      setError("Please select the State / Union Territory of registration. Do not leave jurisdiction unselected.");
      return;
    }

    if (gstRegistered && gstin.trim()) {
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.trim())) {
        setError("Invalid GSTIN format. Standard Indian GSTIN is 15 alphanumeric characters (e.g. 07AAACM1234F1Z8).");
        return;
      }
    }

    const newComp: CompanyMaster = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: userId || "user_active",
      name: name.trim(),
      legalConstitution,
      gstin: gstRegistered ? gstin.trim() : undefined,
      pan: pan.trim() || (gstin ? gstin.substring(2, 12) : undefined),
      state,
      stateCode,
      isGstRegistered: gstRegistered,
      accountingBasis,
      turnoverBracket,
      currentFY: activeFY,
      supportedFYs,
      createdAt: new Date().toISOString(),
    };

    try {
      const saved = await saveCompany(newComp);
      if (saved) {
        setCompanies((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
        handleSelect(saved);
        setIsAddingNew(false);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save company profile.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this company? All associated vouchers and registers will be permanently deleted.")) {
      await deleteCompany(id);
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#102A43] border border-[#1E3A56] rounded-2xl w-full max-w-2xl shadow-2xl text-white overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E3A56] flex items-center justify-between bg-[#071A2B]/95">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isOnboarding ? "Welcome to Munim AI — Business Onboarding" : "Multi-Company & Entity Switcher"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isOnboarding
                  ? "Configure your verified business entity to initialize books of accounts & statutory calendars."
                  : "Strict multi-tenant data isolation per company and Financial Year."}
              </p>
            </div>
          </div>
          {!isOnboarding && companies.length > 0 && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1E3A56]/50 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isAddingNew ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Your Registered Entities ({companies.length})</span>
                <button
                  onClick={() => {
                    setError(null);
                    setIsAddingNew(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add New Entity
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400">Loading companies...</div>
              ) : companies.length === 0 ? (
                <div className="py-8 text-center text-slate-400 bg-[#071A2B] rounded-xl border border-[#1E3A56] p-6 space-y-3">
                  <p>No business profile registered. Please complete onboarding to start bookkeeping.</p>
                  <button
                    onClick={() => setIsAddingNew(true)}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                  >
                    Set Up Business Profile
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {companies.map((comp) => {
                    const isSelected = comp.id === activeCompanyId || comp.name === currentProfile.name;
                    return (
                      <div
                        key={comp.id}
                        onClick={() => handleSelect(comp)}
                        className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-[#071A2B] border-cyan-500 shadow-md ring-1 ring-cyan-500/30"
                            : "bg-[#0B2138] border-[#1E3A56] hover:border-slate-500"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{comp.name}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#1E3A56] text-cyan-300 border border-[#2B4C6F]">
                              {comp.legalConstitution}
                            </span>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" /> Active
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-[11px]">
                            {comp.gstin ? (
                              <span>GSTIN: <strong className="text-slate-300 font-mono">{comp.gstin}</strong></span>
                            ) : (
                              <span className="text-amber-400">Unregistered / Composition</span>
                            )}
                            {comp.pan && <span>PAN: <strong className="text-slate-300 font-mono">{comp.pan}</strong></span>}
                            <span>State: <strong className="text-slate-300">{comp.state}</strong></span>
                            <span>FY: <strong className="text-cyan-400 font-mono">{comp.currentFY}</strong></span>
                            <span>Method: <strong className="text-slate-300">{comp.accountingBasis}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pl-3">
                          <button
                            onClick={(e) => handleDelete(e, comp.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition cursor-pointer rounded-lg hover:bg-[#1E3A56]/60"
                            title="Delete Company"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E3A56]">
                <h4 className="font-bold text-white text-sm">
                  {isOnboarding ? "Step 1: Business Identity & Statutory Jurisdiction" : "Add New Business Entity"}
                </h4>
                {!isOnboarding && companies.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Back to List
                  </button>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Business / Firm / Company Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sterling Diagnostics Private Limited"
                  className="w-full bg-[#071A2B] border border-[#1E3A56] rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Legal Constitution *</label>
                  <select
                    value={legalConstitution}
                    onChange={(e) => setLegalConstitution(e.target.value as any)}
                    className="w-full bg-[#071A2B] border border-[#1E3A56] rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Partnership Firm">Partnership Firm</option>
                    <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                    <option value="Private Limited Company">Private Limited Company</option>
                    <option value="Public Limited Company">Public Limited Company</option>
                    <option value="HUF">Hindu Undivided Family (HUF)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Financial Year *</label>
                  <select
                    value={activeFY}
                    onChange={(e) => setActiveFY(e.target.value)}
                    className="w-full bg-[#071A2B] border border-[#1E3A56] rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-cyan-500 font-mono"
                  >
                    {supportedFYs.map((fy) => (
                      <option key={fy} value={fy}>
                        FY {fy}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* State Selection without defaulting to Delhi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">State / Union Territory *</label>
                  <select
                    value={stateCode}
                    onChange={(e) => handleStateSelect(e.target.value)}
                    className="w-full bg-[#071A2B] border border-[#1E3A56] rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-cyan-500"
                    required
                  >
                    <option value="">-- Select State / UT --</option>
                    {INDIAN_STATES_LIST.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GST Registration Status</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGstRegistered(true)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                        gstRegistered
                          ? "bg-cyan-600/30 border-cyan-500 text-cyan-300"
                          : "bg-[#071A2B] border-[#1E3A56] text-slate-400 hover:text-white"
                      }`}
                    >
                      Registered Regular
                    </button>
                    <button
                      type="button"
                      onClick={() => setGstRegistered(false)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                        !gstRegistered
                          ? "bg-cyan-600/30 border-cyan-500 text-cyan-300"
                          : "bg-[#071A2B] border-[#1E3A56] text-slate-400 hover:text-white"
                      }`}
                    >
                      Unregistered / Comp.
                    </button>
                  </div>
                </div>
              </div>

              {gstRegistered && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      GSTIN (15 Digits)
                    </label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => handleGstinChange(e.target.value)}
                      placeholder="e.g. 27AAACS1429B1ZB"
                      maxLength={15}
                      className="w-full bg-[#071A2B] border border-[#1E3A56] rounded-lg px-3 py-2 text-white uppercase focus:outline-hidden focus:border-cyan-500 font-mono tracking-wider"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      State code and PAN are automatically extracted from GSTIN.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">PAN (10 Characters)</label>
                    <input
                      type="text"
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      placeholder="e.g. AAACS1429B"
                      maxLength={10}
                      className="w-full bg-[#071A2B] border border-[#1E3A56] rounded-lg px-3 py-2 text-white uppercase focus:outline-hidden focus:border-cyan-500 font-mono tracking-wider"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Accounting Method</label>
                  <select
                    value={accountingBasis}
                    onChange={(e) => setAccountingBasis(e.target.value as any)}
                    className="w-full bg-[#071A2B] border border-[#1E3A56] rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="Accrual (Mercantile) Basis">Accrual (Mercantile) Basis - Mandatory for Cos & GST</option>
                    <option value="Cash Basis">Cash Basis - Permitted for Professionals</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Turnover Bracket</label>
                  <select
                    value={turnoverBracket}
                    onChange={(e) => setTurnoverBracket(e.target.value as any)}
                    className="w-full bg-[#071A2B] border border-[#1E3A56] rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="Micro (< ₹1 Crore)">Micro (&lt; ₹1 Crore - 44AD Eligible)</option>
                    <option value="Small (₹1 - ₹5 Crores)">Small (₹1 - ₹5 Crores)</option>
                    <option value="Medium (₹5 - ₹25 Crores)">Medium (₹5 - ₹25 Crores)</option>
                    <option value="Enterprise (> ₹25 Crores)">Enterprise (&gt; ₹25 Crores)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1E3A56] flex items-center justify-end gap-3">
                {!isOnboarding && companies.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-4 py-2 rounded-lg bg-[#071A2B] hover:bg-[#1E3A56] text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold cursor-pointer shadow-md"
                >
                  {isOnboarding ? "Complete Onboarding & Enter Munim" : "Save & Switch to Entity"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
