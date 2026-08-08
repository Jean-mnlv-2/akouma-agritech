import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`text-center py-16 bg-muted/10 rounded-3xl border-2 border-dashed border-muted-foreground/20 ${className}`}>
      <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon className="w-10 h-10 text-primary/60" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      {description && <p className="text-muted-foreground max-w-md mx-auto mb-6">{description}</p>}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
