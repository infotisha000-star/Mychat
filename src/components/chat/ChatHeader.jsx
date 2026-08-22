import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { AppLogo } from '../common/AppLogo';
import { Users, LogOut, ShieldCheck, Key, Search, X, Sun, Moon, Palette, Check } from 'lucide-react';

export const ChatHeader = ({ onOpenAdminDashboard }) => {
  const { user, logout, isAdmin } = useAuth();
  const { activeUsers, searchQuery, setSearchQuery } = useChat();
  const { isDark, toggleTheme, bgTheme, setBgTheme, CHAT_BG_THEMES, activeBgThemeObj } = useTheme();
  const [showSearch, setShowSearch] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  return (
    <header className="app-header sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-2.5 sm:px-4 py-2 flex items-center justify-between shadow-lg shrink-0 transition-colors duration-300 w-full overflow-hidden">
      {/* Search Mode (Full Width Replacement) */}
      {showSearch ? (
        <div className="flex-1 flex items-center gap-2 animate-fadeIn w-full">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages by text or sender..."
              className="msg-input w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-slate-400 hover:text-slate-100 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setShowSearch(false);
            }}
            className="px-2.5 py-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 shrink-0"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          {/* Left: Brand Logo & Online Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
            <AppLogo size="sm" />
            
            {/* Active Users Indicator */}
            <div className="online-badge flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-950/60 dark:bg-emerald-950/60 light:bg-emerald-100 border border-emerald-500/40 text-emerald-400 dark:text-emerald-400 light:text-emerald-700 text-[11px] sm:text-xs font-semibold whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{activeUsers.length || 1} <span className="hidden xs:inline">Online</span></span>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 relative">
            {/* Messenger Background Theme Picker Button */}
            <div className="relative">
              <button
                onClick={() => setShowThemePicker((prev) => !prev)}
                className="app-header-btn p-1.5 sm:p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 transition-transform active:scale-95 flex items-center justify-center shrink-0"
                style={{ color: activeBgThemeObj?.primaryColor || '#6366f1' }}
                title="Messenger Background Themes"
              >
                <Palette className="w-4 h-4 shrink-0" />
              </button>

              {/* Theme Picker Dropdown */}
              {showThemePicker && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowThemePicker(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2.5 flex flex-col gap-2 text-xs text-slate-100 animate-fadeIn">
                    <div className="px-2 py-1 border-b border-slate-800 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                      <span>Chat Background Theme</span>
                      <button
                        onClick={() => setShowThemePicker(false)}
                        className="text-slate-400 hover:text-white p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {CHAT_BG_THEMES.map((themeItem) => {
                        const isSelected = bgTheme === themeItem.id;
                        return (
                          <button
                            key={themeItem.id}
                            onClick={() => {
                              setBgTheme(themeItem.id);
                              setShowThemePicker(false);
                            }}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-xl border transition-all text-left ${
                              isSelected
                                ? 'bg-slate-800 border-indigo-500/60 font-semibold'
                                : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-4 h-4 rounded-full bg-gradient-to-r ${themeItem.gradient} shrink-0 shadow-sm`}
                              />
                              <span className="text-slate-200 text-xs">{themeItem.name}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Theme Toggle (Dark/Light) */}
            <button
              onClick={toggleTheme}
              className="app-header-btn p-1.5 sm:p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 transition-transform active:scale-95 flex items-center justify-center shrink-0"
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 text-indigo-600 shrink-0" />}
            </button>

            {/* Search Toggle */}
            <button
              onClick={() => setShowSearch(true)}
              className="app-header-btn p-1.5 sm:p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 transition-colors flex items-center justify-center shrink-0"
              title="Search Messages"
            >
              <Search className="w-4 h-4 shrink-0" />
            </button>

            {/* Admin Dashboard / Code Indicator */}
            {isAdmin ? (
              <button
                onClick={onOpenAdminDashboard}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-1"
                title="Admin Control Center"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-200 shrink-0" />
                <span className="hidden md:inline whitespace-nowrap">Admin</span>
              </button>
            ) : (
              <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-[11px] font-semibold shrink-0">
                <Key className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="font-mono text-cyan-300 whitespace-nowrap">{user?.code}</span>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={logout}
              className="app-header-btn p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-medium transition-colors shrink-0 flex items-center gap-1"
              title="Log Out"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline whitespace-nowrap">Logout</span>
            </button>
          </div>
        </>
      )}
    </header>
  );
};
