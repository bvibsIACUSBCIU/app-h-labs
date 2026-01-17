/** 作战室主视图：集成市场、链上、新闻及情报流的综合监控面板 */
import React from 'react';
import { TerminalHeader } from '../components/TerminalHeader';
import { Language } from '../i18n';
import { MarketTicker } from './WarDash/MarketTicker';
import { NewsFeed, TwitterTrends } from './WarDash/AlphaNews';
import { CexFlows, SmartMoneyFlows, WhaleAlerts } from './WarDash/OnChainAnalysis';
import { TelegramAlpha } from './WarDash/TelegramAlpha';
import { Radio } from 'lucide-react';

interface BinanceTickerData {
  symbol: string;
  displaySymbol: string;
  price: string;
  change: string;
  trend: 'up' | 'down';
}

interface WarRoomDashboardProps {
  lang: Language;
  translations: any;
  marketData: BinanceTickerData[];
  gasPrice: { price: string; change: string; trend: 'up' | 'down' };
  searchedSymbols: string[];
  setSearchedSymbols: (symbols: string[]) => void;
  fetchBinanceData: (symbols: string[]) => void;
}

export const WarRoomDashboard: React.FC<WarRoomDashboardProps> = ({
  lang,
  translations,
  marketData,
  gasPrice,
  searchedSymbols,
  setSearchedSymbols,
  fetchBinanceData
}) => {
  const t = translations[lang].dashboard.war_room;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <TerminalHeader title={t.title} subtitle={t.subtitle} color="red" />

      {/* Row 1: Live Market Data (Ticker) */}
      <MarketTicker
        lang={lang}
        marketData={marketData}
        gasPrice={gasPrice}
        searchedSymbols={searchedSymbols}
        setSearchedSymbols={setSearchedSymbols}
        fetchBinanceData={fetchBinanceData}
      />

      {/* Row 2: On-Chain Flows (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CexFlows lang={lang} t={t} />
        <SmartMoneyFlows lang={lang} t={t} />
        <WhaleAlerts lang={lang} t={t} />
      </div>

      {/* Row 3: Alpha Intel Stream (Big Component) */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
        <div className="bg-slate-950/80 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="text-sm font-bold text-white tracking-widest uppercase font-mono">
              {lang === 'zh' ? 'Alpha 情报流 (实时)' : 'Alpha Intel Stream (Real-time)'}
            </h2>
          </div>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="w-2 h-2 rounded-full bg-slate-700" />
            <div className="w-2 h-2 rounded-full bg-slate-700" />
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-[30%_40%_30%] gap-6 min-h-[860px]">
          <NewsFeed lang={lang} t={t} />
          <TelegramAlpha lang={lang} />
          <TwitterTrends lang={lang} t={t} />
        </div>
      </div>
    </div>
  );
};
