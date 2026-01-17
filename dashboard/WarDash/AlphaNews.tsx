/** Alpha 新闻组件：实时抓取加密快讯及 Twitter 热门趋势 */
import React, { useState, useEffect, useMemo } from 'react';
import { Radio, Search, RefreshCw, AlertTriangle, ChevronRight, ExternalLink, Radar, Twitter, X } from 'lucide-react';
import { Language } from '../../i18n';
import { SectionCard } from '../../components/SectionCard';
import { twitterTrends } from '../../constants';

const NEWS_URL = "https://min-api.cryptocompare.com/data/v2/news/?lang=EN";

const DEFAULT_CATEGORIES = [
    { id: 'all', name: '全网快讯', nameEn: 'All News', tag: '' },
    { id: 'BTC', name: '比特币', nameEn: 'Bitcoin', tag: 'BTC' },
    { id: 'ETH', name: '以太坊', nameEn: 'Ethereum', tag: 'ETH' },
    { id: 'SOL', name: 'Solana', nameEn: 'Solana', tag: 'SOL' },
    { id: 'AI', name: '人工智能', nameEn: 'AI', tag: 'AI' },
    { id: 'Regulation', name: '政策监管', nameEn: 'Regulation', tag: 'Regulation' }
];

interface NewsArticle {
    id: string;
    title: string;
    description: string;
    url: string;
    sourceName: string;
    sourceImg: string;
    image: string;
    publishedAt: number;
    categories: string[];
    searchIndex: string; // 用于快速搜索
}

/**
 * 新闻详情模态窗口组件
 */
