import React, { useState } from "react";
import { MessageSquarePlus, Star, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { submitFeedback } from "../services/feedbackService";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  activeModule?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  activeModule = "General",
}) => {
  const [feedbackType, setFeedbackType] = useState<"bug" | "feature" | "accounting_query" | "general">("bug");
  const [module, setModule] = useState(activeModule);
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState(userEmail || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please provide both a title and description.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await submitFeedback({
      type: feedbackType,
      module,
      rating,
      title: title.trim(),
      description: description.trim(),
      userEmail: email.trim() || undefined,
      deviceInfo: `${navigator.userAgent} | Screen: ${window.innerWidth}x${window.innerHeight}`,
    });

    setIsSubmitting(false);

    if (res.success) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setTitle("");
        setDescription("");
        onClose();
      }, 2000);
    } else {
      setError(res.error || "Failed to submit feedback. Saved locally.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#102A43] border border-[#1E3A56] rounded-2xl w-full max-w-lg shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E3A56] flex items-center justify-between bg-[#071A2B]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Munim AI Beta Feedback & Bug Report</h3>
              <p className="text-[11px] text-slate-400">Direct feedback channel to CA Ankit Gupta & engineering team</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1E3A56]/50 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Thank You for Your Feedback!</h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Your report has been logged and queued for audit by CA Ankit Gupta. We are constantly improving Munim AI for public beta.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Type & Module row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Feedback Type</label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value as any)}
                  className="w-full bg-[#071A2B] border border-[#1E3A56] rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-cyan-500"
                >
                  <option value="bug">Report a Bug / Error</option>
                  <option value="feature">Suggest a Feature</option>
                  <option value="accounting_query">Accounting / Tax Rule Issue</option>
                  <option value="general">General Experience</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Module</label>
                <select
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  className="w-full bg-[#071A2B] border border-[#1E3A56] rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-cyan-500"
                >
                  <option value="Voucher Generator">Voucher Generator</option>
                  <option value="GST Engine">GST Engine & Calculations</option>
                  <option value="TDS Engine">TDS Statutory Engine</option>
                  <option value="Financial Statements">Financial Statements & TB</option>
                  <option value="Receipt Scanner">Receipt OCR Scanner</option>
                  <option value="Tax Calendar">Tax Calendar</option>
                  <option value="AI Accounting Chat">AI Accounting Chat</option>
                  <option value="General">Other / Platform</option>
                </select>
              </div>
            </div>

            {/* Rating Stars */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Experience Rating</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-500 hover:text-amber-400 transition cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-600"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-slate-400 ml-2">
                  {rating === 5 ? "Excellent" : rating === 4 ? "Good" : rating === 3 ? "Average" : rating === 2 ? "Needs Work" : "Major Issues"}
                </span>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Title / Issue Summary *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Section 194C threshold calculation error in subcontract voucher"
                className="w-full bg-[#071A2B] border border-[#1E3A56] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Detailed Remarks & Steps to Reproduce *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Please describe what you observed, what you expected, and any numbers involved..."
                className="w-full bg-[#071A2B] border border-[#1E3A56] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 resize-none"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Your Email (for updates / follow-up)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#071A2B] border border-[#1E3A56] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E3A56]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#071A2B] hover:bg-[#1E3A56] text-slate-300 font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
