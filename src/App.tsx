import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { HomeLanding } from "./components/HomeLanding";
import { Footer } from "./components/Footer";
import { ChatAdvisor } from "./components/ChatAdvisor";
import { VoucherGenerator } from "./components/VoucherGenerator";
import { GstSetoffSimulator } from "./components/GstSetoffSimulator";
import { TaxCalendar } from "./components/TaxCalendar";
import { FinancialStatements } from "./components/FinancialStatements";
import { ComplianceGuide } from "./components/ComplianceGuide";
import { QuickGstCalculator } from "./components/QuickGstCalculator";
import { QueryDatabaseViewer } from "./components/QueryDatabaseViewer";
import { AndroidAppModal } from "./components/AndroidAppModal";
import { CompanyModal } from "./components/CompanyModal";
import { AdminFeedbackViewer } from "./components/AdminFeedbackViewer";
import { fetchUserCompanies, getActiveCompanyId, companyToProfile } from "./services/companyService";
import { BusinessProfile, AppTab, QueryRecord, Language } from "./types";
import {
  ArrowLeft,
  Calendar,
  FileSpreadsheet,
  Calculator,
  Database,
  Smartphone,
  Sparkles,
  BookOpen,
  ShieldCheck,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [language, setLanguage] = useState<Language>("en");
  const [showAndroidModal, setShowAndroidModal] = useState<boolean>(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [showAdminFeedback, setShowAdminFeedback] = useState<boolean>(false);

  const [profile, setProfile] = useState<BusinessProfile>({
    entityType: "Sole Proprietorship",
    gstRegistered: false,
    turnoverBracket: "Micro (< ₹1 Crore)",
    accountingBasis: "Accrual (Mercantile) Basis",
    state: "",
  });

  useEffect(() => {
    async function initCompany() {
      const companies = await fetchUserCompanies();
      if (companies.length > 0) {
        const activeId = getActiveCompanyId();
        const active = companies.find((c) => c.id === activeId) || companies[0];
        setProfile(companyToProfile(active));
      } else {
        // Trigger mandatory first-time onboarding
        setShowOnboardingModal(true);
      }
    }
    initCompany();
  }, []);

  const [prefilledAdvisorPrompt, setPrefilledAdvisorPrompt] = useState<string | null>(null);
  const [showQuickCalculator, setShowQuickCalculator] = useState<boolean>(false);
  const [prefilledVoucherData, setPrefilledVoucherData] = useState<{
    taxableAmount?: number;
    gstRate?: number;
    isInterState?: boolean;
    hsnCode?: string;
    description?: string;
  } | null>(null);

  const handleConsultAdvisor = (prompt: string) => {
    setPrefilledAdvisorPrompt(prompt);
    setActiveTab("chat");
  };

  const handlePopulateVoucherFromCalculator = (data: {
    taxableAmount: number;
    gstRate: number;
    isInterState: boolean;
    hsnCode: string;
    description: string;
  }) => {
    setPrefilledVoucherData(data);
    setActiveTab("voucher");
    setShowQuickCalculator(false);
  };

  const handleLoadQueryIntoTool = (record: QueryRecord) => {
    if (record.queryType === "advisor") {
      setPrefilledAdvisorPrompt(record.queryText);
      setActiveTab("chat");
    } else if (record.queryType === "voucher" && record.payload) {
      setPrefilledVoucherData({
        taxableAmount: record.payload.amount || record.payload.taxableAmount,
        gstRate: record.payload.gstRate,
        isInterState: record.payload.isInterState,
        description: record.payload.description,
      });
      setActiveTab("voucher");
    } else if (record.queryType === "gst_calc") {
      setShowQuickCalculator(true);
    } else if (record.queryType === "setoff") {
      setActiveTab("gst");
    } else if (record.queryType === "financials") {
      setActiveTab("financials");
    }
  };

  return (
    <div className="min-h-screen bg-[#071A2B] text-[#F8FAFC] flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        setProfile={setProfile}
        onOpenAndroidModal={() => setShowAndroidModal(true)}
        language={language}
        setLanguage={setLanguage}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* If inside tools (not Home), render the Dark Navy contextual action bar */}
        {activeTab !== "home" && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#102A43] border border-[#1E3A56] rounded-2xl text-xs text-slate-300 shadow-lg">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#071A2B] hover:bg-[#163656] text-slate-200 border border-[#1E3A56] font-semibold transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span>Home</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span>
                  <strong>{profile.entityType}</strong> (
                  {profile.gstRegistered ? "GST Registered" : "Non-GST"}
                  ) • {profile.accountingBasis}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Quick GST Calculator Launcher Button */}
              <button
                id="btn-toggle-quick-gst"
                type="button"
                onClick={() => setShowQuickCalculator(!showQuickCalculator)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                  showQuickCalculator
                    ? "bg-cyan-600 text-white border-cyan-400 shadow-sm"
                    : "bg-[#071A2B] text-slate-300 border-[#1E3A56] hover:text-white"
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showQuickCalculator ? "Hide GST Calc" : "⚡ GST Calculator"}</span>
              </button>

              {/* Tool shortcuts */}
              <button
                onClick={() => setActiveTab("chat")}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  activeTab === "chat"
                    ? "bg-blue-600 text-white border-blue-400"
                    : "bg-[#071A2B] text-slate-300 border-[#1E3A56] hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ask Munim</span>
              </button>

              <button
                onClick={() => setActiveTab("financials")}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  activeTab === "financials"
                    ? "bg-blue-600 text-white border-blue-400"
                    : "bg-[#071A2B] text-slate-300 border-[#1E3A56] hover:text-white"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Financials</span>
              </button>

              <button
                onClick={() => setActiveTab("voucher")}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  activeTab === "voucher"
                    ? "bg-blue-600 text-white border-blue-400"
                    : "bg-[#071A2B] text-slate-300 border-[#1E3A56] hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">Voucher</span>
              </button>

              <button
                onClick={() => setActiveTab("calendar")}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  activeTab === "calendar"
                    ? "bg-blue-600 text-white border-blue-400"
                    : "bg-[#071A2B] text-slate-300 border-[#1E3A56] hover:text-white"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Tax Calendar</span>
              </button>

              <button
                onClick={() => setActiveTab("queries")}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  activeTab === "queries"
                    ? "bg-blue-600 text-white border-blue-400"
                    : "bg-[#071A2B] text-slate-300 border-[#1E3A56] hover:text-white"
                }`}
              >
                <Database className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden lg:inline">Logs</span>
              </button>

              <button
                onClick={() => setShowAdminFeedback(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 bg-[#071A2B] hover:bg-emerald-950/40 text-emerald-400 text-xs font-semibold transition cursor-pointer"
                title="Admin Feedback & Audit Desk"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xl:inline">CA Audit Desk</span>
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Quick GST Calculator Dropdown Card */}
        {showQuickCalculator && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-3 duration-200">
            <QuickGstCalculator
              profile={profile}
              onPopulateVoucher={handlePopulateVoucherFromCalculator}
              onConsultAdvisor={handleConsultAdvisor}
              onClose={() => setShowQuickCalculator(false)}
            />
          </div>
        )}

        {/* Tab Views */}
        {activeTab === "home" && (
          <HomeLanding
            onAskMunim={handleConsultAdvisor}
            onNavigateTab={setActiveTab}
            language={language}
            setLanguage={setLanguage}
            profile={profile}
            onOpenQuickGst={() => setShowQuickCalculator(true)}
            onOpenAndroidModal={() => setShowAndroidModal(true)}
          />
        )}
        {activeTab === "calendar" && (
          <TaxCalendar
            profile={profile}
            onSelectAction={handleConsultAdvisor}
          />
        )}
        {activeTab === "chat" && (
          <ChatAdvisor
            profile={profile}
            initialPrompt={prefilledAdvisorPrompt}
            onClearInitialPrompt={() => setPrefilledAdvisorPrompt(null)}
          />
        )}
        {activeTab === "voucher" && (
          <VoucherGenerator
            profile={profile}
            initialData={prefilledVoucherData}
            onClearInitialData={() => setPrefilledVoucherData(null)}
          />
        )}
        {activeTab === "financials" && (
          <FinancialStatements
            profile={profile}
            onConsultAdvisor={handleConsultAdvisor}
          />
        )}
        {activeTab === "gst" && (
          <GstSetoffSimulator
            profile={profile}
            onPopulateVoucher={handlePopulateVoucherFromCalculator}
            onConsultAdvisor={handleConsultAdvisor}
          />
        )}
        {activeTab === "guide" && <ComplianceGuide />}
        {activeTab === "queries" && (
          <QueryDatabaseViewer onLoadIntoTool={handleLoadQueryIntoTool} />
        )}
      </main>

      {/* Mandatory Onboarding Modal for First-time Users */}
      <CompanyModal
        isOpen={showOnboardingModal}
        isOnboarding={true}
        onClose={() => setShowOnboardingModal(false)}
        currentProfile={profile}
        onSelectCompany={(newProfile) => {
          setProfile(newProfile);
          setShowOnboardingModal(false);
        }}
      />

      {/* Admin Feedback Viewer */}
      <AdminFeedbackViewer
        isOpen={showAdminFeedback}
        onClose={() => setShowAdminFeedback(false)}
        currentUserEmail="caankitgupta777@gmail.com"
      />

      {/* Android App Modal */}
      <AndroidAppModal
        isOpen={showAndroidModal}
        onClose={() => setShowAndroidModal(false)}
      />

      {/* Clean Footer with Single Consolidated Disclaimer */}
      <Footer onNavigateTab={setActiveTab} />
    </div>
  );
}
