/**
 * 推文数据获取与处理服务
 * 从 Twitter API 获取用户推文数据，计算统计指标并缓存
 */

// ==================== 类型定义 ====================

/** 原始推文数据 */
export interface RawTweet {
    id: string;
    content: string;
    charCount: number;
    date: string;           // 格式: "YYYY-MM-DD HH:mm:ss"
    hour: number;           // 0-23 小时
    views: number;
    likes: number;
    retweets: number;
    comments: number;
    engagementRate: number; // 互动率 = (likes + retweets + comments) / views * 100
}

/** 推文数据分析结果 */
export interface TweetAnalytics {
    totalTweets: number;
    avgDailyTweets: number;
    weeklyTweetCounts: { date: string; count: number }[];
    avgCharacters: { all: number; blockchain: number; nonBlockchain: number };
    characterDistribution: {
        superLong: { count: number; percent: number };  // >2000字
        long: { count: number; percent: number };       // 200-2000字
        medium: { count: number; percent: number };     // 100-200字
        short: { count: number; percent: number };      // <100字
    };
    viewsDistribution: {
        under1k: { count: number; percent: number };
        from1kTo5k: { count: number; percent: number };
        from5kTo20k: { count: number; percent: number };
        from20kTo100k: { count: number; percent: number };
        over100k: { count: number; percent: number };
    };
    hourlyActivity: number[];  // 24小时发推分布
}

/** 热门推文 */
export interface HotTweet {
    id: string;
    date: string;
    content: string;
    views: number;
    likes: number;
    retweets: number;
    comments: number;
    tweetUrl: string;
}

/** 完整缓存数据结构 */
interface TweetDataCache {
    timestamp: number;
    userId: string;
    rawTweets: RawTweet[];
    analytics: TweetAnalytics;
    hotTweets: HotTweet[];
}

// ==================== 常量配置 ====================

const API_BASE_URL = "https://fapi.uk/api/base/apitools/userTweetsV2";
const MAX_TWEETS = 500;          // 最大获取推文数
const REQUEST_INTERVAL = 1500;   // 请求间隔(ms)
const CACHE_MAX_AGE = 6 * 60 * 60 * 1000;  // 缓存有效期: 6小时

// ==================== 数据获取函数 ====================

/**
 * 带重试机制的 API 请求
 */
async function fetchWithRetry(url: string, retries: number = 3): Promise<string | null> {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'accept': '*/*' },
                signal: AbortSignal.timeout(25000)
            });

            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) return null;
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.text();
        } catch (error: any) {
            console.log(`⏱️ 请求失败 (尝试 ${attempt + 1}/${retries})`);
            if (attempt < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }
    return null;
}

/**
 * 解析推文 API 返回数据
 */
function parseTweetsData(rawJsonStr: string, screenName: string): [RawTweet[], string | null] {
    if (!rawJsonStr) return [[], null];

    try {
        const rawData = JSON.parse(rawJsonStr);
        const innerDataJson = rawData.data || "{}";
        const dataObj = typeof innerDataJson === 'string' ? JSON.parse(innerDataJson) : innerDataJson;

        const instructions = dataObj?.data?.user?.result?.timeline_v2?.timeline?.instructions || [];
        const tweets: RawTweet[] = [];
        let nextCursor: string | null = null;

        for (const instr of instructions) {
            const instrType = instr.type;
            let entries = instrType === "TimelineAddEntries" ? (instr.entries || []) : [];
            if (instrType === "TimelinePinEntry" && instr.entry) {
                entries = [instr.entry];
            }

            for (const entry of entries) {
                const content = entry.content || {};
                const entryId = entry.entryId || "";

                // 提取分页游标
                if (content.cursorType === "Bottom") {
                    nextCursor = content.value;
                    continue;
                }

                if (!entryId.startsWith("tweet-") && !entryId.startsWith("pinEntry-")) continue;

                try {
                    const res = content.itemContent?.tweet_results?.result || {};
                    if (!res) continue;

                    // 处理嵌套结构
                    const tweetData = res.tweet || res;
                    if (!tweetData.legacy) continue;

                    const legacy = tweetData.legacy;
                    const tweetId = tweetData.rest_id;
                    const fullText = legacy.full_text || "";
                    const createdAt = legacy.created_at || "";

                    // 解析日期: "Wed Oct 10 14:22:30 +0000 2024"
                    const dateObj = new Date(createdAt);
                    const dateStr = dateObj.toISOString().slice(0, 19).replace('T', ' ');
                    const hour = dateObj.getUTCHours();

                    // 获取浏览量 (可能在不同位置)
                    const viewsCount = tweetData.views?.count || legacy.views?.count || 0;
                    const views = typeof viewsCount === 'string' ? parseInt(viewsCount, 10) : viewsCount;

                    const likes = legacy.favorite_count || 0;
                    const retweets = legacy.retweet_count || 0;
                    const comments = legacy.reply_count || 0;

                    // 计算互动率
                    const engagementRate = views > 0 ? ((likes + retweets + comments) / views) * 100 : 0;

                    tweets.push({
                        id: tweetId,
                        content: fullText,
                        charCount: fullText.length,
                        date: dateStr,
                        hour,
                        views,
                        likes,
                        retweets,
                        comments,
                        engagementRate: Math.round(engagementRate * 100) / 100
                    });
                } catch { continue; }
            }
        }

        return [tweets, nextCursor];
    } catch (error) {
        console.error("❌ 解析推文数据失败:", error);
        return [[], null];
    }
}

