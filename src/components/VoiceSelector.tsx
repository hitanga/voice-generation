import React, { useState, useRef, useEffect } from "react";
import { User, Sparkles, Volume2, Check, Play, Pause, Loader2, Globe } from "lucide-react";

export interface VoiceOption {
  name: string;
  gender: "female" | "male";
  character: string;
  description: string;
  timbre: string;
  bestFor: string[];
  sampleText?: string;
  sampleMode?: string;
  origin?: "global" | "indian";
  baseVoiceName?: string;
}

interface VoiceSelectorProps {
  voices: VoiceOption[];
  selectedVoice: string;
  onSelectVoice: (voiceName: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
}) => {
  const [filterTab, setFilterTab] = useState<"all" | "female" | "male" | "indian">("all");
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null);

  // Cache decoded audio elements for instant playback
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Stop playback when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  const handlePlaySample = async (voice: VoiceOption, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger card selection if clicking sample button

    // If currently playing this voice, stop it
    if (playingVoice === voice.name) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingVoice(null);
      return;
    }

    // Stop previous audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      setPlayingVoice(null);
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    // Check if we already have this audio cached in memory
    const cachedAudio = audioCacheRef.current.get(voice.name);
    if (cachedAudio) {
      currentAudioRef.current = cachedAudio;
      cachedAudio.currentTime = 0;
      cachedAudio.play().catch(() => {});
      setPlayingVoice(voice.name);
      return;
    }

    // Otherwise, fetch sample audio from server
    setLoadingVoice(voice.name);
    try {
      const res = await fetch(`/api/tts/sample/${encodeURIComponent(voice.name)}`);
      const data = await res.json();

      if (!res.ok || !data.audioBase64) {
        throw new Error(data.error || "Failed to load voice sample");
      }

      const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
      audio.onended = () => {
        setPlayingVoice(null);
      };
      audio.onerror = () => {
        setPlayingVoice(null);
      };

      audioCacheRef.current.set(voice.name, audio);
      currentAudioRef.current = audio;
      await audio.play();
      setPlayingVoice(voice.name);
    } catch (err) {
      console.warn("Server voice sample failed, falling back to browser voice preview", err);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          const samplePhrase = voice.sampleText || "Once upon a time, beneath the starlit sky, an ancient story began.";
          const utter = new SpeechSynthesisUtterance(samplePhrase);
          utter.rate = 0.95;
          if (voice.gender === "male") utter.pitch = 0.88;
          else utter.pitch = 1.1;

          // Try to match appropriate voice if Indian/Hindi
          const availVoices = window.speechSynthesis.getVoices();
          if (voice.origin === "indian") {
            const match = availVoices.find((v) => v.lang.includes("hi") || v.lang.includes("IN"));
            if (match) utter.voice = match;
          } else {
            const match = availVoices.find((v) =>
              voice.gender === "female"
                ? v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("samantha") || v.name.toLowerCase().includes("zira")
                : v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("george")
            );
            if (match) utter.voice = match;
          }

          utter.onend = () => setPlayingVoice(null);
          utter.onerror = () => setPlayingVoice(null);
          setPlayingVoice(voice.name);
          window.speechSynthesis.speak(utter);
        } catch (_) {
          setPlayingVoice(null);
        }
      }
    } finally {
      setLoadingVoice(null);
    }
  };

  const filteredVoices = voices.filter((v) => {
    if (filterTab === "all") return true;
    if (filterTab === "indian") return v.origin === "indian";
    return v.gender === filterTab;
  });

  const indianVoicesCount = voices.filter((v) => v.origin === "indian").length;
  const femaleVoicesCount = voices.filter((v) => v.gender === "female").length;
  const maleVoicesCount = voices.filter((v) => v.gender === "male").length;

  return (
    <div className="space-y-4">
      {/* Header and Voice filter tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-heading font-semibold text-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            Human Storyteller Voices
          </h3>
          <p className="text-xs text-slate-400">
            Listen to sample voices in English & Hindi (हिंदी) with authentic breathing, accents, and emotional warmth.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-lg self-start sm:self-auto text-xs flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 rounded-md font-heading font-medium transition-colors cursor-pointer ${
              filterTab === "all"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({voices.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("female")}
            className={`px-3 py-1.5 rounded-md font-heading font-medium transition-colors flex items-center gap-1 cursor-pointer ${
              filterTab === "female"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Female</span>
            <span className="text-[10px] opacity-80 font-mono">
              ({femaleVoicesCount})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("male")}
            className={`px-3 py-1.5 rounded-md font-heading font-medium transition-colors flex items-center gap-1 cursor-pointer ${
              filterTab === "male"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Male</span>
            <span className="text-[10px] opacity-80 font-mono">
              ({maleVoicesCount})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("indian")}
            className={`px-3 py-1.5 rounded-md font-heading font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              filterTab === "indian"
                ? "bg-emerald-500 text-slate-950 shadow-sm font-semibold"
                : "text-emerald-400 hover:text-emerald-300"
            }`}
          >
            <span>🇮🇳 Hindi & Indian</span>
            <span className="text-[10px] opacity-90 font-mono font-bold">
              ({indianVoicesCount})
            </span>
          </button>
        </div>
      </div>

      {/* Voice cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredVoices.map((voice) => {
          const isSelected = selectedVoice === voice.name;
          const isFemale = voice.gender === "female";
          const isIndian = voice.origin === "indian";
          const isPlayingThis = playingVoice === voice.name;
          const isLoadingThis = loadingVoice === voice.name;

          return (
            <div
              key={voice.name}
              onClick={() => onSelectVoice(voice.name)}
              className={`group relative p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? "bg-gradient-to-b from-amber-500/15 to-slate-900/90 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/60"
                  : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-900/90 hover:border-slate-700"
              }`}
            >
              <div>
                {/* Header inside card */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-inner font-heading ${
                        isIndian
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : isFemale
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      }`}
                    >
                      {voice.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-heading font-semibold text-slate-100 text-sm">
                          {voice.name}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider font-mono ${
                            isFemale
                              ? "bg-rose-500/15 text-rose-300 border border-rose-500/20"
                              : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20"
                          }`}
                        >
                          {voice.gender}
                        </span>
                        {isIndian && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            🇮🇳 Hindi
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-amber-300 font-medium block">
                        {voice.timbre}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                  {voice.description}
                </p>

                {/* Sample Voice Quote Box */}
                {voice.sampleText && (
                  <div className="mb-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 italic relative font-sans leading-relaxed">
                    <span className="text-amber-400 mr-1 font-serif text-sm">“</span>
                    {voice.sampleText}
                    <span className="text-amber-400 ml-1 font-serif text-sm">”</span>
                  </div>
                )}
              </div>

              {/* Bottom Row: Sample Voice Audition Button + Tags */}
              <div className="space-y-2.5 pt-1">
                {/* Sample Voice Audition Button */}
                <button
                  type="button"
                  onClick={(e) => handlePlaySample(voice, e)}
                  disabled={isLoadingThis}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-heading font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    isPlayingThis
                      ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 font-bold"
                      : "bg-slate-950/90 text-amber-300 hover:text-amber-200 border-amber-500/30 hover:border-amber-500/60 hover:bg-slate-900"
                  }`}
                  title={`Audition sample voice for ${voice.name}`}
                >
                  {isLoadingThis ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Synthesizing Sample...</span>
                    </>
                  ) : isPlayingThis ? (
                    <>
                      {/* Animated audio equalizer bars */}
                      <div className="flex items-center gap-0.5 h-3.5">
                        <span className="w-1 bg-slate-950 rounded-full animate-[bounce_0.6s_ease-in-out_infinite] h-3" />
                        <span className="w-1 bg-slate-950 rounded-full animate-[bounce_0.6s_ease-in-out_0.2s_infinite] h-2.5" />
                        <span className="w-1 bg-slate-950 rounded-full animate-[bounce_0.6s_ease-in-out_0.4s_infinite] h-3.5" />
                      </div>
                      <Pause className="w-3 h-3 fill-slate-950 ml-1" />
                      <span>Stop Sample</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Sample Voice</span>
                      <Play className="w-2.5 h-2.5 fill-amber-400 ml-auto" />
                    </>
                  )}
                </button>

                {/* Best for tags */}
                <div className="flex flex-wrap gap-1">
                  {voice.bestFor.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
