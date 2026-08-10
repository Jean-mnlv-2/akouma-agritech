import { createContext, useContext, useState, ReactNode } from "react";

interface MobileMenuContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const MobileMenuContext = createContext<MobileMenuContextValue | undefined>(undefined);

// État partagé entre Header (le Sheet lui-même, avec ses liens/compte/langue)
// et la bottom nav mobile (l'onglet "Menu") — pour que les deux puissent
// ouvrir le même panneau sans dupliquer son contenu.
export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <MobileMenuContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </MobileMenuContext.Provider>
  );
}

export function useMobileMenu(): MobileMenuContextValue {
  const ctx = useContext(MobileMenuContext);
  if (!ctx) throw new Error("useMobileMenu must be used within a MobileMenuProvider");
  return ctx;
}
