import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MessageCircle, ExternalLink, Ghost, RefreshCw } from 'lucide-react';
import { Language } from '../../i18n';
import { SectionCard } from '../../components/SectionCard';

interface TelegramPost {
    id: number;
    text: string;
    date?: string;
    author?: string;
    channel: string;
}

interface TelegramAlphaProps {
    lang: Language;
}

export const TelegramAlpha: React.FC<TelegramAlphaProps> = ({ lang }) => {
    const [activeChannel, setActiveChannel] = useState('all');
    const [tgPosts, setTgPosts] = useState<TelegramPost[]>([]);
    const [tgLoading, setTgLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 从本地缓存加载消息
    const loadCachedPosts = () => {
        try {
            const cached = localStorage.getItem('tg_posts_all');
            if (cached) {
                setTgPosts(JSON.parse(cached));
            }
        } catch (e) {
            console.error("Failed to load TG cache:", e);
        }
    };

    // 自动滚动到底部
    useEffect(() => {
        if (scrollRef.current && tgPosts.length > 0) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [tgPosts, activeChannel]);

    // 获取 Telegram 频道最新消息列表
    const fetchChannelMessages = async (channel: string) => {
        const targetUrl = `https://t.me/s/${channel}?t=${Date.now()}`;
        const proxies = [
            (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
            (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
        ];

        let html = '';
        for (const proxyFn of proxies) {
            try {
                const proxyUrl = proxyFn(targetUrl);
                const response = await fetch(proxyUrl);
                if (!response.ok) continue;

                if (proxyUrl.includes('allorigins')) {
                    const data = await response.json();
                    html = data.contents;
                } else {
                    html = await response.text();
                }

                if (html && html.includes('tgme_widget_message')) break;
            } catch (err) {
                console.warn(`Proxy failed for ${channel}, trying next...`);
            }
        }

        if (!html) return [];

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const messageWraps = doc.querySelectorAll('.tgme_widget_message');
        const posts: any[] = [];
        const lastWraps = Array.from(messageWraps).slice(-10);

        for (const wrap of lastWraps) {
            const textElement = wrap.querySelector('.tgme_widget_message_text');
            if (!textElement) continue;

            // 提取 ID (data-post 属性或链接)
            let idVal = wrap.getAttribute('data-post')?.split('/').pop();
            if (!idVal) {
                const linkElement = wrap.querySelector('.tgme_widget_message_date') as HTMLAnchorElement;
                idVal = linkElement?.href?.split('/').pop();
            }
            const id = idVal ? parseInt(idVal) : Math.random();

            const timeElement = wrap.querySelector('.tgme_widget_message_date time');
            const dateStr = timeElement ? timeElement.getAttribute('datetime') : undefined;

            const authorElement = wrap.querySelector('.tgme_widget_message_author_name');
            const author = authorElement ? authorElement.textContent?.trim() : undefined;

            const cloned = textElement.cloneNode(true) as HTMLElement;

            // 1. 处理换行和链接
            cloned.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
            cloned.querySelectorAll('a').forEach(link => link.remove());

            let text = (cloned as any).innerText || cloned.textContent || '';

            // 2. 核心清理逻辑
            text = text.replace(/https?:\/\/[^\s]+/g, '');
            text = text.replace(/\([^\)]*\)/g, '').replace(/（[^）]*）/g, '');

            if (channel === 'CryptoMarketAggregator') {
                text = text.replace(/[|｜]{1,}/g, '\n');
            }

            text = text.replace(/^\s*[|｜]\s*/gm, '');
            text = text.replace(/\s*[|｜]\s*$/gm, '');

            // 3. 用户需求逻辑：两个换行替换为一个；三个及以上换行替换为两个
            text = text.replace(/\n{2,}/g, (match: string) => match.length === 2 ? '\n' : '\n\n');

            // 4. 前缀检测
            if (/^\s*pinned/i.test(text)) {
                continue;
            }

            if (text.trim()) {
                posts.push({ id, text: text.trim(), date: dateStr, author, channel });
            }
        }
        return posts;
    };

    const refreshAllChannels = async (forceLoading = false) => {
        if (forceLoading) setTgLoading(true);
        const channels = ['CryptoMarketAggregator', 'groupdigest'];

        try {
            const results = await Promise.all(channels.map(c => fetchChannelMessages(c)));
            const allNewPosts = results.flat();

            setTgPosts(prev => {
                const combined = [...prev];
                allNewPosts.forEach(newPost => {
                    const exists = combined.some(p => p.id === newPost.id && p.channel === newPost.channel);
                    if (!exists) combined.push(newPost);
                });

                const finalPosts = combined
                    .filter(p => !/^\s*pinned/i.test(p.text))
                    .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
                    .slice(-40);

                localStorage.setItem('tg_posts_all', JSON.stringify(finalPosts));
                return finalPosts;
            });
        } finally {
            setTgLoading(false);
        }
    };

    useEffect(() => {
        loadCachedPosts();
        refreshAllChannels(true);

        const interval = setInterval(() => refreshAllChannels(false), 90000); // 1.5分钟刷新一次
        return () => clearInterval(interval);
    }, []);

    const filteredPosts = useMemo(() => {
        if (activeChannel === 'all') return tgPosts;
        return tgPosts.filter(p => p.channel === activeChannel);
    }, [tgPosts, activeChannel]);

    return (
        <div className="flex flex-col h-[800px] bg-slate-900/40 rounded-xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950/50 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <MessageCircle className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-wider font-mono">TELEGRAM ALPHA</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">Live Signals</span>
                        </div>
                    </div>
                </div>
                {tgLoading && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />}
            </div>

            {/* Source Filters */}
            <div className="px-6 py-3 bg-slate-900/20 border-b border-slate-800/30">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'all', name: 'ALL CHANNELS' },
                        { id: 'CryptoMarketAggregator', name: 'ALPHA FEED' },
                        { id: 'groupdigest', name: 'DAILY DIGEST' }
                    ].map((src) => (
                        <button
                            key={src.id}
                            onClick={() => { setActiveChannel(src.id); }}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-md text-[10px] font-bold border transition-all duration-300 ${activeChannel === src.id
                                ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                                : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
                                }`}
                        >
                            {src.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Message Feed */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth bg-[radial-gradient(circle_at_top_right,rgba(30,41,59,0.2),transparent_50%)]"
            >
                {tgLoading && filteredPosts.length === 0 ? (
                    [1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex gap-4 animate-pulse">
                            <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex-shrink-0" />
                            <div className="flex-1 space-y-3">
                                <div className="h-3 bg-slate-800/50 rounded-full w-1/4" />
                                <div className="h-20 bg-slate-800/30 rounded-2xl w-full" />
                            </div>
                        </div>
                    ))
                ) : filteredPosts.length > 0 ? (
                    filteredPosts.map((post) => (
                        <div key={`${post.channel}_${post.id}`} className="flex gap-4 group">
                            {/* Avatar/Icon Column */}
                            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110 ${post.channel === 'groupdigest'
                                    ? 'bg-gradient-to-br from-purple-600 to-indigo-700 shadow-purple-900/20'
                                    : 'bg-gradient-to-br from-blue-600 to-cyan-700 shadow-blue-900/20'
                                    }`}>
                                    <MessageCircle size={18} />
                                </div>
                                <div className="w-px flex-1 bg-gradient-to-b from-slate-800 to-transparent opacity-50" />
                            </div>

                            {/* Content Column */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-black tracking-tight ${post.channel === 'groupdigest' ? 'text-purple-400' : 'text-blue-400'}`}>
                                            {(post.author || post.channel).toUpperCase()}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                                        <span className="text-[10px] font-mono text-slate-500 font-medium">
                                            {post.date ? new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ExternalLink size={12} className="text-slate-600 hover:text-blue-400 cursor-pointer" />
                                    </div>
                                </div>

                                <div className={`relative px-5 py-4 rounded-2xl rounded-tl-none border transition-all duration-300 ${post.channel === 'groupdigest'
                                        ? 'bg-slate-900/80 border-purple-500/10 hover:border-purple-500/30 group-hover:bg-slate-800/80'
                                        : 'bg-slate-900/80 border-blue-500/10 hover:border-blue-500/30 group-hover:bg-slate-800/80'
                                    }`}>
                                    {/* Glass reflection effect */}
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

                                    <p className="relative z-10 text-[13px] text-slate-300 leading-[1.6] whitespace-pre-wrap break-words font-medium">
                                        {post.text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="relative mb-6">
                            <Ghost className="w-16 h-16 text-slate-800" />
                            <div className="absolute inset-0 blur-2xl bg-blue-500/10 animate-pulse" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Awaiting Alpha Signals</h3>
                        <p className="text-xs text-slate-600 italic">Scanning decentralized networks for high-conviction data...</p>
                    </div>
                )}
            </div>
        </div>
    );
};
