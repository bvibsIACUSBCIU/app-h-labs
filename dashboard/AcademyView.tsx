import React from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { TerminalHeader } from '../components/TerminalHeader';
import { academyCourses } from '../constants';
import { Language } from '../i18n';

interface AcademyViewProps {
  lang: Language;
  translations: any;
}

export const AcademyView = ({ lang, translations }: AcademyViewProps) => {
  const t = translations[lang].dashboard.academy;
  return (
  <div className="animate-in fade-in duration-500">
    <TerminalHeader title={t.title} subtitle={t.subtitle} color="blue" />

    <div className="grid md:grid-cols-3 gap-6">
      {academyCourses.map((course, i) => (
        <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-lg p-6 hover:border-blue-500/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-900/20 rounded-lg text-blue-400">
              <BookOpen size={24} />
            </div>
            <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded uppercase tracking-wider">
              {course.level}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-4">{course.category}</h3>
          <ul className="space-y-3">
            {course.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-400 hover:text-blue-300 cursor-pointer transition-colors group">
                <ArrowRight size={14} className="mt-1 text-slate-600 group-hover:text-blue-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
)};
