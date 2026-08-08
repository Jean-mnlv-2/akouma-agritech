import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export interface EnrollmentDetails {
  professionalActivity: string;
  experienceLevel: string;
  organization: string;
  sector: string;
  expectations: string;
  // Toujours redemandé pour un cours payant (pré-rempli si déjà connu, mais
  // reste modifiable) — le numéro Mobile Money utilisé pour PAYER peut
  // différer du numéro enregistré sur le compte, contrairement aux autres
  // infos de profil qui ne sont jamais reposées.
  paymentPhone: string;
}

interface EnrollmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  currentUserLabel: string;
  isPaidCourse: boolean;
  /** Téléphone connu sur le compte — sert seulement à pré-remplir, jamais à sauter la question. */
  knownPhone?: string | null;
  submitting?: boolean;
  onSubmit: (details: EnrollmentDetails) => void;
}

const EMPTY_DETAILS: EnrollmentDetails = {
  professionalActivity: "",
  experienceLevel: "",
  organization: "",
  sector: "",
  expectations: "",
  paymentPhone: "",
};

/**
 * Formulaire affiché juste avant l'inscription/le paiement. Ne redemande
 * jamais les infos de compte (nom, email…) déjà connues via l'authentification
 * — uniquement des infos propres à CETTE formation.
 */
export function EnrollmentDetailsDialog({
  open,
  onOpenChange,
  courseTitle,
  currentUserLabel,
  isPaidCourse,
  knownPhone,
  submitting = false,
  onSubmit,
}: EnrollmentDetailsDialogProps) {
  const [details, setDetails] = useState<EnrollmentDetails>(EMPTY_DETAILS);

  // Pré-remplit (sans jamais sauter la question) dès l'ouverture du dialogue
  // pour un cours payant — le numéro Mobile Money reste toujours à confirmer.
  useEffect(() => {
    if (open && isPaidCourse) {
      setDetails((d) => (d.paymentPhone ? d : { ...d, paymentPhone: knownPhone || "" }));
    }
  }, [open, isPaidCourse, knownPhone]);

  const canSubmit = details.professionalActivity.trim().length > 0
    && details.experienceLevel.length > 0
    && (!isPaidCourse || details.paymentPhone.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit || submitting) return;
    onSubmit(details);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!submitting) { onOpenChange(next); if (!next) setDetails(EMPTY_DETAILS); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Avant de commencer</DialogTitle>
          <DialogDescription>
            Quelques informations sur votre profil pour la formation <strong>{courseTitle}</strong>.
          </DialogDescription>
        </DialogHeader>

        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          Connecté en tant que <strong>{currentUserLabel}</strong> — aucune autre information de compte n'est nécessaire.
        </p>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="enroll-activity">
              Votre activité professionnelle <span className="text-destructive">*</span>
            </Label>
            <Input
              id="enroll-activity"
              placeholder="Ex : Agriculteur, étudiant, consultant agricole…"
              value={details.professionalActivity}
              onChange={(e) => setDetails((d) => ({ ...d, professionalActivity: e.target.value }))}
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="enroll-level">
              Votre niveau d'expérience <span className="text-destructive">*</span>
            </Label>
            <Select
              value={details.experienceLevel}
              onValueChange={(v) => setDetails((d) => ({ ...d, experienceLevel: v }))}
            >
              <SelectTrigger id="enroll-level">
                <SelectValue placeholder="Sélectionnez votre niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Débutant</SelectItem>
                <SelectItem value="intermediate">Intermédiaire</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="enroll-org">Organisation <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input
                id="enroll-org"
                placeholder="Coopérative, entreprise…"
                value={details.organization}
                onChange={(e) => setDetails((d) => ({ ...d, organization: e.target.value }))}
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enroll-sector">Secteur <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input
                id="enroll-sector"
                placeholder="Maraîchage, élevage…"
                value={details.sector}
                onChange={(e) => setDetails((d) => ({ ...d, sector: e.target.value }))}
                maxLength={255}
              />
            </div>
          </div>

          {isPaidCourse && (
            <div className="space-y-2">
              <Label htmlFor="enroll-phone">
                Numéro Mobile Money pour ce paiement <span className="text-destructive">*</span>
              </Label>
              <Input
                id="enroll-phone"
                type="tel"
                placeholder="Ex : 07 00 00 00 00"
                value={details.paymentPhone}
                onChange={(e) => setDetails((d) => ({ ...d, paymentPhone: e.target.value }))}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">Confirmez le numéro à utiliser pour CE paiement — il peut différer de celui de votre compte.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="enroll-expectations">Vos attentes <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Textarea
              id="enroll-expectations"
              placeholder="Ce que vous espérez retirer de cette formation…"
              value={details.expectations}
              onChange={(e) => setDetails((d) => ({ ...d, expectations: e.target.value }))}
              maxLength={5000}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Traitement…</>
            ) : isPaidCourse ? (
              "Continuer vers le paiement"
            ) : (
              "Confirmer l'inscription"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EnrollmentDetailsDialog;
