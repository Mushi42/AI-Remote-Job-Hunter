"use client";

export default function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {[40, 28, 20, 16, 14, 14].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`skeleton h-4 w-${w}`} style={{ width: `${w * 4}px` }} />
        </td>
      ))}
    </tr>
  );
}
