/** 移动端底部导航组件：在移动端提供视图切换入口 */
import React from 'react';
import { Swords, Users, Target, GraduationCap, PieChart } from 'lucide-react';
import { TabState } from '../types';
import { Language } from '../i18n';

interface MobileBottomNavProps {
  activeTab: TabState;
  setTab: (t: TabState) => void;
  onLogout: () => void;
  lang: Language;
  translations: any;
}

export const MobileBottomNav = ({ activeTab, setTab, onLogout, lang, translations }: MobileBottomNavProps) => {
  const t = translations[lang].dashboard.sidebar;
  const menuItems = [
    { id: 'war_room', label: t.war_room, icon: Swords },
    { id: 'kol_portal', label: t.kol_portal, icon: Users },
    { id: 'bounty_hall', label: t.bounty_hall, icon: Target },
    { id: 'academy', label: t.academy, icon: GraduationCap },
    { id: 'fund', label: t.fund, icon: PieChart },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 flex items-center justify-around py-2 z-50">
      {menuItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setTab(item.id as TabState)}
            className={`flex flex-col items-center text-xs gap-1 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            <item.icon size={18} />
            <span className="text-[10px] mt-1">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
