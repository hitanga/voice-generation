import React from "react";
import { SlidersHorizontal, Music2, CloudRain, Flame, Trees, Radio, RotateCcw, Volume2, Sparkles } from "lucide-react";
import { AcousticFilterType } from "../lib/audioEngine";

interface AudioTuningStudioProps {
  pitchSemitones: number;
  onChangePitch: (val: number) => void;
  speed: number;
  onChangeSpeed: (val: number) => void;
  acousticFilter: AcousticFilterType;
  onChangeAcousticFilter: (filter: AcousticFilterType) => void;
  ambientType: "none" | "rain" | "fireplace" | "forest" | "space";
  onChangeAmbientType: (type: "none" | "rain" | "fireplace" | "forest" | "space") => void;
  ambientVolume: number;
  onChangeAmbientVolume: (vol: number) => void;
  onResetDefaults: () => void;
}

export const AudioTuningStudio: React.FC<AudioTuningStudioProps> = ({
  pitchSemitones,
  onChangePitch,
  speed,
  onChangeSpeed,
  acousticFilter,
  onChangeAcousticFilter,
  ambientType,
  onChangeAmbientType,
  ambientVolume,
  onChangeAmbientVolume,
  onResetDefaults,
}) => {
  const getPitchLabel = (semi: number) => {
    if (semi === 0) return "Natural Human Pitch (0 st)";
    if (semi < 0) return `Deeper Baritone (${semi} st)`;
    return `Higher Timbre (+${semi} st)`;
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800/70 pb-3">
        <div>
          <h3 className="text-base font-heading font-semibold text-slate-100 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            Immersive Audio & Pitch Controls
          </h3>
          <p className="text-xs text-slate-400">
            Fine-tune human pitch, playback cadence, acoustic chamber, and background atmospheres.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetDefaults}
          className="text-xs font-heading font-medium text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors px-2 py-1 rounded-md hover:bg-slate-800 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Pitch & Speed */}
        <div className="space-y-4">
          {/* Pitch Setting */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-heading font-medium text-slate-200 flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-amber-400" />
                Adjustable Voice Pitch
              </span>
              <span className="text-amber-400 font-mono font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {getPitchLabel(pitchSemitones)}
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={pitchSemitones}
              onChange={(e) => onChangePitch(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-12 st (Grave/Giant)</span>
              <span>-4 st</span>
              <span>0 (Default)</span>
              <span>+4 st</span>
              <span>+12 st (Fairy/Sprite)</span>
            </div>
          </div>

          {/* Speed Setting */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-heading font-medium text-slate-200">Narration Pacing / Speed</span>
              <span className="text-amber-400 font-mono font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {speed.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speed}
              onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.5x Slow</span>
              <span>0.85x Bedtime</span>
              <span>1.0x Normal</span>
              <span>1.25x Audio Novel</span>
              <span>2.0x Fast</span>
            </div>
          </div>
        </div>

        {/* Right Column: Acoustic Filter & Ambient Soundscape */}
        <div className="space-y-4">
          {/* Acoustic Environment */}
          <div>
            <label className="text-xs font-medium text-slate-200 block mb-2">
              Acoustic Room Environment
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(
                [
                  { id: "studio", name: "Studio Clean", desc: "Crisp voice booth" },
                  { id: "cathedral", name: "Cathedral Chamber", desc: "Spacious aura" },
                  { id: "warm_vinyl", name: "Warm Vinyl", desc: "Analog fireside bass" },
                  { id: "vintage_radio", name: "Vintage Radio", desc: "1940s broadcast" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onChangeAcousticFilter(f.id)}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    acousticFilter === f.id
                      ? "bg-amber-500/20 border-amber-500 text-slate-100"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  <div className="font-medium text-[11px] text-slate-200">{f.name}</div>
                  <div className="text-[10px] text-slate-500">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Procedural Ambient Soundscape */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Ambient Soundscape (Offline Mix)
              </label>
              {ambientType !== "none" && (
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-slate-400" />
                  {Math.round(ambientVolume * 100)}%
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2 text-xs">
              {(
                [
                  { id: "none", label: "Off", icon: null },
                  { id: "rain", label: "Gentle Rain", icon: CloudRain },
                  { id: "fireplace", label: "Cozy Fire", icon: Flame },
                  { id: "forest", label: "Night Woods", icon: Trees },
                  { id: "space", label: "Cosmic Drone", icon: Radio },
                ] as const
              ).map((amb) => {
                const Icon = amb.icon;
                const isSelected = ambientType === amb.id;
                return (
                  <button
                    key={amb.id}
                    type="button"
                    onClick={() => onChangeAmbientType(amb.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 border transition-colors ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 border-amber-400 font-semibold"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {Icon && <Icon className="w-3 h-3" />}
                    <span>{amb.label}</span>
                  </button>
                );
              })}
            </div>

            {ambientType !== "none" && (
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={ambientVolume}
                onChange={(e) => onChangeAmbientVolume(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer appearance-none"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
