/** 赏金大厅视图组件：展示活跃任务、赏金池及任务申领功能 */
import React from 'react';
import { Building2 } from 'lucide-react';
import { TerminalHeader } from '../components/TerminalHeader';
import { bountyTasks } from '../constants';
import { Language } from '../i18n';

interface BountyHallViewProps {
  lang: Language;
  translations: any;
}

export const BountyHallView = ({ lang, translations }: BountyHallViewProps) => {
  const t = translations[lang].dashboard.bounty;
  return (
    <div className="animate-in fade-in duration-500">
      <TerminalHeader title={t.title} subtitle={t.subtitle} color="emerald" />

      <div className="bg-slate-900/30 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="flex gap-4 text-sm font-mono">
            <span className="text-slate-400">{t.active}: <span className="text-white">12</span></span>
            <span className="text-slate-400">{t.pool}: <span className="text-emerald-400">$45,200</span></span>
          </div>
          <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded transition-colors">
            {t.filter}
          </button>
        </div>

        <div className="divide-y divide-slate-800">
          {bountyTasks.map((task) => (
            <div key={task.id} className="p-6 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${task.type === 'Content' ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' :
                      task.type === 'Retweet' ? 'bg-sky-900/20 text-sky-400 border-sky-900/30' :
                        'bg-emerald-900/20 text-emerald-400 border-emerald-900/30'
                    }`}>
                    {task.type}
                  </span>
                  <h3 className="text-lg font-bold text-white">{task.title}</h3>
                </div>
                <p className="text-sm text-slate-400 flex items-center gap-2">
                  <Building2 size={14} /> {task.project}
                </p>
              </div>

              <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                <div className="text-center">
                  <div className="text-xs text-slate-500 uppercase font-mono">{t.reward}</div>
                  <div className="text-emerald-400 font-bold font-mono">{task.reward}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500 uppercase font-mono">{t.slots}</div>
                  <div className="text-white font-mono">{task.filled}/{task.slots}</div>
                </div>
                <button className="px-4 py-2 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 rounded text-sm font-medium transition-all">
                  {t.claim}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
};
