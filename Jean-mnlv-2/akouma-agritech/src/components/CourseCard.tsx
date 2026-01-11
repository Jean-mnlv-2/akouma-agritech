import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  students: number;
  rating: number;
  price: string;
  level: "Débutant" | "Intermédiaire" | "Avancé";
  category: string;
  thumbnail: string;
  isLive?: boolean;
}

const CourseCard = ({
  id,
  title,
  description,
  instructor,
  duration,
  students,
  rating,
  price,
  level,
  category,
  thumbnail,
  isLive = false
}: CourseCardProps) => {
  const navigate = useNavigate();

  const handleCourseClick = () => {
    navigate(`/elearning/${id}`);
  };
  const getLevelColor = (level: string) => {
    switch (level) {
      case "Débutant": return "bg-green-100 text-green-800 border-green-200";
      case "Intermédiaire": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Avancé": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer" onClick={handleCourseClick}>
      <div className="relative">
        <img 
          src={thumbnail} 
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isLive && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>LIVE</span>
          </div>
        )}
        <Badge className={`absolute top-3 right-3 ${getLevelColor(level)}`}>
          {level}
        </Badge>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <Button 
            size="sm" 
            variant="secondary" 
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Play className="w-4 h-4 mr-2" />
            {isLive ? "Rejoindre" : "Aperçu"}
          </Button>
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="text-xs mb-2">
            {category}
          </Badge>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{rating}</span>
          </div>
        </div>
        <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <CardDescription className="text-sm">
          Par {instructor}
        </CardDescription>
      </CardHeader>

      <CardContent className="py-0">
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
          {description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{students} élèves</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-primary">
          {price === "Gratuit" ? price : `${price} FCFA`}
        </div>
        <Button 
          variant="nature" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleCourseClick();
          }}
        >
          {isLive ? "Rejoindre" : "S'inscrire"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;