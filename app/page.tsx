"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Zap,
  Eye,
  Filter,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Job } from "@/types/job";
import StatusBadge from "@/components/StatusBadge";
import EmailModal from "@/components/EmailModal";
import JobDetailModal from "@/components/JobDetailModal";
import clsx from "clsx";

const STATUS_OPTIONS = ["", "new", "applied", "interview", "rejected", "saved"];
const LIMIT = 20;

interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  totalPages: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="glass rounded-xl p-4 flex items-center gap-4">
      <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [emailJob, setEmailJob] = useState<Job | null>(null);
  const [emailRecipient, setEmailRecipient] = useState<string | undefined>(undefined);
  const [showDetailFor, setShowDetailFor] = useState<Job | null>(null);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchJobs = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      else setRefreshing(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(LIMIT),
          ...(search && { search }),
          ...(statusFilter && { status: statusFilter }),
        });

        const res = await fetch(`/api/jobs?${params}`);
        const data: JobsResponse & { error?: string } = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch jobs.");

        setJobs(data.jobs);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, statusFilter]
  );

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchJobs();
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter]);

  const handleStatusChange = (filter: string) => {
    setStatusFilter(filter);
    setPage(1);
  };

  const handleQuickStatus = async (job: Job, newStatus: string) => {
    // Optimistic update
    setJobs((prev) =>
      prev.map((j) => (j._id === job._id ? { ...j, status: newStatus } : j))
    );
    try {
      await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: job._id, status: newStatus }),
      });
    } catch {
      // Revert on failure
      setJobs((prev) =>
        prev.map((j) => (j._id === job._id ? { ...j, status: job.status } : j))
      );
    }
  };

  const handleSaveEmail = async (job: Job, subject: string, body: string) => {
    try {
      await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: job._id,
          email_subject: subject,
          email_body: body,
          status: job.status === "new" ? "applied" : job.status,
        }),
      });
      // Update local state
      setJobs((prev) =>
        prev.map((j) =>
          j._id === job._id
            ? { ...j, email_subject: subject, email_body: body }
            : j
        )
      );
    } catch {
      // Non-critical — email was still generated
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      if (hours < 1) return "Just now";
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // Stats from current data
  const stats = {
    total,
    applied: jobs.filter((j) => j.status === "applied").length,
    interview: jobs.filter((j) => j.status === "interview").length,
    new: jobs.filter((j) => j.status === "new").length,
  };

  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>
      {/* Header */}
      <header className="border-b border-white/8 sticky top-0 z-30" style={{ background: "rgba(15,17,23,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">Job Dashboard</h1>
              <p className="text-xs text-slate-500">AI-powered application tracker</p>
            </div>
          </div>
          <button
            onClick={() => fetchJobs({ silent: true })}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/8 border border-white/10 disabled:opacity-50"
          >
            <RefreshCw className={clsx("w-3.5 h-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Briefcase} label="Total Jobs" value={total} color="bg-blue-500/15 text-blue-400" />
          <StatCard icon={Clock} label="New" value={stats.new} color="bg-slate-500/15 text-slate-400" />
          <StatCard icon={CheckCircle2} label="Applied" value={stats.applied} color="bg-green-500/15 text-green-400" />
          <StatCard icon={TrendingUp} label="Interviews" value={stats.interview} color="bg-purple-500/15 text-purple-400" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search jobs, companies, locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 border border-white/10 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-xl text-sm text-white border border-white/10 focus:border-brand-500 focus:outline-none appearance-none cursor-pointer"
              style={{ background: "#1a1d27" }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All Statuses"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {["Job Title", "Company", "Location", "Status", "Posted", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {[200, 120, 100, 80, 70, 120].map((w, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="skeleton h-4 rounded" style={{ width: w }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-slate-600" />
                        </div>
                        <p className="text-slate-500 text-sm">
                          {search || statusFilter ? "No jobs match your filters." : "No jobs found in the database."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  jobs.map((job, idx) => (
                    <tr
                      key={job._id}
                      className={clsx(
                        "border-b border-white/5 hover:bg-white/[0.02] group",
                        "transition-colors duration-100"
                      )}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {/* Title */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <button
                          onClick={() => setShowDetailFor(job)}
                          className="text-sm font-medium text-white hover:text-brand-400 text-left line-clamp-1 transition-colors"
                        >
                          {job.title}
                        </button>
                        {job.source && (
                          <p className="text-xs text-slate-600 mt-0.5">{job.source}</p>
                        )}
                      </td>

                      {/* Company */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-400">
                          {job.company_name || job.company || <span className="text-slate-600">—</span>}
                        </span>
                        {job.industry && (
                          <p className="text-xs text-slate-600 mt-0.5">{job.industry}</p>
                        )}
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-400 whitespace-nowrap">
                          {job.location || "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={job.status} />
                          {/* Quick applied toggle */}
                          <button
                            onClick={() =>
                              handleQuickStatus(
                                job,
                                job.status === "applied" ? "new" : "applied"
                              )
                            }
                            title={job.status === "applied" ? "Mark as new" : "Mark as applied"}
                            className={clsx(
                              "p-1 rounded-md transition-colors",
                              job.status === "applied"
                                ? "text-green-400 hover:text-slate-400 hover:bg-white/5"
                                : "text-slate-600 hover:text-green-400 hover:bg-green-500/10"
                            )}
                          >
                            {job.status === "applied" ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Circle className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Posted */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(job.created_at)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setShowDetailFor(job)}
                            title="View details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setEmailRecipient(undefined); setEmailJob(job); }}
                            title="Generate cover letter"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-400 hover:bg-purple-500/10"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={job.apply_url || job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open job listing"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} jobs
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 5) p = i + 1;
                    else if (page <= 3) p = i + 1;
                    else if (page >= totalPages - 2) p = totalPages - 4 + i;
                    else p = page - 2 + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={clsx(
                          "w-7 h-7 rounded-lg text-xs font-medium",
                          p === page
                            ? "bg-brand-500 text-white"
                            : "text-slate-400 hover:text-white hover:bg-white/10"
                        )}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showDetailFor && (
        <JobDetailModal
          job={showDetailFor}
          onClose={() => setShowDetailFor(null)}
          onGenerateEmail={(hrEmail?: string) => {
            setEmailRecipient(hrEmail);
            setEmailJob(showDetailFor);
            setShowDetailFor(null);
          }}
          onJobUpdate={(updatedJob) => {
            setJobs((prev) =>
              prev.map((j) => (j._id === updatedJob._id ? updatedJob : j))
            );
            setShowDetailFor(updatedJob);
          }}
        />
      )}

      {emailJob && (
        <EmailModal
          job={emailJob}
          onClose={() => { setEmailJob(null); setEmailRecipient(undefined); }}
          onSave={(subject, body) => handleSaveEmail(emailJob, subject, body)}
          initialRecipient={emailRecipient}
        />
      )}
    </div>
  );
}
