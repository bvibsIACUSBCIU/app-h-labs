import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TickerData {
  symbol: string;
  displaySymbol: string;
  price: string;
  change: string;
  trend: 'up' | 'down';
}

interface TickerTapeProps {
  marketData: TickerData[];
  gasPrice?: { price: string; change: string; trend: 'up' | 'down' };
}

export const TickerTape = ({ marketData, gasPrice }: TickerTapeProps) => {
  const allTickers = gasPrice
    ? [...marketData, { displaySymbol: 'GAS', price: gasPrice.price, change: gasPrice.change, trend: gasPrice.trend, symbol: 'GAS' }]
    : marketData;

  // 复制两次以确保无缝滚动 (对应 CSS 中的 -50% 位移)
  const duplicatedTickers = [...allTickers, ...allTickers];

  return (
    <div className="w-full bg-slate-950/80 backdrop-blur-md border-b border-white/5 h-10 flex items-center overflow-hidden z-50 relative group">
      {/* 装饰性 "LIVE" 标签 */}
      <div className="absolute left-0 top-0 bottom-0 px-3 bg-slate-950 z-10 flex items-center border-r border-white/5 shadow-[10px_0_15px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Live</span>
        </div>
      </div>

      <div className="flex items-center animate-scroll hover:[animation-play-state:paused] whitespace-nowrap pl-20">
        {duplicatedTickers.map((t, i) => (
          <div key={i} className="flex items-center gap-3 font-mono text-xs px-6 border-r border-white/5 last:border-r-0">
            <div className="flex flex-col">
              <span className="text-slate-500 font-bold text-[10px] uppercase leading-none mb-0.5">{t.displaySymbol}</span>
              <span className="text-slate-200 font-medium tabular-nums leading-none">{t.price}</span>
            </div>
            <div className={`flex items-center gap-0.5 ${t.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'} bg-slate-900/50 px-1.5 py-0.5 rounded text-[10px] font-bold`}>
              {t.trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {t.change}
            </div>
          </div>
        ))}
      </div>

      {/* 右侧渐变遮罩 */}
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none" />
    </div>
  );
};
