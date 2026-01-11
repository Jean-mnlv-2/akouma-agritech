import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Zap } from "lucide-react";

interface AdSpaceProps {
  size: "banner" | "sidebar" | "inline";
  title?: string;
  description?: string;
  buttonText?: string;
  image?: string;
  sponsored?: boolean;
}

const AdSpace = ({ 
  size, 
  title = "Espace publicitaire", 
  description = "Votre publicité ici",
  buttonText = "En savoir plus",
  image,
  sponsored = true 
}: AdSpaceProps) => {
  const getSizeClasses = () => {
    switch (size) {
      case "banner":
        return "w-full h-32 md:h-24";
      case "sidebar":
        return "w-full h-64";
      case "inline":
        return "w-full h-40";
      default:
        return "w-full h-32";
    }
  };

  return (
    <Card className={`${getSizeClasses()} bg-gradient-to-r from-muted/50 to-muted/30 border-dashed border-2 border-border hover:border-primary/50 transition-all duration-300 group overflow-hidden`}>
      <CardContent className="p-4 h-full flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {image ? (
            <img 
              src={image} 
              alt="Publicité" 
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary-foreground" />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-semibold text-foreground">{title}</h4>
              {sponsored && (
                <Badge variant="outline" className="text-xs">
                  Sponsorisé
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{description}</p>
            {size !== "banner" && (
              <Button variant="outline" size="sm" className="text-xs">
                {buttonText}
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
        
        {size === "banner" && (
          <Button variant="outline" size="sm" className="ml-4">
            {buttonText}
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AdSpace;