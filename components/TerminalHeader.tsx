import React from 'react';

interface TerminalHeaderProps {
  title: string;
  subtitle?: string;
  color?: string;
}

export const TerminalHeader = ({ title, subtitle, color = "cyan" }: TerminalHeaderProps) => (
  <div className={`flex items-center justify-between mb-6 border-b border-${color}-900/30 pb-4`}>
    <div>
      <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2 font-mono">
        <span className={`text-${color}-500`}>//</span> {title}
      </h2>
      {subtitle && <p className={`text-${color}-400/60 text-xs font-mono mt-1 uppercase tracking-wider pl-6`}>{subtitle}</p>}
    </div>
    <div className={`hidden md:flex px-3 py-1 bg-${color}-500/10 border border-${color}-500/30 rounded-sm text-${color}-400 text-xs font-mono animate-pulse items-center gap-2`}>
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${color}-400 opacity-75`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 bg-${color}-500`}></span>
      </span>
      SYSTEM ONLINE
    </div>
  </div>
);
