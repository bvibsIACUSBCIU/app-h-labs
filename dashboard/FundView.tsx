import React from 'react';
import { Lock, PieChart } from 'lucide-react';
import { TerminalHeader } from '../components/TerminalHeader';
import { SectionCard } from '../components/SectionCard';
import { Language } from '../i18n';

interface FundViewProps {
  lang: Language;
  translations: any;
}

export const FundView = ({ lang, translations }: FundViewProps) => {
  const t = translations[lang].dashboard.fund;
  return (
  <div className="animate-in fade-in duration-500">
    <TerminalHeader title={t.title} subtitle={t.subtitle} color="yellow" />

    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 flex flex-col items-center text-center justify-center min-h-[300px]">
        <Lock size={48} className="text-slate-600 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">{t.restricted_title}</h3>
        <p className="text-slate-400 max-w-md mb-6">
          {t.restricted_desc}
        </p>
        <button className="px-6 py-2 bg-yellow-600/20 text-yellow-500 border border-yellow-600/40 hover:bg-yellow-600/30 rounded font-mono transition-colors">
          {t.request}
        </button>
      </div>

      <div className="space-y-6">
         <SectionCard title={t.public} icon={PieChart}>
           <div className="space-y-4">
             {[
               { name: "Nexus Chain (Seed)", roi: "12x", status: "Vesting" },
               { name: "H-Swap (Series A)", roi: "Unrealized", status: "Active" },
               { name: "Project Z (Strategic)", roi: "8.5x", status: "Exited" }
             ].map((deal, i) => (
               <div key={i} className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800">
                 <div>
                   <div className="text-white font-bold">{deal.name}</div>
                   <div className="text-xs text-slate-500 uppercase">{deal.status}</div>
                 </div>
                 <div className="text-right">
                    <div className="text-yellow-500 font-mono font-bold">{deal.roi}</div>
                    <div className="text-[10px] text-slate-600">ROI</div>
                 </div>
               </div>
             ))}
           </div>
         </SectionCard>
      </div>
    </div>
  </div>
)};
