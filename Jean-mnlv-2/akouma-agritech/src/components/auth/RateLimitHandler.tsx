import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clock, Mail } from 'lucide-react';

interface RateLimitHandlerProps {
  email: string;
  onResend: () => Promise<void>;
  actionType: 'signup' | 'login' | 'password-reset';
  className?: string;
}

export const RateLimitHandler: React.FC<RateLimitHandlerProps> = ({
  email,
  onResend,
  actionType,
  className = ''
}) => {
  const [canResend, setCanResend] = useState(true);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  // Vérifier les limitations de taux
  useEffect(() => {
    const checkRateLimit = () => {
      const lastAttempt = localStorage.getItem(`rate_limit_${actionType}_${email}`);
      const now = Date.now();
      
      if (lastAttempt) {
        const timeSinceLastAttempt = now - parseInt(lastAttempt);
        const cooldownPeriod = getCooldownPeriod(actionType);
        
        if (timeSinceLastAttempt < cooldownPeriod) {
          const remaining = Math.ceil((cooldownPeriod - timeSinceLastAttempt) / 1000);
          setCanResend(false);
          setRemainingTime(remaining);
        } else {
          setCanResend(true);
          setRemainingTime(0);
        }
      } else {
        setCanResend(true);
        setRemainingTime(0);
      }
    };

    checkRateLimit();
    const interval = setInterval(checkRateLimit, 1000);
    
    return () => clearInterval(interval);
  }, [email, actionType]);

  // Obtenir la période de refroidissement selon le type d'action
  const getCooldownPeriod = (type: string): number => {
    switch (type) {
      case 'signup':
        return 60000; // 1 minute
      case 'login':
        return 30000; // 30 secondes
      case 'password-reset':
        return 120000; // 2 minutes
      default:
        return 60000; // 1 minute par défaut
    }
  };

  // Gérer le renvoi
  const handleResend = async () => {
    if (!canResend) return;

    setIsResending(true);
    try {
      await onResend();
      
      // Marquer le temps de la tentative
      const now = Date.now();
      localStorage.setItem(`rate_limit_${actionType}_${email}`, now.toString());
      
      setCanResend(false);
      setRemainingTime(Math.ceil(getCooldownPeriod(actionType) / 1000));
      
      toast({
        title: "Email renvoyé",
        description: "Un nouvel email a été envoyé à votre adresse.",
      });
    } catch (error) {
      console.error('Resend error:', error);
      
      if (error instanceof Error && error.message.includes('Too Many Requests')) {
        toast({
          title: "Limite atteinte",
          description: "Trop de tentatives. Veuillez attendre quelques minutes avant de réessayer.",
          variant: "destructive"
        });
        
        // Marquer le temps de la tentative même en cas d'erreur
        const now = Date.now();
        localStorage.setItem(`rate_limit_${actionType}_${email}`, now.toString());
        setCanResend(false);
        setRemainingTime(Math.ceil(getCooldownPeriod(actionType) / 1000));
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de renvoyer l'email. Veuillez réessayer plus tard.",
          variant: "destructive"
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  // Formater le temps restant
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (canResend) {
    return (
      <Button
        onClick={handleResend}
        disabled={isResending}
        variant="outline"
        size="sm"
        className={`flex items-center space-x-2 ${className}`}
      >
        {isResending ? (
          <>
            <Clock className="w-4 h-4 animate-spin" />
            <span>Envoi...</span>
          </>
        ) : (
          <>
            <Mail className="w-4 h-4" />
            <span>Renvoyer l'email</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <div className={`flex items-center space-x-2 text-sm text-muted-foreground ${className}`}>
      <Clock className="w-4 h-4" />
      <span>Renvoyer dans {formatTime(remainingTime)}</span>
    </div>
  );
};
