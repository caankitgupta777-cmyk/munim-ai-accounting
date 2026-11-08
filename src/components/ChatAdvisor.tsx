import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, RefreshCw, AlertCircle, HelpCircle, Check, Copy } from "lucide-react";
import { BusinessProfile, ChatMessage } from "../types";
import { SCENARIO_PRESETS } from "../data/accountingData";
import { logQueryToDatabase } from "../services/queryDatabase";
import { generateRuleBasedAccountingAdvice } from "../services/caRuleEngine";
import { getAuthToken } from "../lib/firebase";
import DOMPurify from "dompurify";

interface ChatAdvisorProps {
  profile: BusinessProfile;
  onSendToVoucherGenerator?: (description: string) => void;
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

export const ChatAdvisor: React.FC<ChatAdvisorProps> = ({ 
  profile, 
  onSendToVoucherGenerator,
  initialPrompt,
  onClearInitialPrompt 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-welcome",
      role: "model",
      content: `**Namaste 👋 I'm Munim.**
Ask me anything about your business accounts.

You can ask questions like:
- *"Mera profit kitna hai?"*
- *"GST kitna bharna padega?"*
- *"Who owes me money past 45 days?"*
- *"Why did my profit fall this month?"*
- *"How to record ₹50,000 office rent with 10% TDS under 194I?"*

I help proprietors, finance teams, and MSMEs understand their numbers and record compliant double-entry journal entries strictly following Ind AS, GST, and Income Tax rules.

Tap any quick scenario below or ask directly in English, हिन्दी, or मराठी!`,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRetryableError, setHasRetryableError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const cleanDisplayErrorMessage = (msg: string): string => {
    if (!msg) return "Failed to communicate with Munim AI. Please try again.";
    try {
      const parsed = JSON.parse(msg);
      if (parsed?.error?.message) return parsed.error.message;
      if (parsed?.error) return typeof parsed.error === "string" ? parsed.error : parsed.error.message || msg;
      if (parsed?.message) return parsed.message;
    } catch {
      // not JSON
    }
    const lower = msg.toLowerCase();
    if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("fetch")) {
      return "The connection to Munim AI server was temporarily interrupted. Please click 'Retry Request' to re-attempt.";
    }
    if (lower.includes("503") || lower.includes("high demand") || lower.includes("unavailable") || lower.includes("overloaded")) {
      return "Munim AI is experiencing temporary peak demand. Automatic fallback models are engaged — please click 'Retry Request' to connect.";
    }
    return msg;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [initialPrompt]);

  const callAdvisorWithAutoRetry = async (
    chatHistory: ChatMessage[],
    maxAttempts = 3
  ): Promise<string> => {
    // Filter out initial welcome model banner and ensure valid turns
    const validTurns = chatHistory
      .filter((m) => m.id !== "initial-welcome" && m.content && m.content.trim().length > 0)
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        content: m.content,
      }));

    let lastError: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const token = await getAuthToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch("/api/accounting-agent", {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages: validTurns,
            businessContext: profile,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData.error || `Server responded with status ${response.status}`;
          if ((response.status === 503 || response.status === 504 || response.status === 429) && attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, attempt * 800));
            continue;
          }
          throw new Error(errMsg);
        }

        const data = await response.json();
        return data.reply;
      } catch (err: any) {
        lastError = err;
        const isNetworkErr =
          err?.name === "TypeError" ||
          err?.message?.includes("Failed to fetch") ||
          err?.message?.includes("NetworkError");

        if (isNetworkErr && attempt < maxAttempts) {
          console.warn(`Advisor connection attempt ${attempt} interrupted, retrying in ${attempt * 700}ms...`);
          await new Promise((r) => setTimeout(r, attempt * 700));
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error("Failed to communicate with Munim AI.");
  };

  const handleRetry = async () => {
    if (loading || messages.length === 0) return;
    setError(null);
    setHasRetryableError(false);
    setLoading(true);

    try {
      const reply = await callAdvisorWithAutoRetry(messages, 3);
      const modelMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: "model",
        content: reply,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.warn("Retry fallback to local CA Rule Engine:", err);
      const lastUser = messages.filter((m) => m.role === "user").pop();
      if (lastUser && lastUser.content) {
        try {
          const localReply = generateRuleBasedAccountingAdvice(lastUser.content, profile);
          const modelMessage: ChatMessage = {
            id: `model-${Date.now()}`,
            role: "model",
            content: `${localReply}\n\n*(⚡ Generated via Munim AI Built-in Rule Engine while server reconnects)*`,
            timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, modelMessage]);
        } catch {
          const clean = cleanDisplayErrorMessage(err?.message || "Failed to communicate with Munim AI.");
          setError(clean);
          setHasRetryableError(true);
        }
      } else {
        const clean = cleanDisplayErrorMessage(err?.message || "Failed to communicate with Munim AI.");
        setError(clean);
        setHasRetryableError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setError(null);
    setHasRetryableError(false);
    setInput("");

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setLoading(true);

    try {
      const reply = await callAdvisorWithAutoRetry(newHistory, 3);
      const modelMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: "model",
        content: reply,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, modelMessage]);

      // Log AI consultation query to database
      logQueryToDatabase({
        queryType: "advisor",
        title: query.length > 70 ? `${query.slice(0, 70)}...` : query,
        queryText: query,
        resultSummary: reply.slice(0, 1500),
        payload: {
          businessContext: profile,
        },
        status: "completed",
        tags: ["advisor", "ca-advice", profile.entityType],
      }).catch((e) => console.warn("Failed to log chat query:", e));
    } catch (err: any) {
      console.warn("Server unavailable, generating response via CA Rule Engine:", err);
      try {
        const localReply = generateRuleBasedAccountingAdvice(query, profile);
        const modelMessage: ChatMessage = {
          id: `model-${Date.now()}`,
          role: "model",
          content: `${localReply}\n\n*(⚡ Generated via Munim AI Built-in Rule Engine while server reconnects)*`,
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, modelMessage]);

        logQueryToDatabase({
          queryType: "advisor",
          title: query.length > 70 ? `${query.slice(0, 70)}...` : query,
          queryText: query,
          resultSummary: localReply.slice(0, 1500),
          payload: {
            businessContext: profile,
          },
          status: "completed",
          tags: ["advisor", "ca-advice", "local-rule-engine", profile.entityType],
        }).catch((e) => console.warn("Failed to log offline query:", e));
      } catch {
        const clean = cleanDisplayErrorMessage(err?.message || "Failed to communicate with Munim AI.");
        setError(clean);
        setHasRetryableError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "initial-welcome",
        role: "model",
        content: `**Chat reset.** What business transaction or Indian tax question would you like to solve today?`,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Helper to render markdown content with pretty formatting for tables, headers, blockquotes, and code
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];
    let inTable = false;
    let codeBuffer: string[] = [];
    let inCode = false;
    let listBuffer: { type: "ul" | "ol"; items: string[] } | null = null;

    const flushList = (key: number) => {
      if (!listBuffer || listBuffer.items.length === 0) {
        listBuffer = null;
        return;
      }
      if (listBuffer.type === "ul") {
        elements.push(
          <ul key={`ul-${key}`} className="my-2.5 space-y-1.5 pl-5 list-disc text-slate-800 text-xs sm:text-sm">
            {listBuffer.items.map((item, i) => (
              <li key={i} className="leading-relaxed">
                <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(item) }} />
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${key}`} className="my-2.5 space-y-1.5 pl-5 list-decimal text-slate-800 text-xs sm:text-sm">
            {listBuffer.items.map((item, i) => (
              <li key={i} className="leading-relaxed">
                <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(item) }} />
              </li>
            ))}
          </ol>
        );
      }
      listBuffer = null;
    };

    const flushCode = (key: number) => {
      if (codeBuffer.length === 0) return;
      const codeText = codeBuffer.join("\n");
      elements.push(
        <div key={`code-${key}`} className="my-3 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-xs">
          <div className="bg-slate-800/80 px-3 py-1.5 text-[11px] font-mono text-slate-400 flex items-center justify-between border-b border-slate-700">
            <span>Code / Tally Script</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(codeText)}
              className="text-slate-400 hover:text-emerald-400 transition"
              title="Copy snippet"
            >
              Copy
            </button>
          </div>
          <pre className="p-3.5 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
            <code>{codeText}</code>
          </pre>
        </div>
      );
      codeBuffer = [];
      inCode = false;
    };

    const flushTable = (key: number) => {
      if (tableBuffer.length === 0) return;
      const rows = tableBuffer.map((line) =>
        line
          .split("|")
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
          .map((c) => c.trim())
      );

      if (rows.length > 0) {
        const headerRow = rows[0];
        const bodyRows = rows.slice(1).filter((r) => !r.every((c) => c.match(/^[-\s:]+$/)));

        elements.push(
          <div key={`table-${key}`} className="my-3.5 overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm min-w-[520px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  {headerRow.map((cell, i) => {
                    const isRightCol = i >= 2 && (cell.toLowerCase().includes("dr") || cell.toLowerCase().includes("cr") || cell.includes("₹") || cell.toLowerCase().includes("amount"));
                    return (
                      <th key={i} className={`py-2.5 px-3.5 ${isRightCol ? "text-right" : "text-left"}`}>
                        <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(cell) }} />
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 text-xs">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                    {row.map((cell, cIdx) => {
                      const trimmedCell = cell.trim();
                      const isDash = trimmedCell === "-" || trimmedCell === "—" || trimmedCell === "";
                      const isAmount = cell.includes("₹") || /^\d+/.test(cell);
                      const isRightCol = (cIdx >= 2 && (isAmount || isDash)) || cIdx === row.length - 1;
                      
                      // Strict Dr/Cr detection
                      const lower = trimmedCell.toLowerCase();
                      const isStrictDr = lower === "dr" || lower === "dr." || lower === "dr (₹)";
                      const isStrictCr = lower === "cr" || lower === "cr." || lower === "cr (₹)";

                      return (
                        <td
                          key={cIdx}
                          className={`py-2.5 px-3.5 ${
                            isRightCol
                              ? "text-right font-mono font-semibold text-slate-900"
                              : "text-slate-800"
                          }`}
                        >
                          {isStrictDr ? (
                            <span className="font-bold text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[11px]">
                              Dr.
                            </span>
                          ) : isStrictCr ? (
                            <span className="font-bold text-purple-800 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded text-[11px]">
                              Cr.
                            </span>
                          ) : (
                            <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(cell) }} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableBuffer = [];
      inTable = false;
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Handle Code Block fence
      if (trimmed.startsWith("```")) {
        if (inCode) {
          flushCode(idx);
        } else {
          if (inTable) flushTable(idx);
          if (listBuffer) flushList(idx);
          inCode = true;
        }
        return;
      }

      if (inCode) {
        codeBuffer.push(line);
        return;
      }

      // Handle Table Lines
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        if (listBuffer) flushList(idx);
        inTable = true;
        tableBuffer.push(trimmed);
        return;
      } else if (inTable) {
        flushTable(idx);
      }

      // Handle Horizontal Rule
      if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
        if (listBuffer) flushList(idx);
        elements.push(<hr key={idx} className="my-4 border-slate-200" />);
        return;
      }

      // Handle Blockquotes (e.g. Disclaimers, Statutory notices)
      if (trimmed.startsWith("> ")) {
        if (listBuffer) flushList(idx);
        const quoteText = trimmed.replace(/^>\s*/, "");
        elements.push(
          <div
            key={idx}
            className="my-2.5 p-3 rounded-xl bg-amber-50/70 border-l-4 border-amber-500 text-amber-950 text-xs sm:text-sm leading-relaxed"
          >
            <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(quoteText) }} />
          </div>
        );
        return;
      }

      // Handle Headings
      if (trimmed.startsWith("### ")) {
        if (listBuffer) flushList(idx);
        elements.push(
          <h4 key={idx} className="text-sm sm:text-base font-bold text-slate-900 mt-4 mb-1.5 flex items-center gap-1.5">
            <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed.replace("### ", "")) }} />
          </h4>
        );
        return;
      } else if (trimmed.startsWith("## ")) {
        if (listBuffer) flushList(idx);
        elements.push(
          <h3 key={idx} className="text-base sm:text-lg font-bold text-slate-900 mt-5 mb-2 flex items-center gap-2 border-b border-slate-200 pb-1.5">
            <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed.replace("## ", "")) }} />
          </h3>
        );
        return;
      } else if (trimmed.startsWith("# ")) {
        if (listBuffer) flushList(idx);
        elements.push(
          <h2 key={idx} className="text-lg sm:text-xl font-bold text-emerald-950 mt-5 mb-2.5">
            <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed.replace("# ", "")) }} />
          </h2>
        );
        return;
      }

      // Handle Bullet Lists (- or *)
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const itemText = trimmed.substring(2).trim();
        if (listBuffer && listBuffer.type === "ul") {
          listBuffer.items.push(itemText);
        } else {
          if (listBuffer) flushList(idx);
          listBuffer = { type: "ul", items: [itemText] };
        }
        return;
      }

      // Handle Numbered Lists (1., 2., 3., 10., etc.)
      const matchNum = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (matchNum) {
        const itemText = matchNum[2].trim();
        if (listBuffer && listBuffer.type === "ol") {
          listBuffer.items.push(itemText);
        } else {
          if (listBuffer) flushList(idx);
          listBuffer = { type: "ol", items: [itemText] };
        }
        return;
      }

      // If we were in a list and hit normal text, flush the list
      if (listBuffer) {
        flushList(idx);
      }

      // Handle Regular Paragraphs
      if (trimmed.length > 0) {
        elements.push(
          <p key={idx} className="text-slate-800 text-xs sm:text-sm leading-relaxed my-2">
            <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed) }} />
          </p>
        );
      } else {
        elements.push(<div key={idx} className="h-1.5" />);
      }
    });

    if (inCode) {
      flushCode(9998);
    }
    if (inTable) {
      flushTable(9999);
    }
    if (listBuffer) {
      flushList(10000);
    }

    return elements;
  };

  const parseInlineMarkdown = (text: string) => {
    const rawHtml = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-950">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 font-mono text-xs border border-slate-300">$1</code>');

    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ["strong", "em", "code", "span", "b", "i", "br"],
      ALLOWED_ATTR: ["class"],
    });
  };

  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const copyMessage = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedMsgId(msg.id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-13.5rem)] min-h-[520px] max-h-[820px] max-w-5xl mx-auto w-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Banner / Scenarios Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Quick Small Business Scenarios
            </span>
          </div>
          <button
            onClick={handleResetChat}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
            title="Clear current conversation"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Chat</span>
          </button>
        </div>

        {/* Horizontal scroll chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {SCENARIO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSendMessage(preset.prompt)}
              disabled={loading}
              className="shrink-0 text-left px-3 py-1.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs text-slate-700 hover:text-emerald-900 transition flex items-center gap-1.5 shadow-2xs group cursor-pointer"
            >
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-800 uppercase">
                {preset.tag}
              </span>
              <span className="font-medium truncate max-w-[200px]">{preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[11px] font-medium text-slate-400">
                {msg.role === "user" ? "You" : "Munim AI (Chartered Advisor)"}
              </span>
              <span className="text-[10px] text-slate-300">• {msg.timestamp}</span>
            </div>

            <div
              className={`rounded-2xl p-4 sm:p-5 relative ${
                msg.role === "user"
                  ? "max-w-[92%] sm:max-w-[85%] bg-emerald-700 text-white rounded-tr-xs shadow-xs"
                  : "max-w-[98%] sm:max-w-[92%] bg-white text-slate-900 border border-slate-200/90 rounded-tl-xs shadow-xs"
              }`}
            >
              {/* Header & Copy bar for model responses */}
              {msg.role === "model" && (
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Munim AI
                  </span>
                  <button
                    onClick={() => copyMessage(msg)}
                    className="p-1 px-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition flex items-center gap-1 text-[11px] font-medium cursor-pointer border border-transparent hover:border-slate-200"
                    title="Copy full advisory"
                  >
                    {copiedMsgId === msg.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Advice</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {msg.role === "user" ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-white">{msg.content}</p>
              ) : (
                <div className="w-full text-slate-800 text-xs sm:text-sm">
                  {renderFormattedContent(msg.content)}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 shadow-xs flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Munim AI is consulting Indian tax laws...</span>
                <span className="block text-[11px] text-slate-400">Verifying Ind AS standards, GST rates & Section 194 TDS</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-900">Advisor Notice: </span>
                <span className="text-rose-700">{cleanDisplayErrorMessage(error)}</span>
              </div>
            </div>
            {hasRetryableError && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={loading}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                <span>Retry Request</span>
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              id="input-chat-query"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g., Bought machine for ₹2 Lakh with 18% GST and paid ₹5,000 installation, how to record under Ind AS 16?"
              disabled={loading}
              className="w-full pl-4 pr-10 py-3.5 rounded-xl border-2 border-slate-300 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>

          <button
            id="btn-send-message"
            type="submit"
            disabled={!input.trim() || loading}
            className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-sm font-semibold transition flex items-center gap-2 shadow-xs shrink-0"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#102A43] border border-[#1E3A56] text-[11px] text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-cyan-300 font-semibold">✓ Based on available transaction data</span>
            <span className="text-slate-400 hidden sm:inline">• Ind AS & GST double-entry verified</span>
          </div>
          <span className="text-slate-400 text-[10px]">
            Statutory disclaimer in footer
          </span>
        </div>
      </div>
    </div>
  );
};
