/** 市场行情组件：展示实时代币价格、行情趋势及 Gas 费用 */
import React, { useState } from 'react';
import { Activity, RefreshCw, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Language } from '../../i18n';

interface BinanceTickerData {
    symbol: string;
    displaySymbol: string;
    price: string;
    change: string;
    trend: 'up' | 'down';
}

interface MarketTickerProps {
    lang: Language;
    marketData: BinanceTickerData[];
    gasPrice: { price: string; change: string; trend: 'up' | 'down' };
    searchedSymbols: string[];
    setSearchedSymbols: (symbols: string[]) => void;
    fetchBinanceData: (symbols: string[]) => void;
}

export const MarketTicker: React.FC<MarketTickerProps> = ({
    lang,
    marketData,
    gasPrice,
    searchedSymbols,
    setSearchedSymbols,
    fetchBinanceData
}) => {
    const [tokenSearchQuery, setTokenSearchQuery] = useState('');
    const [marketLoading, setMarketLoading] = useState(false);

    // 搜索代币并添加到显示列表
    const handleTokenSearch = () => {
        if (!tokenSearchQuery.trim()) return;

        const symbol = tokenSearchQuery.toUpperCase().replace('USDT', '') + 'USDT';
        if (!searchedSymbols.includes(symbol)) {
            const newSymbols = [...searchedSymbols, symbol];
            setSearchedSymbols(newSymbols);
            setMarketLoading(true);
            fetchBinanceData(newSymbols);
            setTimeout(() => setMarketLoading(false), 1000);
        }
        setTokenSearchQuery('');
    };

    return (
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-sm relative overflow-hidden">
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .mask-fade-right {
                    mask-image: linear-gradient(to right, black 85%, transparent 100%);
                    -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
                }
            `}</style>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-green-400" />
                    <span className="text-xs font-mono text-slate-400 uppercase">Live Market Data</span>
                    {marketLoading && <RefreshCw className="w-3 h-3 text-green-400 animate-spin" />}
                </div>

                {/* Token Search */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={lang === 'zh' ? "搜索代币 (如: BTC)" : "Search token (e.g., BTC)"}
                            className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 pl-8 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500/50 transition-all w-48"
                            value={tokenSearchQuery}
                            onChange={(e) => setTokenSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleTokenSearch()}
                        />
                        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <button
                        onClick={handleTokenSearch}
                        className="px-3 py-1.5 bg-green-900/30 text-green-400 text-xs font-bold rounded hover:bg-green-900/50 transition-all border border-green-900/50"
                    >
                        {lang === 'zh' ? '添加' : 'Add'}
                    </button>
                </div>
            </div>

            {/* Market Tickers - Horizontal Scroll */}
            <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar no-scrollbar mask-fade-right">
                {marketData.map((ticker, i) => (
                    <div key={i} className="flex-shrink-0 w-[140px] bg-slate-950/50 border border-slate-800 p-3 rounded hover:border-slate-700 transition-all group">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-slate-500">{ticker.displaySymbol}</span>
                            {ticker.trend === 'up' ? (
                                <ArrowUpRight size={12} className="text-green-400" />
                            ) : (
                                <ArrowDownRight size={12} className="text-red-400" />
                            )}
                        </div>
                        <div className="text-sm font-bold text-white mb-0.5">{ticker.price}</div>
                        <div className={`text-[10px] font-mono ${ticker.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                            {ticker.change}
                        </div>
                    </div>
                ))}

                {/* Gas Price */}
                <div className="flex-shrink-0 w-[140px] bg-slate-950/50 border border-slate-800 p-3 rounded hover:border-slate-700 transition-all group">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-slate-500">GAS</span>
                        {gasPrice.trend === 'up' ? (
                            <ArrowUpRight size={12} className="text-green-400" />
                        ) : (
                            <ArrowDownRight size={12} className="text-red-400" />
                        )}
                    </div>
                    <div className="text-sm font-bold text-white mb-0.5">{gasPrice.price}</div>
                    <div className={`text-[10px] font-mono ${gasPrice.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>{gasPrice.change}</div>
                </div>
            </div>
        </div>
    );
};
