import React from 'react';
import { Swords, Users, Target, GraduationCap, PieChart, LogOut } from 'lucide-react';
import { TabState } from '../types';
import { Language } from '../i18n';

interface DashboardSidebarProps {
  activeTab: TabState;
  setTab: (t: TabState) => void;
  onLogout: () => void;
  lang: Language;
  translations: any;
}

export const DashboardSidebar = ({ activeTab, setTab, onLogout, lang, translations }: DashboardSidebarProps) => {
  const t = translations[lang].dashboard.sidebar;
  const menuItems = [
    { id: 'war_room', label: t.war_room, icon: Swords },
    { id: 'kol_portal', label: t.kol_portal, icon: Users },
    { id: 'bounty_hall', label: t.bounty_hall, icon: Target },
    { id: 'academy', label: t.academy, icon: GraduationCap },
    { id: 'fund', label: t.fund, icon: PieChart },
  ];

  return (
    <div className="hidden md:flex w-20 md:w-52 bg-slate-950 border-r border-slate-800 flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800 invisible pointer-events-none">
        <div className="w-8 h-8" />
        <span className="hidden md:block font-bold text-lg tracking-tight">H Labs OS</span>
      </div>

      <nav className="flex-1 py-6 space-y-2 px-3">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id as TabState)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-200 ${isActive
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-[0_0_10px_rgba(79,70,229,0.1)]'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`hidden md:block font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
              {isActive && <div className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(79,70,229,1)]"></div>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        {/* 点击断开连接将返回官网 https://hlabs.me/ */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-400 transition-all duration-300 rounded-md hover:bg-red-500/5 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)] group"
        >
          <LogOut size={18} className="group-hover:scale-110 transition-transform duration-300" />
          <span className="hidden md:block text-sm font-medium">{t.disconnect}</span>
        </button>
      </div>
    </div>
  );
};
