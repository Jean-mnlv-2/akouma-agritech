import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { api } from '@/integrations/api/client';

interface FileUploadProps {
  label?: string;
  accept?: string;
  value?: string;
  onChange: (url: string) => void;
  endpoint?: string;
  className?: string;
  recommendedSize?: string;
}

export const FileUpload = ({ 
  label = "Image", 
  accept = "image/*", 
  value,
  onChange, 
  endpoint = "/api/upload",
  className = "",
  recommendedSize,
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [previewBroken, setPreviewBroken] = useState(false);
  const { toast } = useToast();

  // `value` peut changer sous nos pieds sans que ce composant soit
  // remonté (ex: l'admin passe d'une image d'en-tête à une autre dans le
  // même formulaire) — sans ça, l'aperçu resterait figé sur l'ancien item.
  useEffect(() => {
    setPreview(value || null);
    setPreviewBroken(false);
  }, [value]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "Le fichier est trop volumineux (max 5MB)",
        variant: "destructive"
      });
      return;
    }

    // Validation du type
    if (accept.includes('image/*') && !file.type.startsWith('image/')) {
      toast({
        title: "Erreur", 
        description: "Veuillez sélectionner un fichier image",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await api.request('POST', endpoint, {
        body: formData,
      });

      const imageUrl = result.url;

      setPreview(imageUrl);
      setPreviewBroken(false);
      onChange(imageUrl);

      toast({
        title: "Succès",
        description: "Fichier uploadé avec succès"
      });

    } catch (error) {
      console.error('Upload error:', error);
      const raw = error instanceof Error ? error.message : "Impossible d'uploader le fichier";
      // Le backend renvoie {"error":"..."} en texte brut dans le message ; on
      // essaie de l'extraire pour afficher la vraie cause (ex: "Extension de
      // fichier non autorisée", "csrf invalid") plutôt qu'un message générique
      // qui masque le diagnostic.
      let description = raw;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.error) description = String(parsed.error);
      } catch {
        // raw n'est pas du JSON (ex: erreur réseau) — on le garde tel quel.
      }
      toast({
        title: "Erreur d'upload",
        description,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      
      {preview ? (
        <div className="relative">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                {accept.includes('image/*') && !previewBroken ? (
                  <img
                    src={preview}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setPreviewBroken(true)}
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground truncate">
                  {preview.split('/').pop()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {previewBroken ? "Image inaccessible (URL cassée)" : "Fichier uploadé avec succès"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-2 pointer-events-none">
            Cliquez pour sélectionner un fichier
          </p>
          <Input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <p className="text-xs text-muted-foreground pointer-events-none">
            PNG, JPG, GIF jusqu'à 5MB
          </p>
        </div>
      )}

      {uploading && (
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Upload en cours...</span>
          </div>
        </div>
      )}
      {recommendedSize && (
        <p className="text-xs text-muted-foreground">
          Taille recommandée : {recommendedSize}
        </p>
      )}
    </div>
  );
};
