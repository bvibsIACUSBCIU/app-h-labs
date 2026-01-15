import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Terminal, Coins, Lock, Globe, Twitter, CheckCircle2, Eye, Activity, UserPlus, Check, Search, LogOut } from 'lucide-react';
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

// API 数据接口定义
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

interface KolPortalViewProps {
  lang: Language;
  translations: Record<Language, any>;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function BarChartIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}

function StatCard({ icon, value, label }: StatCardProps): React.ReactElement {
  return (
    <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex flex-col items-center justify-center text-center gap-2">
      <div className="text-slate-500 mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

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

  // Listen for auth state changes
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

  // 当用户登录且有 username 时,先检查缓存,再获取真实数据
  useEffect(() => {
    if (user && username && twitterId) {
      // 检查本地缓存
      const cacheKey = `kol_data_${twitterId}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsed.timestamp;
          const maxAge = 24 * 60 * 60 * 1000; // 24小时

          if (cacheAge < maxAge) {
            // 验证缓存数据完整性
            const hasValidData =
              parsed.userBasicInfo &&
              parsed.userBasicInfo.followers_count !== undefined &&
              parsed.topFollowers &&
              Array.isArray(parsed.topFollowers) &&
              parsed.blueVerifiedCount !== undefined;

            if (hasValidData) {
              console.log('📦 使用缓存数据', {
                followers: parsed.userBasicInfo.followers_count,
                blueV: parsed.blueVerifiedCount,
                topFollowers: parsed.topFollowers.length
              });
              setUserBasicInfo(parsed.userBasicInfo);
              setTopFollowers(parsed.topFollowers);
              setBlueVerifiedCount(parsed.blueVerifiedCount);
              return; // 使用缓存,不调用 API
            } else {
              console.warn('⚠️ 缓存数据不完整,重新获取');
            }
          } else {
            console.log('⏰ 缓存已过期,重新获取数据');
          }
        } catch (e) {
          console.error('缓存解析失败:', e);
        }
      }

      // 缓存不存在或已过期,调用 API
      console.log('🌐 开始调用 API 获取数据...');
      fetchUserBasicInfo(username);
      fetchFollowersList(twitterId);
    }
  }, [user, username, twitterId]);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const additionalInfo = getAdditionalUserInfo(result);

      // Get Twitter specific info
      const profile = additionalInfo?.profile as any;
      const twUsername = additionalInfo?.username;
      // Twitter User ID is typically in profile.id_str or result.user.providerData[0].uid
      const twId = profile?.id_str || result.user.providerData[0]?.uid;
      // Get high quality photo URL (remove _normal)
      const twPhoto = result.user.photoURL?.replace('_normal', '');

      if (twUsername) {
        setUsername(twUsername);
        localStorage.setItem('tw_username', twUsername);
      }
      if (twId) {
        setTwitterId(twId);
        localStorage.setItem('tw_user_id', twId);
      }
      if (twPhoto) {
        setPhotoUrl(twPhoto);
        localStorage.setItem('tw_photo_url', twPhoto);
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("登录已取消");
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("域名未授权，请检查 Firebase 配置");
      } else {
        setError("登录失败: " + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  // 强制刷新数据(忽略缓存)
  const handleRefreshData = async (): Promise<void> => {
    if (!username || !twitterId) {
      console.error('用户信息不完整,无法刷新');
      return;
    }

    console.log('🔄 手动刷新数据...');
    setIsLoadingData(true);

    // 清除当前缓存
    const cacheKey = `kol_data_${twitterId}`;
    localStorage.removeItem(cacheKey);

    // 重新获取数据
    await fetchUserBasicInfo(username);
    await fetchFollowersList(twitterId);
  };

  // 递归解析嵌套 JSON 字符串
  function parseNestedJson(data: any): any {
    if (typeof data === 'string') {
      try {
        return parseNestedJson(JSON.parse(data));
      } catch {
        return data;
      }
    }
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.map(item => parseNestedJson(item));
      }
      const result: any = {};
      for (const key in data) {
        result[key] = parseNestedJson(data[key]);
      }
      return result;
    }
    return data;
  }

  // 获取用户基本信息
  async function fetchUserBasicInfo(screenName: string): Promise<void> {
    const apiKey = import.meta.env.VITE_X_API_KEY;
    if (!apiKey) {
      console.error('API Key 未配置,请检查 .env 文件中的 VITE_X_API_KEY');
      return;
    }

    console.log(`🔍 开始获取用户 @${screenName} 的基本信息...`);

    try {
      const url = `https://fapi.uk/api/base/apitools/userByScreenNameV2?apiKey=${apiKey}&screenName=${screenName}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'accept': '*/*' }
      });

      if (!response.ok) {
        console.error(`❌ API 请求失败: ${response.status}`);
        throw new Error(`请求失败: ${response.status}`);
      }

      const parsedData = await response.json();
      const nestedData = parseNestedJson(parsedData);

      // 兼容 data 字段为字符串或 dict 的情况
      let dataField = nestedData.data;
      if (typeof dataField === 'string') {
        dataField = JSON.parse(dataField);
      }

      const userResult = dataField.data.user.result;
      const legacy = userResult.legacy || {};

      const basicInfo: UserBasicInfo = {
        name: legacy.name || userResult.name || '',
        followers_count: legacy.followers_count || userResult.followers_count || 0,
        description: legacy.description || userResult.description || '',
        profile_image_url: legacy.profile_image_url_https || userResult.profile_image_url_https || ''
      };

      console.log(`✅ 用户信息获取成功:`, {
        name: basicInfo.name,
        followers_count: basicInfo.followers_count
      });

      setUserBasicInfo(basicInfo);

      // 尝试保存到缓存(如果粉丝数据已存在)
      saveToCache(basicInfo, null, null);
    } catch (err) {
      console.error('获取用户信息失败:', err);
    }
  }

  // 统一的缓存保存函数
  function saveToCache(
    userInfo: UserBasicInfo | null,
    followers: FollowerUser[] | null,
    blueCount: number | null
  ): void {
    if (!twitterId) return;

    const cacheKey = `kol_data_${twitterId}`;

    // 尝试从现有缓存或状态获取数据
    let finalUserInfo = userInfo || userBasicInfo;
    let finalFollowers = followers || topFollowers;
    let finalBlueCount = blueCount !== null ? blueCount : blueVerifiedCount;

    // 如果数据不完整,尝试从缓存补充
    if (!finalUserInfo || !finalFollowers || finalFollowers.length === 0) {
      const existingCache = localStorage.getItem(cacheKey);
      if (existingCache) {
        try {
          const parsed = JSON.parse(existingCache);
          finalUserInfo = finalUserInfo || parsed.userBasicInfo;
          finalFollowers = (finalFollowers && finalFollowers.length > 0) ? finalFollowers : parsed.topFollowers;
          finalBlueCount = finalBlueCount || parsed.blueVerifiedCount;
        } catch (e) {
          // 忽略
        }
      }
    }

    // 验证数据完整性
    const isValid =
      finalUserInfo &&
      finalUserInfo.followers_count !== undefined &&
      finalFollowers &&
      finalFollowers.length > 0 &&
      finalBlueCount !== undefined;

    if (isValid) {
      const cacheData = {
        timestamp: Date.now(),
        userBasicInfo: finalUserInfo,
        topFollowers: finalFollowers,
        blueVerifiedCount: finalBlueCount
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('💾 数据已保存到本地缓存', {
        followers: finalUserInfo!.followers_count,
        topFollowers: finalFollowers!.length,
        blueV: finalBlueCount
      });
    } else {
      console.log('⏳ 数据未完整,暂不保存缓存', {
        hasUserInfo: !!finalUserInfo,
        hasFollowers: finalFollowers?.length > 0,
        hasBlueCount: finalBlueCount !== undefined
      });
    }
  }

  // 获取粉丝列表数据
  async function fetchFollowersList(userId: string): Promise<void> {
    const apiKey = import.meta.env.VITE_X_API_KEY;
    if (!apiKey) {
      console.error('API Key 未配置,请检查 .env 文件中的 VITE_X_API_KEY');
      return;
    }

    setIsLoadingData(true);
    const allFollowers: FollowerUser[] = [];
    let cursor = '-1';
    let pageCount = 1;
    const maxPages = 1000; // 默认最大1000页

    console.log('🚀 开始获取粉丝数据...');

    try {
      while (pageCount <= maxPages) {
        console.log(`正在获取第 ${pageCount} 页 (游标: ${cursor})...`);

        const url = `https://fapi.uk/api/base/apitools/followersListV2?apiKey=${apiKey}&cursor=${cursor}&userId=${userId}`;

        // 网络请求
        let response;
        try {
          response = await fetch(url, {
            method: 'GET',
            headers: { 'accept': '*/*' }
          });
        } catch (networkError) {
          console.error('网络请求失败:', networkError);
          break;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API 请求失败 (${response.status}):`, errorText);
          break;
        }

        const rawData = await response.text();

        // 检查返回的是否是有效的响应
        if (!rawData) {
          console.error('API 返回了空响应');
          break;
        }

        // 双重解析逻辑 - 参考 Python 代码
        let outerData;
        try {
          outerData = JSON.parse(rawData);
        } catch (parseError) {
          console.error('外层 JSON 解析失败:', rawData.substring(0, 200));
          break;
        }

        const innerDataStr = outerData.data || '{}';
        let innerData;
        try {
          innerData = JSON.parse(innerDataStr);
        } catch (parseError) {
          console.error('内层 JSON 解析失败:', innerDataStr.substring(0, 200));
          break;
        }

        const instructions = innerData?.data?.user?.result?.timeline?.timeline?.instructions || [];
        let nextCursor: string | null = null;
        let currentPageUsers: FollowerUser[] = [];

        for (const instruction of instructions) {
          if (instruction.type === 'TimelineAddEntries') {
            const entries = instruction.entries || [];

            for (const entry of entries) {
              const content = entry.content || {};

              // 提取用户信息
              const itemContent = content.itemContent || {};
              if (itemContent.itemType === 'TimelineUser') {
                const userResults = itemContent.user_results?.result || {};
                const isBlue = userResults.is_blue_verified || false;

                if (userResults.legacy) {
                  const legacy = userResults.legacy;
                  currentPageUsers.push({
                    name: legacy.name || '',
                    screen_name: legacy.screen_name || '',
                    followers_count: legacy.followers_count || 0,
                    is_blue_verified: isBlue,
                    verified: legacy.verified || false,
                    description: legacy.description || '',
                    profile_image_url_https: legacy.profile_image_url_https || ''
                  });
                }
              }

              // 提取下一页游标
              if (content.cursorType === 'Bottom') {
                nextCursor = content.value;
              }
            }
          }
        }

        // 如果本页获取到了用户数据
        if (currentPageUsers.length > 0) {
          allFollowers.push(...currentPageUsers);
          console.log(`✅ 本页获取 ${currentPageUsers.length} 人，累计: ${allFollowers.length} 人`);
        } else {
          console.log('⚠️ 本页未获取到用户数据，停止抓取');
          break;
        }

        // 翻页判定
        if (!nextCursor || nextCursor === '0' || nextCursor === cursor) {
          console.log('🏁 已到达最后一页，停止抓取');
          break;
        }

        cursor = nextCursor;
        pageCount++;

        // 优化延迟,加快获取速度 (400ms)
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      console.log(`📊 总计获取 ${allFollowers.length} 位粉丝`);

      // 计算蓝V总数
      const blueCount = allFollowers.filter(f => f.is_blue_verified).length;
      setBlueVerifiedCount(blueCount);
      console.log(`💎 蓝V用户: ${blueCount} 人`);

      // 按粉丝数降序排列,取前20个
      const topUsers = allFollowers
        .sort((a, b) => b.followers_count - a.followers_count)
        .slice(0, 20);

      setTopFollowers(topUsers);
      console.log('✅ 粉丝数据获取完成');

      // 使用统一的缓存保存函数
      saveToCache(null, topUsers, blueCount);
    } catch (err) {
      console.error('获取粉丝列表失败:', err);
    } finally {
      setIsLoadingData(false);
    }
  }

  // 格式化数字显示
  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  const userStats = {
    handle: user?.displayName || "@KOL_User",
    followers: userBasicInfo ? formatNumber(userBasicInfo.followers_count) : "加载中...",
    verified: blueVerifiedCount > 0 ? formatNumber(blueVerifiedCount) : "加载中...",
    exposure: "1.2M",   // 暂无 API 数据
    engagement: "4.8%"   // 暂无 API 数据
  };

  // 使用真实粉丝数据或占位数据
  const matrixKols = topFollowers.length > 0
    ? topFollowers.map(follower => ({
      name: follower.name,
      handle: `@${follower.screen_name}`,
      followers: `${formatNumber(follower.followers_count)} Followers`,
      description: follower.description,
      avatar: follower.profile_image_url_https,
      isBlue: follower.is_blue_verified,
      isVerified: follower.verified
    }))
    : [
      { name: "DeFi Wizard", handle: "@defi_wiz", followers: "45k Followers", description: "DeFi Research", avatar: "", isBlue: false, isVerified: false },
      { name: "NFT Hunter", handle: "@nft_hunt", followers: "82k Followers", description: "NFT Alpha", avatar: "", isBlue: true, isVerified: false },
      { name: "Chain Detective", handle: "@chain_det", followers: "120k Followers", description: "Security OnChain", avatar: "", isBlue: false, isVerified: true },
      { name: "Airdrop King", handle: "@airdrop_k", followers: "210k Followers", description: "Airdrop Guide", avatar: "", isBlue: true, isVerified: false },
    ];

  if (user) {
    return (
      <div className="animate-in fade-in duration-500 space-y-8">
        <div className="flex justify-between items-center">
          <TerminalHeader title={t.title} subtitle={t.subtitle} color="purple" />
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshData}
              disabled={isLoadingData}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg hover:text-white hover:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="刷新数据"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isLoadingData ? 'animate-spin' : ''}>
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
              <span className="text-sm font-medium">{isLoadingData ? '刷新中...' : '刷新数据'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg hover:text-white hover:border-slate-700 transition-colors"
            >
              <LogOut size={16} />
              <span className="text-sm font-medium">退出登录</span>
            </button>
          </div>
        </div>

        {/* My Data Overview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400">
            <BarChartIcon /> <span className="text-sm font-medium">我的数据概览</span>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
            <div className="flex flex-col md:flex-row items-center gap-12">
              {/* Profile */}
              <div className="flex flex-col items-center gap-4 shrink-0">
                <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-700 relative overflow-hidden shadow-xl">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : user.photoURL ? (
                    <img src={user.photoURL.replace('_normal', '')} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-slate-400">{user.displayName?.[0] || 'K'}</span>
                  )}
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="font-bold text-lg text-white">{user.displayName}</span>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400 font-mono">@{username || 'user'}</span>
                      <CheckCircle2 size={14} className="text-blue-400 fill-blue-400/10" />
                    </div>
                    {twitterId && (
                      <span className="text-[10px] text-slate-600 font-mono uppercase tracking-tighter">ID: {twitterId}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <StatCard icon={<Users size={20} />} value={userStats.followers} label="总粉丝数" />
                <StatCard icon={<CheckCircle2 size={20} />} value={userStats.verified} label="蓝 V 关注" />
                <StatCard icon={<Eye size={20} />} value={userStats.exposure} label="24H 曝光量" />
                <StatCard icon={<Activity size={20} />} value={userStats.engagement} label="互动率" />
              </div>
            </div>
          </div>
        </div>

        {/* Matrix Mutual/Push */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400">
            <UserPlus size={18} /> <span className="text-sm font-medium">最具影响力粉丝</span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 显示前8个最具影响力的粉丝 */}
            {isLoadingData && topFollowers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-400">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm">正在加载粉丝数据...</p>
              </div>
            ) : (
              matrixKols.slice(0, 8).map((kol, i) => (
                <a
                  key={i}
                  href={`https://x.com/${kol.handle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 hover:border-slate-700 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      {kol.avatar ? (
                        <img
                          src={kol.avatar}
                          alt={kol.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br from-purple-600 to-blue-600">
                          {kol.name[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="font-bold text-white text-sm truncate">{kol.name}</h4>
                          {kol.isBlue && (
                            <CheckCircle2 size={14} className="text-blue-400 fill-blue-400/10 shrink-0" />
                          )}
                          {kol.isVerified && (
                            <CheckCircle2 size={14} className="text-yellow-400 fill-yellow-400/10 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{kol.handle}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Users size={12} /> {kol.followers}
                  </div>

                  {kol.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-auto">
                      {kol.description}
                    </p>
                  )}
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <TerminalHeader title={t.title} subtitle={t.subtitle} color="purple" />

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Left Column: Privileges */}
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

        {/* Right Column: Login Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-12 relative overflow-hidden">
          {/* Background Glow Effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
            <div className="w-20 h-20 mb-6 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700/50 shadow-xl shadow-black/50">
              <Twitter size={32} className="text-blue-400 fill-blue-400/10" />
              <div className="absolute -inset-1 border border-dashed border-slate-700/50 rounded-full animate-spin-slow"></div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-3">加入 H-Club</h3>
            <p className="text-slate-400 text-sm mb-8">
              最低要求: 10k+ 粉丝或拥有 500+ 活跃成员的社区。
            </p>

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className={`group relative w-full flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-900/20 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <Twitter size={20} className="fill-white" />
              <span>{isLoading ? '正在连接...' : '授权 Twitter (X) 登录'}</span>
            </button>

            {error && (
              <p className="mt-4 text-xs text-red-500 bg-red-500/10 border border-red-500/20 py-2 px-4 rounded-lg animate-in slide-in-from-top-2">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
