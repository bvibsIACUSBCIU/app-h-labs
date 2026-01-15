import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Terminal, Coins, Lock, Globe, Twitter, CheckCircle2, Eye, Activity, UserPlus, LogOut, X, Heart, MessageCircle, ExternalLink } from 'lucide-react';
import { TerminalHeader } from '../components/TerminalHeader';
import { kolBenefits } from '../constants';
import { Language } from '../i18n';

// Firebase imports
import {
  TwitterAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  getAdditionalUserInfo,
  User
} from "firebase/auth";
import { auth } from "../firebase";

const provider = new TwitterAuthProvider();

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
}

// 推文数据分析接口
interface TweetAnalytics {
  totalTweets: number;
  avgDailyTweets: number;
  weeklyTweetCounts: { date: string; count: number }[];
  avgCharacters: { all: number; blockchain: number; nonBlockchain: number };
  characterDistribution: {
    superLong: { count: number; percent: number };
    long: { count: number; percent: number };
    medium: { count: number; percent: number };
    short: { count: number; percent: number };
  };
  viewsDistribution: {
    under1k: { count: number; percent: number };
    from1kTo5k: { count: number; percent: number };
    from5kTo20k: { count: number; percent: number };
    from20kTo100k: { count: number; percent: number };
    over100k: { count: number; percent: number };
  };
  hourlyActivity: number[];
}

// 热门推文接口
interface HotTweet {
  id: string;
  date: string;
  content: string;
  views: number;
  likes: number;
  comments: number;
  tweetUrl: string;
}

interface KolPortalViewProps {
  lang: Language;
  translations: Record<Language, any>;
}

// ==================== 模拟数据 ====================

// 推文数据分析模拟数据
const MOCK_TWEET_ANALYTICS: TweetAnalytics = {
  totalTweets: 206,
  avgDailyTweets: 0.57,
  weeklyTweetCounts: [
    { date: '08-04', count: 1 }, { date: '08-11', count: 1 }, { date: '08-18', count: 0 },
    { date: '08-25', count: 2 }, { date: '09-01', count: 1 }, { date: '09-08', count: 0 },
    { date: '09-15', count: 1 }, { date: '09-22', count: 0 }, { date: '09-29', count: 0 },
    { date: '10-06', count: 5 }, { date: '10-13', count: 0 }, { date: '10-20', count: 3 },
    { date: '10-27', count: 0 }, { date: '11-03', count: 0 }, { date: '11-10', count: 0 },
    { date: '11-17', count: 4 }, { date: '11-24', count: 2 }, { date: '12-01', count: 5 },
    { date: '12-08', count: 4 }, { date: '12-15', count: 3 }
  ],
  avgCharacters: { all: 482, blockchain: 725, nonBlockchain: 427 },
  characterDistribution: {
    superLong: { count: 8, percent: 3.9 },
    long: { count: 89, percent: 43.2 },
    medium: { count: 44, percent: 21.4 },
    short: { count: 65, percent: 31.6 }
  },
  viewsDistribution: {
    under1k: { count: 1, percent: 0.5 },
    from1kTo5k: { count: 110, percent: 53.4 },
    from5kTo20k: { count: 82, percent: 39.8 },
    from20kTo100k: { count: 12, percent: 5.8 },
    over100k: { count: 1, percent: 0.5 }
  },
  hourlyActivity: [3, 2, 1, 5, 6, 7, 8, 9, 10, 12, 11, 8, 12, 13, 14, 25, 22, 12, 8, 6, 5, 21, 14, 8]
};

