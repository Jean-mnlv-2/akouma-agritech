import { Loader2, Wheat } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  text?: string;
  showIcon?: boolean;
  className?: string;
}

const LoadingSpinner = ({ 
  size = "medium", 
  text = "Chargement...",
  showIcon = true,
  className = ""
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8", 
    large: "w-12 h-12"
  };

  const containerClasses = {
    small: "gap-2 text-sm",
    medium: "gap-3 text-base",
    large: "gap-4 text-lg"
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${containerClasses[size]} ${className}`}>
      <div className="relative">
        {showIcon && (
          <Wheat className={`${sizeClasses[size]} text-primary animate-pulse`} />
        )}
        <Loader2 className={`${sizeClasses[size]} text-primary/60 animate-spin absolute inset-0`} />
      </div>
      <p className="text-muted-foreground font-medium">{text}</p>
    </div>
  );
};

export default LoadingSpinner;