"use client";

import clsx from "clsx";

const STATUS_CONFIG: Record<string, { label: string; classes: string; dot: string }> = {
  new: {
    label: "New",
    classes: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dot: "bg-blue-400",
  },
  applied: {
    label: "Applied",
    classes: "bg-green-500/10 text-green-400 border-green-500/20",
    dot: "bg-green-400",
  },
  interview: {
    label: "Interview",
    classes: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    dot: "bg-purple-400",
  },
  rejected: {
    label: "Rejected",
    classes: "bg-red-500/10 text-red-400 border-red-500/20",
    dot: "bg-red-400",
  },
  saved: {
    label: "Saved",
    classes: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    dot: "bg-yellow-400",
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status?.toLowerCase()] || {
    label: status || "Unknown",
    classes: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    dot: "bg-gray-400",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        config.classes,
        className
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
