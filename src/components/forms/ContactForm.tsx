import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";
import { api } from "@/integrations/api/client";
import { useCountries } from "@/hooks/use-countries";
import { useRecaptcha } from "@/hooks/use-recaptcha";

interface ContactFormProps {
  source?: 'general' | 'partnerships' | 'donations' | 'support' | 'careers';
  title?: string;
  description?: string;
  className?: string;
  onSuccess?: () => void;
  prefillSubject?: string;
}

const ContactForm = ({ 
  source: _source = 'general', 
  title = "Contactez-nous",
  description = "Nous sommes là pour répondre à toutes vos questions.",
  className = "",
  onSuccess,
  prefillSubject
}: ContactFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { countries, updatePhoneWithCode } = useCountries();
  const { execute: executeRecaptcha } = useRecaptcha();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    country_id: "",
    subject: prefillSubject || "",
    message: "",
    resume: "",
    experience: "",
    education: ""
  });

  // Update subject when prefillSubject changes
  useEffect(() => {
    if (prefillSubject) {
      setFormData(prev => ({ ...prev, subject: prefillSubject }));
    }
  }, [prefillSubject]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'country_id') {
        return {
          ...next,
          phone: updatePhoneWithCode(prev.phone, value)
        };
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez saisir une adresse email valide.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const recaptchaToken = await executeRecaptcha('contact');
      const selectedCountry = countries.find(c => c.id?.toString() === formData.country_id);
      const basePayload: Record<string, unknown> = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          subject: formData.subject || null,
          project_type: formData.subject || 'general',
          country: selectedCountry?.name || null,
          message: formData.message,
          recaptchaToken
        };

      const { error } = await api
        .from('contact_messages')
        .insert(basePayload);

      if (error) throw error;

      toast({
        title: "Message envoyé !",
        description: "Nous vous répondrons dans les 24h.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        country_id: "",
        subject: "",
        message: "",
        resume: "",
        experience: "",
        education: ""
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nom complet *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Votre nom complet"
            required
            disabled={isLoading}
          />
        </div>
        
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="votre@email.com"
            required
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country">Pays</Label>
          <Select 
            value={formData.country_id} 
            onValueChange={(value) => handleInputChange("country_id", value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez votre pays" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {countries.map((country) => (
                          <SelectItem key={country.code || country.id} value={country.id?.toString() || country.name}>
                            {country.name} ({country.phoneCode})
                          </SelectItem>
                        ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            placeholder="+237 XXX XXX XXX"
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="company">Entreprise/Organisation</Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => handleInputChange("company", e.target.value)}
          placeholder="Nom de votre organisation"
          disabled={isLoading}
        />
      </div>
      
      <div>
        <Label htmlFor="subject">Sujet</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => handleInputChange("subject", e.target.value)}
          placeholder="Sujet de votre message"
          disabled={isLoading}
        />
      </div>
      
      <div>
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => handleInputChange("message", e.target.value)}
          placeholder="Votre message..."
          rows={4}
          required
          disabled={isLoading}
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Envoi en cours...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Envoyer
          </>
        )}
      </Button>
    </form>
  );
};

export default ContactForm;
export { ContactForm };