const NewsModal: React.FC<{
    article: NewsArticle;
    onClose: () => void;
    formatDate: (timestamp: number) => string;
}> = ({ article, onClose, formatDate }) => {
    // 将正文按段落分割（双换行符或单换行符）
    const paragraphs = article.description
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-3xl max-h-[90vh] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 关闭按钮 */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full transition-all duration-200 group"
                >
                    <X className="w-5 h-5 text-slate-400 group-hover:text-white" />
                </button>

                {/* 内容区域 */}
                <div className="overflow-y-auto max-h-[90vh] custom-scrollbar">
                    {/* 头部信息 */}
                    <div className="sticky top-0 bg-gradient-to-b from-slate-900 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-8 pt-6 pb-4 z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-xs font-bold text-slate-400 px-3 py-1.5 bg-slate-800/80 rounded-full border border-slate-700/50">
                                {article.sourceName}
                            </span>
                            <span className="text-xs font-mono text-slate-500">
                                {formatDate(article.publishedAt)}
                            </span>
                            {article.categories.slice(0, 3).map((cat, idx) => (
                                <span key={idx} className="text-[10px] font-bold text-red-400 px-2 py-1 bg-red-500/10 rounded border border-red-500/20">
                                    {cat}
                                </span>
                            ))}
                        </div>

                        {/* 标题 */}
                        <h2 className="text-2xl font-bold text-white leading-tight mb-2">
                            {article.title}
                        </h2>
                    </div>

                    {/* 正文内容 */}
                    <div className="px-8 py-6 space-y-4">
                        {paragraphs.map((paragraph, index) => (
                            <p
                                key={index}
                                className="text-sm text-slate-300 leading-relaxed"
                            >
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    {/* 底部链接 */}
                    <div className="sticky bottom-0 bg-gradient-to-t from-slate-900 to-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 px-8 py-5">
                        <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-sm rounded-lg transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
                        >
                            <ExternalLink size={16} />
                            阅读原文 / Read Full Article
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const NewsFeed: React.FC<{ lang: Language; t: any }> = ({ lang, t }) => {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

    const fetchCryptoNews = async () => {
        setLoading(true);
        setError(null);
        try {
            const categoryTag = DEFAULT_CATEGORIES.find(c => c.id === activeCategory)?.tag || '';
            const url = categoryTag ? `${NEWS_URL}&categories=${categoryTag}` : NEWS_URL;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response error');
            const data = await response.json();
            if (data.Data) {
                const formatted: NewsArticle[] = data.Data.map((item: any) => {
                    const categories = item.categories ? item.categories.split('|') : [];
                    const searchIndex = `${item.title} ${item.body} ${categories.join(' ')}`.toLowerCase();
                    return {
                        id: item.id,
                        title: item.title,
                        description: item.body,
                        url: item.url,
                        sourceName: item.source_info.name,
                        sourceImg: item.source_info.img,
                        image: item.imageurl,
                        publishedAt: item.published_on * 1000,
                        categories,
                        searchIndex
                    };
                });
                setArticles(formatted);
            } else {
                throw new Error('No valid data received');
            }
        } catch (err) {
            console.error("API Fetch Error:", err);
            setError(lang === 'zh' ? "无法连接到快讯服务器。" : "Unable to connect to news server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCryptoNews();
        const timer = setInterval(fetchCryptoNews, 300000);
        return () => clearInterval(timer);
    }, [activeCategory]);

    const filteredArticles = useMemo(() => {
        if (!searchQuery.trim()) return articles;
        const query = searchQuery.toLowerCase();
        return articles.filter(a => a.searchIndex.includes(query));
    }, [articles, searchQuery]);

    const formatDate = (timestamp: number) => {
        const articleDate = new Date(timestamp);
        const diff = Math.floor((new Date().getTime() - articleDate.getTime()) / 1000 / 60);
        if (lang === 'zh') {
            if (diff < 1) return "刚刚";
            if (diff < 60) return `${diff} 分钟前`;
            if (diff < 1440) return `${Math.floor(diff / 60)} 小时前`;
            return articleDate.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
        }
        if (diff < 1) return "just now";
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return articleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <>
            <div className="flex flex-col h-[800px] bg-slate-900/30 rounded-lg border border-slate-800/50 p-4">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Radio className="w-5 h-5 text-red-500" />
                        <span className="text-sm font-bold text-slate-200">LATEST NEWS</span>
                    </div>
                    <div className="relative w-32">
                        <input
                            type="text"
                            placeholder="..."
                            className="w-full bg-slate-950/50 border border-slate-800 rounded px-2 py-1 text-xs text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute right-1.5 top-1.5 w-3 h-3 text-slate-600" />
                    </div>
                </div>

                <div className="flex gap-1 mb-3 overflow-x-auto no-scrollbar">
                    {DEFAULT_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`whitespace-nowrap px-3 py-1 rounded-[4px] text-xs font-bold border transition-all ${activeCategory === cat.id ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-slate-950/50 text-slate-500 border-slate-800 hover:border-slate-700'}`}
                        >
                            {lang === 'zh' ? cat.name : cat.nameEn}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mb-3 p-2.5 bg-red-950/20 border border-red-900/30 rounded flex items-center gap-2 text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <p className="text-xs">{error}</p>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {loading && articles.length === 0 ? (
                        [1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="p-3 bg-slate-950/50 rounded border border-slate-800 animate-pulse">
                                <div className="h-3 bg-slate-800 rounded w-3/4" />
                            </div>
                        ))
                    ) : (
                        filteredArticles.map(article => (
                            <div
                                key={article.id}
                                className="bg-slate-950/40 border border-white/5 rounded p-3 transition-all hover:bg-slate-900/50 hover:border-red-500/20 cursor-pointer group"
                                onClick={() => setSelectedArticle(article)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-slate-500 px-1.5 py-0.5 bg-slate-900 rounded">
                                        {article.sourceName}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-600">
                                        {formatDate(article.publishedAt)}
                                    </span>
                                </div>
                                <h3 className="text-sm leading-tight font-bold text-slate-200 group-hover:text-white transition-colors line-clamp-2">
                                    {article.title}
                                </h3>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 新闻详情模态窗口 */}
            {selectedArticle && (
                <NewsModal
                    article={selectedArticle}
                    onClose={() => setSelectedArticle(null)}
                    formatDate={formatDate}
                />
            )}
        </>
    );
};

export const TwitterTrends: React.FC<{ lang: Language; t: any }> = ({ lang, t }) => {
    return (
        <div className="flex flex-col h-[800px] bg-slate-900/30 rounded-lg border border-slate-800/50 p-4">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
                <Twitter className="w-5 h-5 text-sky-400" />
                <span className="text-sm font-bold text-slate-200">TWITTER TRENDS</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                {twitterTrends.map((topic) => (
                    <div key={topic.id} className="bg-slate-950/40 border border-white/5 p-3 rounded hover:border-sky-500/20 transition-all group">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors uppercase tracking-tight">{topic.name}</span>
                            <span className="text-xs font-mono text-emerald-400">+{topic.change}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{topic.volume} POSTS</span>
                            <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-white/5 text-[9px] uppercase">{topic.phase}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