// 热门推文模拟数据
const MOCK_HOT_TWEETS: HotTweet[] = [
  {
    id: '1', date: '2025/5/19',
    content: '你知道一个靠发假ca的骗子,能赚多少钱吗?\n答案是:1亿刀!\nP小将们每天枯坐16个小时,也不及骗子的小毛。\n这是泼天的数据,让我忍不住发推文感慨一下。\n起因是我在查看链上数据的时候,发现一个盈利50个万sol的地址,但是该地址交易的ca都是很快归零。地址...',
    views: 163257, likes: 296, comments: 249,
    tweetUrl: 'https://x.com/example/status/1'
  },
  {
    id: '2', date: '2025/2/24',
    content: '有点震惊,infini被盗了5000万美金\n看见好几个人说,相信Christian没问题,肯定自己能赔付。\n杜老板说,infini是赌点小钱,得个经验教训。\n我并没有质疑的意思\n让我惊讶的是,你们怎么这么有钱啊,5千万美金只是小...',
    views: 91284, likes: 139, comments: 19,
    tweetUrl: 'https://x.com/example/status/2'
  },
  {
    id: '3', date: '2025/1/2',
    content: 'AI Agent将成为下一个万亿级别的市场,对于这个我深信不疑。\n很多人还不懂什么是AI Agent? AI Agent就是能够独立完成一系列任务的AI智能体。如果要理解它,先要明白AI理解AI Agent与现在的大语言模型(LLM)例如Chatgpt、claude、gemini等的区别。（后面就用...',
    views: 78034, likes: 391, comments: 361,
    tweetUrl: 'https://x.com/example/status/3'
  },
  {
    id: '4', date: '2025/1/1',
    content: 'virtual是我见过迄今为止最牛的代币经济模型\n每个上面发射的ai agent发币(叫aaa)组成aaa/virtual交易对。大量virtual被锁在流动池子内。就像21年Defi的时候,大量ETH躺在uni的amm池子内。\n用户想买aaa的时候,会自动将eth/usdc先买入virtual然后买aaa。...',
    views: 74221, likes: 272, comments: 151,
    tweetUrl: 'https://x.com/example/status/4'
  },
  {
    id: '5', date: '2025/1/18',
    content: '总统真会玩,不知道是谁说动总统,并操刀的Trump。严重怀疑是Musk\n从链上操作来看,对McMe和sol链上的操作非常的熟悉。\n1.发行10亿发后,1亿转入Meteora做了流动性。在一路上涨后,又将加了5200万枚。都是单币的流动性。\n这是依靠LP池子,做到情无声息的出货啊。...',
    views: 36743, likes: 101, comments: 44,
    tweetUrl: 'https://x.com/example/status/5'
  },
  {
    id: '6', date: '2025/2/21',
    content: '最近2个月,都没怎么时间写推特,主要精力都在搞我的第三个AI Agent\n经过了多轮优化和测试后,昨天Agent3已经开启。这样三个AI Agent就形成了交易的闭环了。AI P小将就此诞生了。要不给它取名叫爱砸吧。\n昨天发现了两个10倍,业绩还可以。...',
    views: 35365, likes: 66, comments: 46,
    tweetUrl: 'https://x.com/example/status/6'
  }
];

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
function DonutChart({ data, total, centerLabel }: { data: { label: string; value: number; percent: number; color: string }[]; total: number; centerLabel: string }): React.ReactElement {
  let cumPercent = 0;
  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {data.map((item, i) => {
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
        {data.map((item, i) => (
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

// 每小时活动热力图组件
function HourlyHeatmap({ data }: { data: number[] }): React.ReactElement {
  const maxVal = Math.max(...data);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>各小时发推 (UTC+0)</span>
      </div>
      <div className="flex items-end gap-1 h-24">
        {data.map((count, hour) => {
          const height = maxVal > 0 ? (count / maxVal) * 100 : 0;
          return (
            <div key={hour} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-cyan-500/80 rounded-sm transition-all" style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }} title={`${hour}时: ${count}条`} />
              {hour % 3 === 0 && <span className="text-[10px] text-slate-500">{hour}</span>}
            </div>
          );
        })}
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
  const [isLoadingData, setIsLoadingData] = useState(false);

  // 模拟数据状态 (预留真实数据接口)
  const [tweetAnalytics] = useState<TweetAnalytics>(MOCK_TWEET_ANALYTICS);
  const [hotTweets] = useState<HotTweet[]>(MOCK_HOT_TWEETS);
  const [selectedTweet, setSelectedTweet] = useState<HotTweet | null>(null);

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
          const cacheAge = Date.now() - parsed.timestamp;
          const maxAge = 24 * 60 * 60 * 1000;

          if (cacheAge < maxAge && parsed.userBasicInfo && parsed.topFollowers?.length > 0) {
            setUserBasicInfo(parsed.userBasicInfo);
            setTopFollowers(parsed.topFollowers);
            setBlueVerifiedCount(parsed.blueVerifiedCount || 0);
            return;
          }
        } catch { /* 忽略解析错误 */ }
      }

      fetchUserBasicInfo(username);
      fetchFollowersList(twitterId);
    }
  }, [user, username, twitterId]);

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
  function saveToCache(userInfo: UserBasicInfo | null, followers: FollowerUser[] | null, blueCount: number | null): void {
    if (!twitterId) return;
    const finalUserInfo = userInfo || userBasicInfo;
    const finalFollowers = followers || topFollowers;
    const finalBlueCount = blueCount ?? blueVerifiedCount;

    if (finalUserInfo && finalFollowers?.length > 0) {
      localStorage.setItem(`kol_data_${twitterId}`, JSON.stringify({
        timestamp: Date.now(),
        userBasicInfo: finalUserInfo,
        topFollowers: finalFollowers,
        blueVerifiedCount: finalBlueCount
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
      saveToCache(basicInfo, null, null);
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
                  profile_image_url_https: legacy.profile_image_url_https || ''
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
      saveToCache(null, topUsers, blueCount);
    } catch (err) { console.error('获取粉丝列表失败:', err); }
    finally { setIsLoadingData(false); }
  }

  // 用户统计数据
  const userStats = {
    followers: userBasicInfo ? formatNumber(userBasicInfo.followers_count) : "加载中...",
    verified: blueVerifiedCount > 0 ? formatNumber(blueVerifiedCount) : "加载中...",
    exposure: "1.2M",
    engagement: "4.8%"
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
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 左侧：个人信息卡片 */}
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

          {/* 右侧：最具影响力粉丝列表 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm font-medium text-white">关注Ta的Top 100 KOL</span>
            </div>
            <div className="max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
              {isLoadingData && topFollowers.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mr-2" />
                  <span className="text-sm">正在加载粉丝数据...</span>
                </div>
              ) : topFollowers.length > 0 ? (
                topFollowers.slice(0, 20).map((follower, i) => <FollowerRow key={follower.screen_name} follower={follower} rank={i + 1} />)
              ) : (
                <div className="text-center py-12 text-slate-500 text-sm">暂无粉丝数据</div>
              )}
            </div>
          </div>
        </div>

        {/* 推文数据分析模块 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">推文数据分析</h2>
            <span className="text-xs text-slate-500">多维度透视推文数量、频率、受众反馈与行为特征。</span>
          </div>

          {/* 第一行: 推文总数 + 每日发文 + 每周推文数量 */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="text-xs text-slate-500 mb-2">分析的推文总数</div>
              <div className="text-4xl font-bold text-white">{tweetAnalytics.totalTweets}<span className="text-lg text-slate-500 ml-1">条</span></div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="text-xs text-slate-500 mb-2">平均每日发文量</div>
              <div className="text-4xl font-bold text-white">{tweetAnalytics.avgDailyTweets}<span className="text-lg text-slate-500 ml-1">/日</span></div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="text-xs text-slate-500 mb-3">每周推文数量</div>
              <div className="flex items-end gap-1 h-16">
                {tweetAnalytics.weeklyTweetCounts.map((item, i) => {
                  const maxCount = Math.max(...tweetAnalytics.weeklyTweetCounts.map(w => w.count));
                  const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 mb-1">{item.count > 0 ? item.count : ''}</span>
                      <div className="w-full bg-gradient-to-t from-orange-600 to-yellow-500 rounded-sm" style={{ height: `${height}%`, minHeight: item.count > 0 ? '4px' : '0' }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 第二行: 推文平均字数 + 推文字数分布 */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="text-xs text-slate-500">推文平均字数</div>
              <ProgressBar label="全部推文" value={tweetAnalytics.avgCharacters.all} max={1000} color="bg-gradient-to-r from-pink-500 to-purple-500" />
              <ProgressBar label="区块链" value={tweetAnalytics.avgCharacters.blockchain} max={1000} color="bg-gradient-to-r from-blue-500 to-cyan-500" />
              <ProgressBar label="非区块链" value={tweetAnalytics.avgCharacters.nonBlockchain} max={1000} color="bg-gradient-to-r from-yellow-500 to-orange-500" />
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="text-xs text-slate-500 mb-4">推文字数分布</div>
              <DonutChart
                total={tweetAnalytics.totalTweets}
                centerLabel="推文"
                data={[
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
                data={[
                  { label: '浏览量 <1k', value: tweetAnalytics.viewsDistribution.under1k.count, percent: tweetAnalytics.viewsDistribution.under1k.percent, color: '#ec4899' },
                  { label: '浏览量 1k-5k', value: tweetAnalytics.viewsDistribution.from1kTo5k.count, percent: tweetAnalytics.viewsDistribution.from1kTo5k.percent, color: '#22d3ee' },
                  { label: '浏览量 5k-20k', value: tweetAnalytics.viewsDistribution.from5kTo20k.count, percent: tweetAnalytics.viewsDistribution.from5kTo20k.percent, color: '#facc15' },
                  { label: '浏览量 20k-100k', value: tweetAnalytics.viewsDistribution.from20kTo100k.count, percent: tweetAnalytics.viewsDistribution.from20kTo100k.percent, color: '#22c55e' },
                  { label: '浏览量 >100k', value: tweetAnalytics.viewsDistribution.over100k.count, percent: tweetAnalytics.viewsDistribution.over100k.percent, color: '#a855f7' }
                ]}
              />
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <HourlyHeatmap data={tweetAnalytics.hourlyActivity} />
            </div>
          </div>
        </div>

        {/* 热门推文精选模块 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">热门推文精选</h2>
            <span className="text-xs text-slate-500">浏览量最高的20条推文，捕捉最具影响力的内容。</span>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
            <div className="text-sm font-medium text-white mb-4">浏览量最高的 20 条推文</div>
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
