import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, User, Lock, Shield, Mail } from "lucide-react";
import { api } from "@/integrations/api/client";
import { useNavigate } from "react-router-dom";

const authSchema = z.object({
  email: z.string().email("Veuillez entrer une adresse email valide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

const signupSchema = authSchema.extend({
  confirmPassword: z.string().min(6, "Confirmez votre mot de passe"),
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type AuthFormData = z.infer<typeof authSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export const AuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loginForm = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" }
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { 
      email: "", 
      password: "", 
      confirmPassword: "",
      firstName: "",
      lastName: ""
    }
  });

  const onLogin = async (data: AuthFormData) => {
    setIsLoading(true);
    try {
      const { data: authData } = await api.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authData?.user) {
        const user = authData.user;
        const role = user.role || 'customer';
        const isActive = user.isActive;
        
        console.log("[AuthForm] Login success, user role:", role, "isActive:", isActive);

        if (isActive === false) {
          toast({ title: "Compte désactivé", description: "Votre compte est désactivé. Contactez l'administrateur.", variant: "destructive" });
          return;
        }

        // Store session info for AdminRoute to use immediately after redirect
        sessionStorage.setItem('kilimo_auth_user', JSON.stringify(user));

        window.dispatchEvent(new Event('auth-change'));

        if (role === 'admin') {
          toast({ title: "Connexion réussie", description: "Bienvenue dans votre dashboard administrateur" });
          console.log("[AuthForm] Redirecting to /admin...");
          navigate('/admin', { replace: true });
        } else if (role === 'supervisor') {
          toast({ title: "Connexion réussie", description: "Bienvenue dans votre espace superviseur" });
          console.log("[AuthForm] Redirecting to /supervisor...");
          navigate('/supervisor', { replace: true });
        } else {
          toast({ title: "Connexion réussie", description: "Bienvenue !" });
          console.log("[AuthForm] Redirecting to /...");
          navigate('/', { replace: true });
        }
      } else {
        toast({ title: "Erreur de connexion", description: "Email ou mot de passe incorrect.", variant: "destructive" });
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : "Une erreur s'est produite lors de la connexion";
      
      let userMessage = errorMessage;
      if (errorMessage.includes('invalid credentials') || errorMessage.includes('401')) {
        userMessage = "Email ou mot de passe incorrect.";
      } else if (errorMessage.includes('account disabled')) {
        userMessage = "Votre compte est désactivé. Contactez l'administrateur.";
      } else if (errorMessage.includes('Serveur indisponible') || errorMessage.includes('fetch')) {
        userMessage = "Le serveur est temporairement indisponible. Réessayez dans quelques instants.";
      }
      
      toast({ title: "Erreur de connexion", description: userMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const onSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      await api.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: fullName } }
      });

      toast({ title: "Inscription réussie", description: "Bienvenue dans votre espace client !" });
      signupForm.reset();
      navigate('/');
    } catch (error: unknown) {
      console.error('Signup error:', error);
      const errorMessage = error instanceof Error ? error.message : "Une erreur s'est produite";
      
      let userMessage = errorMessage;
      if (errorMessage.includes('email already used') || errorMessage.includes('409')) {
        userMessage = "Cet email est déjà utilisé. Essayez de vous connecter.";
      } else if (errorMessage.includes('Serveur indisponible')) {
        userMessage = "Le serveur est temporairement indisponible. Réessayez dans quelques instants.";
      }
      
      toast({ title: "Erreur d'inscription", description: userMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      toast({ title: "Erreur", description: "Veuillez saisir un email valide.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await api.auth.forgotPassword(resetEmail);
      setResetSent(true);
      toast({ title: "Email envoyé", description: "Si cet email existe dans notre système, vous recevrez un lien de réinitialisation." });
    } catch (error) {
      console.error('Forgot password error:', error);
      setResetSent(true);
      toast({ title: "Demande prise en compte", description: "Si cet email existe, un lien de réinitialisation sera envoyé." });
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="auth-form-container forgot-password flex items-center justify-center py-12 px-4" translate="no">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="px-4 md:px-6 pt-6 pb-4">
            <CardTitle className="text-xl md:text-2xl text-center flex items-center justify-center space-x-2">
              <Mail className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
              <span>Mot de passe oublié</span>
            </CardTitle>
            <CardDescription className="text-center text-sm md:text-base">
              Entrez votre adresse email pour recevoir un lien de réinitialisation
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-6 space-y-4">
            {resetSent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  Si l'adresse <strong>{resetEmail}</strong> est associée à un compte, 
                  vous recevrez un email avec les instructions de réinitialisation.
                </p>
                <Button variant="outline" className="w-full" onClick={() => { setShowForgotPassword(false); setResetSent(false); setResetEmail(""); }}>
                  Retour à la connexion
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="forgot-email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="votre@email.com"
                      className="pl-10"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleForgotPassword} disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Envoi en cours...</>
                  ) : (
                    "Envoyer le lien"
                  )}
                </Button>
                <Button variant="ghost" className="w-full text-sm" onClick={() => { setShowForgotPassword(false); setResetSent(false); }}>
                  ← Retour à la connexion
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="auth-form-container flex items-center justify-center py-12 px-4" translate="no">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="px-4 md:px-6 pt-6 pb-4">
          <CardTitle className="text-xl md:text-2xl text-center flex items-center justify-center space-x-2">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
            <span>Mon compte KILIMO</span>
          </CardTitle>
          <CardDescription className="text-center text-sm md:text-base">
            Connectez-vous pour suivre vos commandes ou administrer la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="text-xs md:text-sm">Connexion</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs md:text-sm">Inscription</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="login-email">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="login-email" type="email" autoComplete="email" placeholder="votre@email.com" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="login-password">Mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="login-password"
                              autoComplete="current-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Votre mot de passe"
                              className="pl-10 pr-10"
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="text-right">
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connexion...</>
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="signup">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={signupForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="signup-firstName">Prénom</FormLabel>
                          <FormControl>
                            <Input id="signup-firstName" autoComplete="given-name" placeholder="Prénom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="signup-lastName">Nom</FormLabel>
                          <FormControl>
                            <Input id="signup-lastName" autoComplete="family-name" placeholder="Nom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="signup-email">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="signup-email" type="email" autoComplete="email" placeholder="votre@email.com" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="signup-password">Mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="signup-password"
                              autoComplete="new-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Mot de passe (min. 6 caractères)"
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signupForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="signup-confirmPassword">Confirmer le mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="signup-confirmPassword"
                              autoComplete="new-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Confirmez votre mot de passe"
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Inscription...</>
                    ) : (
                      "S'inscrire"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
