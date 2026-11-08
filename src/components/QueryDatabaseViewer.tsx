import React, { useState, useEffect } from "react";
import {
  Database,
  Search,
  Trash2,
  Download,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Filter,
  Sparkles,
  FileText,
  Calculator,
  Layers,
  Camera,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { QueryRecord } from "../types";
import {
  subscribeToQueries,
  deleteQueryFromDatabase,
  clearAllQueriesFromDatabase,
} from "../services/queryDatabase";

interface QueryDatabaseViewerProps {
  onLoadIntoTool?: (query: QueryRecord) => void;
}

export const QueryDatabaseViewer: React.FC<QueryDatabaseViewerProps> = ({
  onLoadIntoTool,
}) => {
  const [queries, setQueries] = useState<QueryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToQueries((records) => {
      setQueries(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    await deleteQueryFromDatabase(id);
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear all query logs from the database?")) {
      await clearAllQueriesFromDatabase();
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(queries, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `indialedger_queries_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    if (queries.length === 0) return;
    const headers = ["ID", "Timestamp", "Type", "Title", "Query Text", "Status", "Summary"];
    const rows = queries.map((q) => [
      `"${q.id}"`,
      `"${q.createdAt}"`,
      `"${q.queryType}"`,
      `"${(q.title || "").replace(/"/g, '""')}"`,
      `"${(q.queryText || "").replace(/"/g, '""')}"`,
      `"${q.status}"`,
      `"${(q.resultSummary || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `indialedger_queries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Filter queries
  const filteredQueries = queries.filter((q) => {
    const matchesType = selectedType === "all" || q.queryType === selectedType;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      q.title.toLowerCase().includes(term) ||
      q.queryText.toLowerCase().includes(term) ||
      (q.resultSummary && q.resultSummary.toLowerCase().includes(term)) ||
      (q.tags && q.tags.some((t) => t.toLowerCase().includes(term)));
    return matchesType && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "advisor":
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case "voucher":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "gst_calc":
        return <Calculator className="w-4 h-4 text-amber-600" />;
      case "setoff":
        return <Layers className="w-4 h-4 text-purple-600" />;
      case "ocr_scan":
        return <Camera className="w-4 h-4 text-rose-600" />;
      default:
        return <Database className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "advisor":
        return { label: "AI Advisor", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" };
      case "voucher":
        return { label: "Voucher Entry", bg: "bg-blue-50 text-blue-800 border-blue-200" };
      case "gst_calc":
        return { label: "GST Calculator", bg: "bg-amber-50 text-amber-800 border-amber-200" };
      case "setoff":
        return { label: "ITC Set-off", bg: "bg-purple-50 text-purple-800 border-purple-200" };
      case "ocr_scan":
        return { label: "Receipt OCR", bg: "bg-rose-50 text-rose-800 border-rose-200" };
      case "financials":
        return { label: "Financials", bg: "bg-teal-50 text-teal-800 border-teal-200" };
      default:
        return { label: type, bg: "bg-slate-100 text-slate-800 border-slate-200" };
    }
  };

  // Metrics
  const totalCount = queries.length;
  const advisorCount = queries.filter((q) => q.queryType === "advisor").length;
  const voucherCount = queries.filter((q) => q.queryType === "voucher").length;
  const gstCount = queries.filter((q) => q.queryType === "gst_calc" || q.queryType === "setoff").length;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      {/* Database Status Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
              <Database className="w-5 h-5 text-emerald-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">
                  Cloud Query Database & Audit Trail
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Firestore Live
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Every calculation, AI tax consultation, voucher entry, and receipt scan is permanently logged with structured metadata.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-export-json"
              onClick={handleExportJson}
              disabled={queries.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>JSON</span>
            </button>
            <button
              type="button"
              id="btn-export-csv"
              onClick={handleExportCsv}
              disabled={queries.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>
            {queries.length > 0 && (
              <button
                type="button"
                id="btn-clear-database"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
                title="Clear all queries"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Total Queries Logged</span>
            <span className="text-xl font-bold text-slate-900">{totalCount}</span>
          </div>
          <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100">
            <span className="text-[11px] font-medium text-emerald-800 block">AI Tax Consultations</span>
            <span className="text-xl font-bold text-emerald-900">{advisorCount}</span>
          </div>
          <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100">
            <span className="text-[11px] font-medium text-blue-800 block">Vouchers Created</span>
            <span className="text-xl font-bold text-blue-900">{voucherCount}</span>
          </div>
          <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100">
            <span className="text-[11px] font-medium text-amber-800 block">GST Computations</span>
            <span className="text-xl font-bold text-amber-900">{gstCount}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-query-search"
            type="text"
            placeholder="Search queries, HSN, vouchers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-emerald-600 shadow-2xs"
          />
        </div>

        {/* Filter Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Logs" },
            { id: "advisor", label: "AI Advisor" },
            { id: "voucher", label: "Vouchers" },
            { id: "gst_calc", label: "GST Calc" },
            { id: "setoff", label: "Set-off" },
            { id: "ocr_scan", label: "Receipts" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              id={`filter-type-${cat.id}`}
              onClick={() => setSelectedType(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedType === cat.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Query List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-500">Syncing database queries from Firestore...</p>
        </div>
      ) : filteredQueries.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <Database className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Queries Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchTerm
              ? "No queries match your search filter. Try clearing the search term."
              : "Execute a prompt in the AI Advisor, calculate GST, create a voucher, or scan a receipt to log queries in the database."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQueries.map((record) => {
            const badge = getTypeBadge(record.queryType);
            const isExpanded = expandedId === record.id;
            const formattedDate = new Date(record.createdAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={record.id}
                id={`query-card-${record.id}`}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-2xs transition overflow-hidden"
              >
                {/* Header row */}
                <div
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0 mt-0.5">
                      {getTypeIcon(record.queryType)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {record.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                        {record.queryText}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <span className="text-[11px] text-slate-400 font-mono inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formattedDate}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : record.id);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3">
                    {/* Full Query Input */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Full Query / Input Details:
                      </span>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap">
                        {record.queryText}
                      </div>
                    </div>

                    {/* Result Summary */}
                    {record.resultSummary && (
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Result / Computed Output:
                        </span>
                        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs text-emerald-950 whitespace-pre-wrap">
                          {record.resultSummary}
                        </div>
                      </div>
                    )}

                    {/* Structured Payload (if available) */}
                    {record.payload && Object.keys(record.payload).length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Structured Metadata Payload (JSON):
                        </span>
                        <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48">
                          {JSON.stringify(record.payload, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          id={`btn-copy-query-${record.id}`}
                          onClick={() => handleCopy(record.id, record.queryText)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                        >
                          {copiedId === record.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span>{copiedId === record.id ? "Copied" : "Copy Query"}</span>
                        </button>

                        {onLoadIntoTool && (
                          <button
                            type="button"
                            id={`btn-load-query-${record.id}`}
                            onClick={() => onLoadIntoTool(record)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 hover:bg-emerald-200 transition cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Load into Module</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        id={`btn-delete-query-${record.id}`}
                        onClick={() => handleDelete(record.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Record</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
