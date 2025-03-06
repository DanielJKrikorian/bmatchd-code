import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

interface PackageContextType {
  packages: Package[];
  setPackages: React.Dispatch<React.SetStateAction<Package[]>>;
}

const PackageContext = createContext<PackageContextType | undefined>(undefined);

export function PackageProvider({ children }: { children: ReactNode }) {
  const [packages, setPackages] = useState<Package[]>([]);

  return (
    <PackageContext.Provider value={{ packages, setPackages }}>
      {children}
    </PackageContext.Provider>
  );
}

export function usePackages() {
  const context = useContext(PackageContext);
  if (!context) throw new Error('usePackages must be used within a PackageProvider');
  return context;
}