"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import clsx from "clsx";

interface ResumeUploaderProps {
  onResumeText: (text: string) => void;
  onResumeFile?: (file: File | null) => void;
  resumeText: string;
}

export default function ResumeUploader({
  onResumeText,
  onResumeFile,
  resumeText,
}: ResumeUploaderProps) {
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const extractText = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "txt") {
      return await file.text();
    }

    if (ext === "pdf" || ext === "docx") {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Failed to parse ${ext.toUpperCase()}`);
      const data = await res.json();
      return data.text;
    }

    throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setLoading(true);
      setError("");

      try {
        const text = await extractText(file);
        setFileName(file.name);
        onResumeText(text);
        onResumeFile?.(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to read file.");
      } finally {
        setLoading(false);
      }
    },
    [onResumeText, onResumeFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const clearResume = () => {
    setFileName("");
    onResumeText("");
    onResumeFile?.(null);
    setError("");
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">
        Resume{" "}
        <span className="text-slate-500 font-normal">
          (optional — improves personalization &amp; attached to email)
        </span>
      </label>

      {resumeText && fileName ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-green-400 font-medium truncate">{fileName}</p>
            <p className="text-xs text-slate-500">
              {resumeText.length.toLocaleString()} characters · will be attached to email
            </p>
          </div>
          <button
            onClick={clearResume}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
            title="Remove resume"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={clsx(
            "relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer",
            "transition-all duration-200",
            isDragActive
              ? "border-brand-500 bg-brand-500/10"
              : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]",
            loading && "pointer-events-none opacity-60"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {loading ? (
              <>
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Parsing resume...</p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  {isDragActive ? (
                    <FileText className="w-5 h-5 text-brand-500" />
                  ) : (
                    <Upload className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-300">
                    {isDragActive
                      ? "Drop your resume here"
                      : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    PDF, DOCX, or TXT · Max 5MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <X className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}
