import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface AppPageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backTo?: string;
  right?: ReactNode;
  children?: ReactNode;
}

/**
 * Barre de titre compacte et collante utilisée par les vues PWA standalone
 * (sous le Header global). Remplace les gros hero pleine page du site web —
 * un vrai app bar mobile : titre + action, rien de plus.
 */
export function AppPageHeader({ title, subtitle, onBack, backTo, right, children }: AppPageHeaderProps) {
  const navigate = useNavigate();
  const showBack = !!(onBack || backTo);

  return (
    <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-lg border-b border-border/60">
      <div className="flex items-center gap-2 px-4 h-14">
        {showBack && (
          <button
            type="button"
            onClick={() => (onBack ? onBack() : navigate(backTo!))}
            aria-label="Retour"
            className="-ml-2 flex items-center justify-center w-9 h-9 rounded-full active:bg-muted shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold truncate leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
        {right && <div className="shrink-0 flex items-center gap-1">{right}</div>}
      </div>
      {children}
    </div>
  );
}

export default AppPageHeader;