/**
 * 获取用户全部推文数据
 */
export async function fetchUserTweets(
    userId: string,
    screenName: string,
    onProgress?: (page: number, total: number) => void
): Promise<RawTweet[]> {
    const apiKey = import.meta.env.VITE_X_API_KEY;
    if (!apiKey) {
        console.error("❌ API Key 未配置");
        return [];
    }

    console.log("🚀 开始获取推文数据...");

    const allTweets = new Map<string, RawTweet>();
    let cursor = "-1";
    let page = 1;
    let emptyCount = 0;

    while (allTweets.size < MAX_TWEETS) {
        let url = `${API_BASE_URL}?apiKey=${apiKey}&userId=${userId}`;
        if (cursor && cursor !== "-1") url += `&cursor=${cursor}`;

        const rawData = await fetchWithRetry(url);
        if (!rawData) {
            page++;
            await new Promise(r => setTimeout(r, REQUEST_INTERVAL + 1000));
            continue;
        }

        const [tweets, nextCursor] = parseTweetsData(rawData, screenName);

        let newCount = 0;
        for (const tweet of tweets) {
            if (!allTweets.has(tweet.id)) {
                allTweets.set(tweet.id, tweet);
                newCount++;
            }
        }

        console.log(`📄 第 ${page} 页 | 本页: ${tweets.length} 条 | 新增: ${newCount} 条 | 累计: ${allTweets.size}`);
        onProgress?.(page, allTweets.size);

        if (newCount === 0) emptyCount++;
        else emptyCount = 0;

        if (emptyCount >= 3) {
            console.log("🏁 连续3页无新数据，停止获取");
            break;
        }

        if (!nextCursor || nextCursor === cursor) {
            console.log("🏁 已到达末尾");
            break;
        }

        cursor = nextCursor;
        page++;
        await new Promise(r => setTimeout(r, REQUEST_INTERVAL));
    }

    const result = Array.from(allTweets.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    console.log(`✅ 推文获取完成，共 ${result.length} 条`);
    return result;
}

// ==================== 数据统计函数 ====================

/**
 * 计算推文分析统计数据
 */
export function calculateTweetAnalytics(tweets: RawTweet[]): TweetAnalytics {
    const total = tweets.length;
    if (total === 0) return getEmptyAnalytics();

    // 1. 计算日期范围和平均每日发文量
    const dates = tweets.map(t => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const daySpan = Math.max(1, Math.ceil((maxDate - minDate) / (24 * 60 * 60 * 1000)));
    const avgDailyTweets = Math.round((total / daySpan) * 100) / 100;

    // 2. 每周推文数量统计（以周日为起始）
    const weeklyMap = new Map<string, number>();
    const weekStartDateMap = new Map<string, Date>();  // 用于排序
    tweets.forEach(t => {
        const date = new Date(t.date);
        const weekStart = getWeekStart(date);
        const key = `${(weekStart.getMonth() + 1).toString().padStart(2, '0')}-${weekStart.getDate().toString().padStart(2, '0')}`;
        weeklyMap.set(key, (weeklyMap.get(key) || 0) + 1);
        weekStartDateMap.set(key, weekStart);
    });
    const weeklyTweetCounts = Array.from(weeklyMap.entries())
        .map(([date, count]) => ({ date, count, sortDate: weekStartDateMap.get(date)!.getTime() }))
        .sort((a, b) => a.sortDate - b.sortDate)
        .map(({ date, count }) => ({ date, count }))
        .slice(-20);  // 只保留最近20周

    // 3. 平均字数统计
    const totalChars = tweets.reduce((sum, t) => sum + t.charCount, 0);
    const avgAll = Math.round(totalChars / total);

    // 4. 字数分布统计
    const charDist = { superLong: 0, long: 0, medium: 0, short: 0 };
    tweets.forEach(t => {
        if (t.charCount > 2000) charDist.superLong++;
        else if (t.charCount >= 200) charDist.long++;
        else if (t.charCount >= 100) charDist.medium++;
        else charDist.short++;
    });

    // 5. 浏览量分布统计
    const viewsDist = { under1k: 0, from1kTo5k: 0, from5kTo20k: 0, from20kTo100k: 0, over100k: 0 };
    tweets.forEach(t => {
        if (t.views >= 100000) viewsDist.over100k++;
        else if (t.views >= 20000) viewsDist.from20kTo100k++;
        else if (t.views >= 5000) viewsDist.from5kTo20k++;
        else if (t.views >= 1000) viewsDist.from1kTo5k++;
        else viewsDist.under1k++;
    });

    // 6. 24小时发推分布
    const hourlyActivity = new Array(24).fill(0);
    tweets.forEach(t => { hourlyActivity[t.hour]++; });

    return {
        totalTweets: total,
        avgDailyTweets,
        weeklyTweetCounts,
        avgCharacters: { all: avgAll, blockchain: avgAll, nonBlockchain: avgAll },
        characterDistribution: {
            superLong: { count: charDist.superLong, percent: round(charDist.superLong / total * 100) },
            long: { count: charDist.long, percent: round(charDist.long / total * 100) },
            medium: { count: charDist.medium, percent: round(charDist.medium / total * 100) },
            short: { count: charDist.short, percent: round(charDist.short / total * 100) }
        },
        viewsDistribution: {
            under1k: { count: viewsDist.under1k, percent: round(viewsDist.under1k / total * 100) },
            from1kTo5k: { count: viewsDist.from1kTo5k, percent: round(viewsDist.from1kTo5k / total * 100) },
            from5kTo20k: { count: viewsDist.from5kTo20k, percent: round(viewsDist.from5kTo20k / total * 100) },
            from20kTo100k: { count: viewsDist.from20kTo100k, percent: round(viewsDist.from20kTo100k / total * 100) },
            over100k: { count: viewsDist.over100k, percent: round(viewsDist.over100k / total * 100) }
        },
        hourlyActivity
    };
}

/**
 * 获取热门推文 (按浏览量排序)
 */
export function getHotTweets(tweets: RawTweet[], screenName: string, limit: number = 10): HotTweet[] {
    return tweets
        .sort((a, b) => b.views - a.views)
        .slice(0, limit)
        .map(t => ({
            id: t.id,
            date: t.date.split(' ')[0].replace(/-/g, '/'),
            content: t.content,
            views: t.views,
            likes: t.likes,
            retweets: t.retweets,
            comments: t.comments,
            tweetUrl: `https://x.com/${screenName}/status/${t.id}`
        }));
}

/**
 * 计算最近24小时的数据统计
 * @param tweets 所有推文数据
 * @returns { total24hViews: 总浏览量, avg24hEngagement: 平均互动率 }
 */
export function calculate24HourStats(tweets: RawTweet[]): { total24hViews: number; avg24hEngagement: number } {
    const now = Date.now();
    const last24Hours = 24 * 60 * 60 * 1000;

    // 筛选出最近24小时内发布的推文
    const recent24hTweets = tweets.filter(t => {
        const tweetTime = new Date(t.date).getTime();
        return (now - tweetTime) <= last24Hours;
    });

    if (recent24hTweets.length === 0) {
        return { total24hViews: 0, avg24hEngagement: 0 };
    }

    // 计算总浏览量
    const total24hViews = recent24hTweets.reduce((sum, t) => sum + t.views, 0);

    // 计算平均互动率
    const totalEngagement = recent24hTweets.reduce((sum, t) => sum + t.engagementRate, 0);
    const avg24hEngagement = totalEngagement / recent24hTweets.length;

    return {
        total24hViews,
        avg24hEngagement: Math.round(avg24hEngagement * 100) / 100
    };
}

// ==================== 缓存管理 ====================

/**
 * 获取缓存 key
 */
function getCacheKey(userId: string): string {
    return `tweet_data_${userId}`;
}

/**
 * 保存数据到本地缓存
 */
export function saveTweetDataToCache(
    userId: string,
    rawTweets: RawTweet[],
    analytics: TweetAnalytics,
    hotTweets: HotTweet[]
): void {
    const cache: TweetDataCache = {
        timestamp: Date.now(),
        userId,
        rawTweets,
        analytics,
        hotTweets
    };
    localStorage.setItem(getCacheKey(userId), JSON.stringify(cache));
    console.log("💾 推文数据已缓存");
}

/**
 * 从本地缓存加载数据
 */
export function loadTweetDataFromCache(userId: string): TweetDataCache | null {
    const raw = localStorage.getItem(getCacheKey(userId));
    if (!raw) return null;

    try {
        const cache: TweetDataCache = JSON.parse(raw);
        const age = Date.now() - cache.timestamp;

        if (age > CACHE_MAX_AGE) {
            console.log("⏰ 推文缓存已过期");
            return null;
        }

        console.log(`📦 使用缓存的推文数据 (${cache.rawTweets.length} 条)`);
        return cache;
    } catch {
        return null;
    }
}

/**
 * 清除推文缓存
 */
export function clearTweetCache(userId: string): void {
    localStorage.removeItem(getCacheKey(userId));
    console.log("🗑️ 推文缓存已清除");
}

// ==================== 辅助函数 ====================

function round(num: number): number {
    return Math.round(num * 10) / 10;
}

/**
 * 获取周日作为一周开始日期
 */
function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();  // 0 (周日) 到 6 (周六)
    const diff = d.getDate() - day;  // 减去当前是周几，就回到周日
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getEmptyAnalytics(): TweetAnalytics {
    return {
        totalTweets: 0,
        avgDailyTweets: 0,
        weeklyTweetCounts: [],
        avgCharacters: { all: 0, blockchain: 0, nonBlockchain: 0 },
        characterDistribution: {
            superLong: { count: 0, percent: 0 },
            long: { count: 0, percent: 0 },
            medium: { count: 0, percent: 0 },
            short: { count: 0, percent: 0 }
        },
        viewsDistribution: {
            under1k: { count: 0, percent: 0 },
            from1kTo5k: { count: 0, percent: 0 },
            from5kTo20k: { count: 0, percent: 0 },
            from20kTo100k: { count: 0, percent: 0 },
            over100k: { count: 0, percent: 0 }
        },
        hourlyActivity: new Array(24).fill(0)
    };
}

// ==================== 主入口函数 ====================

/**
 * 获取并处理推文数据的主函数
 * 优先使用缓存，否则从 API 获取
 */
export async function fetchAndProcessTweetData(
    userId: string,
    screenName: string,
    forceRefresh: boolean = false,
    onProgress?: (page: number, total: number) => void
): Promise<{ analytics: TweetAnalytics; hotTweets: HotTweet[] } | null> {
    // 检查缓存
    if (!forceRefresh) {
        const cached = loadTweetDataFromCache(userId);
        if (cached) {
            return { analytics: cached.analytics, hotTweets: cached.hotTweets };
        }
    }

    // 从 API 获取
    const rawTweets = await fetchUserTweets(userId, screenName, onProgress);
    if (rawTweets.length === 0) {
        console.warn("⚠️ 未获取到推文数据");
        return null;
    }

    // 计算统计数据
    const analytics = calculateTweetAnalytics(rawTweets);
    const hotTweets = getHotTweets(rawTweets, screenName, 10);

    // 保存缓存
    saveTweetDataToCache(userId, rawTweets, analytics, hotTweets);

    return { analytics, hotTweets };
}
