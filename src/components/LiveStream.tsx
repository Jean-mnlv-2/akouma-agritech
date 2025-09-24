import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Users, MessageCircle, Calendar, Clock } from "lucide-react";
import { useState } from "react";

interface LiveStreamProps {
  id: string;
  title: string;
  instructor: string;
  scheduledTime: string;
  duration: string;
  viewers: number;
  isLive: boolean;
  description: string;
  thumbnail: string;
  category: string;
  platform?: 'youtube' | 'facebook';
  url?: string | null;
}

const LiveStream = ({
  title,
  instructor,
  scheduledTime,
  duration,
  viewers,
  isLive,
  description,
  thumbnail,
  category,
  platform,
  url
}: LiveStreamProps) => {
  const [isJoining, setIsJoining] = useState(false);

  const getEmbedUrl = () => {
    if (!url) return null;
    try {
      if (platform === 'youtube') {
        // Handle youtu.be/<id> or youtube.com/watch?v=<id>
        const ytShort = url.match(/youtu\.be\/([\w-]+)/);
        const ytWatch = url.match(/[?&]v=([\w-]+)/);
        const id = ytShort?.[1] || ytWatch?.[1];
        if (id) return `https://www.youtube.com/embed/${id}`;
        // Fallback: if already an embed link
        if (url.includes('/embed/')) return url;
      }
      if (platform === 'facebook') {
        const href = encodeURIComponent(url);
        return `https://www.facebook.com/plugins/video.php?href=${href}&show_text=0&width=560`;
      }
    } catch {}
    return null;
  };

  const embedUrl = getEmbedUrl();

  const handleJoinStream = async () => {
    setIsJoining(true);
    // Simulate joining stream
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsJoining(false);
  };

  return (
    <Card className="overflow-hidden hover:shadow-elegant transition-shadow duration-300">
      <div className="relative">
        {embedUrl ? (
          <div className="w-full aspect-video bg-black">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title={title}
            />
          </div>
        ) : (
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-48 object-cover"
          />
        )}
        
        {/* Live indicator */}
        {isLive && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>EN DIRECT</span>
          </div>
        )}
        
        {/* Category badge */}
        <Badge className="absolute top-4 right-4 bg-black/70 text-white hover:bg-black/80">
          {category}
        </Badge>

        {/* Viewer count */}
        {isLive && (
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{viewers}</span>
          </div>
        )}

        {/* Video overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/90 hover:bg-white"
          >
            <Video className="w-4 h-4 mr-2" />
            {isLive ? "Regarder" : "Aperçu"}
          </Button>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{scheduledTime}</span>
            <Clock className="w-4 h-4 ml-2" />
            <span>{duration}</span>
          </div>
          {isLive && (
            <div className="flex items-center space-x-1 text-sm text-red-500">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-medium">LIVE</span>
            </div>
          )}
        </div>
        
        <CardTitle className="text-xl leading-tight hover:text-primary transition-colors cursor-pointer">
          {title}
        </CardTitle>
        
        <p className="text-sm text-muted-foreground">
          Par {instructor}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm mb-6 line-clamp-3">
          {description}
        </p>

        <div className="flex space-x-3">
          <Button 
            variant={isLive ? "nature" : "outline"}
            className="flex-1"
            disabled={isJoining}
            onClick={handleJoinStream}
          >
            <Video className="w-4 h-4 mr-2" />
            {isJoining 
              ? "Connexion..." 
              : isLive 
                ? "Rejoindre le live" 
                : "Programmer un rappel"
            }
          </Button>
          
          <Button variant="ghost" size="sm">
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveStream;