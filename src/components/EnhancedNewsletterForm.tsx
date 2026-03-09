import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCountries } from "@/hooks/use-countries";
import { Mail, Loader2, Globe } from "lucide-react";

const enhancedNewsletterSchema = z.object({
  email: z.string().email("Veuillez entrer une adresse email valide"),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  country: z.string().min(1, "Veuillez sélectionner votre pays"),
  phone: z.string().min(8, "Veuillez entrer un numéro de téléphone valide"),
  interests: z.array(z.string()).optional()
});

type EnhancedNewsletterFormData = z.infer<typeof enhancedNewsletterSchema>;

export const EnhancedNewsletterForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { countries, updatePhoneWithCode } = useCountries();
  const { toast } = useToast();
   const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;

  const form = useForm<EnhancedNewsletterFormData>({
    resolver: zodResolver(enhancedNewsletterSchema),
    defaultValues: {
      email: "",
      name: "",
      country: "",
      phone: "",
      interests: []
    }
  });

  const onSubmit = async (data: EnhancedNewsletterFormData) => {
    setIsSubmitting(true);
    try {
      // Validation supplémentaire côté client
      if (!data.email || !data.name || !data.country || !data.phone) {
        toast({
          title: "Erreur de validation",
          description: "Veuillez remplir tous les champs obligatoires.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      const fullPhone = data.phone || null;
      const url = new URL('/api/newsletter_subscriptions', apiBaseUrl);
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email.trim(),
          name: data.name.trim(),
          country: data.country,
          phone: fullPhone,
          source: 'enhanced_form',
          confirmed_at: new Date().toISOString()
        })
      });
      if (!res.ok) {
        const text = await res.text();
        if (text.includes('duplicate') || res.status === 409) {
          toast({ title: 'Déjà inscrit', description: "Cette adresse email est déjà inscrite à notre newsletter.", variant: 'destructive' });
          setIsSubmitting(false);
          return;
        }
        throw new Error(text);
      }
      toast({
        title: "Inscription réussie !",
        description: "Merci de vous être abonné à notre newsletter. Vous recevrez bientôt nos dernières actualités.",
      });
      form.reset();
    } catch (error: any) {
      console.error('Error subscribing to newsletter:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de l'inscription. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Mail className="w-6 h-6 text-primary" />
          <span>Newsletter AKOUMA</span>
        </CardTitle>
        <CardDescription>
          Restez informé des dernières innovations en agriculture et agritech
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet *</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre nom complet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse email *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="votre@email.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pays *</FormLabel>
                  <Select 
                    onValueChange={(val) => {
                      field.onChange(val);
                      form.setValue('phone', updatePhoneWithCode(form.getValues('phone') || "", val));
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre pays" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country.code} value={country.name}>
                          <div className="flex items-center space-x-2">
                            <span>{country.name} ({country.phoneCode})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone *</FormLabel>
                  <FormControl>
                    <div className="flex space-x-2">
                      <div className="w-24 text-sm text-muted-foreground flex items-center justify-center border rounded-md bg-muted">
                        {(() => {
                          const country = countries.find(c => c.name === form.watch("country"));
                          return country?.phoneCode || "+XXX";
                        })()}
                      </div>
                      <Input 
                        placeholder="6XX XX XX XX" 
                        {...field} 
                        className="flex-1"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Ce que vous recevrez :</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Dernières innovations en agriculture</li>
                    <li>Formations et événements exclusifs</li>
                    <li>Conseils d'experts agronomes</li>
                    <li>Actualités du secteur agritech</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  S'abonner à la newsletter
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              En vous inscrivant, vous acceptez de recevoir nos communications. 
              Vous pouvez vous désabonner à tout moment.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
