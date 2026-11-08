import React, { useState } from "react";
import { MunimLogo } from "./MunimLogo";
import { ShieldCheck, ExternalLink, MessageSquarePlus } from "lucide-react";
import { FeedbackModal } from "./FeedbackModal";

interface FooterProps {
  onNavigateTab: (tab: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab }) => {
  const [modalType, setModalType] = useState<"privacy" | "terms" | "disclaimer" | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  return (
    <>
      <footer className="bg-[#071A2B] border-t border-[#1E3A56] pt-12 pb-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Main Footer Columns */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Brand Column (2 cols) */}
            <div className="md:col-span-2 space-y-3">
              <MunimLogo size="md" showText={true} />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#102A43] border border-[#1E3A56] text-xs font-semibold text-cyan-300">
                <span>Munim AI - Made by CA Ankit Gupta</span>
              </div>
              <p className="text-slate-300 text-sm font-medium">
                Your AI Accountant for Smarter Business.
              </p>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Ask questions. Understand your accounts. Make better financial decisions. Ind AS, GST & Income Tax compliant.
              </p>
              <div className="pt-1 flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Crafted by <strong>CA Ankit Gupta</strong> with chartered accounting precision</span>
              </div>
            </div>

            {/* Product Column */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => onNavigateTab("home")}
                    className="hover:text-cyan-400 transition cursor-pointer"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigateTab("chat")}
                    className="hover:text-cyan-400 transition cursor-pointer"
                  >
                    AI Accountant
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigateTab("financials")}
                    className="hover:text-cyan-400 transition cursor-pointer"
                  >
                    Financial Insights
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigateTab("gst")}
                    className="hover:text-cyan-400 transition cursor-pointer"
                  >
                    GST Assistant
                  </button>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Company</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => onNavigateTab("guide")}
                    className="hover:text-cyan-400 transition cursor-pointer"
                  >
                    About Ind AS & Tax
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigateTab("calendar")}
                    className="hover:text-cyan-400 transition cursor-pointer"
                  >
                    Statutory Calendar
                  </button>
                </li>
                <li>
                  <a
                    href="#faq"
                    onClick={() => onNavigateTab("home")}
                    className="hover:text-cyan-400 transition cursor-pointer"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => onNavigateTab("queries")}
                    className="hover:text-cyan-400 transition cursor-pointer"
                  >
                    Query History
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => setModalType("privacy")}
                    className="hover:text-cyan-400 transition cursor-pointer text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setModalType("terms")}
                    className="hover:text-cyan-400 transition cursor-pointer text-left"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setModalType("disclaimer")}
                    className="hover:text-cyan-400 transition cursor-pointer text-left"
                  >
                    Statutory Disclaimer
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    className="text-amber-400 hover:text-amber-300 font-semibold transition cursor-pointer text-left flex items-center gap-1"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>Report a Bug / Feedback</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* SINGLE CONSOLIDATED DISCLAIMER (Per User Specification Item #10 & #19) */}
          <div className="pt-6 border-t border-[#1E3A56]">
            <div className="p-4 rounded-xl bg-[#0D263D] border border-[#1E3A56] text-[11px] leading-relaxed text-slate-300">
              <p>
                <strong className="text-white">Disclaimer:</strong> Munim AI provides AI-generated financial and accounting information for informational purposes only. Outputs may contain errors or omissions and should be verified with a qualified professional before making accounting, tax, legal or financial decisions.
              </p>
            </div>
          </div>

          {/* Bottom Copyright & Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-[11px] text-slate-400">
            <div className="font-medium text-slate-300">
              © 2026 Munim AI with CA Ankit Gupta all rights reserved
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setModalType("privacy")}
                className="hover:text-slate-200 transition cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                onClick={() => setModalType("terms")}
                className="hover:text-slate-200 transition cursor-pointer"
              >
                Terms
              </button>
              <span>•</span>
              <button
                onClick={() => setModalType("disclaimer")}
                className="hover:text-slate-200 transition cursor-pointer"
              >
                Disclaimer
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Popups */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#102A43] text-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#1E3A56] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3A56]">
              <h3 className="text-base font-bold text-white capitalize">
                {modalType === "privacy" && "Privacy Policy"}
                {modalType === "terms" && "Terms of Service"}
                {modalType === "disclaimer" && "Financial & Statutory Disclaimer"}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-white text-xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed max-h-72 overflow-y-auto space-y-2 pr-1">
              {modalType === "disclaimer" && (
                <p>
                  Munim AI provides AI-generated financial and accounting information for informational purposes only. Outputs may contain errors or omissions and should be verified with a qualified professional before making accounting, tax, legal or financial decisions. Munim AI does not provide formal auditing sign-offs or statutory tax filing representations unless reviewed by a licensed Chartered Accountant.
                </p>
              )}
              {modalType === "privacy" && (
                <p>
                  Munim AI values your privacy. Your imported financial data, trial balances, and invoice questions are maintained securely within your active application session. No proprietary client financial ledgers are indexed or sold to third-party advertisers.
                </p>
              )}
              {modalType === "terms" && (
                <p>
                  By using Munim AI, you agree that computational vouchers, draft statements, and tax estimations are decision-support aids. You retain full responsibility for verifying all voucher entries, GST returns, and tax submissions prior to statutory filing with GSTN and Income Tax Department.
                </p>
              )}
            </div>
            <div className="pt-3 border-t border-[#1E3A56] flex justify-end">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beta Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        activeModule="Footer"
      />
    </>
  );
};
