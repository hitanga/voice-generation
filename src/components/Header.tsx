import React, { useState, useEffect } from "react";
import { Sparkles, HardDrive, Wifi, WifiOff, BookOpen, Volume2 } from "lucide-react";
import { getOfflineStorageUsage } from "../lib/offlineStorage";

interface HeaderProps {
  onOpenLibrary: () => void;
  savedOfflineCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLibrary, savedOfflineCount }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950">
            <Volume2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold tracking-tight text-slate-100">
                FableVoice
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Gemini 3.8 Flash TTS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden xs:block">
              Human Voice Storytelling & Audio Studio
            </p>
          </div>
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Network status badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
              isOnline
                ? "bg-slate-900 border-slate-800 text-slate-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>Online & Cloud Ready</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>Offline Mode (IDB Active)</span>
              </>
            )}
          </div>

          {/* Library button */}
          <button
            type="button"
            onClick={onOpenLibrary}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm font-heading"
          >
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            <span>Story Vault</span>
            {savedOfflineCount > 0 && (
              <span className="bg-amber-500 text-slate-950 font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {savedOfflineCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
