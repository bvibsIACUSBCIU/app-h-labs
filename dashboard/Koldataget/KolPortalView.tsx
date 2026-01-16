/** KOL 门户视图：集成 Twitter 登录、个人影响力统计、粉丝分析及推文数据分析 */
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Terminal, Coins, Lock, Globe, Twitter, CheckCircle2, Eye, Activity, UserPlus, LogOut, X, Heart, MessageCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { TerminalHeader } from '../../components/TerminalHeader';
import { kolBenefits } from '../../constants';
import { Language } from '../../i18n';
import { fetchAndProcessTweetData, clearTweetCache, calculate24HourStats, type TweetAnalytics, type HotTweet, type RawTweet } from './TweetDataService';

// Firebase imports
import {
  TwitterAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  getAdditionalUserInfo,
  User
} from "firebase/auth";
import { auth } from "../../firebase";

const provider = new TwitterAuthProvider();

// ... existing imports

// ==================== 类型定义 ====================

interface UserBasicInfo {
  name: string;
  followers_count: number;
  description: string;
  profile_image_url: string;
}

interface FollowerUser {
  name: string;
  screen_name: string;
  followers_count: number;
  is_blue_verified: boolean;
  verified: boolean;
  description: string;
  profile_image_url_https: string;
  // 新增字段用于活跃度分析
  friends_count: number;
  statuses_count: number;
  favourites_count: number;
  media_count: number;
  created_at: string;
  pinned_tweet_ids_str: string[];
  default_profile_image: boolean;
  profile_banner_url?: string;
}

interface FanActivityStats {
  distribution: {
    veryActive: { count: number; percent: number };
    active: { count: number; percent: number };
    lowActive: { count: number; percent: number };
    bot: { count: number; percent: number };
  };
  healthScore: number;
  totalAnalyzed: number;
}

interface KolPortalViewProps {
  lang: Language;
  translations: Record<Language, any>;
}

// ==================== 默认空数据 ====================

const EMPTY_FAN_STATS: FanActivityStats = {
  distribution: {
    veryActive: { count: 0, percent: 0 },
    active: { count: 0, percent: 0 },
    lowActive: { count: 0, percent: 0 },
    bot: { count: 0, percent: 0 }
  },
  healthScore: 0,
  totalAnalyzed: 0
};

const EMPTY_TWEET_ANALYTICS: TweetAnalytics = {
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

// ==================== 辅助函数 ====================

// 格式化数字显示
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toString();
}

// 递归解析嵌套 JSON 字符串
function parseNestedJson(data: any): any {
  if (typeof data === 'string') {
    try { return parseNestedJson(JSON.parse(data)); }
    catch { return data; }
  }
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) return data.map(item => parseNestedJson(item));
    const result: any = {};
    for (const key in data) result[key] = parseNestedJson(data[key]);
    return result;
  }
  return data;
}

// 解析 Twitter 时间戳
function parseTwitterTimestamp(tsStr: string): Date | null {
  if (!tsStr) return null;
  try {
    // Twitter format: "Wed Dec 19 13:03:09 +0000 2018"
    return new Date(tsStr);
  } catch {
    return null;
  }
}

// 计算活跃度评分 (0-100)
function calculateActivityScore(user: FollowerUser): number {
  let score = 0;

  // --- 1. 身份可信度 (40分) ---
  if (user.is_blue_verified) score += 25;
  if (!user.default_profile_image) score += 10;
  if (user.profile_banner_url) score += 5;

  // --- 2. 内容产出 (25分) ---
  if (user.statuses_count > 1000) score += 15;
  else if (user.statuses_count > 100) score += 10;
  else if (user.statuses_count > 10) score += 5;

  if (user.media_count > 10) score += 10;

  // --- 3. 互动与影响力 (20分) ---
  if (user.favourites_count > 500) score += 10;
  else if (user.favourites_count > 50) score += 5;

  if (user.pinned_tweet_ids_str && user.pinned_tweet_ids_str.length > 0) score += 10;

  // --- 4. 账号质量比 (15分) ---
  const friends = user.friends_count || 1;
  const ratio = user.followers_count / friends;
  if (ratio > 0.8) score += 10;

  // 账号创建时间惩罚/加分 (简单处理: <30天 -20, >365天 +5)
  const createdAt = parseTwitterTimestamp(user.created_at);
  if (createdAt) {
    const daysOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 30) score -= 20;
    else if (daysOld > 365) score += 5;
  }

  return Math.max(0, Math.floor(score));
}

