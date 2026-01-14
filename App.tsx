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

    if (!isLoggedIn) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#050b1d] text-white">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold">H LABS TERMINAL</h1>
                    <button
                        onClick={() => setIsLoggedIn(true)}
                        className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-full font-bold transition-all"
                    >
                        LOGIN TO TERMINAL
                    </button>
                </div>
            </div>
        );
    }

    return (
        <Dashboard onLogout={handleLogout} lang={lang} />
    );
};

export default App;
