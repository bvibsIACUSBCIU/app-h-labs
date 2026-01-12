import React, { useState, useEffect } from 'react';
import { TabState } from '../types';
import { Language, translations } from '../i18n';
import { TickerTape } from '../components/TickerTape';
import { DashboardSidebar } from './DashboardSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { WarRoomDashboard } from './WarRoomDashboard';
import { KolPortalView } from './KolPortalView';
import { BountyHallView } from './BountyHallView';
import { AcademyView } from './AcademyView';
import { FundView } from './FundView';

// Binance API Endpoints
const BINANCE_ENDPOINTS = [
  "https://api.binance.com/api/v3",
  "https://api1.binance.com/api/v3",
  "https://api2.binance.com/api/v3",
  "https://api3.binance.com/api/v3",
  "https://data-api.binance.vision/api/v3"
];

const DEFAULT_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'TRXUSDT', 'AVAXUSDT',
  'LINKUSDT', 'SHIBUSDT', 'LTCUSDT', 'NEARUSDT', 'APTUSDT',
  'SUIUSDT', 'PEPEUSDT', 'ARBUSDT', 'OPUSDT', 'RENDERUSDT',
  'TAOUSDT', 'FETUSDT', 'INJUSDT', 'SEIUSDT', 'TIAUSDT', 'WIFUSDT'
];

interface BinanceTickerData {
  symbol: string;
  displaySymbol: string;
  price: string;
  change: string;
  trend: 'up' | 'down';
}

interface DashboardProps {
  onLogout: () => void;
  lang: Language;
}

export const Dashboard = ({ onLogout, lang }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState<TabState>('war_room');
  const [marketData, setMarketData] = useState<BinanceTickerData[]>([]);
  const [gasPrice] = useState({ price: '12 gwei', change: '-5%', trend: 'down' as 'up' | 'down' });
  const [searchedSymbols, setSearchedSymbols] = useState<string[]>(DEFAULT_SYMBOLS);

  // 获取币安市场数据 (带有多个备用节点)
  const fetchBinanceData = async (symbols: string[] = DEFAULT_SYMBOLS) => {
    const symbolsParam = JSON.stringify(symbols);
    let success = false;

    for (const endpoint of BINANCE_ENDPOINTS) {
      if (success) break;
      try {
        const response = await fetch(`${endpoint}/ticker/24hr?symbols=${symbolsParam}`);
        if (!response.ok) continue;

        const data = await response.json();
        const formatted: BinanceTickerData[] = data.map((ticker: any) => {
          const displaySymbol = ticker.symbol.replace('USDT', '');
          const price = parseFloat(ticker.lastPrice);
          const change = parseFloat(ticker.priceChangePercent);

          return {
            symbol: ticker.symbol,
            displaySymbol,
            price: price >= 1000 ? `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : price >= 1 ? `$${price.toFixed(2)}` : `$${price.toFixed(4)}`,
            change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
            trend: change >= 0 ? 'up' : 'down'
          };
        });

        setMarketData(formatted);
        success = true;
      } catch (err) {
        console.warn(`Binance endpoint ${endpoint} failed, trying next...`);
      }
    }

    if (!success) {
      console.error("All Binance API endpoints failed.");
    }
  };

  // 初始化和定时刷新市场数据
  useEffect(() => {
    fetchBinanceData(searchedSymbols);
    const marketTimer = setInterval(() => fetchBinanceData(searchedSymbols), 10000); // 10秒刷新
    return () => clearInterval(marketTimer);
  }, [searchedSymbols]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#050b1d]">
      <DashboardSidebar
        activeTab={activeTab}
        setTab={setActiveTab}
        onLogout={onLogout}
        lang={lang}
        translations={translations}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TickerTape marketData={marketData} gasPrice={gasPrice} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-0 custom-scrollbar relative">
          {/* Background Grid for Terminal */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-5 pointer-events-none" />

          <div className="relative z-10 max-w-[1600px] mx-auto">
            {activeTab === 'war_room' && (
              <WarRoomDashboard
                lang={lang}
                translations={translations}
                marketData={marketData}
                gasPrice={gasPrice}
                searchedSymbols={searchedSymbols}
                setSearchedSymbols={setSearchedSymbols}
                fetchBinanceData={fetchBinanceData}
              />
            )}
            {activeTab === 'kol_portal' && <KolPortalView lang={lang} translations={translations} />}
            {activeTab === 'bounty_hall' && <BountyHallView lang={lang} translations={translations} />}
            {activeTab === 'academy' && <AcademyView lang={lang} translations={translations} />}
            {activeTab === 'fund' && <FundView lang={lang} translations={translations} />}
          </div>
        </main>
      </div>
      <MobileBottomNav
        activeTab={activeTab}
        setTab={setActiveTab}
        onLogout={onLogout}
        lang={lang}
        translations={translations}
      />
    </div>
  );
};
