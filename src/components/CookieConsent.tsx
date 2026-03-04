import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("akouma_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("akouma_cookie_consent", "accepted");
    localStorage.setItem("akouma_cookie_timestamp", new Date().toISOString());
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("akouma_cookie_consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[100] md:max-w-md md:left-auto">
      <Card className="shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-md animate-in fade-in slide-in-from-bottom-10 duration-500">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Nous respectons votre vie privée</h3>
                <button 
                  onClick={() => setIsVisible(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AKOUMA Agritech utilise des cookies pour améliorer votre expérience, analyser le trafic et vous proposer des contenus adaptés. En cliquant sur "Accepter", vous consentez à notre utilisation des cookies.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button onClick={handleAccept} className="flex-1">
                  Accepter
                </Button>
                <Button onClick={handleDecline} variant="outline" className="flex-1">
                  Refuser
                </Button>
              </div>
              <div className="text-center pt-2">
                <Link 
                  to="/cookies" 
                  className="text-xs text-primary hover:underline underline-offset-4"
                >
                  En savoir plus sur notre politique de cookies
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieConsent;
