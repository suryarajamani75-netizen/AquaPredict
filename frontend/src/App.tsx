import React, { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Prediction } from './pages/Prediction';
import { BatchAnalysis } from './pages/BatchAnalysis';
import { PredictionHistory } from './pages/PredictionHistory';
import { About } from './pages/About';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'prediction':
        return <Prediction />;
      case 'batch':
        return <BatchAnalysis />;
      case 'history':
        return <PredictionHistory />;
      case 'about':
        return <About />;
      default:
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </AppShell>
  );
};

export default App;
