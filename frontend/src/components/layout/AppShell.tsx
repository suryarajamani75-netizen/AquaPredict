import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface AppShellProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ activeTab, setActiveTab, children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};
