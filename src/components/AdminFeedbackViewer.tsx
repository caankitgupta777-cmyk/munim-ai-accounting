import React, { useState, useEffect } from "react";
import { ShieldCheck, MessageSquare, RefreshCw, AlertCircle, CheckCircle, Bug, Star, FileText } from "lucide-react";
import { fetchAllFeedbackForAdmin } from "../services/feedbackService";
import { FeedbackSubmission } from "../types";

interface AdminFeedbackViewerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
}

export const AdminFeedbackViewer: React.FC<AdminFeedbackViewerProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
}) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  const isAdmin = currentUserEmail === "caankitgupta777@gmail.com" || currentUserEmail === "admin@munimai.in";

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const data = await fetchAllFeedbackForAdmin();
      setFeedbacks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFeedbacks();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = filterType === "all" ? feedbacks : feedbacks.filter(f => f.type === filterType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#102A43] border border-[#1E3A56] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E3A56] flex items-center justify-between bg-[#071A2B]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Admin Feedback & Bug Audit Desk</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">
                  CA Audit Panel
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logged user reports, beta tester feedback, and accounting engine discrepancies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadFeedbacks}
              disabled={loading}
              className="p-2 rounded-lg bg-[#071A2B] hover:bg-[#1E3A56] text-slate-300 hover:text-white transition cursor-pointer"
              title="Refresh feedback logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-[#1E3A56] hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-3 border-b border-[#1E3A56] bg-[#0c2136] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Category:</span>
            {["all", "bug", "accounting_query", "feature", "rating", "general"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterType(cat)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition cursor-pointer ${
                  filterType === cat
                    ? "bg-cyan-500 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1E3A56]/60"
                }`}
              >
                {cat.replace("_", " ")}
              </button>
            ))}
          </div>
          <span className="text-slate-400">
            Total records: <strong className="text-white">{filtered.length}</strong>
          </span>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Loading feedback reports...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No feedback records found in this category.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#071A2B]/80 border border-[#1E3A56] hover:border-cyan-500/40 transition space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.type === "bug"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : item.type === "accounting_query"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : item.type === "feature"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      }`}
                    >
                      {item.type.replace("_", " ")}
                    </span>
                    {item.module && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {item.module}
                      </span>
                    )}
                    {item.rating && (
                      <span className="flex items-center gap-1 text-amber-400 text-[11px] font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {item.rating}/5
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(item.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{item.description}</p>

                <div className="pt-2 border-t border-[#1E3A56]/60 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>
                      User: <span className="text-slate-300">{item.contactEmail || item.userId || "Anonymous"}</span>
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono text-[10px]">ID: {item.id}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
