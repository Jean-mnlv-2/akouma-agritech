import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ShieldCheck, Cookie, BarChart3, Megaphone, SlidersHorizontal, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import {
  acceptAll,
  rejectAll,
  readConsent,
  saveConsent,
  OPEN_PREFERENCES_EVENT,
} from "@/lib/cookieConsent";

type Prefs = {
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

const DEFAULT_PREFS: Prefs = { analytics: false, marketing: false, preferences: false };

// One-time migration from the legacy string flag ("accepted" / "declined")
function migrateLegacyIfNeeded() {
  try {
    const legacy = localStorage.getItem("KILIMO_cookie_consent");
    if (!legacy) return;
    localStorage.removeItem("KILIMO_cookie_consent");
    localStorage.removeItem("KILIMO_cookie_timestamp");
    if (legacy === "accepted") void acceptAll();
    else if (legacy === "declined") void rejectAll();
  } catch { /* noop */ }
}

const CookieConsent = () => {
  const [bannerOpen, setBannerOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    migrateLegacyIfNeeded();
    const existing = readConsent();
    if (existing) {
      setPrefs({
        analytics: existing.analytics,
        marketing: existing.marketing,
        preferences: existing.preferences,
      });
    } else {
      const t = setTimeout(() => setBannerOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const openHandler = () => {
      const existing = readConsent();
      if (existing) {
        setPrefs({
          analytics: existing.analytics,
          marketing: existing.marketing,
          preferences: existing.preferences,
        });
      }
      setPrefsOpen(true);
    };
    window.addEventListener(OPEN_PREFERENCES_EVENT, openHandler);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, openHandler);
  }, []);

  const handleAcceptAll = useCallback(async () => {
    setSaving(true);
    try {
      await acceptAll();
      setPrefs({ analytics: true, marketing: true, preferences: true });
      setBannerOpen(false);
      setPrefsOpen(false);
    } finally {
      setSaving(false);
    }
  }, []);

  const handleRejectAll = useCallback(async () => {
    setSaving(true);
    try {
      await rejectAll();
      setPrefs(DEFAULT_PREFS);
      setBannerOpen(false);
      setPrefsOpen(false);
    } finally {
      setSaving(false);
    }
  }, []);

  const handleSaveCustom = useCallback(async () => {
    setSaving(true);
    try {
      await saveConsent({ ...prefs, method: "custom" });
      setBannerOpen(false);
      setPrefsOpen(false);
    } finally {
      setSaving(false);
    }
  }, [prefs]);

  return (
    <>
      {bannerOpen && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Bandeau de consentement aux cookies"
          className="fixed bottom-4 left-4 right-4 z-[100] md:max-w-xl md:left-auto md:right-6 md:bottom-6"
        >
          <Card className="shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-md animate-in fade-in slide-in-from-bottom-10 duration-500">
            <CardContent className="p-5 md:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-full bg-primary/10 text-primary shrink-0">
                  <ShieldCheck className="w-5 h-5" aria-hidden />
                </div>
                <div className="space-y-1">
                  <h2 className="font-bold text-base md:text-lg">Nous respectons votre vie privée</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    KILIMO Agritech utilise des cookies strictement nécessaires au fonctionnement du site et, avec votre accord, des cookies de mesure d'audience, de préférences et marketing. Vous pouvez accepter, refuser, ou personnaliser vos choix. Vos préférences sont modifiables à tout moment depuis « Gérer les cookies » (pied de page).
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button onClick={handleAcceptAll} disabled={saving} className="w-full">Tout accepter</Button>
                <Button onClick={handleRejectAll} disabled={saving} variant="outline" className="w-full">Tout refuser</Button>
                <Button onClick={() => setPrefsOpen(true)} disabled={saving} variant="secondary" className="w-full">Personnaliser</Button>
              </div>
              <div className="text-center">
                <Link to="/cookies" className="text-xs text-primary hover:underline underline-offset-4">
                  Politique de cookies
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" aria-hidden />
              Préférences de cookies
            </DialogTitle>
            <DialogDescription>
              Choisissez les catégories que vous autorisez. Les cookies strictement nécessaires ne peuvent pas être désactivés car ils garantissent le fonctionnement de base du site.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <CategoryRow
              icon={<Lock className="w-4 h-4" aria-hidden />}
              title="Strictement nécessaires"
              description="Authentification, panier, sécurité (CSRF), équilibrage de charge. Ces cookies sont indispensables et toujours activés."
              checked
              disabled
              onChange={() => { /* noop */ }}
            />
            <CategoryRow
              icon={<BarChart3 className="w-4 h-4" aria-hidden />}
              title="Mesure d'audience"
              description="Nous aident à comprendre l'usage du site (pages consultées, performance) pour l'améliorer. Données agrégées et anonymisées."
              checked={prefs.analytics}
              onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
            />
            <CategoryRow
              icon={<SlidersHorizontal className="w-4 h-4" aria-hidden />}
              title="Préférences"
              description="Mémorisent vos choix (langue, région, affichage) pour une expérience personnalisée."
              checked={prefs.preferences}
              onChange={(v) => setPrefs((p) => ({ ...p, preferences: v }))}
            />
            <CategoryRow
              icon={<Megaphone className="w-4 h-4" aria-hidden />}
              title="Marketing"
              description="Permettent de mesurer l'efficacité de nos campagnes et de proposer des contenus adaptés hors du site. Aucun tag n'est chargé sans votre accord."
              checked={prefs.marketing}
              onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={handleRejectAll} disabled={saving} variant="outline" className="sm:mr-auto">Tout refuser</Button>
            <Button onClick={handleSaveCustom} disabled={saving} variant="secondary">Enregistrer mes choix</Button>
            <Button onClick={handleAcceptAll} disabled={saving}>Tout accepter</Button>
          </DialogFooter>

          <p className="text-xs text-muted-foreground pt-2">
            Conformément au RGPD et aux recommandations de la CNIL, refuser est aussi simple qu'accepter. Vos préférences sont conservées 13 mois maximum.
            En savoir plus dans notre <Link to="/cookies" className="text-primary hover:underline">politique de cookies</Link>.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};

type CategoryRowProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
};

const CategoryRow = ({ icon, title, description, checked, disabled, onChange }: CategoryRowProps) => (
  <div className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4">
    <div className="flex gap-3 min-w-0">
      <div className="mt-0.5 p-2 rounded-md bg-primary/10 text-primary shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="font-semibold text-sm">{title}</div>
        <p className="text-xs text-muted-foreground leading-relaxed mt-1">{description}</p>
      </div>
    </div>
    <Switch
      checked={checked}
      disabled={disabled}
      onCheckedChange={onChange}
      aria-label={`Autoriser les cookies ${title.toLowerCase()}`}
    />
  </div>
);

export default CookieConsent;
