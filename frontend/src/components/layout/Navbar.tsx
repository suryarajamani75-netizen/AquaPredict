import React, { useState, useEffect } from 'react';
import { Droplets, Activity, CheckCircle2, AlertCircle, Menu, X, BarChart3, FileSpreadsheet, History, Info } from 'lucide-react';
import { apiClient } from '../../api/client';
import { ReadyResponse } from '../../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [readyStatus, setReadyStatus] = useState<ReadyResponse | null>(null);
  const [isCheckingReady, setIsCheckingReady] = useState(false);

  const checkStatus = async () => {
    setIsCheckingReady(true);
    try {
      const res = await apiClient.getReadiness(3000);
      setReadyStatus(res);
    } catch {
      setReadyStatus({
        status: 'not_ready',
        model_loaded: false,
        model_name: null,
        details: 'Backend service offline or unreachable',
      });
    } finally {
      setIsCheckingReady(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'prediction', label: 'Water Quality Prediction', icon: Droplets },
    { id: 'batch', label: 'Batch Analysis', icon: FileSpreadsheet },
    { id: 'history', label: 'Prediction History', icon: History },
    { id: 'about', label: 'About the Project', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 group text-left focus:outline-hidden"
              aria-label="AquaPredict Home"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-700 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-brand-700 transition-colors">
                  Aqua<span className="text-teal-600">Predict</span>
                </span>
                <span className="hidden sm:block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Water Quality Analytics
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-xs border border-brand-200/60 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Backend Status Badge */}
          <div className="hidden lg:flex items-center gap-3">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                readyStatus?.model_loaded
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
              title={readyStatus?.details || 'Backend Model Status'}
            >
              {readyStatus?.model_loaded ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Model Online: {readyStatus.model_name || 'Random Forest'}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                  <span>API Offline</span>
                </>
              )}
              {isCheckingReady && <Activity className="h-3 w-3 animate-spin text-slate-400 ml-1" />}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-3">
            <span>Model Status:</span>
            <span className={`font-semibold ${readyStatus?.model_loaded ? 'text-emerald-600' : 'text-rose-600'}`}>
              {readyStatus?.model_loaded ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
