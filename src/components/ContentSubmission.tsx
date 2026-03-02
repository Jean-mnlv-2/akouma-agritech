import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Video, Headphones, Send, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

interface ContentSubmissionForm {
  name: string;
  email: string;
  phone: string;
  organization: string;
  contentType: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  targetAudience: string;
  file: FileList | null;
  fileUrl: string;
  country: string;
}

const ContentSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [countries, setCountries] = useState<Array<{code: string, name: string, phoneCode: string}>>([]);
  const { toast } = useToast();

  const form = useForm<ContentSubmissionForm>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      organization: "",
      contentType: "",
      title: "",
      description: "",
      category: "",
      duration: "",
      targetAudience: "",
      file: null,
      fileUrl: "",
      country: ""
    }
  });

  // Charger les pays depuis l'API
  React.useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch('/api/countries');
        const body = await (res.ok ? res.json() : Promise.resolve([]));
        const list = Array.isArray(body) ? body : (body?.data || []);
        setCountries(list.sort((a: any, b: any) => a?.name?.localeCompare?.(b?.name || '') || 0));
      } catch (error) {
        console.error('Error fetching countries:', error);
        setCountries([
          { code: "CM", name: "Cameroun", phoneCode: "+237" },
          { code: "NG", name: "Nigeria", phoneCode: "+234" },
          { code: "GH", name: "Ghana", phoneCode: "+233" },
          { code: "CI", name: "Côte d'Ivoire", phoneCode: "+225" },
          { code: "SN", name: "Sénégal", phoneCode: "+221" },
          { code: "UG", name: "Ouganda", phoneCode: "+256" },
          { code: "KE", name: "Kenya", phoneCode: "+254" },
          { code: "TZ", name: "Tanzanie", phoneCode: "+255" },
          { code: "ET", name: "Éthiopie", phoneCode: "+251" },
          { code: "ZA", name: "Afrique du Sud", phoneCode: "+27" }
        ]);
      }
    };
    fetchCountries();
  }, []);

  const onSubmit = async (data: ContentSubmissionForm) => {
    setIsSubmitting(true);
    try {
      // Validation stricte côté client
      if (!data.name || !data.email || !data.phone || !data.contentType || !data.title || !data.description || (!data.file && !data.fileUrl)) {
        toast({
          title: "Erreur de validation",
          description: "Veuillez remplir tous les champs obligatoires et fournir un fichier ou un lien.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const basePayload = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        organization: data.organization?.trim() || null,
        content_type: data.contentType,
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        duration: data.duration,
        target_audience: data.targetAudience?.trim() || null,
        file_url: data.fileUrl?.trim() || null,
      };

      const res = await fetch('/api/content_submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(basePayload),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({
        title: "Contenu soumis avec succès !",
        description: "Votre proposition sera examinée par notre équipe sous 48h.",
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      const err = error as { message?: string };
      console.error('Error submitting content:', error);
      toast({
        title: "Erreur",
        description: err.message || "Une erreur s'est produite lors de l'envoi. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contentTypes = [
    { value: "video", label: "Vidéo", icon: Video },
    { value: "podcast", label: "Podcast", icon: Headphones }
  ];

  const categories = [
    "Agriculture",
    "Irrigation", 
    "Maladies des plantes",
    "Techniques modernes",
    "Gestion",
    "Élevage",
    "Transformation",
    "Marketing agricole",
    "Financement",
    "Innovation"
  ];

  // Fonction pour obtenir le code téléphonique du pays sélectionné
  const getCountryPhoneCode = (countryName: string) => {
    const country = countries.find(c => c.name === countryName);
    return country?.phoneCode || "+XXX";
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-green-50 border-primary/20">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2 text-primary">
          <Upload className="w-6 h-6" />
          <span>Partagez votre expertise</span>
        </CardTitle>
        <CardDescription className="text-base">
          Vous êtes agriculteur, expert ou acteur de l'agritech ? Proposez vos contenus 
          (vidéos, podcasts) pour enrichir notre plateforme et partager votre savoir-faire.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="text-lg px-8">
              <Send className="w-5 h-5 mr-2" />
              Proposer mon contenu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Upload className="w-6 h-6 text-primary" />
                <span>Proposer votre contenu</span>
              </DialogTitle>
              <DialogDescription>
                Remplissez ce formulaire pour soumettre votre vidéo ou podcast. Notre équipe l'examinera sous 48h.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Informations personnelles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Vos informations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      rules={{ required: "Le nom est requis" }}
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
                      rules={{ 
                        required: "L'email est requis",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Email invalide"
                        }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="votre@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      rules={{ required: "Le pays est requis" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pays *</FormLabel>
                          <Select 
                            onValueChange={(val) => {
                              field.onChange(val);
                              const selected = countries.find(c => c.name === val);
                              const code = selected?.phoneCode;
                              const current = form.getValues('phone') || '';
                              if (code) {
                                const stripped = current.replace(/^\+?\d+\s*/, '');
                                form.setValue('phone', `${code} ${stripped}`.trim());
                              }
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez votre pays" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-64 overflow-y-auto">
                              {countries.map(country => (
                                <SelectItem key={country.code} value={country.name}>
                                  {country.name}
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
                              <div className="w-28 text-sm text-muted-foreground flex items-center justify-center border rounded-md bg-muted">
                                {getCountryPhoneCode(form.watch("country"))}
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
                  </div>
                  <FormField
                      control={form.control}
                      name="organization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organisation/Entreprise</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom de votre organisation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                {/* Informations sur le contenu */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Votre contenu</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contentType"
                      rules={{ required: "Le type de contenu est requis" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de contenu *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez le type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {contentTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center space-x-2">
                                    <type.icon className="w-4 h-4" />
                                    <span>{type.label}</span>
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
                      name="category"
                      rules={{ required: "La catégorie est requise" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégorie *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez une catégorie" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    rules={{ required: "Le titre est requis" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre du contenu *</FormLabel>
                        <FormControl>
                          <Input placeholder="Titre descriptif de votre contenu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    rules={{ required: "La description est requise" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Décrivez le contenu, les objectifs pédagogiques et les points clés abordés..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="duration"
                      rules={{ required: "La durée est requise" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durée approximative *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 15 minutes, 1h30..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="targetAudience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Public cible</FormLabel>
                          <FormControl>
                            <Input placeholder="Débutant, Intermédiaire, Avancé..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="file"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Uploader votre fichier *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="file"
                              accept="video/*,audio/*,.mp4,.avi,.mov,.wmv,.mp3,.wav,.ogg"
                              onChange={(e) => onChange(e.target.files)}
                              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Formats acceptés: MP4, AVI, MOV, WMV (vidéos) | MP3, WAV, OGG (audio) - Max 500MB
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="text-center text-sm text-muted-foreground">
                    <span>ou</span>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="fileUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lien vers votre contenu</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="URL Google Drive, Dropbox, YouTube, etc." 
                            {...field} 
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Alternative à l'upload: partagez le lien de votre fichier
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Critères de sélection :</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Contenu original et de qualité</li>
                        <li>Pertinence pour notre audience agricole</li>
                        <li>Qualité audio/vidéo acceptable (minimum 720p pour vidéos)</li>
                        <li>Respect des bonnes pratiques agricoles</li>
                        <li>Fichier maximum 500MB ou lien vers plateforme de partage</li>
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
                    "Envoi en cours..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Soumettre ma proposition
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Video className="w-4 h-4 text-primary" />
            <span>Vidéos techniques et témoignages</span>
          </div>
          <div className="flex items-center space-x-2">
            <Headphones className="w-4 h-4 text-primary" />
            <span>Podcasts et interviews d'experts</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentSubmission;
