import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Star, Zap } from "lucide-react";
import { useState } from "react";
import { useCartContext } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  rating: number;
  reviews: number;
  image: string;
  inStock: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  features?: string[];
}

const ProductCard = ({
  id,
  name,
  description,
  price,
  originalPrice,
  category,
  rating,
  reviews,
  image,
  inStock,
  isNew = false,
  isBestSeller = false,
  features = []
}: ProductCardProps) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const { addToCart, isLoading } = useCartContext();
  const navigate = useNavigate();

  const handleProductClick = () => {
    navigate(`/shop/${id}`);
  };

  const handleAddToCart = async () => {
    await addToCart({
      id,
      name,
      price,
      image,
      inStock
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  return (
    <Card className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <div className="relative">
        <img 
          src={image} 
          alt={name}
          className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-1">
          {isNew && (
            <Badge className="bg-blue-500 text-white hover:bg-blue-600">
              Nouveau
            </Badge>
          )}
          {isBestSeller && (
            <Badge className="bg-orange-500 text-white hover:bg-orange-600">
              <Zap className="w-3 h-3 mr-1" />
              Bestseller
            </Badge>
          )}
          {!inStock && (
            <Badge variant="destructive">
              Rupture
            </Badge>
          )}
        </div>

        {/* Favorite button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 w-8 h-8 p-0 bg-white/80 hover:bg-white"
          onClick={() => setIsFavorited(!isFavorited)}
        >
          <Heart 
            className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
          />
        </Button>

        {/* Discount percentage */}
        {originalPrice && originalPrice > price && (
          <div className="absolute bottom-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
            -{Math.round(((originalPrice - price) / originalPrice) * 100)}%
          </div>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="text-xs mb-2">
            {category}
          </Badge>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{rating}</span>
            <span className="text-xs text-muted-foreground">({reviews})</span>
          </div>
        </div>
        
        <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {name}
        </CardTitle>
      </CardHeader>

      <CardContent className="py-0">
        <CardDescription className="text-sm line-clamp-3 mb-4">
          {description}
        </CardDescription>
        
        {features.length > 0 && (
          <div className="space-y-1 mb-4">
            {features.slice(0, 2).map((feature, index) => (
              <div key={`product-feature-${index}-${feature.slice(0, 15)}`} className="flex items-center text-xs text-muted-foreground">
                <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                {feature}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 flex flex-col space-y-3">
        <div className="w-full flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary">
                {formatPrice(price)} FCFA
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(originalPrice)} FCFA
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="w-full flex space-x-2">
          <Button 
            variant="nature" 
            className="flex-1"
            disabled={!inStock || isLoading}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isLoading ? "Ajout..." : !inStock ? "Rupture" : "Ajouter"}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleProductClick();
            }}
          >
            Détails
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;