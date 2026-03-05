import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  
  const cleanTitle = item.title.replace(/<[^>]*>/g, '');
  const displayDescription = (item.excerpt || item.description || "").replace(/<[^>]*>/g, '');
  
  const handleShare = async () => {
    if (isSharing) return;
    
    const shareData = {
      title: cleanTitle || "AKOUMA Agritech",
      text: `Découvrez ce contenu sur AKOUMA Agritech : ${displayDescription.slice(0, 100)}...`,
      url: item.url,
    };

    try {
      setIsSharing(true);
      if (typeof navigator.share !== 'undefined') {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(item.url);
        toast({
          title: "Lien copié",
          description: "Le lien a été copié dans votre presse-papier.",
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share error:', error);
      }
    } finally {
      setIsSharing(false);
    }
  };
  
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
          <DialogTitle className="text-2xl font-bold border-b-2 border-primary inline-block pb-1">
            Contenu protégé par AKOUMA Agritech
          </DialogTitle>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Ce contenu est protégé par le droit d'auteur. Cependant, si vous souhaitez partager ces informations, vous pouvez utiliser les éléments ci-dessous :
          </p>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {item.imageUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-md border border-slate-100">
              <img
                src={item.imageUrl}
                alt={cleanTitle}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground leading-tight">
                {cleanTitle}
              </h3>
              
              {item.date && (
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {item.date}
                </p>
              )}

              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {displayDescription}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-2">
              <div className="flex-1 min-w-0 w-full">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Lien de partage</p>
                <div className="text-sm font-medium text-primary break-all p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
                  {item.url}
                </div>
              </div>
              
              <Button 
                onClick={handleShare}
                className="w-full sm:w-auto shrink-0 gap-2"
                disabled={isSharing}
              >
                {isSharing ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {typeof navigator.share !== 'undefined' ? "Partager" : "Copier le lien"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CopyProtectionDialog;
