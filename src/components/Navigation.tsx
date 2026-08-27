import React from 'react';
import { 
  LayoutDashboard, 
  Waves, 
  CloudRain, 
  Thermometer, 
  Sprout, 
  Map, 
  Scale, 
  LineChart, 
  FileText, 
  Database,
  Award
} from 'lucide-react';

export type TabId = 
  | 'landing'
  | 'overview'
  | 'enso'
  | 'rainfall'
  | 'temperature'
  | 'agriculture'
  | 'district'
  | 'statistics'
  | 'timeseries'
  | 'methodology'
  | 'sources'
  | 'report';

interface NavigationProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab
}) => {
  const tabs: { id: TabId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: '1. Overview', icon: LayoutDashboard },
    { id: 'enso', label: '2. ENSO Analysis', icon: Waves },
    { id: 'rainfall', label: '3. Rainfall Analysis', icon: CloudRain },
    { id: 'temperature', label: '4. Temperature Analysis', icon: Thermometer },
    { id: 'agriculture', label: '5. Agriculture Analysis', icon: Sprout },
    { id: 'district', label: '6. District Analysis', icon: Map },
    { id: 'statistics', label: '7. Statistical Evidence', icon: Scale },
    { id: 'timeseries', label: '8. Time Series', icon: LineChart },
    { id: 'methodology', label: '9. Methodology', icon: FileText },
    { id: 'sources', label: '10. Data Sources', icon: Database },
    { id: 'report', label: '11. Research Report', icon: Award }
  ];

  return (
    <nav aria-label="Main Research Sections" className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-300' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
