/**
 * Mo — Mentora's friendly robot mascot. Pure inline SVG (no assets),
 * used on the landing page, chat avatars, and celebration screens.
 */
export function Mascot({ size = 96, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      role="img"
      aria-label="Mo, the Mentora mascot"
      className={className}
    >
      {/* antenna */}
      <line x1="48" y1="14" x2="48" y2="24" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" />
      <circle cx="48" cy="10" r="5" fill="#f59e0b" />
      {/* head */}
      <rect x="16" y="24" width="64" height="52" rx="18" fill="#2563eb" />
      <rect x="22" y="30" width="52" height="40" rx="13" fill="#eef7ff" />
      {/* eyes */}
      <circle cx="38" cy="47" r="5.5" fill="#102033" />
      <circle cx="58" cy="47" r="5.5" fill="#102033" />
      <circle cx="40" cy="45" r="2" fill="#ffffff" />
      <circle cx="60" cy="45" r="2" fill="#ffffff" />
      {/* smile */}
      <path d="M38 58 Q48 66 58 58" stroke="#102033" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* cheeks */}
      <circle cx="30" cy="56" r="3.5" fill="#fda4af" opacity="0.8" />
      <circle cx="66" cy="56" r="3.5" fill="#fda4af" opacity="0.8" />
      {/* ears */}
      <rect x="8" y="42" width="8" height="16" rx="4" fill="#14b8a6" />
      <rect x="80" y="42" width="8" height="16" rx="4" fill="#14b8a6" />
      {/* body hint */}
      <rect x="34" y="76" width="28" height="12" rx="6" fill="#7c3aed" />
    </svg>
  );
}
