"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Copy,
  Check,
  Mail,
  ChevronDown,
  Send,
  AtSign,
  CheckSquare,
  Square,
} from "lucide-react";
import { Job } from "@/types/job";
import ResumeUploader from "./ResumeUploader";
import clsx from "clsx";

interface SendResult {
  email: string;
  success: boolean;
  error?: string;
}

interface EmailModalProps {
  job: Job;
  onClose: () => void;
  onSave?: (subject: string, body: string) => void;
  initialRecipient?: string;
}

export default function EmailModal({ job, onClose, onSave, initialRecipient }: EmailModalProps) {
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [subject, setSubject] = useState(job.email_subject || `Application for ${job.title}`);
  const [body, setBody] = useState(job.email_body || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);
  const [saved, setSaved] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showSendForm, setShowSendForm] = useState(!!initialRecipient);

  // Build the full list of HR emails from the job record
  const jobHrEmails: string[] = [
    ...(job.possible_hr_emails || []),
    ...(job.hr_email_guess && !job.possible_hr_emails?.includes(job.hr_email_guess)
      ? [job.hr_email_guess]
      : []),
  ].filter(Boolean);

  // Selected recipients — default: all HR emails pre-checked, plus initialRecipient if provided
  const defaultSelected = initialRecipient
    ? Array.from(new Set([initialRecipient, ...jobHrEmails]))
    : jobHrEmails;

  const [selectedEmails, setSelectedEmails] = useState<string[]>(defaultSelected);
  const [customEmail, setCustomEmail] = useState(
    initialRecipient && !jobHrEmails.includes(initialRecipient) ? initialRecipient : ""
  );

  // Send state
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<SendResult[] | null>(null);
  const [sendError, setSendError] = useState("");

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

  const generateEmail = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job, resumeText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate email.");
      setSubject(data.subject);
      setBody(data.body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: "subject" | "body") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(subject, body);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const toggleEmail = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const addCustomEmail = () => {
    const email = customEmail.trim();
    if (!email || selectedEmails.includes(email)) return;
    setSelectedEmails((prev) => [...prev, email]);
    setCustomEmail("");
  };

  const allRecipients = selectedEmails.filter(Boolean);

  const handleSendViaGmail = async () => {
    if (allRecipients.length === 0) return;
    setSending(true);
    setSendError("");
    setSendResults(null);

    try {
      const formData = new FormData();
      formData.append("to", allRecipients.join(","));
      formData.append("subject", subject);
      formData.append("emailBody", body);
      if (resumeFile) formData.append("resume", resumeFile, resumeFile.name);

      const res = await fetch("/api/send-email", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send email.");

      setSendResults(data.results);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  const hasEmail = body.trim().length > 0;
  const successCount = sendResults?.filter((r) => r.success).length ?? 0;
  const failCount = sendResults?.filter((r) => !r.success).length ?? 0;

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
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10"
          style={{ background: "#13151f" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <Mail className="w-4 h-4 text-brand-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Generate Cover Letter</h2>
              <p className="text-xs text-slate-500 truncate max-w-xs">{job.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Job summary */}
          <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-300">Job Details</span>
                <span className="text-xs text-slate-500">
                  {job.company_name || job.company || "Company N/A"} · {job.location}
                </span>
              </div>
              <ChevronDown className={clsx("w-4 h-4 text-slate-500 transition-transform", showDescription && "rotate-180")} />
            </button>
            {showDescription && (
              <div className="px-4 pb-4 border-t border-white/8">
                <p className="text-xs text-slate-400 mt-3 leading-relaxed line-clamp-6">{job.description}</p>
              </div>
            )}
          </div>

          {/* Resume upload */}
          <ResumeUploader onResumeText={setResumeText} onResumeFile={setResumeFile} resumeText={resumeText} />

          {/* Generate button */}
          <button
            onClick={generateEmail}
            disabled={loading}
            className={clsx(
              "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm",
              "bg-gradient-to-r from-brand-500 to-purple-600 text-white",
              "hover:from-brand-600 hover:to-purple-700 active:scale-[0.98]",
              "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100",
              "shadow-lg shadow-brand-500/20"
            )}
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Generating with AI...</span></>
            ) : (
              <><Sparkles className="w-4 h-4" /><span>{body ? "Regenerate Email" : "Generate Personalized Email"}</span></>
            )}
          </button>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Email output */}
          {hasEmail && (
            <div className="space-y-4 fade-in">
              {/* Subject */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Subject Line</label>
                  <button onClick={() => copyToClipboard(subject, "subject")} className="flex items-center gap-1 text-xs text-slate-500 hover:text-white px-2 py-1 rounded hover:bg-white/10">
                    {copied === "subject" ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white border border-white/10 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email Body</label>
                  <button onClick={() => copyToClipboard(body, "body")} className="flex items-center gap-1 text-xs text-slate-500 hover:text-white px-2 py-1 rounded hover:bg-white/10">
                    {copied === "body" ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-slate-200 border border-white/10 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 resize-none leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                />
              </div>

              {/* Send results */}
              {sendResults && (
                <div className={clsx(
                  "p-3 rounded-lg border space-y-2",
                  failCount === 0 ? "bg-green-500/10 border-green-500/20" : "bg-yellow-500/10 border-yellow-500/20"
                )}>
                  <p className={clsx("text-sm font-medium", failCount === 0 ? "text-green-400" : "text-yellow-400")}>
                    {successCount} sent{resumeFile ? " with resume" : ""}{failCount > 0 ? `, ${failCount} failed` : ""}
                  </p>
                  <div className="space-y-1">
                    {sendResults.map((r) => (
                      <div key={r.email} className="flex items-center gap-2 text-xs">
                        {r.success
                          ? <Check className="w-3 h-3 text-green-400 shrink-0" />
                          : <X className="w-3 h-3 text-red-400 shrink-0" />}
                        <span className={clsx("font-mono", r.success ? "text-slate-300" : "text-red-400")}>
                          {r.email}
                        </span>
                        {!r.success && r.error && (
                          <span className="text-red-400/70">— {r.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gmail send form */}
              {showSendForm && (
                <div className="rounded-xl border border-white/10 p-4 space-y-3 fade-in" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Send via Gmail</p>
                    {allRecipients.length > 0 && (
                      <span className="text-xs text-slate-500">{allRecipients.length} recipient{allRecipients.length > 1 ? "s" : ""}</span>
                    )}
                  </div>

                  {/* HR emails checklist */}
                  {jobHrEmails.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-500">HR emails from job record:</p>
                      {jobHrEmails.map((email) => (
                        <button
                          key={email}
                          onClick={() => toggleEmail(email)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 text-left"
                        >
                          {selectedEmails.includes(email)
                            ? <CheckSquare className="w-4 h-4 text-green-400 shrink-0" />
                            : <Square className="w-4 h-4 text-slate-600 shrink-0" />}
                          <span className="text-xs text-slate-300 font-mono">{email}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Custom email input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="email"
                        placeholder="Add another email..."
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addCustomEmail(); }}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm text-white border border-white/10 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      />
                    </div>
                    <button
                      onClick={addCustomEmail}
                      disabled={!customEmail.trim()}
                      className="px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white border border-white/10 hover:bg-white/8 disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>

                  {/* Custom added emails */}
                  {selectedEmails.filter((e) => !jobHrEmails.includes(e)).map((email) => (
                    <div key={email} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20">
                      <span className="text-xs text-slate-300 font-mono flex-1">{email}</span>
                      <button onClick={() => toggleEmail(email)} className="text-slate-500 hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {sendError && <p className="text-xs text-red-400">{sendError}</p>}

                  <button
                    onClick={handleSendViaGmail}
                    disabled={sending || allRecipients.length === 0}
                    className={clsx(
                      "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium",
                      "bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400",
                      "disabled:opacity-40 disabled:cursor-not-allowed"
                    )}
                  >
                    {sending ? (
                      <><div className="w-3.5 h-3.5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />Sending to {allRecipients.length}...</>
                    ) : (
                      <><Send className="w-3.5 h-3.5" />Send to {allRecipients.length} recipient{allRecipients.length !== 1 ? "s" : ""}{resumeFile ? " + resume" : ""}</>
                    )}
                  </button>

                  <p className="text-xs text-slate-600">Each recipient gets a separate email from your Gmail account.</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleSave}
                  disabled={!hasEmail}
                  className={clsx(
                    "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium",
                    "bg-white/8 hover:bg-white/12 border border-white/10 text-white",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  {saved ? <><Check className="w-4 h-4 text-green-400" /> Saved!</> : "Save to Job"}
                </button>

                <button
                  onClick={() => copyToClipboard(`Subject: ${subject}\n\n${body}`, "body")}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 text-brand-400"
                >
                  {copied === "body" ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy All</>}
                </button>

                <button
                  onClick={() => { setShowSendForm((v) => !v); setSendError(""); setSendResults(null); }}
                  className={clsx(
                    "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium border transition-colors",
                    showSendForm
                      ? "bg-green-500/20 border-green-500/30 text-green-400"
                      : "bg-white/8 hover:bg-white/12 border-white/10 text-white"
                  )}
                >
                  <Send className="w-4 h-4" />
                  Gmail{jobHrEmails.length > 0 ? ` (${jobHrEmails.length})` : ""}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
