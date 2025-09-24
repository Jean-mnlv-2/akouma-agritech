import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Check, Trash2 } from "lucide-react";
import { useOffline } from "@/hooks/useOffline";
import { useToast } from "@/hooks/use-toast";

interface OfflineButtonProps {
  id: string;
  title: string;
  content: string;
  type: 'news' | 'course';
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
}

const OfflineButton = ({ id, title, content, type, size = "sm", variant = "outline" }: OfflineButtonProps) => {
  const { saveOfflineContent, removeOfflineContent, isContentOffline } = useOffline();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const isOffline = isContentOffline(id);

  const handleToggleOffline = async () => {
    setIsLoading(true);
    
    try {
      if (isOffline) {
        removeOfflineContent(id);
        toast({
          title: "Contenu supprimé",
          description: "Le contenu a été retiré du mode hors ligne",
        });
      } else {
        // Simulate download process
        await new Promise(resolve => setTimeout(resolve, 1000));
        saveOfflineContent({ id, title, content, type });
        toast({
          title: "Contenu téléchargé",
          description: "Le contenu est maintenant disponible hors ligne",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le contenu hors ligne",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleOffline}
      disabled={isLoading}
      className="flex items-center space-x-2"
    >
      {isLoading ? (
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : isOffline ? (
        <>
          <Check className="w-4 h-4" />
          <span>Hors ligne</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Télécharger</span>
        </>
      )}
    </Button>
  );
};

export default OfflineButton;