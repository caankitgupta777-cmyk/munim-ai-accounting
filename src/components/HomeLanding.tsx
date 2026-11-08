import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  FileSpreadsheet,
  Calculator,
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  Search,
  MessageSquare,
  BarChart3,
  Layers,
  ArrowUpRight,
  Send,
  Zap,
  ExternalLink,
  Clock,
} from "lucide-react";
import { MunimLogo } from "./MunimLogo";
import { BusinessProfile, Language } from "../types";

interface HomeLandingProps {
  onAskMunim: (prompt: string) => void;
  onNavigateTab: (tab: any) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  profile: BusinessProfile;
  onOpenQuickGst: () => void;
  onOpenAndroidModal: () => void;
}

export const HomeLanding: React.FC<HomeLandingProps> = ({
  onAskMunim,
  onNavigateTab,
  language,
  setLanguage,
  profile,
  onOpenQuickGst,
  onOpenAndroidModal,
}) => {
  const [commandInput, setCommandInput] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeWorkScenario, setActiveWorkScenario] = useState<"profit" | "gst" | "bs_diff" | "msme">("profit");

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commandInput.trim()) {
      onAskMunim(commandInput.trim());
    }
  };

  // Multilingual Greetings & Placeholders
  const getGreeting = () => {
    switch (language) {
      case "hi":
        return {
          greeting: "नमस्ते 👋 मैं मुनीम हूँ",
          subtitle: "अपने बिज़नेस खातों और टैक्स के बारे में कुछ भी पूछें।",
          searchPlaceholder: "मुनीम से अपने एकाउंट्स के बारे में कुछ भी पूछें...",
        };
      case "mr":
        return {
          greeting: "नमस्ते 👋 मी मुनीम आहे",
          subtitle: "तुमच्या व्यवसाय खात्यांबद्दल आणि करांबद्दल काहीही विचारा.",
          searchPlaceholder: "मुनीम यांना तुमच्या खात्यांबद्दल काहीही विचारा...",
        };
      default:
        return {
          greeting: "Namaste 👋 I'm Munim",
          subtitle: "Ask me anything about your business accounts.",
          searchPlaceholder: "Ask Munim AI anything about your accounts...",
        };
    }
  };

  const currentGreeting = getGreeting();

  const examplePrompts = [
    { label: "Show my outstanding receivables", query: "Show my outstanding receivables and overdue debtors past 45 days under MSME Sec 43B(h)" },
    { label: "Why did my profit fall this month?", query: "Why did my net profit margin decline this month despite revenue growth?" },
    { label: "Calculate GST payable", query: "Calculate my net GST liability after ITC setoff for this month" },
    { label: "Explain my P&L", query: "Explain my draft Profit and Loss statement and highlight key operating expense drivers" },
    { label: "Which customer owes me the most?", query: "Which customer owes me the highest pending trade receivable balance?" },
  ];

  const multilingualPrompts = [
    { lang: "हिन्दी", query: "मेरा इस महीने का नेट प्रॉफिट कितना है?" },
    { lang: "हिन्दी", query: "इस महीने कितना GST भरना पड़ेगा?" },
    { lang: "मराठी", query: "माझ्या व्यवसायात सर्वाधिक येणे रक्कम कोणाकडे आहे?" },
    { lang: "English", query: "Why is there a difference between Assets and Liabilities in my Balance sheet?" },
  ];

  const faqs = [
    {
      q: "What is Munim AI?",
      a: "Munim AI is an intelligent AI financial assistant and accountant built specifically for Indian businesses, proprietors, startups, and MSMEs. It helps you understand your balance sheet, profit and loss, GST liability, TDS deductions, and journal entries in plain, jargon-free language.",
    },
    {
      q: "Who can use Munim AI?",
      a: "Sole proprietors, partnership firms, LLPs, Private Limited companies, and freelance professionals. Whether you use Tally, Zoho Books, Busy, or Excel ledgers, Munim AI helps you interpret your numbers and make smarter financial decisions.",
    },
    {
      q: "Can Munim understand my financial data?",
      a: "Yes! Munim AI allows you to import trial balances directly from Excel/CSV, generate draft Ind AS Schedule III Balance Sheets & P&L statements, scan vendor receipts, and ask questions directly about your live balances.",
    },
    {
      q: "Can Munim help with GST?",
      a: "Absolutely. Munim calculates CGST/SGST/IGST by HSN/SAC code, verifies ITC eligibility vs blocked credit under Section 17(5), guides reverse charge (RCM), and simulates Rule 88A tax credit setoff hierarchies.",
    },
    {
      q: "Can I ask questions in Hindi or Marathi?",
      a: "Yes! Munim AI is trained to understand and respond in English, Hinglish, Hindi (हिन्दी), and Marathi (मराठी), making accounting intuitive for Indian entrepreneurs across regions.",
    },
    {
      q: "Is Munim AI a replacement for my CA?",
      a: "Munim AI is designed to assist with accounting and financial understanding. It does not replace a Chartered Accountant, tax professional or other qualified professional where professional advice or statutory compliance is required. Munim AI empowers you to stay on top of your daily finances and have more productive discussions with your CA.",
    },
    {
      q: "How accurate are Munim's answers?",
      a: "Munim is grounded in Indian Accounting Standards (Ind AS), the GST Acts, and the Income Tax Act, 1961. Every financial response includes confidence indicators, statutory references (e.g. Sec 43B(h), Sec 194I), and exact double-entry debit/credit ledger mappings.",
    },
    {
      q: "Is my financial information secure?",
      a: "Yes. Your financial statements and transaction queries are processed locally in your secure session with enterprise-grade data privacy and no unverified data sharing.",
    },
  ];

  return (
    <div className="text-[#F8FAFC] space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-10">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-80 bg-gradient-to-r from-blue-600/15 via-cyan-500/15 to-emerald-500/10 blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="text-center max-w-3xl mx-auto space-y-6 px-4">
          {/* Brand positioning badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#102A43] border border-[#1E3A56] text-xs font-semibold text-cyan-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Munim AI - Made by CA Ankit Gupta</span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline">Your AI Accountant for Smarter Business</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Your AI Accountant. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Always Ready.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            Ask Munim AI about your business finances, GST, P&L, expenses, cash flow and accounting — in simple language.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigateTab("chat")}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-cyan-200" />
              <span>✨ Ask Munim AI</span>
            </button>
            <a
              href="#features"
              className="px-6 py-3.5 rounded-xl bg-[#102A43] hover:bg-[#163656] text-white border border-[#1E3A56] font-semibold text-sm sm:text-base transition-colors flex items-center gap-2"
            >
              <span>Explore Features</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </a>
          </div>

          <p className="text-xs text-slate-400 font-medium tracking-wide">
            No accounting jargon. Just clear answers.
          </p>
        </div>

        {/* HERO VISUAL: Large AI Chat Window Showcase */}
        <div className="mt-10 sm:mt-12 max-w-4xl mx-auto px-4">
          <div className="rounded-2xl bg-[#102A43] border border-[#1E3A56] shadow-2xl overflow-hidden">
            {/* Window titlebar */}
            <div className="px-5 py-3.5 bg-[#0D263D] border-b border-[#1E3A56] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/70 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/70 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/70 inline-block" />
                </div>
                <span className="text-xs font-semibold text-slate-300 ml-2">
                  Munim AI • Live Financial Dialogue
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Ind AS & GST Grounded</span>
              </div>
            </div>

            {/* Conversation Flow */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* User Question */}
              <div className="flex justify-end">
                <div className="max-w-md bg-blue-600/20 border border-blue-500/40 text-white rounded-2xl rounded-tr-xs px-4 py-3 text-sm shadow-sm">
                  <div className="text-[11px] text-blue-300 font-semibold mb-1">You</div>
                  <p>How much profit did I make this month?</p>
                </div>
              </div>

              {/* Munim Response */}
              <div className="flex justify-start items-start gap-3">
                <MunimLogo size="sm" animated={true} />
                <div className="max-w-2xl bg-[#0D263D] border border-[#1E3A56] rounded-2xl rounded-tl-xs p-4 text-sm text-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                      Munim AI
                    </span>
                    <span className="text-[10px] text-slate-400">Sep 2026 Analysis</span>
                  </div>

                  <p className="leading-relaxed">
                    Your estimated net profit for September is <strong className="text-emerald-400 font-bold">₹2,84,500</strong>, which is <strong className="text-cyan-300 font-bold">12.4% higher</strong> than August.
                  </p>

                  {/* Insight Stat Pills Grid (Dashboard Colors) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="bg-[#102A43] border border-[#1E3A56] p-2.5 rounded-xl">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Net Profit</div>
                      <div className="text-sm font-bold text-emerald-400 mt-0.5">₹2.84L</div>
                      <div className="text-[10px] text-emerald-500 font-medium">Margin: 33.8%</div>
                    </div>
                    <div className="bg-[#102A43] border border-[#1E3A56] p-2.5 rounded-xl">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Growth</div>
                      <div className="text-sm font-bold text-cyan-400 mt-0.5">+12.4%</div>
                      <div className="text-[10px] text-slate-400 font-medium">Month-on-Month</div>
                    </div>
                    <div className="bg-[#102A43] border border-[#1E3A56] p-2.5 rounded-xl">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Revenue</div>
                      <div className="text-sm font-bold text-blue-400 mt-0.5">₹8.42L</div>
                      <div className="text-[10px] text-slate-400 font-medium">B2B & B2C Invoices</div>
                    </div>
                    <div className="bg-[#102A43] border border-[#1E3A56] p-2.5 rounded-xl">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Expenses</div>
                      <div className="text-sm font-bold text-amber-400 mt-0.5">₹5.57L</div>
                      <div className="text-[10px] text-slate-400 font-medium">COGS & OpEx</div>
                    </div>
                  </div>

                  {/* AI Confidence Badge */}
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium">
                      ✓ Based on available transaction data
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      Includes 18% GST input tax credit offsets
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Bottom Bar in Visual */}
            <div className="px-5 py-3 bg-[#0D263D]/80 border-t border-[#1E3A56] flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">
                Want to ask about your own numbers?
              </span>
              <button
                onClick={() => onNavigateTab("chat")}
                className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition"
              >
                <span>Try asking Munim now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE SIGNATURE ELEMENT: "ASK MUNIM" COMMAND BOX */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="rounded-2xl bg-gradient-to-b from-[#102A43] to-[#0D263D] border border-[#1E3A56] p-6 sm:p-8 shadow-xl">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <span>What would you like to know?</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Type any accounting, GST, or tax question for instant, accurate guidance.
                </p>
              </div>

              {/* Language switcher hint */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-[#071A2B] px-3 py-1.5 rounded-lg border border-[#1E3A56]">
                <span>Language:</span>
                <span className="font-semibold text-cyan-300 uppercase">{language}</span>
              </div>
            </div>

            {/* Interactive Input Box */}
            <form onSubmit={handleCommandSubmit} className="relative mt-2">
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder={currentGreeting.searchPlaceholder}
                  className="w-full bg-[#071A2B] border-2 border-[#1E3A56] focus:border-cyan-500 rounded-xl pl-12 pr-28 py-4 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!commandInput.trim()}
                  className="absolute right-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Ask</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Example Clickable Pills */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-semibold text-slate-400">Popular questions:</div>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onAskMunim(item.query)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#071A2B] hover:bg-[#1E3A56] text-slate-300 hover:text-white border border-[#1E3A56] transition cursor-pointer flex items-center gap-1.5 text-left"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="w-3 h-3 text-cyan-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Multilingual prompt row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1E3A56]/60 text-xs text-slate-400">
              <span className="font-medium text-slate-300">Try in Indian Languages:</span>
              {multilingualPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onAskMunim(p.query)}
                  className="px-2.5 py-1 rounded-md bg-[#0D263D] hover:bg-[#1E3A56] text-slate-300 hover:text-cyan-300 border border-[#1E3A56] text-[11px] transition cursor-pointer"
                >
                  <span className="text-cyan-400 font-semibold mr-1">[{p.lang}]</span>
                  {p.query}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHAT MUNIM AI DOES & USE CASES */}
      <section id="what-munim-does" className="max-w-6xl mx-auto px-4 scroll-mt-24 space-y-10">
        <div id="how-it-works" className="scroll-mt-24 -mt-6" />

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#102A43] border border-[#1E3A56] text-xs font-semibold text-cyan-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>What Munim AI Does • Overview & Key Use Cases</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            What Munim AI Does
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Your 24/7 Virtual Chartered Accountant & Financial Intelligence Partner for Indian Business
          </p>
        </div>

        {/* Short Description About What It Does */}
        <div className="rounded-2xl bg-gradient-to-r from-[#102A43] via-[#0D263D] to-[#102A43] border border-cyan-500/30 p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-start gap-4">
            <MunimLogo size="lg" animated={true} className="hidden sm:inline-flex shrink-0" />
            <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed">
              <p>
                <strong>Munim AI</strong> acts as an intelligent, conversational financial assistant built exclusively for Indian sole proprietors, partnerships, LLPs, Private Limited companies, and MSMEs. Instead of struggling through complex accounting software menus or waiting for monthly audit closes, you can talk to Munim AI naturally about any aspect of your business finances.
              </p>
              <p className="text-slate-300">
                It translates the Indian Income Tax Act 1961, Goods & Services Tax (GST) statutes, and Indian Accounting Standards (Ind AS / AS) into plain, jargon-free business guidance. Munim AI doesn't just display static numbers—it explains root causes, diagnoses why your Balance Sheet does not balance, computes exact net GST cash liability under Rule 88A, flags MSME 45-day overdue risks under Section 43B(h), and generates audit-ready financial statements from your raw Trial Balance.
              </p>
            </div>
          </div>

          {/* Quick Capability Tags */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-4 border-t border-[#1E3A56]">
            <div className="p-2.5 rounded-xl bg-[#071A2B] border border-[#1E3A56] text-center">
              <div className="text-cyan-400 font-bold text-xs">⚡ Double-Entry</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Golden Rules Vouchers</div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#071A2B] border border-[#1E3A56] text-center">
              <div className="text-emerald-400 font-bold text-xs">⚖️ Balance Sheet</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Equilibrium Diagnostics</div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#071A2B] border border-[#1E3A56] text-center">
              <div className="text-blue-400 font-bold text-xs">🧮 GST Rule 88A</div>
              <div className="text-[11px] text-slate-400 mt-0.5">ITC Setoff & Cash Challan</div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#071A2B] border border-[#1E3A56] text-center">
              <div className="text-amber-400 font-bold text-xs">🏢 Sec 43B(h)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">MSME 45-Day Radar</div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#071A2B] border border-[#1E3A56] text-center">
              <div className="text-purple-400 font-bold text-xs">📊 Ind AS Reports</div>
              <div className="text-[11px] text-slate-400 mt-0.5">PDF & Excel Exports</div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#071A2B] border border-[#1E3A56] text-center">
              <div className="text-pink-400 font-bold text-xs">🗣️ 3 Languages</div>
              <div className="text-[11px] text-slate-400 mt-0.5">EN • हिन्दी • मराठी</div>
            </div>
          </div>
        </div>

        {/* BRIEF NOTE OF MUNIM AI USE CASES */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>Brief Note of Munim AI Use Cases</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Practical, everyday business scenarios where Munim AI saves hours of accounting confusion:
              </p>
            </div>
            <span className="text-xs text-cyan-300 bg-[#102A43] border border-[#1E3A56] px-3 py-1 rounded-lg">
              Click any use case to test live
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Use Case 1 */}
            <div className="p-5 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 transition flex flex-col justify-between group">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-md">
                    Use Case 1 • Daily Bookkeeping
                  </span>
                  <span className="text-lg">🧾</span>
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Recording Complex Commercial Transactions
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Never guess whether to debit an asset or expense. Handles rent payments with 10% Section 194I TDS, professional fees under 194J, contractor bills under 194C, and GST Reverse Charge (RCM) with exact Tally-ready voucher tables.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[#1E3A56]">
                <button
                  type="button"
                  onClick={() => onAskMunim("How do I record ₹50,000 office rent with 10% TDS under Section 194I?")}
                  className="w-full py-2 px-3 rounded-xl bg-[#071A2B] hover:bg-blue-600/30 text-cyan-300 border border-[#1E3A56] text-xs font-semibold flex items-center justify-between transition cursor-pointer"
                >
                  <span className="truncate">"Record ₹50,000 rent with TDS"</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-1" />
                </button>
              </div>
            </div>

            {/* Use Case 2 */}
            <div className="p-5 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 transition flex flex-col justify-between group">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                    Use Case 2 • Audit Diagnostics
                  </span>
                  <span className="text-lg">⚖️</span>
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Diagnosing Balance Sheet Differences
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Identifies the root cause when Assets do not equal Liabilities. Traces unclosed Profit & Loss transfers to Reserves & Surplus, owner drawing misclassifications, and suspense account leakages with exact rectification entries.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[#1E3A56]">
                <button
                  type="button"
                  onClick={() => onAskMunim("Why is there a difference between Assets and Liabilities in my Balance sheet?")}
                  className="w-full py-2 px-3 rounded-xl bg-[#071A2B] hover:bg-emerald-600/30 text-emerald-300 border border-[#1E3A56] text-xs font-semibold flex items-center justify-between transition cursor-pointer"
                >
                  <span className="truncate">"Fix Balance Sheet difference"</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-1" />
                </button>
              </div>
            </div>

            {/* Use Case 3 */}
            <div className="p-5 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 transition flex flex-col justify-between group">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-md">
                    Use Case 3 • GST Optimization
                  </span>
                  <span className="text-lg">🧮</span>
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Rule 88A GST Setoff & Blocked ITC
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Computes exact CGST/SGST/IGST liability, applies the statutory Rule 88A credit offset order, and flags Section 17(5) blocked ITC (food, business travel cabs, personal perks) before monthly GSTR-3B filing.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[#1E3A56]">
                <button
                  type="button"
                  onClick={() => onAskMunim("Calculate my net GST payable after Rule 88A ITC setoff for this month")}
                  className="w-full py-2 px-3 rounded-xl bg-[#071A2B] hover:bg-cyan-600/30 text-cyan-300 border border-[#1E3A56] text-xs font-semibold flex items-center justify-between transition cursor-pointer"
                >
                  <span className="truncate">"Calculate net GST challan"</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-1" />
                </button>
              </div>
            </div>

            {/* Use Case 4 */}
            <div className="p-5 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 transition flex flex-col justify-between group">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
                    Use Case 4 • Statutory MSME Law
                  </span>
                  <span className="text-lg">🏢</span>
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  MSME Section 43B(h) 45-Day Payment Watch
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Monitors unpaid trade payables to registered Micro and Small suppliers past the mandatory 15-day or 45-day deadline to prevent permanent tax expense disallowances and compound interest penalties.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[#1E3A56]">
                <button
                  type="button"
                  onClick={() => onAskMunim("Which vendor bills are overdue past 45 days under Section 43B(h)?")}
                  className="w-full py-2 px-3 rounded-xl bg-[#071A2B] hover:bg-amber-600/30 text-amber-300 border border-[#1E3A56] text-xs font-semibold flex items-center justify-between transition cursor-pointer"
                >
                  <span className="truncate">"Check Section 43B(h) overdue bills"</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-1" />
                </button>
              </div>
            </div>

            {/* Use Case 5 */}
            <div className="p-5 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 transition flex flex-col justify-between group">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 rounded-md">
                    Use Case 5 • Profitability Analysis
                  </span>
                  <span className="text-lg">📈</span>
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Profit Margin & Cost Leakage Analysis
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Uncovers why net profits contracted despite top-line sales growth. Breaks down raw materials inflation, operating overheads, debtor collection delays, and liquidity ratio bottlenecks into clear business advice.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[#1E3A56]">
                <button
                  type="button"
                  onClick={() => onAskMunim("Why did my net profit margin decline this month despite revenue growth?")}
                  className="w-full py-2 px-3 rounded-xl bg-[#071A2B] hover:bg-purple-600/30 text-purple-300 border border-[#1E3A56] text-xs font-semibold flex items-center justify-between transition cursor-pointer"
                >
                  <span className="truncate">"Analyze profit margin decline"</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-1" />
                </button>
              </div>
            </div>

            {/* Use Case 6 */}
            <div className="p-5 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 transition flex flex-col justify-between group">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-400 bg-pink-500/10 border border-pink-500/30 px-2.5 py-0.5 rounded-md">
                    Use Case 6 • Financial Statements
                  </span>
                  <span className="text-lg">📊</span>
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Trial Balance Import & Ind AS Reports
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Upload any Excel or CSV trial balance, auto-map balances into Schedule III Division II accounting heads, and export polished Balance Sheet and P&L reports formatted for management review and CA audits in PDF or Excel.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[#1E3A56]">
                <button
                  type="button"
                  onClick={() => onNavigateTab("financials")}
                  className="w-full py-2 px-3 rounded-xl bg-[#071A2B] hover:bg-pink-600/30 text-pink-300 border border-[#1E3A56] text-xs font-semibold flex items-center justify-between transition cursor-pointer"
                >
                  <span className="truncate">"Open Balance Sheet & P&L"</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Outcome Pillars (Understand, Analyze, Decide, Act) */}
        <div className="pt-4">
          <div className="text-center max-w-xl mx-auto mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              The 4 Step Munim Framework
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              From asking a simple question to executing compliant accounting entries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pillar 1: Understand */}
            <div className="p-6 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-105 transition-transform">
                1
              </div>
              <h3 className="text-lg font-bold text-white">Understand</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Ask questions about your accounts in plain English, Hindi, or Marathi without complex jargon.
              </p>
            </div>

            {/* Pillar 2: Analyze */}
            <div className="p-6 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-105 transition-transform">
                2
              </div>
              <h3 className="text-lg font-bold text-white">Analyze</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Find trends, unusual expenses, debtor aging, and profitability changes month-over-month.
              </p>
            </div>

            {/* Pillar 3: Decide */}
            <div className="p-6 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-105 transition-transform">
                3
              </div>
              <h3 className="text-lg font-bold text-white">Decide</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Get financial insights, tax impact evaluations, and cash forecasts before making major purchases.
              </p>
            </div>

            {/* Pillar 4: Act */}
            <div className="p-6 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-105 transition-transform">
                4
              </div>
              <h3 className="text-lg font-bold text-white">Act</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Turn insights into practical next steps: balanced journal entries, GST challan prep, and MSME notices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURE SECTION (6 CARDS) */}
      <section id="features" className="max-w-6xl mx-auto px-4 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#102A43] border border-[#1E3A56] text-xs font-semibold text-cyan-300 mb-3">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Comprehensive Financial Toolkit</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            Built for Modern Indian Accounting
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Everything your business needs to stay compliant, solvent, and informed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Accounting Assistant */}
          <div
            onClick={() => onNavigateTab("chat")}
            className="p-6 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 hover:bg-[#12304d] transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
              🧾
            </div>
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span>Accounting Assistant</span>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Ask Munim about transactions, ledgers and accounts. Get ready-to-post double-entry vouchers with Golden Rules logic.
            </p>
            <div className="mt-4 pt-3 border-t border-[#1E3A56] text-[11px] text-cyan-400 font-semibold">
              Open Accounting Chat →
            </div>
          </div>

          {/* Card 2: Financial Analysis */}
          <div
            onClick={() => onNavigateTab("financials")}
            className="p-6 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 hover:bg-[#12304d] transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
              📊
            </div>
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span>Financial Analysis</span>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Understand revenue, expenses, profit and margins. Generate draft Ind AS Schedule III Balance Sheets & P&L statements with PDF/Excel export.
            </p>
            <div className="mt-4 pt-3 border-t border-[#1E3A56] text-[11px] text-emerald-400 font-semibold">
              View Balance Sheet & P&L →
            </div>
          </div>

          {/* Card 3: GST Assistant */}
          <div
            onClick={() => onNavigateTab("gst")}
            className="p-6 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 hover:bg-[#12304d] transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
              🧮
            </div>
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span>GST Assistant</span>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Get help understanding GST calculations and reports. Simulate Rule 88A ITC setoff, check blocked credit Sec 17(5), and calculate CGST/SGST/IGST.
            </p>
            <div className="mt-4 pt-3 border-t border-[#1E3A56] text-[11px] text-cyan-400 font-semibold">
              Calculate GST & Setoff →
            </div>
          </div>

          {/* Card 4: Cash Flow Intelligence */}
          <div
            onClick={() => onAskMunim("Analyze my cash flow position and tell me where money is going")}
            className="p-6 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 hover:bg-[#12304d] transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
              💰
            </div>
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span>Cash Flow Intelligence</span>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Understand where your money is going. Pinpoint cash drainers, analyze liquidity ratios, and track bank vs book balances.
            </p>
            <div className="mt-4 pt-3 border-t border-[#1E3A56] text-[11px] text-amber-400 font-semibold">
              Inspect Cash Flow →
            </div>
          </div>

          {/* Card 5: Business Insights */}
          <div
            onClick={() => onAskMunim("Identify unusual expenditure trends and risk factors in my accounts")}
            className="p-6 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 hover:bg-[#12304d] transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
              📈
            </div>
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span>Business Insights</span>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Identify trends and unusual movements. Flag MSME Sec 43B(h) overdue risks, advance tax deadlines, and high expense spikes.
            </p>
            <div className="mt-4 pt-3 border-t border-[#1E3A56] text-[11px] text-purple-400 font-semibold">
              Explore Trend Insights →
            </div>
          </div>

          {/* Card 6: Natural Language */}
          <div
            onClick={() => onNavigateTab("chat")}
            className="p-6 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 hover:bg-[#12304d] transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
              💬
            </div>
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span>Natural Language</span>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Ask questions in simple English, Hindi, or Marathi. No rigid syntax required — Munim understands everyday merchant speech.
            </p>
            <div className="mt-4 pt-3 border-t border-[#1E3A56] text-[11px] text-pink-400 font-semibold">
              Chat in your language →
            </div>
          </div>
        </div>
      </section>

      {/* 5. BEFORE VS AFTER MUNIM */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Traditional Accounting vs With Munim AI
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Why Indian business owners are switching from confusing ledger dumps to conversational clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traditional Accounting (Red) */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#0D263D] border border-red-500/30 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1E3A56]">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold">
                ✕
              </div>
              <h3 className="text-lg font-bold text-white">Traditional Accounting</h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold shrink-0">❌</span>
                <span>Search multiple reports across fragmented software</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold shrink-0">❌</span>
                <span>Struggle with complex accounting terminology and rules</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold shrink-0">❌</span>
                <span>Manually calculate and analyse numbers on spreadsheets</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold shrink-0">❌</span>
                <span>Spend hours preparing summaries and reconciliations</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold shrink-0">❌</span>
                <span>Difficult for non-accountant business owners to act</span>
              </li>
            </ul>
          </div>

          {/* With Munim AI (Emerald / Cyan) */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#102A43] border border-cyan-500/40 shadow-xl shadow-cyan-950/20 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-500/20 text-cyan-300 border-b border-l border-cyan-500/30 text-[10px] font-bold rounded-bl-xl uppercase tracking-wider">
              Recommended
            </div>
            <div className="flex items-center gap-2 pb-3 border-b border-[#1E3A56]">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                ✓
              </div>
              <h3 className="text-lg font-bold text-white">With Munim AI</h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span><strong>Ask naturally:</strong> Speak or type in conversational English, Hindi, or Marathi</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span><strong>Get instant explanations:</strong> No waiting for monthly accounting close cycles</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span><strong>Understand your numbers:</strong> Why profits rose or fell with exact factor decomposition</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span><strong>Find important changes:</strong> Automated MSME 45-day overdue alerts and GST offset gaps</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span><strong>Make informed decisions:</strong> Immediate journal entries and tax planning advice</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. "AI ACCOUNTANT AT WORK" / EXAMPLES SECTION */}
      <section id="examples" className="max-w-5xl mx-auto px-4 scroll-mt-24 space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#102A43] border border-[#1E3A56] text-xs font-semibold text-cyan-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Demonstrations • Real-World Examples</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Munim AI in Action: Real-World Examples
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            Munim doesn't just show static figures. It diagnoses root causes, audits ledgers, and explains what to do next.
          </p>
        </div>

        {/* BRIEF ABOUT THE EXAMPLES SECTION */}
        <div className="rounded-2xl bg-gradient-to-r from-[#102A43] via-[#0D263D] to-[#102A43] border border-cyan-500/30 p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 text-xl font-bold">
              💡
            </div>
            <div className="space-y-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Brief About The Examples Section</span>
                  <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                    CA Diagnostic Architecture
                  </span>
                </h3>
                <span className="text-[11px] text-cyan-400 font-medium">
                  Interactive Live Simulators
                </span>
              </div>
              <p>
                Traditional accounting software, spreadsheets, and ERP dashboards merely report static columns and rows—leaving business owners wondering <em>why</em> their net bank cash declined despite growing sales, <em>why</em> a Balance Sheet differs by thousands of rupees, or <em>how</em> to calculate net GST cash after complex Rule 88A setoffs.
              </p>
              <p className="text-slate-300">
                This <strong>Examples Section</strong> showcases how Munim AI acts as a dedicated in-house Chartered Accountant. Rather than just returning numbers, it executes deterministic validation layers, verifies statutory Indian tax provisions (Ind AS, Section 43B(h), and GST Rule 88A), and explains the root causes in plain language with actionable next steps.
              </p>
            </div>
          </div>

          {/* 4 Pillars Highlight within the Brief */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#1E3A56]">
            <div className="p-3 rounded-xl bg-[#071A2B] border border-[#1E3A56] space-y-1">
              <div className="text-blue-400 font-bold text-xs flex items-center gap-1.5">
                <span>📉 Example 1: P&L Variance</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Pinpoints hidden cost inflation, overhead creep, and pending customer collections draining profit.
              </p>
              <div className="text-[10px] text-blue-300/80 font-semibold pt-1">
                → Cost of Materials & Margins
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#071A2B] border border-[#1E3A56] space-y-1">
              <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <span>⚖️ Example 2: Balance Sheet Equilibrium</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Detects unclosed net profits, unrecorded drawings, and suspense accounts to achieve Ind AS balance.
              </p>
              <div className="text-[10px] text-emerald-300/80 font-semibold pt-1">
                → Reserves & Retained Earnings
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#071A2B] border border-[#1E3A56] space-y-1">
              <div className="text-cyan-400 font-bold text-xs flex items-center gap-1.5">
                <span>🧮 Example 3: GST Rule 88A Setoff</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Demonstrates mandatory IGST credit exhaustion and strips Sec 17(5) blocked credits before cash payment.
              </p>
              <div className="text-[10px] text-cyan-300/80 font-semibold pt-1">
                → Net Cash via Challan PMT-06
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#071A2B] border border-[#1E3A56] space-y-1">
              <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                <span>🏢 Example 4: MSME Sec 43B(h) Radar</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Audits Sundry Creditors ledger for invoices older than 15/45 days to avoid income tax disallowances.
              </p>
              <div className="text-[10px] text-amber-300/80 font-semibold pt-1">
                → UDYAM Verification & Form 3CD
              </div>
            </div>
          </div>
        </div>

        {/* Scenario Selectors */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setActiveWorkScenario("profit")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeWorkScenario === "profit"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-[#102A43] text-slate-400 hover:text-white border border-[#1E3A56]"
            }`}
          >
            📉 Example 1: Profit Decrease Analysis
          </button>
          <button
            onClick={() => setActiveWorkScenario("bs_diff")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeWorkScenario === "bs_diff"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-[#102A43] text-slate-400 hover:text-white border border-[#1E3A56]"
            }`}
          >
            ⚖️ Example 2: Balance Sheet Imbalance
          </button>
          <button
            onClick={() => setActiveWorkScenario("gst")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeWorkScenario === "gst"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-[#102A43] text-slate-400 hover:text-white border border-[#1E3A56]"
            }`}
          >
            🧮 Example 3: GST Liability & Rule 88A
          </button>
          <button
            onClick={() => setActiveWorkScenario("msme")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeWorkScenario === "msme"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-[#102A43] text-slate-400 hover:text-white border border-[#1E3A56]"
            }`}
          >
            🏢 Example 4: MSME Sec 43B(h) 45-Day Watch
          </button>
        </div>

        {/* The Interactive Work Card */}
        <div className="rounded-2xl bg-[#102A43] border border-[#1E3A56] p-6 sm:p-8 shadow-xl space-y-6">
          {activeWorkScenario === "profit" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* User question */}
              <div className="p-3.5 bg-[#071A2B] rounded-xl border border-[#1E3A56] text-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">User asks Munim AI:</span>
                  <span className="text-white font-semibold">"Why is my profit lower this month even though sales didn't fall much?"</span>
                </div>
                <span className="text-xs text-blue-400 font-medium bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">Monthly P&L Audit</span>
              </div>

              {/* Munim analyses */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Munim Analyses Behind The Scenes:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#0D263D] rounded-xl border border-[#1E3A56]">
                    <div className="text-[10px] text-slate-400">Revenue</div>
                    <div className="text-sm font-bold text-red-400 flex items-center gap-1 mt-0.5">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>↓ 4.2%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-[#0D263D] rounded-xl border border-[#1E3A56]">
                    <div className="text-[10px] text-slate-400">Raw Material Cost</div>
                    <div className="text-sm font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>↑ 8.7%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-[#0D263D] rounded-xl border border-[#1E3A56]">
                    <div className="text-[10px] text-slate-400">Employee Expenses</div>
                    <div className="text-sm font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>↑ 3.1%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-[#0D263D] rounded-xl border border-[#1E3A56]">
                    <div className="text-[10px] text-slate-400">Receivables Surge</div>
                    <div className="text-sm font-bold text-purple-400 flex items-center gap-1 mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>↑ ₹1.24L</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Munim responds */}
              <div className="p-4 bg-[#0D263D] rounded-xl border border-cyan-500/30 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <MunimLogo size="sm" animated={true} />
                    <span>Munim responds:</span>
                  </span>
                  <span className="text-[11px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-medium">
                    ✓ Based on available transaction data
                  </span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  "Your profit decreased mainly because raw-material expenses increased faster than revenue (+8.7% vs -4.2%). Receivables also increased by ₹1,24,000, which is tying up liquid capital and affecting your immediate cash position. Recommend prioritizing collections from top 3 overdue customers before making fresh inventory purchases."
                </p>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => onAskMunim("Why is my net profit lower this month? Analyze revenue vs expenses")}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Test this query in Munim Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {activeWorkScenario === "bs_diff" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="p-3.5 bg-[#071A2B] rounded-xl border border-[#1E3A56] text-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">User asks Munim AI:</span>
                  <span className="text-white font-semibold">"Why is there a difference between my Assets and Liabilities?"</span>
                </div>
                <span className="text-xs text-amber-400 font-medium bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">Balance Sheet Equilibrium</span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Munim Audits Ledger Mappings:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#0D263D] rounded-xl border border-[#1E3A56]">
                    <div className="text-[10px] text-slate-400">Total Assets</div>
                    <div className="text-sm font-bold text-blue-400 mt-0.5">₹24,80,000</div>
                  </div>
                  <div className="p-3 bg-[#0D263D] rounded-xl border border-[#1E3A56]">
                    <div className="text-[10px] text-slate-400">Equity + Liabilities</div>
                    <div className="text-sm font-bold text-slate-300 mt-0.5">₹23,30,000</div>
                  </div>
                  <div className="p-3 bg-[#0D263D] rounded-xl border border-red-500/30">
                    <div className="text-[10px] text-slate-400">Variance</div>
                    <div className="text-sm font-bold text-red-400 mt-0.5">₹1,50,000 (Dr)</div>
                  </div>
                  <div className="p-3 bg-[#0D263D] rounded-xl border border-amber-500/30">
                    <div className="text-[10px] text-slate-400">Root Cause Found</div>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">P&L not transferred</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#0D263D] rounded-xl border border-cyan-500/30 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <MunimLogo size="sm" animated={true} />
                    <span>Munim responds:</span>
                  </span>
                  <span className="text-[11px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-medium">
                    ✓ Based on available transaction data
                  </span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  "The ₹1,50,000 variance in your Balance Sheet occurs because the Net Profit from your P&L statement has not yet been rolled into <strong>Reserves & Surplus (Equity)</strong> for the period. Once you post the closing transfer (Debit Profit & Loss Account ₹1,50,000; Credit Retained Earnings ₹1,50,000), your Assets and Liabilities will balance perfectly at ₹24,80,000."
                </p>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => onAskMunim("Diagnose why Assets and Liabilities do not tally in my Balance Sheet")}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Test this query in Munim Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {activeWorkScenario === "gst" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="p-3.5 bg-[#071A2B] rounded-xl border border-[#1E3A56] text-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">User asks Munim AI:</span>
                  <span className="text-white font-semibold">"How much GST do I actually need to pay in cash after ITC setoff?"</span>
                </div>
                <span className="text-xs text-cyan-400 font-medium bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">GST Rule 88A Simulator</span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Munim Applies Statutory Setoff Hierarchy:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#0D263D] rounded-xl border border-[#1E3A56]">
                    <div className="text-[10px] text-slate-400">Output GST Due</div>
                    <div className="text-sm font-bold text-red-400 mt-0.5">₹1,80,000</div>
                  </div>
                  <div className="p-3 bg-[#0D263D] rounded-xl border border-[#1E3A56]">
                    <div className="text-[10px] text-slate-400">Available ITC</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">₹1,15,000</div>
                  </div>
                  <div className="p-3 bg-[#0D263D] rounded-xl border border-amber-500/30">
                    <div className="text-[10px] text-slate-400">Blocked ITC Sec 17(5)</div>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">₹8,500 excluded</div>
                  </div>
                  <div className="p-3 bg-[#0D263D] rounded-xl border border-cyan-500/30">
                    <div className="text-[10px] text-slate-400">Net Cash Payable</div>
                    <div className="text-sm font-bold text-cyan-400 mt-0.5">₹65,000 (Challan)</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#0D263D] rounded-xl border border-cyan-500/30 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <MunimLogo size="sm" animated={true} />
                    <span>Munim responds:</span>
                  </span>
                  <span className="text-[11px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-medium">
                    ✓ Based on available transaction data
                  </span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  "Your net cash GST liability is <strong>₹65,000</strong>. Your total output GST was ₹1,80,000 (₹90,000 CGST + ₹90,000 SGST). Per Rule 88A, your IGST credit is exhausted first, followed by CGST and SGST credits against their respective heads. Food & travel invoices of ₹8,500 were correctly excluded under Section 17(5) blocked credit."
                </p>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => onAskMunim("Calculate my net GST cash liability after Rule 88A ITC setoff")}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Test this query in Munim Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {activeWorkScenario === "msme" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="p-3.5 bg-[#071A2B] rounded-xl border border-[#1E3A56] text-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">User asks Munim AI:</span>
                  <span className="text-white font-semibold">"Which vendor bills will be disallowed under Section 43B(h) if not paid this month?"</span>
                </div>
                <span className="text-xs text-amber-400 font-medium bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">MSME Compliance Watch</span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Munim Audits Trade Creditors & UDYAM Registrations:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#0D263D] rounded-xl border border-[#1E3A56]">
                    <div className="text-[10px] text-slate-400">Total Trade Payables</div>
                    <div className="text-sm font-bold text-blue-400 mt-0.5">₹14,50,000</div>
                  </div>
                  <div className="p-3 bg-[#0D263D] rounded-xl border border-[#1E3A56]">
                    <div className="text-[10px] text-slate-400">Registered Micro/Small</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">₹6,20,000 (8 Vendors)</div>
                  </div>
                  <div className="p-3 bg-[#0D263D] rounded-xl border border-red-500/30">
                    <div className="text-[10px] text-slate-400">Overdue &gt; 45 Days</div>
                    <div className="text-sm font-bold text-red-400 mt-0.5">₹1,85,000 (2 Invoices)</div>
                  </div>
                  <div className="p-3 bg-[#0D263D] rounded-xl border border-amber-500/30">
                    <div className="text-[10px] text-slate-400">Tax Disallowance Risk</div>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">₹1.85L added to ITR Profit</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#0D263D] rounded-xl border border-cyan-500/30 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <MunimLogo size="sm" animated={true} />
                    <span>Munim responds:</span>
                  </span>
                  <span className="text-[11px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-medium">
                    ✓ Based on available transaction data
                  </span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  "Under Section 43B(h), <strong>2 supplier invoices totaling ₹1,85,000</strong> from registered Micro/Small vendors are now past the mandatory 45-day payment window. If these remain unpaid on or before March 31, this ₹1,85,000 will be added back to your taxable net income, resulting in an additional ~₹46,250 income tax liability plus compound interest u/s 16 of the MSMED Act. Recommend remitting payment immediately to clear the deduction."
                </p>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => onAskMunim("Check my vendor ledger for Section 43B(h) MSME overdue payments past 45 days")}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Test this query in Munim Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* UPCOMING STATUTORY DEADLINES SECTION (REFERENCING OFFICIAL INCOMETAX & GST PORTALS) */}
      <section className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#102A43] border border-[#1E3A56] text-xs font-semibold text-cyan-300">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Official Compliance Calendar • incometax.gov.in &amp; gst.gov.in</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Upcoming Statutory Tax Deadlines
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Synchronized with the Income Tax Department of India, Goods &amp; Services Tax Network, and TRACES.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab("calendar")}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer shrink-0"
            >
              <span>Open Full Tax Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Official Portal Verification Links */}
        <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-xl bg-[#0D263D] border border-[#1E3A56] text-xs text-slate-300">
          <span className="font-semibold text-slate-200">Official Portals:</span>
          <a
            href="https://eportal.incometax.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#071A2B] hover:bg-blue-900/30 text-cyan-300 border border-[#1E3A56] transition"
          >
            <span>🏛️ Income Tax e-Filing (eportal.incometax.gov.in)</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href="https://www.incometax.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#071A2B] hover:bg-blue-900/30 text-blue-300 border border-[#1E3A56] transition"
          >
            <span>📄 CBDT Circulars (incometax.gov.in)</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href="https://www.gst.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#071A2B] hover:bg-emerald-900/30 text-emerald-300 border border-[#1E3A56] transition"
          >
            <span>🧾 GST Common Portal (gst.gov.in)</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href="https://www.tdscpc.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#071A2B] hover:bg-purple-900/30 text-purple-300 border border-[#1E3A56] transition"
          >
            <span>📂 TDS TRACES (tdscpc.gov.in)</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>

        {/* Quick Deadline Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Item 1: Tax Audit */}
          <div
            onClick={() => onNavigateTab("calendar")}
            className="p-5 rounded-2xl bg-[#102A43] border border-amber-500/50 hover:border-amber-400 transition cursor-pointer group flex flex-col justify-between shadow-lg"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-md">
                  Last Day: 07 Oct 2026
                </span>
                <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>CBDT Extension</span>
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                Tax Audit Report u/s 44AB (Form 3CA / 3CB - 3CD)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Statutory due date: <strong>30th September</strong>, extended to <strong>07th October 2026</strong> by CBDT Circular. For Transfer Pricing cases u/s 92E, due date is <strong>31st October</strong>. File on <em>eportal.incometax.gov.in</em>.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#1E3A56] flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-amber-400/90 font-medium">Sec 271B Penalty: ₹1,50,000 max</span>
              <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform font-semibold">Calendar →</span>
            </div>
          </div>

          {/* Item 2: TDS Deposit */}
          <div
            onClick={() => onNavigateTab("calendar")}
            className="p-5 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 transition cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-300 bg-blue-950/60 border border-blue-500/30 px-2 py-0.5 rounded-md">
                  Due 07 Oct 2026
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Monthly</span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                TDS / TCS Deposit for Sep 2026
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Deposit tax deducted on salaries (192), contractor (194C), professional fees (194J), rent (194I) via Challan ITNS 281.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#1E3A56] flex items-center justify-between text-[11px] text-slate-400">
              <span>Interest: 1.5%/month u/s 201(1A)</span>
              <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">Details →</span>
            </div>
          </div>

          {/* Item 3: GSTR-1 */}
          <div
            onClick={() => onNavigateTab("calendar")}
            className="p-5 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 transition cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  Due 11 Oct 2026
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Monthly</span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                Monthly GSTR-1 (Outward Supplies)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Upload B2B sales invoices and credit notes for September 2026 to ensure recipients can claim GSTR-2B ITC.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#1E3A56] flex items-center justify-between text-[11px] text-slate-400">
              <span>Late fee: ₹50/day u/s 47</span>
              <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">Details →</span>
            </div>
          </div>

          {/* Item 4: GSTR-3B */}
          <div
            onClick={() => onNavigateTab("calendar")}
            className="p-5 rounded-2xl bg-[#102A43] border border-[#1E3A56] hover:border-cyan-500/50 transition cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  Due 20 Oct 2026
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Monthly / 88A</span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                GSTR-3B Summary Return &amp; Payment
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Reconcile eligible ITC from GSTR-2B, set off liabilities under Rule 88A, and pay cash balance via PMT-06.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#1E3A56] flex items-center justify-between text-[11px] text-slate-400">
              <span>Interest: 18% p.a. on cash net</span>
              <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">Details →</span>
            </div>
          </div>

          {/* Item 5: Corporate ITR & Q2 TDS Return */}
          <div
            onClick={() => onNavigateTab("calendar")}
            className="p-5 rounded-2xl bg-[#102A43] border border-cyan-500/30 hover:border-cyan-400/60 transition cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                  Due 31 Oct 2026
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold">Major Filing</span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                Corporate ITR-6 &amp; Q2 TDS Return (26Q)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Audited ITR-6/ITR-5 submission on incometax.gov.in and quarterly TDS return for Q2 (July - Sept 2026) on TRACES.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#1E3A56] flex items-center justify-between text-[11px] text-slate-400">
              <span>Late fee: ₹200/day u/s 234E</span>
              <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">Details →</span>
            </div>
          </div>

          {/* Item 6: Sec 16(4) GST ITC Cutoff */}
          <div
            onClick={() => onNavigateTab("calendar")}
            className="p-5 rounded-2xl bg-[#102A43] border border-purple-500/30 hover:border-purple-400/60 transition cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-md">
                  Due 30 Nov 2026
                </span>
                <span className="text-[10px] text-purple-400 font-semibold">Statutory Cutoff</span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                FY 2025-26 GST ITC Section 16(4) Cutoff
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Final statutory deadline to claim any missing Input Tax Credit or issue debit/credit notes for FY 2025-26 supplies.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#1E3A56] flex items-center justify-between text-[11px] text-slate-400">
              <span>Strict statutory bar u/s 16(4)</span>
              <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">Details →</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TRUST SECTION: "BUILT FOR INDIAN BUSINESSES" */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="rounded-2xl bg-gradient-to-r from-[#102A43] via-[#0D263D] to-[#102A43] border border-[#1E3A56] p-8 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Built for Indian Businesses
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Tuned to the real statutory framework of Indian commercial law and enterprise accounting.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-xl bg-[#071A2B] border border-[#1E3A56] flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">🇮🇳</span>
              <span className="text-xs font-semibold text-slate-200">Indian Accounting</span>
            </div>
            <div className="p-4 rounded-xl bg-[#071A2B] border border-[#1E3A56] flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">🧾</span>
              <span className="text-xs font-semibold text-slate-200">GST Compliance</span>
            </div>
            <div className="p-4 rounded-xl bg-[#071A2B] border border-[#1E3A56] flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">📊</span>
              <span className="text-xs font-semibold text-slate-200">P&L & Balance Sheet</span>
            </div>
            <div className="p-4 rounded-xl bg-[#071A2B] border border-[#1E3A56] flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">💰</span>
              <span className="text-xs font-semibold text-slate-200">Cash Flow</span>
            </div>
            <div className="p-4 rounded-xl bg-[#071A2B] border border-[#1E3A56] flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">📒</span>
              <span className="text-xs font-semibold text-slate-200">Double-Entry Ledgers</span>
            </div>
            <div className="p-4 rounded-xl bg-[#071A2B] border border-[#1E3A56] flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">🔐</span>
              <span className="text-xs font-semibold text-slate-200">Data Privacy</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION (8 QUESTIONS) */}
      <section id="faq" className="max-w-4xl mx-auto px-4 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#102A43] border border-[#1E3A56] text-xs font-semibold text-cyan-300 mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Everything you need to know about Munim AI
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-[#102A43] border border-[#1E3A56] overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-white hover:text-cyan-300 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isOpen ? "rotate-180 text-cyan-400" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-[#1E3A56]/60 pt-3">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. BOTTOM CTA */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="rounded-2xl bg-gradient-to-r from-blue-900/60 via-[#102A43] to-cyan-900/60 border border-cyan-500/30 p-8 text-center space-y-4 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Ready to understand your accounts?
          </h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto">
            Start a conversational accounting session with Munim AI or generate draft financial statements in seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigateTab("chat")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Ask Munim AI Now</span>
            </button>
            <button
              onClick={() => onNavigateTab("financials")}
              className="px-6 py-3 rounded-xl bg-[#071A2B] hover:bg-[#0D263D] text-slate-200 border border-[#1E3A56] font-semibold text-sm transition cursor-pointer flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Open Balance Sheet & P&L</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
