import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionCardProps {
  children: React.ReactNode;
  title: string;
  icon: LucideIcon;
  className?: string;
}

export const SectionCard = ({ children, title, icon: Icon, className = "" }: SectionCardProps) => (
  <div className={`bg-slate-900/50 border border-slate-800 p-4 rounded-sm backdrop-blur-sm ${className}`}>
    <div className="flex items-center gap-2 mb-4 text-slate-300 font-mono text-sm uppercase tracking-wider border-b border-slate-800/50 pb-2">
      <Icon size={16} className="text-indigo-400" />
      {title}
    </div>
    {children}
  </div>
);
