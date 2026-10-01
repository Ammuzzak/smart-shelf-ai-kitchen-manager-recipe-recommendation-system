import React from 'react';
import { KitchenProvider, useKitchen } from './context/KitchenContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { ShoppingListView } from './components/ShoppingListView';
import { RescuePlanView } from './components/RescuePlanView';
import { RecipeHubView } from './components/RecipeHubView';
import { AnalyticsView } from './components/AnalyticsView';
import { CommunityView } from './components/CommunityView';
import { ProfileView } from './components/ProfileView';
import { AddInventoryModal } from './components/AddInventoryModal';
import { EditInventoryModal } from './components/EditInventoryModal';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { HeyChefModal } from './components/HeyChefModal';

const MainContent: React.FC = () => {
  const { activeScreen, theme } = useKitchen();
  const isDark = theme === 'dark';

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardView />;
      case 'inventory':
        return <InventoryView />;
      case 'shopping-list':
        return <ShoppingListView />;
      case 'rescue':
        return <RescuePlanView />;
      case 'recipes':
        return <RecipeHubView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'community':
        return <CommunityView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div
      className={`flex h-screen overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#0d1518] text-[#dbe4e8]' : 'bg-[#F7F5EF] text-[#24332D]'
      }`}
    >
      {/* Desktop Sidebar Navigation */}
      <Sidebar />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {renderScreen()}
        </main>
      </div>

      {/* Modals & Voice Assistant Overlays */}
      <AddInventoryModal />
      <EditInventoryModal />
      <RecipeDetailModal />
      <HeyChefModal />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default function App() {
  return (
    <KitchenProvider>
      <MainContent />
    </KitchenProvider>
  );
}
