import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import DOMPurify from 'dompurify';

interface AdminDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
  type: string;
}

const AdminDetailsDialog: React.FC<AdminDetailsDialogProps> = ({
  isOpen,
  onClose,
  title,
  data,
  type
}) => {
  if (!data) return null;

  const renderValue = (value: unknown) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground italic">Non renseigné</span>;
    if (typeof value === 'boolean') return <Badge variant={value ? 'default' : 'destructive'}>{value ? 'Oui' : 'Non'}</Badge>;
    if (Array.isArray(value)) return (
      <div className="flex flex-wrap gap-1">
        {value.map((v, i) => <Badge key={i} variant="outline">{String(v)}</Badge>)}
      </div>
    );
    if (typeof value === 'string' && (value.includes('<p>') || value.includes('</'))) {
      return <div className="prose prose-sm max-w-none dark:prose-invert mt-1" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value) }} />;
    }
    return <span className="text-foreground">{String(value)}</span>;
  };

  interface FieldDef {
    label: string;
    key: string;
    value?: unknown;
    transform?: (v: unknown) => string;
    isImage?: boolean;
    isGallery?: boolean;
    isJson?: boolean;
  }

  const getFields = (): FieldDef[] => {
    switch (type) {
      case 'news':
        return [
          { label: 'Titre', key: 'title' },
          { label: 'Auteur', key: 'author' },
          { label: 'Catégorie', key: 'category' },
          { label: 'Date', key: 'date', transform: (v: unknown) => new Date(v as string).toLocaleDateString() },
          { label: 'Résumé', key: 'excerpt' },
          { label: 'Contenu', key: 'content' },
          { label: 'Image', key: 'imageUrl', isImage: true },
        ];
      case 'product':
        return [
          { label: 'Nom', key: 'name' },
          { label: 'Catégorie', key: 'category' },
          { label: 'Prix', key: 'price', transform: (v: unknown) => `${Number(v).toLocaleString()} FCFA` },
          { label: 'Stock', key: 'stock' },
          { label: 'Description', key: 'description' },
          { label: 'Caractéristiques', key: 'features' },
          { label: 'Spécifications', key: 'specifications', isJson: true },
          { label: 'Image Principale', key: 'imageUrl', isImage: true },
          { label: 'Galerie', key: data.gallery ? 'gallery' : 'gallery_urls', isGallery: true },
        ];
      case 'seed':
        return [
          { label: 'Nom', key: 'name' },
          { label: 'Variété', key: 'variety' },
          { label: 'Catégorie', key: 'category' },
          { label: 'Prix', key: 'price', transform: (v: unknown) => `${Number(v).toLocaleString()} FCFA / ${data.unit || ''}` },
          { label: 'Disponibilité', key: 'availability' },
          { label: 'Temps de récolte', key: 'harvestTime' },
          { label: 'Rendement', key: 'yield' },
          { label: 'Description', key: 'description' },
          { label: 'Image', key: 'imageUrl', isImage: true },
          { label: 'Galerie', key: data.images ? 'images' : 'gallery', isGallery: true },
        ];
      case 'user':
        return [
          { label: 'Nom complet', key: 'fullName', value: `${data.first_name || ''} ${data.last_name || ''}` },
          { label: 'Email', key: 'email' },
          { label: 'Rôle', key: 'role' },
          { label: 'Statut', key: 'is_active', transform: (v: unknown) => (v as boolean) !== false ? 'Actif' : 'Inactif' },
          { label: 'Modules autorisés', key: 'allowed_modules' },
          { label: 'Dernière connexion', key: 'last_login', transform: (v: unknown) => v ? new Date(v as string).toLocaleString() : 'Jamais' },
        ];
      case 'promo-code':
        return [
          { label: 'Code', key: 'code' },
          { label: 'Description', key: 'description' },
          { label: 'Type de remise', key: 'discountType' },
          { label: 'Valeur de remise', key: 'discountValue', transform: (v: unknown) => data.discountType === 'PERCENTAGE' ? `${v}%` : `${Number(v).toLocaleString()} FCFA` },
          { label: 'Utilisations max', key: 'maxUses', transform: (v: unknown) => String(v || 'Illimité') },
          { label: 'Nombre d\'utilisations', key: 'usesCount' },
          { label: 'Valide du', key: 'validFrom', transform: (v: unknown) => v ? new Date(v as string).toLocaleDateString() : 'N/A' },
          { label: 'Valide jusqu\'au', key: 'validUntil', transform: (v: unknown) => v ? new Date(v as string).toLocaleDateString() : 'N/A' },
          { label: 'Statut', key: 'isActive', transform: (v: unknown) => v ? 'Actif' : 'Inactif' },
          { label: 'Créé le', key: 'createdAt', transform: (v: unknown) => v ? new Date(v as string).toLocaleString() : '' },
        ];
      default:
        return Object.keys(data)
          .filter(k => !['id', 'slug', 'createdAt', 'updatedAt', 'created_at', 'updated_at'].includes(k))
          .map(k => ({ label: k.charAt(0).toUpperCase() + k.slice(1), key: k }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            Détails : {title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Visualisation des informations complètes de l'élément sélectionné.
          </DialogDescription>
        </DialogHeader>
        
        <Separator />
        
        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {getFields().map((field, idx) => {
              const value = field.value !== undefined ? field.value : (data as Record<string, unknown>)[field.key];
              
              if (field.isImage && value) {
                return (
                  <div key={idx} className="md:col-span-2 space-y-2">
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{field.label}</span>
                    <div className="aspect-video relative rounded-lg overflow-hidden border bg-muted/30 flex items-center justify-center">
                      <img src={value} alt="Preview" className="max-h-full object-contain" />
                    </div>
                  </div>
                );
              }

              if (field.isGallery && value) {
                const galleryImages = Array.isArray(value) 
                  ? value 
                  : (typeof value === 'string' ? value.split(',').map(s => s.trim()).filter(Boolean) : []);
                
                if (galleryImages.length > 0) {
                  return (
                    <div key={idx} className="md:col-span-2 space-y-2">
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{field.label}</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {galleryImages.map((img: string, i: number) => (
                          <div key={i} className="aspect-square relative rounded-lg overflow-hidden border bg-muted/30 flex items-center justify-center">
                            <img src={img} alt={`Gallery ${i}`} className="max-h-full object-contain" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              }

              if (field.isJson && value) {
                const jsonObj = typeof value === 'string' ? JSON.parse(value) : value;
                return (
                  <div key={idx} className="md:col-span-2 space-y-2">
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{field.label}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted/20 p-4 rounded-lg">
                      {Object.entries(jsonObj).map(([k, v]: [string, any]) => (
                        <div key={k} className="flex justify-between border-b border-border/50 pb-1">
                          <span className="text-sm font-medium">{k} :</span>
                          <span className="text-sm">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              const isWide = field.key === 'content' || field.key === 'description' || field.key === 'excerpt';
              
              return (
                <div key={idx} className={`${isWide ? 'md:col-span-2' : ''} space-y-1`}>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{field.label}</span>
                  <div className="text-base">
                    {field.transform ? renderValue(field.transform(value)) : renderValue(value)}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        <Separator />
        <div className="p-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Fermer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminDetailsDialog;
