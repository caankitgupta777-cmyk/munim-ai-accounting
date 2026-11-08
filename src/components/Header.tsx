import React, { useState } from "react";
import {
  BookOpen,
  Calculator,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  Check,
  Calendar,
  FileSpreadsheet,
  Database,
  Smartphone,
  ChevronDown,
  ArrowRight,
  Globe,
  MessageSquarePlus,
} from "lucide-react";
import { BusinessProfile, AppTab, Language } from "../types";
import { MunimLogo } from "./MunimLogo";
import { FeedbackModal } from "./FeedbackModal";
import { CompanyModal } from "./CompanyModal";

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  profile: BusinessProfile;
  setProfile: React.Dispatch<React.SetStateAction<BusinessProfile>>;
  onOpenAndroidModal?: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  profile,
  setProfile,
  onOpenAndroidModal,
  language,
  setLanguage,
}) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [tempProfile, setTempProfile] = useState<BusinessProfile>(profile);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);

  const saveProfile = () => {
    setProfile(tempProfile);
    setShowProfileModal(false);
  };

  const handleNavClick = (sectionId: string) => {
    if (activeTab !== "home") {
      setActiveTab("home");
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <header className="bg-[#071A2B] border-b border-[#1E3A56] sticky top-0 z-40 backdrop-blur-md bg-[#071A2B]/95 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
            {/* Logo and Brand */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setActiveTab("home")}
            >
              <MunimLogo size="md" animated={true} />
              <div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                    Munim <span className="text-cyan-400">AI</span>
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    - Made by <span className="text-cyan-300 font-semibold">CA Ankit Gupta</span>
                  </span>
                  <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#102A43] text-cyan-300 border border-[#1E3A56]">
                    Your AI Accountant
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Ask questions • Understand accounts • Better financial decisions
                </p>
              </div>
            </div>

            {/* Middle Nav Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-xs font-semibold text-slate-300">
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === "home"
                    ? "text-cyan-300 bg-[#102A43] border border-[#1E3A56]"
                    : "hover:text-white hover:bg-[#102A43]/50"
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => handleNavClick("what-munim-does")}
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#102A43]/50 transition cursor-pointer"
              >
                What Munim AI Does
              </button>
              <button
                type="button"
                onClick={() => handleNavClick("features")}
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#102A43]/50 transition cursor-pointer"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => handleNavClick("examples")}
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#102A43]/50 transition cursor-pointer"
              >
                Examples
              </button>
              <button
                type="button"
                onClick={() => handleNavClick("faq")}
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#102A43]/50 transition cursor-pointer"
              >
                FAQ
              </button>

              {/* Tools Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                    activeTab !== "home"
                      ? "text-cyan-300 bg-[#102A43] border-cyan-500/40"
                      : "text-slate-300 border-[#1E3A56] hover:bg-[#102A43]"
                  }`}
                >
                  <span>Tools</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showToolsDropdown && (
                  <div
                    className="absolute left-0 mt-2 w-56 rounded-xl bg-[#0D263D] border border-[#1E3A56] shadow-2xl p-1.5 space-y-1 z-50 text-xs"
                    onMouseLeave={() => setShowToolsDropdown(false)}
                  >
                    <button
                      onClick={() => {
                        setActiveTab("chat");
                        setShowToolsDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${
                        activeTab === "chat" ? "bg-blue-600/30 text-cyan-300" : "text-slate-300 hover:bg-[#102A43]"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>✨ Ask Munim (AI Chat)</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("financials");
                        setShowToolsDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${
                        activeTab === "financials" ? "bg-blue-600/30 text-cyan-300" : "text-slate-300 hover:bg-[#102A43]"
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>📊 Balance Sheet & P&L</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("gst");
                        setShowToolsDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${
                        activeTab === "gst" ? "bg-blue-600/30 text-cyan-300" : "text-slate-300 hover:bg-[#102A43]"
                      }`}
                    >
                      <Calculator className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>🧮 GST Calculator & Setoff</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("voucher");
                        setShowToolsDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${
                        activeTab === "voucher" ? "bg-blue-600/30 text-cyan-300" : "text-slate-300 hover:bg-[#102A43]"
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>🧾 Voucher Generator</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("calendar");
                        setShowToolsDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${
                        activeTab === "calendar" ? "bg-blue-600/30 text-cyan-300" : "text-slate-300 hover:bg-[#102A43]"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>📅 Tax Calendar</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("queries");
                        setShowToolsDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${
                        activeTab === "queries" ? "bg-blue-600/30 text-cyan-300" : "text-slate-300 hover:bg-[#102A43]"
                      }`}
                    >
                      <Database className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>🗄️ Query Logs</span>
                    </button>
                  </div>
                )}
              </div>
            </nav>

            {/* Right Side: Language Selector + Try Munim CTA + Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Selector: EN | हिन्दी | मराठी */}
              <div className="flex items-center bg-[#102A43] border border-[#1E3A56] p-0.5 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    language === "en"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="English"
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("hi")}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    language === "hi"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="हिन्दी (Hindi)"
                >
                  हिन्दी
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("mr")}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    language === "mr"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="मराठी (Marathi)"
                >
                  मराठी
                </button>
              </div>

              {/* Business Profile / Company Switcher Chip */}
              <button
                id="btn-profile-badge"
                onClick={() => setShowCompanyModal(true)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1E3A56] bg-[#102A43] hover:bg-[#163656] text-xs text-slate-300 transition cursor-pointer"
                title="Switch Business Entity / Financial Year"
              >
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold text-white max-w-[130px] truncate">{profile.name || profile.entityType}</span>
                <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">Entities</span>
              </button>

              {/* Beta Feedback Button */}
              <button
                type="button"
                onClick={() => setShowFeedbackModal(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition cursor-pointer shadow-xs"
                title="Submit Beta Feedback or Bug Report"
              >
                <MessageSquarePlus className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Feedback</span>
              </button>

              {/* Try Munim AI Primary CTA */}
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "chat" ? "financials" : "chat")}
                className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-cyan-500/20 transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>{activeTab === "home" ? "Try Munim AI →" : "✨ Ask Munim"}</span>
              </button>

              {/* Mobile Tool Navigation Menu Button */}
              <button
                type="button"
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                className="md:hidden p-2 rounded-xl bg-[#102A43] border border-[#1E3A56] text-slate-300"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Business Profile Modal (Styled in Dark Navy) */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#102A43] text-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#1E3A56] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E3A56]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Configure Business Profile</h2>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-white text-xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2 mb-4">
              Munim AI tailors accounting entries, TDS thresholds, GST rules, and Ind AS applicability based on your legal constitution.
            </p>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Legal Entity Constitution
                </label>
                <select
                  value={tempProfile.entityType}
                  onChange={(e) =>
                    setTempProfile({
                      ...tempProfile,
                      entityType: e.target.value as any,
                    })
                  }
                  className="w-full bg-[#071A2B] border border-[#1E3A56] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Partnership Firm">Partnership Firm</option>
                  <option value="LLP (Limited Liability Partnership)">LLP (Limited Liability Partnership)</option>
                  <option value="Private Limited Company">Private Limited Company</option>
                  <option value="One Person Company (OPC)">One Person Company (OPC)</option>
                  <option value="Public Limited Company">Public Limited Company</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  GST Registration Status
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTempProfile({ ...tempProfile, gstRegistered: true })}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                      tempProfile.gstRegistered
                        ? "bg-blue-600/30 border-cyan-500 text-cyan-300"
                        : "bg-[#071A2B] border-[#1E3A56] text-slate-400 hover:text-white"
                    }`}
                  >
                    GST Registered Regular
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempProfile({ ...tempProfile, gstRegistered: false })}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                      !tempProfile.gstRegistered
                        ? "bg-blue-600/30 border-cyan-500 text-cyan-300"
                        : "bg-[#071A2B] border-[#1E3A56] text-slate-400 hover:text-white"
                    }`}
                  >
                    Composition / Non-GST
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Accounting Standard Basis
                </label>
                <select
                  value={tempProfile.accountingBasis}
                  onChange={(e) =>
                    setTempProfile({
                      ...tempProfile,
                      accountingBasis: e.target.value as any,
                    })
                  }
                  className="w-full bg-[#071A2B] border border-[#1E3A56] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="Accrual (Mercantile) Basis">Accrual (Mercantile) Basis - Mandatory for Cos & GST</option>
                  <option value="Cash Basis">Cash Basis - Permitted for Professionals</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Annual Turnover Bracket
                </label>
                <select
                  value={tempProfile.turnoverBracket}
                  onChange={(e) =>
                    setTempProfile({
                      ...tempProfile,
                      turnoverBracket: e.target.value as any,
                    })
                  }
                  className="w-full bg-[#071A2B] border border-[#1E3A56] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="Micro (< ₹1 Crore)">Micro (&lt; ₹1 Crore - 44AD Eligible)</option>
                  <option value="Small (₹1 Cr - ₹10 Cr)">Small (₹1 Cr - ₹10 Cr - Audit rules apply)</option>
                  <option value="Medium (₹10 Cr - ₹50 Cr)">Medium (₹10 Cr - ₹50 Cr)</option>
                  <option value="Large (> ₹50 Cr)">Large (&gt; ₹50 Cr - e-Invoicing mandatory)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-[#1E3A56]">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveProfile}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Company / Entity Switcher Modal */}
      <CompanyModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        currentProfile={profile}
        onSelectCompany={(newProfile) => {
          setProfile(newProfile);
          setTempProfile(newProfile);
        }}
      />

      {/* Beta Feedback & Bug Reporting Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        activeModule={activeTab}
      />
    </>
  );
};
