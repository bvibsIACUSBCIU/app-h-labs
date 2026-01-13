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

  const userStats = {
    handle: user?.displayName || "@KOL_User",
    followers: "128.5K", // Placeholder
    verified: "2,450",   // Placeholder
    exposure: "1.2M",   // Placeholder
    engagement: "4.8%"   // Placeholder
  };

  const matrixKols = [
    { name: "DeFi Wizard", handle: "@defi_wiz", followers: "45k Followers", tags: ["DeFi", "Research"], status: "Follow", bgColor: "bg-indigo-600" },
    { name: "NFT Hunter", handle: "@nft_hunt", followers: "82k Followers", tags: ["NFT", "Alpha"], status: "Mutual", bgColor: "bg-purple-600" },
    { name: "Chain Detective", handle: "@chain_det", followers: "120k Followers", tags: ["Security", "OnChain"], status: "Follow", bgColor: "bg-blue-600" },
    { name: "Airdrop King", handle: "@airdrop_k", followers: "210k Followers", tags: ["Airdrop", "Guide"], status: "Mutual", bgColor: "bg-pink-600" },
  ];

  if (user) {
    return (
      <div className="animate-in fade-in duration-500 space-y-8">
        <div className="flex justify-between items-center">
          <TerminalHeader title={t.title} subtitle={t.subtitle} color="purple" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg hover:text-white hover:border-slate-700 transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">退出登录</span>
          </button>
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
                  <CheckCircle2 size={24} className="absolute bottom-0 right-0 text-blue-500 bg-slate-900 rounded-full" />
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
            <UserPlus size={18} /> <span className="text-sm font-medium">矩阵互关/互推</span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {matrixKols.map((kol, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${kol.bgColor}`}>
                      {kol.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{kol.name}</h4>
                      <p className="text-xs text-slate-500">{kol.handle}</p>
                    </div>
                  </div>
                  {kol.status === 'Mutual' ? (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-900/30 text-green-400 border border-green-900/50 flex items-center gap-1">
                      <Check size={10} /> Mutual
                    </span>
                  ) : (
                    <button className="px-3 py-1 rounded text-xs font-medium bg-purple-600 text-white hover:bg-purple-500 transition-colors">
                      Follow
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Users size={12} /> {kol.followers}
                </div>

                <div className="flex gap-2 mt-auto">
                  {kol.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-[10px] border border-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
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
