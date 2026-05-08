"use client";

import { useEffect, useRef } from "react";
import {
  X,
  ExternalLink,
  MapPin,
  Building2,
  Tag,
  Zap,
  Globe,
  Mail,
  Linkedin,
  Briefcase,
} from "lucide-react";
import { Job } from "@/types/job";
import StatusBadge from "./StatusBadge";
import clsx from "clsx";

interface JobDetailModalProps {
  job: Job;
  onClose: () => void;
  onGenerateEmail: (hrEmail?: string) => void;
  onJobUpdate?: (updatedJob: Job) => void;
}

export default function JobDetailModal({
  job,
  onClose,
  onGenerateEmail,
  onJobUpdate,
}: JobDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Resolve best available company name
  const companyName = job.company_name || job.company || "—";

  // Collect all HR emails from both fields
  const hrEmails: string[] = [
    ...(job.possible_hr_emails || []),
    ...(job.hr_email_guess && !job.possible_hr_emails?.includes(job.hr_email_guess)
      ? [job.hr_email_guess]
      : []),
  ].filter(Boolean);

  const isEnriched = !!(job.company_summary || job.industry || job.website || hrEmails.length > 0);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl fade-in"
        style={{ background: "#13151f" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 py-4 border-b border-white/10"
          style={{ background: "#13151f" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-white leading-tight">
                {job.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-sm text-slate-400">
                  <Building2 className="w-3.5 h-3.5" />
                  {companyName}
                </span>
                <span className="flex items-center gap-1 text-sm text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.location || "Remote"}
                </span>
                <StatusBadge status={job.status} />
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-white/8" style={{ background: "rgba(255,255,255,0.02)" }}>
              <p className="text-xs text-slate-500 mb-1">Source</p>
              <p className="text-sm text-slate-300 font-medium">{job.source || "—"}</p>
            </div>
            <div className="p-3 rounded-xl border border-white/8" style={{ background: "rgba(255,255,255,0.02)" }}>
              <p className="text-xs text-slate-500 mb-1">Salary</p>
              <p className="text-sm text-slate-300 font-medium">{job.salary || "Not specified"}</p>
            </div>
            <div className="p-3 rounded-xl border border-white/8" style={{ background: "rgba(255,255,255,0.02)" }}>
              <p className="text-xs text-slate-500 mb-1">Score</p>
              <p className="text-sm font-medium">
                <span className={clsx(
                  job.score >= 70 ? "text-green-400" :
                  job.score >= 40 ? "text-yellow-400" : "text-slate-400"
                )}>
                  {job.score > 0 ? `${job.score}/100` : "Not scored"}
                </span>
              </p>
            </div>
            <div className="p-3 rounded-xl border border-white/8" style={{ background: "rgba(255,255,255,0.02)" }}>
              <p className="text-xs text-slate-500 mb-1">Posted</p>
              <p className="text-sm text-slate-300 font-medium">{formatDate(job.created_at)}</p>
            </div>
          </div>

          {/* Tags */}
          {job.tags && (
            <div className="flex items-start gap-2">
              <Tag className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-400">{job.tags}</p>
            </div>
          )}

          {/* AI match reason */}
          {job.reason && (
            <div className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
              <p className="text-xs text-yellow-500/70 mb-1 font-medium">AI Match Note</p>
              <p className="text-sm text-yellow-400/80">{job.reason}</p>
            </div>
          )}

          {/* ── Company Info (from DB) ── */}
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <div
              className="flex items-center gap-2 px-4 py-3 border-b border-white/8"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <Building2 className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-medium text-slate-300">Company Info</span>
              {isEnriched && (
                <span className="text-xs text-slate-600 ml-1">· enriched</span>
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* Summary */}
              {job.company_summary ? (
                <p className="text-sm text-slate-300 leading-relaxed">{job.company_summary}</p>
              ) : (
                <p className="text-sm text-slate-600 italic">No company summary available.</p>
              )}

              {/* Industry + Website + LinkedIn row */}
              <div className="flex flex-wrap gap-3">
                {job.industry && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    {job.industry}
                  </div>
                )}
                {job.website && (
                  <a
                    href={job.website.startsWith("http") ? job.website : `https://${job.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Website
                  </a>
                )}
                {job.linkedin && (
                  <a
                    href={job.linkedin.startsWith("http") ? job.linkedin : `https://${job.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    LinkedIn
                  </a>
                )}
                {job.careers_url && (
                  <a
                    href={job.careers_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Careers Page
                  </a>
                )}
              </div>

              {/* HR Emails */}
              {hrEmails.length > 0 ? (
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 space-y-2">
                  <p className="text-xs text-green-400/80 font-medium flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    HR / Recruiting Emails
                  </p>
                  <div className="space-y-1.5">
                    {hrEmails.map((email) => (
                      <div key={email} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-300 font-mono">{email}</span>
                        <button
                          onClick={() => {
                            onGenerateEmail(email);
                            onClose();
                          }}
                          className="shrink-0 text-xs px-2 py-1 rounded bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/20"
                        >
                          Use &amp; Send
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600">No HR emails found in record.</p>
              )}
            </div>
          </div>

          {/* Job Description */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Job Description</h3>
            <div
              className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap rounded-xl p-4 border border-white/8 max-h-64 overflow-y-auto"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              {job.description || "No description available."}
            </div>
          </div>

          {/* Saved email preview */}
          {job.email_body && (
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Saved Email</h3>
              <div
                className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap rounded-xl p-4 border border-white/8 max-h-48 overflow-y-auto"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <p className="text-xs text-slate-500 mb-2">Subject: {job.email_subject}</p>
                {job.email_body}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => onGenerateEmail()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium bg-gradient-to-r from-brand-500 to-purple-600 text-white hover:from-brand-600 hover:to-purple-700 shadow-lg shadow-brand-500/20"
            >
              <Zap className="w-4 h-4" />
              {job.email_body ? "Regenerate Email" : "Generate Cover Letter"}
            </button>
            <a
              href={job.apply_url || job.careers_url || job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium bg-white/8 hover:bg-white/12 border border-white/10 text-white"
            >
              <ExternalLink className="w-4 h-4" />
              Apply
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
