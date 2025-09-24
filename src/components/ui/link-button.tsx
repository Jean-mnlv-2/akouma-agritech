import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LinkButtonProps {
  to: string;
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "nature" | "tech" | "hero";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const LinkButton = ({ to, children, variant, size, className }: LinkButtonProps) => {
  return (
    <Link to={to}>
      <Button variant={variant} size={size} className={cn("w-full", className)}>
        {children}
      </Button>
    </Link>
  );
};