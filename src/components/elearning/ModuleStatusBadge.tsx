import { Lock, CheckCircle, PlayCircle, Circle } from "lucide-react";

export type ModuleStatus = "locked" | "available" | "completed" | "current";

interface ModuleStatusBadgeProps {
  status: ModuleStatus;
  className?: string;
}

const CONFIG: Record<ModuleStatus, { icon: typeof Lock; label: string; className: string }> = {
  locked: { icon: Lock, label: "Verrouillé", className: "text-muted-foreground" },
  available: { icon: Circle, label: "À faire", className: "text-muted-foreground" },
  current: { icon: PlayCircle, label: "En cours", className: "text-primary" },
  completed: { icon: CheckCircle, label: "Terminé", className: "text-green-600 dark:text-green-400" },
};

export function ModuleStatusBadge({ status, className = "" }: ModuleStatusBadgeProps) {
  const { icon: Icon, label, className: colorClass } = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 ${colorClass} ${className}`} aria-label={label} title={label}>
      <Icon className="w-4 h-4" aria-hidden="true" />
    </span>
  );
}

export default ModuleStatusBadge;
