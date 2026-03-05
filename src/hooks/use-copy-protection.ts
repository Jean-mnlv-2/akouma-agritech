import { useState, useEffect, useCallback } from "react";

interface CopyProtectionItem {
  title: string;
  imageUrl?: string;
  excerpt?: string;
  description?: string;
  date?: string;
  url: string;
}

export const useCopyProtection = (isEnabled: boolean, _item: CopyProtectionItem) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCopy = useCallback(
    (event: ClipboardEvent) => {
      if (isEnabled) {
        event.preventDefault();
        setIsDialogOpen(true);
        
        const selection = window.getSelection()?.toString();
        const cleanTitle = _item.title.replace(/<[^>]*>/g, '');
        const customContent = `Contenu protégé par AKOUMA Agritech\n\n${cleanTitle}\n${_item.url}\n\n${selection ? '--- Extrait sélectionné ---\n' + selection : ''}`;
        
        if (event.clipboardData) {
          event.clipboardData.setData('text/plain', customContent);
        }
      }
    },
    [isEnabled, _item]
  );

  const handleContextMenu = useCallback(
    (event: MouseEvent) => {
      if (isEnabled) {
        event.preventDefault();
        setIsDialogOpen(true);
      }
    },
    [isEnabled]
  );

  useEffect(() => {
    if (isEnabled) {
      document.addEventListener("copy", handleCopy);
      document.addEventListener("contextmenu", handleContextMenu);
      return () => {
        document.removeEventListener("copy", handleCopy);
        document.removeEventListener("contextmenu", handleContextMenu);
      };
    }
  }, [isEnabled, handleCopy, handleContextMenu]);

  return {
    isDialogOpen,
    closeDialog: () => setIsDialogOpen(false),
  };
};
