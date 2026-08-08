import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TriangleAlert, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Une erreur est survenue",
  description = "Impossible de charger ces données. Vérifiez votre connexion et réessayez.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <Alert variant="destructive" className={className}>
      <TriangleAlert className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
        <span>{description}</span>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="shrink-0">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Réessayer
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export default ErrorState;
