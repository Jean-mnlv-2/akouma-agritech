import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2 } from "lucide-react";
import { useI18n } from "@/i18n";
import { useCountries } from "@/hooks/use-countries";
import { useRecaptcha } from "@/hooks/use-recaptcha";

const newsletterSchema = z.object({
  email: z.string().email("Veuillez entrer une adresse email valide"),
  name: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional()
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

interface NewsletterFormProps {
  source?: string;
  showNameField?: boolean;
  showPhoneField?: boolean;
  className?: string;
}

export const NewsletterForm = ({ 
  source = "footer", 
  showNameField = false, 
  showPhoneField = false,
  className = ""
}: NewsletterFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const { countries, updatePhoneWithCode } = useCountries();
  const { execute: executeRecaptcha } = useRecaptcha();

  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: "",
      name: "",
      country: "",
      phone: ""
    }
  });

  const onSubmit = async (data: NewsletterFormData) => {
    setIsSubmitting(true);
    
    try {
      const recaptchaToken = await executeRecaptcha('newsletter');
      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;
      const url = new URL('/api/newsletter_subscriptions', apiBaseUrl);
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email.trim(),
          name: data.name || null,
          country: data.country || null,
          phone: data.phone || null,
          source: source,
          confirmed_at: new Date().toISOString(),
          recaptchaToken
        })
      });

      if (!res.ok) {
        throw new Error('Failed to subscribe');
      }

      const responseData = await res.json();

      if (responseData.message && (responseData.message.includes('Déjà inscrit') || responseData.message.includes('Email réactivé'))) {
        toast({
          title: t("newsletter.already.title"),
          description: responseData.message,
          variant: "default"
        });
      } else {
        toast({
          title: t("newsletter.success.title"),
          description: t("newsletter.success.desc"),
        });
        form.reset();
      }
    } catch (error: unknown) {
      console.error('Error subscribing to newsletter:', error);
      toast({
        title: t("newsletter.error.title"),
        description: t("newsletter.error.desc"),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-4 ${className}`}>
        {showNameField && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("newsletter.name")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("newsletter.name.placeholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("newsletter.email")}</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder={t("newsletter.email.placeholder")} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showPhoneField && (
          <>
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.country") || "Pays"}</FormLabel>
                  <Select 
                    onValueChange={(val) => {
                      field.onChange(val);
                      if (showPhoneField) {
                        form.setValue('phone', updatePhoneWithCode(form.getValues('phone') || "", val));
                      }
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("form.select.country") || "Sélectionnez votre pays"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.name}>
                          {country.name} ({country.phoneCode})
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
                  <FormLabel>{t("newsletter.phone")}</FormLabel>
                  <FormControl>
                    <div className="flex space-x-2">
                      <div className="w-24 text-sm text-muted-foreground flex items-center justify-center border rounded-md">
                        {form.watch("country") || "+XXX"}
                      </div>
                      <Input 
                        placeholder={t("newsletter.phone.placeholder")} 
                        {...field} 
                        className="flex-1"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("newsletter.loading")}
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              {t("newsletter.submit")}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};