// 用户分类
function classifyUser(score: number): 'veryActive' | 'active' | 'lowActive' | 'bot' {
  if (score >= 80) return 'veryActive'; // 非常活跃 (高价值)
  if (score >= 45) return 'active';     // 普通活跃
  if (score >= 20) return 'lowActive';  // 低频活跃
  return 'bot';                         // 疑似僵尸/机器人
}

// ==================== 子组件 ====================

// 统计卡片组件
function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }): React.ReactElement {
  return (
    <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-lg flex flex-col items-center justify-center text-center gap-2 hover:border-purple-500/30 transition-colors">
      <div className="text-slate-500 mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

// 粉丝列表行组件
function FollowerRow({ follower, rank }: { follower: FollowerUser; rank: number }): React.ReactElement {
  return (
    <a
      href={`https://x.com/${follower.screen_name}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 px-4 py-3 hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 last:border-0"
    >
      {/* 头像 */}
      {follower.profile_image_url_https ? (
        <img src={follower.profile_image_url_https} alt={follower.name} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
      ) : (
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br from-purple-600 to-blue-600">{follower.name[0]}</div>
      )}
      {/* 名称和账号 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-white truncate">{follower.name}</span>
          {follower.is_blue_verified && <CheckCircle2 size={14} className="text-blue-400 fill-blue-400/10 shrink-0" />}
        </div>
        <p className="text-xs text-slate-500 truncate">@{follower.screen_name}</p>
        {follower.description && <p className="text-xs text-slate-600 truncate mt-0.5">{follower.description}</p>}
      </div>
      {/* 排名 */}
      <div className="text-center shrink-0 w-12">
        <div className="text-xs text-slate-500">排名</div>
        <div className="text-lg font-bold text-white">{rank}</div>
      </div>
      {/* 粉丝数 */}
      <div className="text-right shrink-0 w-20">
        <div className="text-lg font-bold text-cyan-400">{formatNumber(follower.followers_count)}</div>
        <div className="text-xs text-slate-500">关注者</div>
      </div>
    </a>
  );
}

// 进度条组件
function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }): React.ReactElement {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-mono">{value}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

// 环形图组件
function DonutChart({ Data, total, centerLabel }: { Data: { label: string; value: number; percent: number; color: string }[]; total: number; centerLabel: string }): React.ReactElement {
  let cumPercent = 0;
  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {Data.map((item, i) => {
            const strokeDasharray = `${item.percent * 2.51327} ${251.327 - item.percent * 2.51327}`;
            const strokeDashoffset = -cumPercent * 2.51327;
            cumPercent += item.percent;
            return <circle key={i} cx="50" cy="50" r="40" fill="none" stroke={item.color} strokeWidth="12" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />;
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{total}</span>
        </div>
      </div>
      <div className="space-y-2">
        {Data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-slate-400 w-24">{item.label}</span>
            <span className="text-white font-bold">{item.percent.toFixed(1)}%</span>
            <span className="text-slate-500">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 各小时发推点状图组件
function HourlyDotChart({ data }: { data: number[] }): React.ReactElement {
  const maxVal = Math.max(...data);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>各小时发推 (UTC+0)</span>
      </div>
      {/* 点状图容器 */}
      <div className="relative">
        <div className="flex items-end justify-between gap-0.5 h-32 px-1">
          {data.map((count, hour) => {
            // 计算每列显示的点数(最多显示8个点,超过则按比例缩放)
            const displayDots = Math.min(count, 8);
            const scaledDots = maxVal > 8 ? Math.ceil((count / maxVal) * 8) : count;
            const dotsToShow = Math.max(scaledDots, count > 0 ? 1 : 0);

            return (
              <div key={hour} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
                {/* 点状柱 */}
                <div className="flex flex-col-reverse items-center gap-0.5" style={{ minHeight: '8px' }}>
                  {Array.from({ length: dotsToShow }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                      style={{
                        boxShadow: '0 0 4px rgba(34, 211, 238, 0.6)'
                      }}
                      title={`${hour}时: ${count}条`}
                    />
                  ))}
                </div>
                {/* 数值标签(只在有数据时显示) */}
                {count > 0 && (
                  <span className="text-[9px] text-cyan-400 font-medium">
                    {count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {/* 24小时坐标轴 */}
        <div className="flex justify-between mt-2 px-1 border-t border-slate-800 pt-2">
          {data.map((_, hour) => {
            // 每隔3小时显示一个标签
            if (hour % 3 === 0) {
              return (
                <span key={hour} className="text-[10px] text-slate-500 font-mono" style={{ width: `${100 / 24}%`, textAlign: 'center' }}>
                  {hour}
                </span>
              );
            }
            return <span key={hour} style={{ width: `${100 / 24}%` }} />;
          })}
        </div>
      </div>
    </div>
  );
}

// 推文卡片组件
function TweetCard({ tweet, onClick }: { tweet: HotTweet; onClick: () => void }): React.ReactElement {
  return (
    <div onClick={onClick} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-700 transition-colors group">
      <div className="text-xs text-slate-500 mb-2">{tweet.date}</div>
      <p className="text-sm text-slate-300 line-clamp-4 mb-4 leading-relaxed">{tweet.content}</p>
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Eye size={12} /> {formatNumber(tweet.views)}</span>
        <span className="flex items-center gap-1"><Heart size={12} /> {tweet.likes}</span>
        <span className="flex items-center gap-1"><MessageCircle size={12} /> {tweet.comments}</span>
      </div>
    </div>
  );
}

// 推文详情弹窗组件
function TweetDetailModal({ tweet, onClose }: { tweet: HotTweet | null; onClose: () => void }): React.ReactElement | null {
  if (!tweet) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button>
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
          <span className="font-medium">Tweet Details</span>
          <span>•</span>
          <span>{tweet.date}</span>
        </div>
        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap mb-6">{tweet.content}</p>
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-1"><Eye size={14} /> {formatNumber(tweet.views)}</span>
            <span className="flex items-center gap-1"><Heart size={14} /> {tweet.likes}</span>
            <span className="flex items-center gap-1"><MessageCircle size={14} /> {tweet.comments}</span>
          </div>
          <a href={tweet.tweetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors">
            View on X <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

// ==================== 主组件 ====================

export function KolPortalView({ lang, translations }: KolPortalViewProps): React.ReactElement {
  const t = translations[lang].dashboard.kol;
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(localStorage.getItem('tw_username'));
  const [twitterId, setTwitterId] = useState<string | null>(localStorage.getItem('tw_user_id'));
  const [photoUrl, setPhotoUrl] = useState<string | null>(localStorage.getItem('tw_photo_url'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 真实数据状态
  const [userBasicInfo, setUserBasicInfo] = useState<UserBasicInfo | null>(null);
  const [topFollowers, setTopFollowers] = useState<FollowerUser[]>([]);
  const [blueVerifiedCount, setBlueVerifiedCount] = useState<number>(0);
  const [fanActivityStats, setFanActivityStats] = useState<FanActivityStats>(EMPTY_FAN_STATS);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // 推文数据状态 (使用真实 API 数据)
  const [rawTweets, setRawTweets] = useState<RawTweet[]>([]);
  const [tweetAnalytics, setTweetAnalytics] = useState<TweetAnalytics>(EMPTY_TWEET_ANALYTICS);
  const [hotTweets, setHotTweets] = useState<HotTweet[]>([]);
  const [selectedTweet, setSelectedTweet] = useState<HotTweet | null>(null);
  const [isLoadingTweets, setIsLoadingTweets] = useState(false);
  const [tweetLoadProgress, setTweetLoadProgress] = useState({ page: 0, total: 0 });
  const [stats24h, setStats24h] = useState({ total24hViews: 0, avg24hEngagement: 0 });

  // 监听认证状态变化
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUsername(null);
        setTwitterId(null);
        setPhotoUrl(null);
        localStorage.removeItem('tw_username');
        localStorage.removeItem('tw_user_id');
        localStorage.removeItem('tw_photo_url');
      }
    });
    return () => unsubscribe();
  }, []);

  // 用户登录后获取数据
  useEffect(() => {
    if (user && username && twitterId) {
      const cacheKey = `kol_data_${twitterId}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          setUserBasicInfo(parsed.userBasicInfo);
          setTopFollowers(parsed.topFollowers);
          setBlueVerifiedCount(parsed.blueVerifiedCount || 0);
          if (parsed.fanActivityStats) setFanActivityStats(parsed.fanActivityStats);
        } catch { /* 忽略解析错误 */ }
      } else {
        fetchUserBasicInfo(username);
        fetchFollowersList(twitterId);
      }

      // 始终尝试加载推文数据
      fetchTweetData(twitterId, username, false);
    }
  }, [user, username, twitterId]);

  // 获取推文数据
  async function fetchTweetData(userId: string, screenName: string, forceRefresh: boolean): Promise<void> {
    setIsLoadingTweets(true);
    setTweetLoadProgress({ page: 0, total: 0 });
    try {
      const result = await fetchAndProcessTweetData(
        userId,
        screenName,
        forceRefresh,
        (page, total) => setTweetLoadProgress({ page, total })
      );

      if (result) {
        setTweetAnalytics(result.analytics);
        setHotTweets(result.hotTweets);

        // 尝试从存储中恢复 RawTweets 来计算 24H 统计
        const cacheRaw = localStorage.getItem(`tweet_data_${userId}`);
        if (cacheRaw) {
          const cacheData = JSON.parse(cacheRaw);
          if (cacheData.rawTweets) {
            setRawTweets(cacheData.rawTweets);
            const stats = calculate24HourStats(cacheData.rawTweets);
            setStats24h(stats);
            console.log('✅ 24H统计数据:', stats);
          }
        }
        console.log('✅ 推文数据加载完成');
      }
    } catch (err) {
      console.error('❌ 获取推文数据失败:', err);
    } finally {
      setIsLoadingTweets(false);
    }
  }

  // 刷新推文数据
  async function handleRefreshTweetData(): Promise<void> {
    if (!twitterId || !username) return;
    clearTweetCache(twitterId);
    await fetchTweetData(twitterId, username, true);
  }

  // 登录处理
  async function handleLogin(): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const additionalInfo = getAdditionalUserInfo(result);
      const profile = additionalInfo?.profile as any;
      const twUsername = additionalInfo?.username;
      const twId = profile?.id_str || result.user.providerData[0]?.uid;
      const twPhoto = result.user.photoURL?.replace('_normal', '');

      if (twUsername) { setUsername(twUsername); localStorage.setItem('tw_username', twUsername); }
      if (twId) { setTwitterId(twId); localStorage.setItem('tw_user_id', twId); }
      if (twPhoto) { setPhotoUrl(twPhoto); localStorage.setItem('tw_photo_url', twPhoto); }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.code === 'auth/popup-closed-by-user' ? "登录已取消" : "登录失败: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // 登出处理
  async function handleLogout(): Promise<void> {
    try { await signOut(auth); } catch (err) { console.error("Logout Error:", err); }
  }

  // 刷新数据
  async function handleRefreshData(): Promise<void> {
    if (!username || !twitterId) return;
    setIsLoadingData(true);
    localStorage.removeItem(`kol_data_${twitterId}`);
    await fetchUserBasicInfo(username);
    await fetchFollowersList(twitterId);
  }

  // 保存缓存
  function saveToCache(userInfo: UserBasicInfo | null, followers: FollowerUser[] | null, blueCount: number | null, fanStats: FanActivityStats | null): void {
    if (!twitterId) return;
    const finalUserInfo = userInfo || userBasicInfo;
    const finalFollowers = followers || topFollowers;
    const finalBlueCount = blueCount ?? blueVerifiedCount;
    const finalFanStats = fanStats || fanActivityStats;

    if (finalUserInfo && finalFollowers?.length > 0) {
      localStorage.setItem(`kol_data_${twitterId}`, JSON.stringify({
        timestamp: Date.now(),
        userBasicInfo: finalUserInfo,
        topFollowers: finalFollowers,
        blueVerifiedCount: finalBlueCount,
        fanActivityStats: finalFanStats
      }));
    }
  }

  // 获取用户基本信息
  async function fetchUserBasicInfo(screenName: string): Promise<void> {
    const apiKey = import.meta.env.VITE_X_API_KEY;
    if (!apiKey) return;

    try {
      const url = `https://fapi.uk/api/base/apitools/userByScreenNameV2?apiKey=${apiKey}&screenName=${screenName}`;
      const response = await fetch(url, { method: 'POST', headers: { 'accept': '*/*' } });
      if (!response.ok) throw new Error(`请求失败: ${response.status}`);

      const parsedData = await response.json();
      const nestedData = parseNestedJson(parsedData);
      let dataField = nestedData.data;
      if (typeof dataField === 'string') dataField = JSON.parse(dataField);

      const userResult = dataField.data.user.result;
      const legacy = userResult.legacy || {};
      const basicInfo: UserBasicInfo = {
        name: legacy.name || '',
        followers_count: legacy.followers_count || 0,
        description: legacy.description || '',
        profile_image_url: legacy.profile_image_url_https || ''
      };

      setUserBasicInfo(basicInfo);
      saveToCache(basicInfo, null, null, null);
    } catch (err) { console.error('获取用户信息失败:', err); }
  }

  // 带重试的请求函数
  async function fetchWithRetry(url: string, retries: number = 3): Promise<string | null> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, { method: 'GET', headers: { 'accept': '*/*' }, signal: AbortSignal.timeout(20000) });
        if (!response.ok) { if (response.status >= 400 && response.status < 500) return null; throw new Error(`HTTP ${response.status}`); }
        return await response.text();
      } catch (error: any) {
        if (attempt < retries - 1) await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    return null;
  }

  // 解析粉丝数据
  function parseTwitterFollowersData(rawJsonStr: string): [FollowerUser[], string | null] {
    if (!rawJsonStr) return [[], null];
    try {
      const outerData = JSON.parse(rawJsonStr);
      const innerData = JSON.parse(outerData.data || '{}');
      const instructions = innerData?.data?.user?.result?.timeline?.timeline?.instructions || [];
      const userList: FollowerUser[] = [];
      let nextCursor: string | null = null;

      for (const instruction of instructions) {
        if (instruction.type === 'TimelineAddEntries') {
          for (const entry of instruction.entries || []) {
            const content = entry.content || {};
            const itemContent = content.itemContent || {};
            if (itemContent.itemType === 'TimelineUser') {
              const userResults = itemContent.user_results?.result || {};
              const legacy = userResults.legacy;
              if (legacy?.screen_name) {
                userList.push({
                  name: legacy.name || '',
                  screen_name: legacy.screen_name,
                  followers_count: legacy.followers_count || 0,
                  is_blue_verified: userResults.is_blue_verified || false,
                  verified: legacy.verified || false,
                  description: legacy.description || '',
                  profile_image_url_https: legacy.profile_image_url_https || '',
                  // 新增字段 extraction
                  friends_count: legacy.friends_count || 0,
                  statuses_count: legacy.statuses_count || 0,
                  favourites_count: legacy.favourites_count || 0,
                  media_count: legacy.media_count || 0,
                  created_at: legacy.created_at || '',
                  pinned_tweet_ids_str: legacy.pinned_tweet_ids_str || [],
                  default_profile_image: legacy.default_profile_image || false,
                  profile_banner_url: legacy.profile_banner_url
                });
              }
            }
            if (content.cursorType === 'Bottom' && content.value) nextCursor = content.value;
          }
        }
      }
      return [userList, nextCursor];
    } catch { return [[], null]; }
  }

  // 获取粉丝列表
  async function fetchFollowersList(userId: string): Promise<void> {
    const apiKey = import.meta.env.VITE_X_API_KEY;
    if (!apiKey) return;

    setIsLoadingData(true);
    const allFollowers: FollowerUser[] = [];
    const seenScreenNames = new Set<string>();
    let cursor = '-1';
    let pageCount = 1;
    let emptyPageCount = 0;

    try {
      while (pageCount <= 200) {
        const url = `https://fapi.uk/api/base/apitools/followersListV2?apiKey=${apiKey}&cursor=${cursor}&userId=${userId}`;
        const rawData = await fetchWithRetry(url, 3);

        if (rawData === null) { pageCount++; await new Promise(r => setTimeout(r, 2500)); continue; }

        const [users, nextCursor] = parseTwitterFollowersData(rawData);
        const newUsers = users.filter(u => { if (seenScreenNames.has(u.screen_name)) return false; seenScreenNames.add(u.screen_name); return true; });

        if (newUsers.length > 0) { allFollowers.push(...newUsers); emptyPageCount = 0; }
        else emptyPageCount++;

        if (!nextCursor || nextCursor === '0' || nextCursor === cursor || emptyPageCount >= 3) break;
        cursor = nextCursor;
        pageCount++;
        await new Promise(r => setTimeout(r, 1500));
      }

      const blueCount = allFollowers.filter(f => f.is_blue_verified).length;
      setBlueVerifiedCount(blueCount);

      const topUsers = allFollowers.sort((a, b) => b.followers_count - a.followers_count).slice(0, 20);
      setTopFollowers(topUsers);

      // 计算活跃度统计
      let veryActive = 0, active = 0, lowActive = 0, bot = 0;
      let totalHealthScore = 0;

      allFollowers.forEach(user => {
        const score = calculateActivityScore(user);
        const category = classifyUser(score);
        if (category === 'veryActive') veryActive++;
        else if (category === 'active') active++;
        else if (category === 'lowActive') lowActive++;
        else bot++;
      });

      const total = allFollowers.length || 1;
      // 粉丝健康评分: 活跃粉丝(非常活跃+普通活跃)占比 * 100
      const healthScore = Math.round(((veryActive + active) / total) * 100);

      const stats: FanActivityStats = {
        totalAnalyzed: total,
        healthScore,
        distribution: {
          veryActive: { count: veryActive, percent: (veryActive / total) * 100 },
          active: { count: active, percent: (active / total) * 100 },
          lowActive: { count: lowActive, percent: (lowActive / total) * 100 },
          bot: { count: bot, percent: (bot / total) * 100 }
        }
      };

      setFanActivityStats(stats);
      saveToCache(null, topUsers, blueCount, stats);
    } catch (err) { console.error('获取粉丝列表失败:', err); }
    finally { setIsLoadingData(false); }
  }

  // 用户统计数据
  const userStats = {
    followers: userBasicInfo ? formatNumber(userBasicInfo.followers_count) : "加载中...",
    verified: blueVerifiedCount > 0 ? formatNumber(blueVerifiedCount) : "加载中...",
    exposure: formatNumber(stats24h.total24hViews), // 使用实时计算的24H数据
    engagement: `${stats24h.avg24hEngagement.toFixed(2)}%` // 使用实时计算的24H数据
  };

  // ==================== 已登录视图 ====================
  if (user) {
    return (
      <div className="animate-in fade-in duration-500 space-y-8">
        {/* 顶部操作栏 */}
        <div className="flex justify-between items-center">
          <TerminalHeader title={t.title} subtitle={t.subtitle} color="purple" />
          <div className="flex items-center gap-3">
            <button onClick={handleRefreshData} disabled={isLoadingData} className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg hover:text-white hover:border-purple-500 transition-colors disabled:opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isLoadingData ? 'animate-spin' : ''}><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" /></svg>
              <span className="text-sm font-medium">{isLoadingData ? '刷新中...' : '刷新数据'}</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg hover:text-white hover:border-slate-700 transition-colors">
              <LogOut size={16} /><span className="text-sm font-medium">退出登录</span>
            </button>
          </div>
        </div>

        {/* 第一行：个人信息 + 影响力粉丝列表 */}
        {/* 第一行：个人信息 + 影响力粉丝列表 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 左侧容器：个人信息卡片 + 粉丝活跃度分析 */}
          <div className="space-y-6">
            {/* 个人信息卡片 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden shrink-0">
                  {photoUrl ? <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">{user.displayName?.[0] || 'K'}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white truncate">{userBasicInfo?.name || user.displayName}</h3>
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-medium rounded">已认证</span>
                  </div>
                  <p className="text-sm text-slate-500">@{username || 'user'}</p>
                  <p className="text-sm text-slate-400 mt-2 line-clamp-2">{userBasicInfo?.description || '复旦博士 | 正在building 由多个AI Agents组成的链上分析、聪明钱动向、项目分析、评价、交易系统'}</p>
                </div>
              </div>
              {/* 统计指标 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={<Users size={18} />} value={userStats.followers} label="粉丝数量" />
                <StatCard icon={<CheckCircle2 size={18} />} value={userStats.verified} label="蓝 V 关注" />
                <StatCard icon={<Eye size={18} />} value={userStats.exposure} label="24H 曝光量" />
                <StatCard icon={<Activity size={18} />} value={userStats.engagement} label="互动率" />
              </div>
            </div>

            {/* 粉丝活跃度分析 (移动到左侧) */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6 border-l-2 border-purple-500 pl-3">
                <h3 className="font-bold text-white">粉丝活跃度分析</h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                {/* 环形图 */}
                <div className="flex-1 w-full flex justify-center sm:justify-start">
                  <DonutChart
                    total={fanActivityStats.totalAnalyzed}
                    centerLabel="粉丝"
                    Data={[
                      { label: '非常活跃', value: fanActivityStats.distribution.veryActive.count, percent: fanActivityStats.distribution.veryActive.percent, color: '#22c55e' },
                      { label: '普通活跃', value: fanActivityStats.distribution.active.count, percent: fanActivityStats.distribution.active.percent, color: '#3b82f6' },
                      { label: '低频活跃', value: fanActivityStats.distribution.lowActive.count, percent: fanActivityStats.distribution.lowActive.percent, color: '#facc15' },
                      { label: '疑似机器人', value: fanActivityStats.distribution.bot.count, percent: fanActivityStats.distribution.bot.percent, color: '#ef4444' }
                    ]}
                  />
                </div>

                {/* 健康评分 */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-950/50 rounded-xl border border-slate-800 min-w-[140px]">
                  <div className={`text-5xl font-bold mb-2 ${fanActivityStats.healthScore >= 60 ? 'text-green-400' : fanActivityStats.healthScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {fanActivityStats.healthScore}
                  </div>
                  <div className="text-xs text-slate-500 text-center">账号粉丝<br />健康评分</div>
                </div>
              </div>

              <div className="text-xs text-slate-500 mt-6 text-center opacity-60">
                注*由于API限制，数据可能不全
              </div>
            </div>
          </div>

          {/* 右侧容器：最具影响力粉丝列表 (高度与左侧对齐) */}
          <div className="h-[590px]">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden h-full flex flex-col">
              <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-800 bg-slate-900/30 shrink-0">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-white">关注你的Top 20</span>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                {isLoadingData && topFollowers.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mr-2" />
                    <span className="text-sm">正在加载粉丝数据...</span>
                  </div>
                ) : topFollowers.length > 0 ? (
                  topFollowers.slice(0, 20).map((follower, i) => <FollowerRow key={follower.screen_name} follower={follower} rank={i + 1} />)
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">暂无粉丝数据</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 推文数据分析模块 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">推文数据分析</h2>
              <span className="text-xs text-slate-500">多维度透视推文数量、频率、受众反馈与行为特征。</span>
            </div>
            <button
              onClick={handleRefreshTweetData}
              disabled={isLoadingTweets}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-lg hover:text-white hover:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} className={isLoadingTweets ? 'animate-spin' : ''} />
              {isLoadingTweets ? `获取中 (${tweetLoadProgress.total}条)` : '刷新数据'}
            </button>
          </div>

          {/* 第一行: 推文总数 + 每日发文 + 每周推文数量 */}
          <div className="grid lg:grid-cols-[320px_1fr] gap-4">
            {/* 左侧: 推文总数 + 每日发文量 */}
            <div className="flex flex-col gap-4">
              <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-500 mb-1">分析的推文总数</div>
                  <div className="text-3xl font-bold text-white">{tweetAnalytics.totalTweets}<span className="text-sm text-slate-500 ml-1">条</span></div>
                </div>
              </div>
              <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-500 mb-1">平均每日发文量</div>
                  <div className="text-3xl font-bold text-white">{tweetAnalytics.avgDailyTweets}<span className="text-sm text-slate-500 ml-1">/日</span></div>
                </div>
              </div>
            </div>

            {/* 右侧: 每周推文数量折线图 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-full min-h-[280px]">
              <div className="text-sm font-medium text-white mb-6">每周推文数量</div>
              <div className="relative h-[calc(100%-3rem)]">
                {/* 折线图容器 */}
                <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                  {/* 网格线 */}
                  <line x1="0" y1="0" x2="800" y2="0" stroke="#1e293b" strokeWidth="1" />
                  <line x1="0" y1="50" x2="800" y2="50" stroke="#1e293b" strokeWidth="1" />
                  <line x1="0" y1="100" x2="800" y2="100" stroke="#1e293b" strokeWidth="1" />
                  <line x1="0" y1="150" x2="800" y2="150" stroke="#1e293b" strokeWidth="1" />
                  <line x1="0" y1="200" x2="800" y2="200" stroke="#1e293b" strokeWidth="1" />

                  {/* 折线图路径 */}
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {(() => {
                    const maxCount = Math.max(...tweetAnalytics.weeklyTweetCounts.map(w => w.count), 1);
                    const points = tweetAnalytics.weeklyTweetCounts.map((item, i) => {
                      const x = (i / (tweetAnalytics.weeklyTweetCounts.length - 1)) * 800;
                      const y = 200 - (item.count / maxCount) * 180;
                      return `${x},${y}`;
                    }).join(' ');

                    const areaPoints = `0,200 ${points} 800,200`;

                    return (
                      <>
                        {/* 渐变填充区域 */}
                        <polygon points={areaPoints} fill="url(#areaGradient)" />

                        {/* 折线 */}
                        <polyline
                          points={points}
                          fill="none"
                          stroke="url(#lineGradient)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* 数据点 */}
                        {tweetAnalytics.weeklyTweetCounts.map((item, i) => {
                          const x = (i / (tweetAnalytics.weeklyTweetCounts.length - 1)) * 800;
                          const y = 200 - (item.count / maxCount) * 180;
                          return (
                            <g key={i}>
                              <circle cx={x} cy={y} r="5" fill="#8b5cf6" stroke="#1e293b" strokeWidth="2" />
                              {item.count > 0 && (
                                <text x={x} y={y - 12} textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="500">
                                  {item.count}
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>

                {/* 日期轴 */}
                <div className="flex justify-between mt-3 px-1">
                  {tweetAnalytics.weeklyTweetCounts.map((item, i) => {
                    // 每隔4个显示一个日期标签,避免拥挤
                    if (i % 4 === 0 || i === tweetAnalytics.weeklyTweetCounts.length - 1) {
                      return (
                        <span key={i} className="text-[10px] text-slate-500 font-mono">
                          {item.date}
                        </span>
                      );
                    }
                    return <span key={i} />;
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 第二行: 推文平均字数 + 推文字数分布 */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-3">推文平均字词数</div>
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 mb-2">
                  {tweetAnalytics.avgCharacters.all}
                </div>
                <div className="text-sm text-slate-400">字词/条</div>
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="text-xs text-slate-500 mb-4">推文字词数分布</div>
              <DonutChart
                total={tweetAnalytics.totalTweets}
                centerLabel="推文"
                Data={[
                  { label: '超长篇 (>2000字)', value: tweetAnalytics.characterDistribution.superLong.count, percent: tweetAnalytics.characterDistribution.superLong.percent, color: '#ec4899' },
                  { label: '长篇 (280-2000字)', value: tweetAnalytics.characterDistribution.long.count, percent: tweetAnalytics.characterDistribution.long.percent, color: '#22d3ee' },
                  { label: '中等 (100-280字)', value: tweetAnalytics.characterDistribution.medium.count, percent: tweetAnalytics.characterDistribution.medium.percent, color: '#facc15' },
                  { label: '短篇 (<100字)', value: tweetAnalytics.characterDistribution.short.count, percent: tweetAnalytics.characterDistribution.short.percent, color: '#a855f7' }
                ]}
              />
            </div>
          </div>

          {/* 第三行: 浏览量分布 + 各小时发推 */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="text-xs text-slate-500 mb-4">浏览量分布</div>
              <DonutChart
                total={tweetAnalytics.totalTweets}
                centerLabel="推文"
                Data={[
                  { label: '浏览量 <1k', value: tweetAnalytics.viewsDistribution.under1k.count, percent: tweetAnalytics.viewsDistribution.under1k.percent, color: '#ec4899' },
                  { label: '浏览量 1k-5k', value: tweetAnalytics.viewsDistribution.from1kTo5k.count, percent: tweetAnalytics.viewsDistribution.from1kTo5k.percent, color: '#22d3ee' },
                  { label: '浏览量 5k-20k', value: tweetAnalytics.viewsDistribution.from5kTo20k.count, percent: tweetAnalytics.viewsDistribution.from5kTo20k.percent, color: '#facc15' },
                  { label: '浏览量 20k-100k', value: tweetAnalytics.viewsDistribution.from20kTo100k.count, percent: tweetAnalytics.viewsDistribution.from20kTo100k.percent, color: '#22c55e' },
                  { label: '浏览量 >100k', value: tweetAnalytics.viewsDistribution.over100k.count, percent: tweetAnalytics.viewsDistribution.over100k.percent, color: '#a855f7' }
                ]}
              />
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <HourlyDotChart data={tweetAnalytics.hourlyActivity} />
            </div>
          </div>
        </div>

        {/* 热门推文精选模块 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">热门推文精选</h2>
            <span className="text-xs text-slate-500">浏览量最高的12条推文，捕捉最具影响力的内容。</span>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotTweets.map(tweet => <TweetCard key={tweet.id} tweet={tweet} onClick={() => setSelectedTweet(tweet)} />)}
            </div>
          </div>
        </div>

        {/* 推文详情弹窗 */}
        <TweetDetailModal tweet={selectedTweet} onClose={() => setSelectedTweet(null)} />
      </div>
    );
  }

  // ==================== 未登录视图 ====================
  return (
    <div className="animate-in fade-in duration-500">
      <TerminalHeader title={t.title} subtitle={t.subtitle} color="purple" />

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* 左侧: 权益说明 */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="text-purple-500" /> {t.privileges}
          </h3>
          <div className="grid gap-4">
            {kolBenefits.map((benefit, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg flex gap-4 hover:border-purple-500/30 transition-colors group">
                <div className="w-12 h-12 bg-slate-800/50 rounded-lg flex items-center justify-center text-purple-400 shrink-0 group-hover:text-purple-300 transition-colors border border-slate-700/50">
                  {benefit.iconType === 'Tool' && <Terminal size={24} />}
                  {benefit.iconType === 'Money' && <Coins size={24} />}
                  {benefit.iconType === 'Safety' && <Lock size={24} />}
                  {benefit.iconType === 'Network' && <Globe size={24} />}
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">{benefit.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧: 登录卡片 */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-12 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
            <div className="w-20 h-20 mb-6 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700/50 shadow-xl shadow-black/50 relative">
              <Twitter size={32} className="text-blue-400 fill-blue-400/10" />
              <div className="absolute -inset-1 border border-dashed border-slate-700/50 rounded-full animate-spin-slow" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">加入 H-Club</h3>
            <p className="text-slate-400 text-sm mb-8">最低要求: 10k+ 粉丝或拥有 500+ 活跃成员的社区。</p>
            <button onClick={handleLogin} disabled={isLoading} className={`group relative w-full flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-900/20 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
              <Twitter size={20} className="fill-white" />
              <span>{isLoading ? '正在连接...' : '授权 Twitter (X) 登录'}</span>
            </button>
            {error && <p className="mt-4 text-xs text-red-500 bg-red-500/10 border border-red-500/20 py-2 px-4 rounded-lg animate-in slide-in-from-top-2">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
