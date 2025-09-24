import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, Shield, Eye, EyeOff } from 'lucide-react';

const ADMIN_SECRET_KEY = 'AKOUMA_ADMIN_2024_SECURE';

export default function AdminAccess() {
  const [secretKey, setSecretKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already authenticated as admin
  useEffect(() => {
    (async () => {
      const { data: { session } } = await api.auth.getSession();
      if (session) {
        // Check if user has admin role directly from session
        const hasAdminRole = (session as any).user?.role === 'admin';
        if (hasAdminRole) {
          navigate('/admin');
        }
      }
    })();
  }, [navigate]);

  const handleAccessRequest = useCallback(async () => {
    if (!secretKey.trim()) {
      toast({ title: 'Clé requise', description: "Veuillez entrer la clé d'accès administrateur", variant: 'destructive' });
      return;
    }

    if (secretKey !== ADMIN_SECRET_KEY) {
      toast({ title: 'Accès refusé', description: "Clé d'accès incorrecte", variant: 'destructive' });
      setSecretKey('');
      return;
    }

    setIsVerifying(true);
    try {
      sessionStorage.setItem('admin_access_granted', 'true');
      navigate('/auth');
    } catch (error) {
      console.error('Error processing admin access:', error);
      toast({ title: 'Erreur', description: "Une erreur s'est produite lors de la vérification", variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  }, [secretKey, navigate, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleAccessRequest(); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Accès Administrateur</CardTitle>
          <CardDescription>Zone restreinte - Accès sécurisé requis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Clé d'accès administrateur</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input type={showKey ? 'text' : 'password'} placeholder="Entrez la clé secrète" value={secretKey} onChange={e => setSecretKey(e.target.value)} onKeyDown={handleKeyDown} className="pl-10 pr-10" autoFocus />
              <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0" onClick={() => setShowKey(v => !v)} tabIndex={-1} aria-label={showKey ? "Masquer la clé" : "Afficher la clé"}>
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <Button onClick={handleAccessRequest} disabled={isVerifying || !secretKey.trim()} className="w-full" size="lg">
            {isVerifying ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Vérification...</>) : ('Accéder au dashboard')}
          </Button>
          <div className="text-center">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-sm">Retour à l&apos;accueil</Button>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
            <p className="font-medium mb-1">Note de sécurité :</p>
            <p>Cette page est réservée aux administrateurs autorisés. Toute tentative d&apos;accès non autorisée est enregistrée.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
