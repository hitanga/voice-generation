import React from "react";
import { Sparkles, Moon, Swords, Eye, Flame, BookOpen, Sliders } from "lucide-react";

export interface VoiceMode {
  id: string;
  name: string;
  stylePrompt: string;
  description: string;
  icon?: string;
}

interface VoiceModeSelectorProps {
  modes: VoiceMode[];
  selectedModeId: string;
  onSelectMode: (modeId: string) => void;
  customStyle: string;
  onChangeCustomStyle: (custom: string) => void;
}

export const VoiceModeSelector: React.FC<VoiceModeSelectorProps> = ({
  modes,
  selectedModeId,
  onSelectMode,
  customStyle,
  onChangeCustomStyle,
}) => {
  const getIcon = (id: string) => {
    switch (id) {
      case "epic_dramatic":
        return <Swords className="w-4 h-4 text-orange-400" />;
      case "bedtime_warm":
        return <Moon className="w-4 h-4 text-indigo-400" />;
      case "whisper_mystery":
        return <Eye className="w-4 h-4 text-purple-400" />;
      case "whimsical_fantasy":
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case "noir_detective":
        return <Flame className="w-4 h-4 text-rose-400" />;
      case "classic_novel":
      default:
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-heading font-semibold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Story Voice Modes & Moods
          </h3>
          <p className="text-xs text-slate-400">
            Adapts phrasing, dramatic pauses, vocal inflection, and emotional cadence.
          </p>
        </div>
      </div>

      {/* Grid of modes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {modes.map((mode) => {
          const isSelected = selectedModeId === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 h-24 cursor-pointer ${
                isSelected
                  ? "bg-amber-500/15 border-amber-500 text-slate-100 shadow-md ring-1 ring-amber-500/40"
                  : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  {getIcon(mode.id)}
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </div>
              <div>
                <span className="font-heading font-semibold text-xs text-slate-100 block leading-tight">
                  {mode.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom narrator nuance input */}
      <div className="pt-1">
        <label className="text-xs font-heading font-medium text-slate-400 flex items-center gap-1.5 mb-1.5">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Custom Persona Direction (Optional Nuance Prompt)</span>
        </label>
        <input
          type="text"
          value={customStyle}
          onChange={(e) => onChangeCustomStyle(e.target.value)}
          placeholder="e.g. Add a gentle British accent, subtle conspiratorial chuckle, and hushed pauses before secrets..."
          className="w-full px-3.5 py-2 text-xs bg-slate-900/90 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-colors"
        />
      </div>
    </div>
  );
};
