import React, { createContext, useContext, ReactNode } from 'react';
import { useAdminCache } from '@/hooks/use-admin-cache';

type AdminContextType = ReturnType<typeof useAdminCache>;

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const adminCache = useAdminCache();

  return (
    <AdminContext.Provider value={adminCache}>
      {children}
    </AdminContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
