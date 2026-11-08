import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Scale,
  TrendingUp,
  ShieldAlert,
  Droplets,
  Building2,
  HelpCircle,
  Lightbulb,
  FileSpreadsheet
} from "lucide-react";
import { BusinessProfile, ChatMessage } from "../types";
import { StatementsExportData } from "../services/financialStatementsExporter";
import { logQueryToDatabase } from "../services/queryDatabase";
import { getAuthToken } from "../lib/firebase";
import DOMPurify from "dompurify";

interface FinancialStatementsAiChatProps {
  statementsData: StatementsExportData;
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

export const FinancialStatementsAiChat: React.FC<FinancialStatementsAiChatProps> = ({
  statementsData,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const { profile, plStatement, balanceSheet, ledgers } = statementsData;

  const fmt = (n: number) =>
    "₹ " + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const rev = plStatement.revenueFromOperations || 0;
  const pat = plStatement.profitAfterTax || 0;
  const netMargin = rev > 0 ? ((pat / rev) * 100).toFixed(1) : "0.0";
  const totAssets = balanceSheet.totalAssets || 0;
  const totEquityLiab = balanceSheet.totalEquityAndLiabilities || 0;
  const bsDiff =
    balanceSheet.bsDiff ?? Math.abs(totAssets - totEquityLiab);
  const isBalanced = balanceSheet.isBsBalanced ?? bsDiff < 1;

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-fs-chat",
      role: "model",
      content: `### 🧑‍💼 Namaste! I am your Munim AI Financial & Audit Analyst.

I am connected directly to your **Draft Profit & Loss** and **Ind AS Balance Sheet** for **${profile.entityType}** (FY 2025-26):
* **Turnover (Revenue):** ${fmt(rev)}
* **Net Profit After Tax (PAT):** ${fmt(pat)} (Net Margin: **${netMargin}%**)
* **Total Assets:** ${fmt(totAssets)} | **Total Equity & Liabilities:** ${fmt(totEquityLiab)}
* **Balance Sheet Status:** ${
        isBalanced
          ? "✅ **Perfect Double-Entry Equilibrium** (Difference: ₹0)"
          : `⚠️ **Imbalance of ${fmt(bsDiff)}** (${totAssets > totEquityLiab ? "Assets exceed Liabilities" : "Liabilities exceed Assets"})`
      }

#### 💡 How can I assist you today?
- **Balance Sheet Equilibrium:** *"Why is there a difference in my Balance Sheet and how do I balance it?"*
- **Profit & Loss Analysis:** *"What is driving our net profit margin and how can we optimize expenses?"*
- **Working Capital & Ratios:** *"What is our Current Ratio and liquidity position?"*
- **Statutory Audit & Tax Flags:** *"Are there any Section 43B(h) MSME or Income Tax risks in these statements?"*

Click any prompt below or type your question!`,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle external trigger (e.g. from Balance Sheet imbalance alert button)
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [initialPrompt]);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendMessage = async (userText: string) => {
    const text = userText.trim();
    if (!text || loading) return;

    setError(null);
    setInput("");

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Build API request payload
      const payload = {
        messages: newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        statementsData,
      };

      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/financial-statements-chat", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const replyContent = data?.reply || "I analyzed your financial statements, but received an empty response. Please try again.";

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "model",
        content: replyContent,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Log to database
      logQueryToDatabase({
        queryType: "financials",
        title: `Financial Statement AI: ${text.slice(0, 60)}...`,
        queryText: text,
        resultSummary: replyContent.slice(0, 300),
        status: "completed",
        payload: {
          bsDiff,
          isBalanced,
          rev,
          pat,
        },
      });
    } catch (err: any) {
      console.error("Financial Statements Chat error:", err);
      setError("Communication with Munim AI analyst was interrupted. Please retry your question.");
    } finally {
      setLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    {
      icon: Scale,
      label: isBalanced ? "⚖️ Verify Balance Sheet Equilibrium" : "⚖️ Why is there a Difference in Balance Sheet?",
      query: isBalanced
        ? "Please verify why my Balance Sheet is currently in equilibrium and explain the double-entry mechanics connecting my P&L and Balance Sheet."
        : `Why is there a difference of ${fmt(bsDiff)} in my Balance Sheet? Please analyze my assets vs liabilities & equity, identify the root causes, and give me the exact adjusting journal entries to fix it.`,
      highlight: !isBalanced,
    },
    {
      icon: TrendingUp,
      label: "📈 Profit & Loss Performance & Margin Health",
      query: "Analyze my Profit and Loss statement: What is our Gross and Net Profit Margin, what are the top cost drivers, and how can we optimize our operating overheads?",
      highlight: false,
    },
    {
      icon: Droplets,
      label: "💧 Current Ratio & Working Capital Runway",
      query: "Calculate our Current Ratio, Quick Ratio, and Working Capital. Do we have enough liquidity to meet short-term vendor payables and loan obligations?",
      highlight: false,
    },
    {
      icon: ShieldAlert,
      label: "⚠️ Audit Red Flags & Sec 43B(h) MSME Exposure",
      query: "Perform an audit and tax compliance scan on my draft statements: Highlight any Section 43B(h) MSME payment risks, Section 40A(3) cash limits, and TDS matching in Form 26AS.",
      highlight: false,
    },
    {
      icon: Building2,
      label: "🏢 Ind AS 115 & 116 Disclosures",
      query: "Explain how Ind AS 115 (Contract Liabilities / Customer Advances) and Ind AS 116 (Right-of-Use Assets & Leases) are reflected in my balance sheet line items.",
      highlight: false,
    },
    {
      icon: Lightbulb,
      label: "📝 Top 3 Strategic CA Recommendations",
      query: "Based on my current balance sheet and P&L figures, what are the top 3 actionable recommendations a Chief Financial Officer or practicing CA would give to my business?",
      highlight: false,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden h-[750px] max-h-[85vh]">
      {/* Top Live Financial Ribbon */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold font-serif text-lg">
            मु
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Munim AI Financial & Audit Analyst</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Live Context Synced
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive AI advisor for Schedule III Balance Sheet, Profit & Loss, Ratios, and Ind AS Audit
            </p>
          </div>
        </div>

        {/* Live KPI Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 text-[10px] block">Revenue</span>
            <span className="font-semibold text-white">{fmt(rev)}</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 text-[10px] block">Net PAT ({netMargin}%)</span>
            <span className={`font-semibold ${pat >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {fmt(pat)}
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 text-[10px] block">Total Assets</span>
            <span className="font-semibold text-white">{fmt(totAssets)}</span>
          </div>

          <div
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
              isBalanced
                ? "bg-emerald-950/60 border-emerald-600/50 text-emerald-300"
                : "bg-amber-950/60 border-amber-500/60 text-amber-300"
            }`}
          >
            {isBalanced ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            )}
            <div>
              <span className="text-[10px] opacity-80 block">Equilibrium</span>
              <span className="font-bold">
                {isBalanced ? "Balanced" : `Diff: ${fmt(bsDiff)}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 overflow-x-auto scrollbar-none flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-500" />
          <span>Quick Analysis:</span>
        </span>
        {QUICK_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p.query)}
            disabled={loading}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border cursor-pointer disabled:opacity-50 ${
              p.highlight
                ? "bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300 shadow-xs animate-pulse"
                : "bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border-slate-200 hover:border-emerald-300"
            }`}
          >
            <p.icon className={`w-3.5 h-3.5 ${p.highlight ? "text-amber-700" : "text-emerald-600"}`} />
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/40">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                  isUser
                    ? "bg-slate-800 text-white"
                    : "bg-emerald-800 text-white font-serif"
                }`}
              >
                {isUser ? "You" : "मु"}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-[13px] leading-relaxed relative group ${
                  isUser
                    ? "bg-emerald-800 text-white rounded-tr-xs shadow-xs"
                    : "bg-white text-slate-800 rounded-tl-xs border border-slate-200/80 shadow-xs"
                }`}
              >
                {/* Copy Button for Model messages */}
                {!isUser && (
                  <button
                    onClick={() => handleCopyMessage(m.id, m.content)}
                    className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition opacity-0 group-hover:opacity-100"
                    title="Copy response"
                  >
                    {copiedId === m.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {/* Message Content */}
                <div className="prose prose-xs max-w-none space-y-2 select-text">
                  {m.content.split("\n\n").map((para, pIdx) => {
                    // Check if table
                    if (para.includes("|") && para.includes("---")) {
                      const rows = para
                        .split("\n")
                        .filter((r) => r.trim().startsWith("|") || r.includes("|"));
                      if (rows.length >= 2) {
                        const headerCols = rows[0]
                          .split("|")
                          .map((c) => c.trim())
                          .filter(Boolean);
                        const bodyRows = rows.slice(2).map((r) =>
                          r
                            .split("|")
                            .map((c) => c.trim())
                            .filter(Boolean)
                        );
                        return (
                          <div key={pIdx} className="overflow-x-auto my-2 rounded-lg border border-slate-200">
                            <table className="w-full text-left border-collapse text-[11px]">
                              <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-200">
                                <tr>
                                  {headerCols.map((col, cIdx) => (
                                    <th key={cIdx} className="p-2 border-r border-slate-200 last:border-r-0">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {bodyRows.map((bRow, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-slate-50">
                                    {bRow.map((cell, cIdx) => (
                                      <td
                                        key={cIdx}
                                        className={`p-2 border-r border-slate-100 last:border-r-0 ${
                                          cIdx === bRow.length - 1 ? "font-semibold" : ""
                                        }`}
                                      >
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }
                    }

                    // Headers
                    if (para.startsWith("### ")) {
                      return (
                        <h4 key={pIdx} className="text-sm font-bold text-slate-900 mt-2 mb-1 flex items-center gap-1.5">
                          {para.replace("### ", "")}
                        </h4>
                      );
                    }
                    if (para.startsWith("#### ")) {
                      return (
                        <h5 key={pIdx} className="text-xs font-bold text-slate-800 mt-2 mb-0.5">
                          {para.replace("#### ", "")}
                        </h5>
                      );
                    }

                    // Bullet lists
                    if (para.startsWith("* ") || para.startsWith("- ") || para.startsWith("1. ")) {
                      const listItems = para.split("\n");
                      return (
                        <ul key={pIdx} className="list-disc pl-4 space-y-1 my-1">
                          {listItems.map((li, lIdx) => {
                            const raw = li
                              .replace(/^[\*\-\d\.]\s*/, "")
                              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                              .replace(/\*(.*?)\*/g, "<em>$1</em>");
                            const clean = DOMPurify.sanitize(raw, {
                              ALLOWED_TAGS: ["strong", "em", "code", "span", "b", "i"],
                            });
                            return (
                              <li key={lIdx} className="text-slate-700">
                                <span dangerouslySetInnerHTML={{ __html: clean }} />
                              </li>
                            );
                          })}
                        </ul>
                      );
                    }

                    // Regular paragraph
                    const rawPara = para
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.*?)\*/g, "<em>$1</em>");
                    const cleanPara = DOMPurify.sanitize(rawPara, {
                      ALLOWED_TAGS: ["strong", "em", "code", "span", "b", "i"],
                    });
                    return (
                      <p
                        key={pIdx}
                        className={isUser ? "text-white" : "text-slate-700"}
                        dangerouslySetInnerHTML={{ __html: cleanPara }}
                      />
                    );
                  })}
                </div>

                {/* Timestamp */}
                <div
                  className={`text-[10px] mt-2 text-right ${
                    isUser ? "text-emerald-200" : "text-slate-400"
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading state */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white font-serif flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
              मु
            </div>
            <div className="bg-white rounded-2xl rounded-tl-xs p-4 border border-slate-200 shadow-xs flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800">
                  Munim AI is analyzing your financial statements...
                </span>
                <p className="text-[10px] text-slate-500">
                  Cross-referencing Ind AS 1 P&L margins, Schedule III Balance Sheet, and double-entry debits/credits
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => handleSendMessage(messages[messages.length - 1]?.content || "Analyze Balance sheet")}
              className="px-2.5 py-1 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg text-xs font-semibold text-rose-900 transition"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about Profit & Loss, Balance Sheet difference, MSME 43B(h), or ratios..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition disabled:opacity-60 bg-white"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

        <p className="text-[10px] text-slate-400 text-center mt-2">
          Munim AI analyzes real-time Balance Sheet & P&L figures under Ind AS and ICAI guidelines. Not a substitute for statutory audit certification.
        </p>
      </div>
    </div>
  );
};
