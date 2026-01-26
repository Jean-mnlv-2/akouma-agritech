import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
}

interface SortOption {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  categories: Category[];
  sortOptions: SortOption[];
  minPrice: number;
  maxPrice: number;
  onReset: () => void;
  resultCount: number;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  priceRange,
  setPriceRange,
  sortBy,
  setSortBy,
  categories,
  sortOptions,
  minPrice,
  maxPrice,
  onReset,
  resultCount
}) => {
  const activeFiltersCount = [
    searchQuery ? 1 : 0,
    selectedCategory !== 'all' ? 1 : 0,
    priceRange[0] > minPrice || priceRange[1] < maxPrice ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Recherche */}
      <div className="space-y-2">
        <Label>Recherche</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Rechercher un produit..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pl-9" 
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <Separator />

      {/* Catégories */}
      <div className="space-y-3">
        <Label>Catégories</Label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button 
              key={category.id} 
              variant={selectedCategory === category.id ? 'default' : 'outline'} 
              onClick={() => setSelectedCategory(category.id)} 
              size="sm" 
              className="rounded-full"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Prix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Prix</Label>
          <span className="text-sm text-muted-foreground">
            {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} FCFA
          </span>
        </div>
        <Slider
          defaultValue={[minPrice, maxPrice]}
          value={[priceRange[0], priceRange[1]]}
          max={maxPrice}
          min={minPrice}
          step={500}
          onValueChange={(value) => setPriceRange([value[0], value[1]])}
          className="py-4"
        />
      </div>

      <Separator />

      {/* Tri */}
      <div className="space-y-2">
        <Label>Trier par</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Trier par..." />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reset */}
      {activeFiltersCount > 0 && (
        <Button 
          variant="ghost" 
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 mt-4"
          onClick={onReset}
        >
          Réinitialiser tous les filtres
        </Button>
      )}
    </div>
  );

  return (
    <div className="w-full">
      {/* Desktop Filters - Always Visible on large screens? No, let's keep it clean with a top bar or side sheet */}
      {/* For this implementation, I will make a responsive toolbar */}
      
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm mb-8">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Mobile/Tablet Filter Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filtres
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 h-5 min-w-[1.25rem] flex items-center justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtres</SheetTitle>
                <SheetDescription>
                  Affinez votre recherche pour trouver le produit idéal.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-8">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>

          {/* Quick Search on Desktop */}
          <div className="hidden md:block relative w-64">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
             <Input 
                placeholder="Recherche rapide..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-9 h-10" 
              />
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            {resultCount} produit{resultCount !== 1 ? 's' : ''}
          </p>
          
          <div className="w-[180px]">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Trier par..." />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedCategory !== 'all' && (
            <Badge variant="secondary" className="gap-1 pl-3 pr-2 py-1">
              Catégorie: {categories.find(c => c.id === selectedCategory)?.name}
              <button onClick={() => setSelectedCategory('all')} className="ml-1 hover:bg-muted rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {(priceRange[0] > minPrice || priceRange[1] < maxPrice) && (
            <Badge variant="secondary" className="gap-1 pl-3 pr-2 py-1">
              Prix: {priceRange[0]} - {priceRange[1]}
              <button onClick={() => setPriceRange([minPrice, maxPrice])} className="ml-1 hover:bg-muted rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {searchQuery && (
             <Badge variant="secondary" className="gap-1 pl-3 pr-2 py-1">
             Recherche: {searchQuery}
             <button onClick={() => setSearchQuery('')} className="ml-1 hover:bg-muted rounded-full p-0.5">
               <X className="w-3 h-3" />
             </button>
           </Badge>
          )}
          <Button variant="link" size="sm" onClick={onReset} className="h-auto p-0 text-muted-foreground hover:text-foreground text-xs">
            Tout effacer
          </Button>
        </div>
      )}
    </div>
  );
};
