interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className = 'h-9 w-9' }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gp-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <radialGradient id="gp-glow" cx="50%" cy="25%" r="40%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="13" r="13" fill="url(#gp-glow)" />
      <path d="M 9 43 L 20 16 L 28 16 L 39 43 Z" fill="url(#gp-grad)" fillOpacity="0.82" />
      <line x1="24" y1="43" x2="24" y2="16" stroke="#c4b5fd" strokeWidth="0.5" strokeOpacity="0.35" />
      <rect x="22.5" y="5" width="3" height="17" rx="1.5" fill="url(#gp-grad)" />
      <rect x="17.5" y="10.5" width="13" height="3" rx="1.5" fill="url(#gp-grad)" />
    </svg>
  );
}

interface GracePathLogoProps {
  className?: string;
  textClassName?: string;
}

export function GracePathLogo({ className = 'h-9 w-9', textClassName = 'text-lg' }: GracePathLogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className={className} />
      <span className={`font-serif font-semibold ${textClassName} text-ink-900`}>
        GracePath
      </span>
    </div>
  );
}
