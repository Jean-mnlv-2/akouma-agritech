interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

/**
 * Anneau de progression SVG — remplace les barres plates pour un rendu
 * "app d'apprentissage" (type Duolingo/Coursera) sur le dashboard mobile.
 */
export function ProgressRing({ progress, size = 56, strokeWidth = 5, className = "", label }: ProgressRingProps) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} className="stroke-muted" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-primary transition-all duration-500"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-bold text-foreground">{label ?? `${pct}%`}</span>
    </div>
  );
}

export default ProgressRing;
