import React, { useState } from 'react';
import { Dashboard } from './dashboard/Dashboard';
import { Language } from './i18n';

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(true); // Default to true for development
    const [lang, setLang] = useState<Language>('zh');

    // 断开连接，返回官网
    const handleLogout = () => {
        window.location.href = 'https://hlabs.me/';
    };

    return (
        <div className="relative min-h-screen bg-[#050b1d]">
            {/* Top-left Global Logo */}
            <div className="fixed top-6 left-6 z-[60] flex items-center gap-3 pointer-events-none">
                <img
                    src="/Hlabs-logo.jpg"
                    alt="H Labs Logo"
                    className="w-8 h-8 rounded-sm shadow-[0_0_15px_rgba(79,70,229,0.4)] object-cover"
                />
                <span className="text-white font-bold text-lg tracking-tight hidden md:block">
                    H Labs <span className="text-indigo-500 text-xs align-top">OS</span>
                </span>
            </div>

            {isLoggedIn ? (
                <Dashboard onLogout={handleLogout} lang={lang} />
            ) : (
                <div className="flex flex-col items-center justify-center min-h-screen text-white bg-[#050b1d]">
                    <div className="text-center space-y-8 animate-in">
                        <div className="flex justify-center">
                            <img
                                src="/Hlabs-logo.jpg"
                                alt="H Labs Logo"
                                className="w-24 h-24 rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.3)] border border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-5xl font-bold tracking-tighter">H LABS TERMINAL</h1>
                            <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">Secure Access Node</p>
                        </div>
                        <button
                            onClick={() => setIsLoggedIn(true)}
                            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] transform hover:-translate-y-1"
                        >
                            LOGIN TO TERMINAL
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
