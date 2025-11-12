import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Empêcher le prompt natif du navigateur pour le contrôler via notre bouton
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register service worker avec gestion d'erreur améliorée
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          // Vérifier les mises à jour périodiquement
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nouveau service worker disponible
                  console.log('New service worker available');
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          // Ne pas afficher d'erreur si c'est juste une erreur de scope ou de réseau
          if (registrationError instanceof Error && 
              !registrationError.message.includes('scope') &&
              !registrationError.message.includes('network')) {
            console.warn('SW registration failed: ', registrationError);
          }
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Si le prompt n'est pas disponible, afficher les instructions manuelles
      setShowInstallDialog(true);
      return;
    }

    try {
      // Afficher le prompt d'installation
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        // L'utilisateur a accepté l'installation
        setDeferredPrompt(null);
      } else {
        // L'utilisateur a refusé, on peut réessayer plus tard
        // Le prompt sera disponible lors du prochain beforeinstallprompt
      }
    } catch (error) {
      // En cas d'erreur, afficher les instructions manuelles
      console.warn('Install prompt error:', error);
      setShowInstallDialog(true);
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2 shadow-lg"
      >
        <Download className="w-4 h-4" />
        <span>Installer l'app</span>
      </Button>

      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Installer AKOUMA
            </DialogTitle>
            <DialogDescription>
              Installez l'application AKOUMA sur votre appareil pour un accès rapide et une meilleure expérience.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Sur mobile (Android/iOS):</h4>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Ouvrez le menu de votre navigateur (⋮)</li>
                <li>2. Sélectionnez "Ajouter à l'écran d'accueil"</li>
                <li>3. Confirmez l'installation</li>
              </ol>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Sur ordinateur (Chrome/Edge):</h4>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Cliquez sur l'icône d'installation dans la barre d'adresse</li>
                <li>2. Ou utilisez le menu "Installer AKOUMA"</li>
              </ol>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowInstallDialog(false)}>
              Plus tard
            </Button>
            <Button onClick={() => setShowInstallDialog(false)}>
              Compris
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PWAInstallButton;