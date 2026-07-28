import { useCartContext } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartSummary } from "@/components/cart/CartSummary";
import { Plus, Minus, Trash2, ShoppingCart, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, getCartItemsCount } = useCartContext();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  const itemsCount = getCartItemsCount();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-8 pb-16">
        <div className="container mx-auto px-6">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link to="/shop" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la boutique
            </Link>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Mon Panier
            </h1>
            <p className="text-muted-foreground">
              {itemsCount} article{itemsCount > 1 ? 's' : ''} dans votre panier
            </p>
          </div>

          {items.length === 0 ? (
            // Empty Cart
            <div className="text-center py-16">
              <ShoppingCart className="w-24 h-24 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Votre panier est vide
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Découvrez notre sélection de produits agricoles innovants et ajoutez-les à votre panier
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/shop">
                  <Button size="lg" variant="nature" className="focus-visible:ring-4 focus-visible:ring-primary/40 transition-transform duration-200 hover:scale-105" aria-label="Parcourir la boutique">
                    Parcourir la boutique
                  </Button>
                </Link>
                <Link to="/seeds">
                  <Button size="lg" variant="outline" className="focus-visible:ring-4 focus-visible:ring-accent/40 transition-transform duration-200 hover:scale-105" aria-label="Voir les semences">
                    Voir les semences
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            // Cart with items
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="p-6">
                    <div className="flex items-start space-x-4">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg text-foreground line-clamp-2">
                            {item.name}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeFromCart(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <p className="text-2xl font-bold text-primary">
                              {formatPrice(item.price * item.quantity)} FCFA
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(item.price)} FCFA / unité
                            </p>
                            {item.inStock ? (
                              <Badge variant="secondary" className="text-green-600">
                                En stock
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                Rupture de stock
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-10 w-10 p-0"
                              onClick={() => updateQuantity(item, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-12 text-center text-lg font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-10 w-10 p-0"
                              onClick={() => updateQuantity(item, item.quantity + 1)}
                              disabled={!item.inStock}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Sous-total:</span>
                            <span className="font-semibold text-lg">
                              {formatPrice(item.price * item.quantity)} FCFA
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="lg:col-span-1">
                <CartSummary />
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cart;