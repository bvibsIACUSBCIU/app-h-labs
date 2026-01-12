import React, { useState, useEffect } from 'react';
import { ArrowRight, Wallet, Ghost, ArrowDownRight, ArrowUpRight, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Language } from '../../i18n';
import { SectionCard } from '../../components/SectionCard';
import {
    smartMoneyFlows,
    whaleAlerts
} from '../../constants';

interface CexData {
    name: string;
    logo: string;
    tvl: number;
    change_1d: number;
    netChange: number;
}

export const CexFlows: React.FC<{ lang: Language; t: any }> = ({ lang, t }) => {
    const [cexData, setCexData] = useState<CexData[]>([]);
    const [loading, setLoading] = useState(true);

    const formatUSD = (val: number) => {
        if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
        if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
        if (Math.abs(val) >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
        return `$${val.toFixed(0)}`;
    };

    const fetchCexData = async () => {
        try {
            const res = await fetch('https://api.llama.fi/protocols');
            const data = await res.json();
            const filtered = data
                .filter((p: any) => p.category === 'CEX')
                .sort((a: any, b: any) => b.tvl - a.tvl)
                .slice(0, 8)
                .map((p: any) => ({
                    name: p.name,
                    logo: p.logo,
                    tvl: p.tvl,
                    change_1d: p.change_1d || 0,
                    netChange: p.tvl * ((p.change_1d || 0) / 100)
                }));
            setCexData(filtered);
        } catch (err) {
            console.error("Failed to fetch CEX data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCexData();
        const timer = setInterval(fetchCexData, 600000);
        return () => clearInterval(timer);
    }, []);

    return (
        <SectionCard title={t.cex} icon={ArrowRight} className="h-full">
            <div className="relative overflow-x-auto no-scrollbar h-[180px] flex flex-col">
                <div className="flex items-center justify-between px-2 py-1 mb-2 bg-slate-900/50 rounded text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                    <span className="w-1/3">Exchange</span>
                    <span className="w-1/4 text-right">TVL</span>
                    <span className="w-1/4 text-right">24H Net</span>
                    <span className="w-8 text-right">Status</span>
                </div>

                <div className="space-y-1.5 overflow-y-auto no-scrollbar pr-1 flex-1">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-10 bg-slate-900/30 animate-pulse rounded" />
                        ))
                    ) : (
                        cexData.map((cex, i) => (
                            <div key={i} className="flex items-center justify-between px-2 py-2 hover:bg-slate-800/40 rounded transition-colors border-b border-white/5 last:border-0 group">
                                <div className="flex items-center gap-2 w-1/3 min-w-0">
                                    <img src={cex.logo} alt={cex.name} className="w-5 h-5 rounded-full bg-slate-800" />
                                    <span className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">{cex.name}</span>
                                </div>
                                <div className="w-1/4 text-right">
                                    <div className="text-sm font-mono text-slate-300">{formatUSD(cex.tvl)}</div>
                                    <div className={`text-[10px] font-mono ${cex.change_1d >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {cex.change_1d >= 0 ? '+' : ''}{cex.change_1d.toFixed(2)}%
                                    </div>
                                </div>
                                <div className="w-1/4 text-right">
                                    <div className={`text-sm font-mono font-bold ${cex.netChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {cex.netChange >= 0 ? '+' : ''}{formatUSD(cex.netChange)}
                                    </div>
                                </div>
                                <div className="w-8 flex justify-end">
                                    {cex.change_1d > 0.1 ? <TrendingUp size={14} className="text-emerald-500" /> : cex.change_1d < -0.1 ? <TrendingDown size={14} className="text-rose-500" /> : <Minus size={14} className="text-slate-600" />}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-yellow-900/10 border border-yellow-900/20 rounded">
                    <AlertCircle size={10} className="text-yellow-600 flex-shrink-0" />
                    <span className="text-[9px] text-yellow-700/80 italic leading-tight">
                        DefiLlama Realtime
                    </span>
                </div>
            </div>
        </SectionCard>
    );
};

export const SmartMoneyFlows: React.FC<{ lang: Language; t: any }> = ({ lang, t }) => {
    return (
        <SectionCard title={t.smart} icon={Wallet} className="h-full">
            <div className="space-y-2 h-[180px] overflow-y-auto no-scrollbar">
                {smartMoneyFlows.map((flow, i) => (
                    <div key={i} className="p-3 bg-slate-950/50 rounded border-l-2 border-indigo-500 hover:bg-slate-900/50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-white text-sm">{flow.token}</span>
                            <span className="text-[10px] bg-indigo-900/30 text-indigo-300 px-1.5 rounded font-mono uppercase">{flow.entityType}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400 truncate mr-2">{flow.entityName}</span>
                            <span className="text-green-400 font-mono font-bold">{flow.netFlow24h}</span>
                        </div>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
};

export const WhaleAlerts: React.FC<{ lang: Language; t: any }> = ({ lang, t }) => {
    return (
        <SectionCard title={t.whale} icon={Ghost} className="h-full">
            <div className="space-y-3 h-[180px] overflow-y-auto no-scrollbar">
                {whaleAlerts.map((whale, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-slate-950/30 rounded border border-white/5 hover:border-white/10 transition-all">
                        <div className={`p-1.5 rounded-full ${whale.action === 'Buy' ? 'bg-green-900/30 text-green-400' : whale.action === 'Sell' ? 'bg-red-900/30 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                            {whale.action === 'Buy' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs text-slate-200 mb-0.5">
                                <span className="font-bold">{whale.amount} {whale.token}</span>
                                <span className="font-mono text-slate-400">{whale.value}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate font-mono">{whale.walletLabel}</div>
                        </div>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
};
