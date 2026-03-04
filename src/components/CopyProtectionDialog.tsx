import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface CopyProtectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    title: string;
    imageUrl?: string;
    excerpt?: string;
    description?: string;
    date?: string;
    url: string;
  };
}

const CopyProtectionDialog: React.FC<CopyProtectionDialogProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const displayDescription = item.excerpt || item.description || "";
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-8 overflow-hidden rounded-xl border-none shadow-2xl bg-white dark:bg-slate-900">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Fermer</span>
        </button>

        <DialogHeader className="space-y-4">
          <DialogTitle className="text-2xl font-bold border-b-2 border-black dark:border-white inline-block pb-1">
            Ce contenu est protégé par le droit d'auteur
          </DialogTitle>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Cependant, si vous souhaitez partager les informations contenues dans cet article, vous pouvez utiliser le titre, le résumé et le lien ci-dessous :
          </p>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {item.imageUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-md">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xl font-bold text-foreground leading-tight">
              {item.title}
            </h3>
            
            {item.date && (
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {item.date}
              </p>
            )}

            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {displayDescription}
            </p>

            <div className="pt-2">
              <a
                href={item.url}
                className="text-sm font-medium text-orange-500 hover:text-orange-600 dark:text-orange-400 break-all underline-offset-4 hover:underline transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.url}
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CopyProtectionDialog;
