import React, { useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Download,
  HardDriveDownload,
  CloudUpload,
  Check,
  ChevronDown,
  Volume2,
  FileAudio,
  Bookmark,
  Sparkles,
  Loader2,
} from "lucide-react";
import { AudioVisualizer } from "./AudioVisualizer";
import { formatDuration } from "../lib/audioUtils";

interface StoryPlayerProps {
  storyTitle: string;
  storyText: string;
  voiceName: string;
  modeName: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  analyser: AnalyserNode | null;
  engineType?: "gemini" | "browser";
  onPlay: () => void;
  onPause: () => void;
  onSeek: (seconds: number) => void;
  onSkip: (offset: number) => void;
  onDownloadWav: () => void;
  onDownloadMp3: (bitrate: 128 | 160) => void;
  isEncodingMp3: boolean;
  onSaveOffline: () => void;
  isSavedOffline: boolean;
  onSaveCloud: () => void;
  isSavedCloud: boolean;
  isSavingCloud: boolean;
}

export const StoryPlayer: React.FC<StoryPlayerProps> = ({
  storyTitle,
  storyText,
  voiceName,
  modeName,
  isPlaying,
  currentTime,
  duration,
  analyser,
  engineType = "gemini",
  onPlay,
  onPause,
  onSeek,
  onSkip,
  onDownloadWav,
  onDownloadMp3,
  isEncodingMp3,
  onSaveOffline,
  isSavedOffline,
  onSaveCloud,
  isSavedCloud,
  isSavingCloud,
}) => {
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Split story into paragraphs for read-along display
  const paragraphs = storyText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Estimate which paragraph is currently playing
  const currentParaIndex =
    paragraphs.length > 0 && duration > 0
      ? Math.min(
          paragraphs.length - 1,
          Math.floor((currentTime / duration) * paragraphs.length)
        )
      : 0;

  const handleTriggerWavDownload = () => {
    setDownloadStatus("wav");
    onDownloadWav();
    setTimeout(() => {
      setDownloadStatus(null);
    }, 2500);
  };

  const handleTriggerMp3Download = (bitrate: 128 | 160) => {
    setDownloadStatus("mp3");
    onDownloadMp3(bitrate);
    setTimeout(() => {
      setDownloadStatus(null);
    }, 3000);
  };

  return (
    <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-2xl shadow-amber-500/5 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-heading font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Voice: {voiceName}
            </span>
            <span className="text-[10px] font-heading font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Mood: {modeName}
            </span>
            <span
              className={`text-[10px] font-heading font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                engineType === "browser"
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              }`}
            >
              {engineType === "browser" ? "⚡ Live Speech Narrator" : "✨ Gemini 24kHz Studio"}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 font-heading">
            {storyTitle || "Master Story Narration"}
          </h2>
        </div>

        {/* Action Buttons: Save Offline, Sync Cloud, Download */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Offline Save Button */}
          <button
            type="button"
            onClick={onSaveOffline}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-medium flex items-center gap-1.5 border transition-all ${
              isSavedOffline
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700"
            }`}
            title="Cache in browser IndexedDB for offline listening"
          >
            {isSavedOffline ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Offline Cached</span>
              </>
            ) : (
              <>
                <HardDriveDownload className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Offline</span>
              </>
            )}
          </button>

          {/* Cloud Save Button */}
          <button
            type="button"
            onClick={onSaveCloud}
            disabled={isSavingCloud}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-medium flex items-center gap-1.5 border transition-all ${
              isSavedCloud
                ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                : "bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700"
            }`}
            title="Save story & audio to cloud storage vault"
          >
            {isSavedCloud ? (
              <>
                <Check className="w-3.5 h-3.5 text-sky-400" />
                <span>Cloud Synced</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-3.5 h-3.5 text-sky-400" />
                <span>{isSavingCloud ? "Syncing..." : "Sync Cloud"}</span>
              </>
            )}
          </button>

          {/* Download Audio Controls */}
          <div className="relative flex items-center gap-1">
            {/* Primary Direct Download Button (WAV Master) */}
            <button
              type="button"
              onClick={handleTriggerWavDownload}
              className="px-3.5 py-1.5 rounded-lg text-xs font-heading font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
              title="Download Master Lossless WAV audio file directly"
            >
              {downloadStatus === "wav" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                  <span>WAV Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Audio (WAV)</span>
                </>
              )}
            </button>

            {/* Direct MP3 Download Button */}
            <button
              type="button"
              onClick={() => handleTriggerMp3Download(160)}
              disabled={isEncodingMp3}
              className="px-3 py-1.5 rounded-lg text-xs font-heading font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              title="Download High-Quality MP3 file"
            >
              {isEncodingMp3 ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Encoding MP3...</span>
                </>
              ) : downloadStatus === "mp3" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span>MP3 Downloaded!</span>
                </>
              ) : (
                <>
                  <FileAudio className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download MP3</span>
                </>
              )}
            </button>

            {/* More formats dropdown toggle */}
            <button
              type="button"
              onClick={() => setShowFormatDropdown(!showFormatDropdown)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
              title="Select format options"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Format Dropdown Menu */}
            {showFormatDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                <div className="px-2 py-1 text-[10px] font-heading font-semibold uppercase text-slate-400 border-b border-slate-800/80 mb-1">
                  Audio Download Formats
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowFormatDropdown(false);
                    handleTriggerWavDownload();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileAudio className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-heading font-semibold">Lossless WAV (Master)</div>
                      <div className="text-[10px] text-slate-400">24kHz 16-bit Uncompressed</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-bold">
                    WAV
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowFormatDropdown(false);
                    handleTriggerMp3Download(160);
                  }}
                  disabled={isEncodingMp3}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-200 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <FileAudio className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-heading font-semibold">High-Res MP3 (160 kbps)</div>
                      <div className="text-[10px] text-slate-400">Studio quality, universal</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
                    MP3
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowFormatDropdown(false);
                    handleTriggerMp3Download(128);
                  }}
                  disabled={isEncodingMp3}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-200 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <FileAudio className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="font-heading font-semibold">Standard MP3 (128 kbps)</div>
                      <div className="text-[10px] text-slate-400">Smaller file size</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded font-bold">
                    MP3
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visualizer Canvas */}
      <AudioVisualizer analyser={analyser} isPlaying={isPlaying} />

      {/* Timeline Scrub Bar */}
      <div className="space-y-1">
        <div className="relative group cursor-pointer pt-2 pb-1">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              onSeek(ratio * duration);
            }}
            className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative cursor-pointer"
          >
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-75 relative"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Timestamps */}
        <div className="flex justify-between text-xs font-mono text-slate-400">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Playback Controls Deck */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 pt-1">
        {/* Rewind 10s */}
        <button
          type="button"
          onClick={() => onSkip(-10)}
          className="p-2.5 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Rewind 10s"
        >
          <Rewind className="w-5 h-5" />
        </button>

        {/* Main Play / Pause Button */}
        <button
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-slate-950" />
          ) : (
            <Play className="w-6 h-6 fill-slate-950 translate-x-0.5" />
          )}
        </button>

        {/* Forward 10s */}
        <button
          type="button"
          onClick={() => onSkip(10)}
          className="p-2.5 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Forward 10s"
        >
          <FastForward className="w-5 h-5" />
        </button>

        {/* Restart from beginning */}
        <button
          type="button"
          onClick={() => onSeek(0)}
          className="p-2.5 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Restart from beginning"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Read-Along Story Text Section */}
      <div className="border-t border-slate-800/80 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-heading font-semibold text-slate-300 flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            Synchronized Read-Along Script
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Paragraph {currentParaIndex + 1} of {paragraphs.length}
          </span>
        </div>

        <div className="max-h-48 overflow-y-auto rounded-xl bg-slate-950/70 p-3.5 border border-slate-800/70 space-y-2.5 text-xs font-sans leading-relaxed">
          {paragraphs.map((p, idx) => {
            const isActive = idx === currentParaIndex && isPlaying;
            return (
              <p
                key={idx}
                className={`transition-colors duration-200 p-2 rounded-lg ${
                  isActive
                    ? "bg-amber-500/15 text-amber-200 font-medium border-l-2 border-amber-400 pl-3"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                {p}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
};
