import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from "lucide-react";
import { useCartContext } from "@/context/CartContext";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const { items, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartItemsCount } = useCartContext();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  const itemsCount = getCartItemsCount();
  const total = getCartTotal();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5" />
            <span>Panier ({itemsCount})</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <ShoppingCart className="w-16 h-16 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                Votre panier est vide
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Découvrez nos produits et ajoutez-les à votre panier
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                      <p className="text-primary font-semibold">
                        {formatPrice(item.price)} FCFA
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg text-primary">
                    {formatPrice(total)} FCFA
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    size="lg" 
                    variant="nature"
                    onClick={() => {
                      onOpenChange(false);
                      window.location.href = '/cart';
                    }}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Voir le panier
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={clearCart}
                  >
                    Vider le panier
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;