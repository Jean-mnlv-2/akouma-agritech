import { Progress } from "@/components/ui/progress";

interface CourseProgressBarProps {
  progress: number;
  completedModules?: number;
  totalModules?: number;
  className?: string;
  showPercent?: boolean;
}

export function CourseProgressBar({
  progress,
  completedModules,
  totalModules,
  className = "",
  showPercent = true,
}: CourseProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <div className={className}>
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-1.5">
        {totalModules != null ? (
          <span>{completedModules ?? 0}/{totalModules} modules</span>
        ) : (
          <span>Progression</span>
        )}
        {showPercent && <span>{pct}%</span>}
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}

export default CourseProgressBar;
