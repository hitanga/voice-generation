import React, { useRef } from "react";
import { BookOpen, Sparkles, Upload, FileText, Layers, Clock, AlertCircle } from "lucide-react";
import { SAMPLE_STORIES, SampleStory } from "../lib/sampleStories";

interface StoryEditorProps {
  title: string;
  onChangeTitle: (title: string) => void;
  text: string;
  onChangeText: (text: string) => void;
  onSelectSample: (sample: SampleStory) => void;
  onSynthesize: () => void;
  isSynthesizing: boolean;
  synthesizeProgressText?: string;
  errorMessage?: string | null;
}

export const StoryEditor: React.FC<StoryEditorProps> = ({
  title,
  onChangeTitle,
  text,
  onChangeText,
  onSelectSample,
  onSynthesize,
  isSynthesizing,
  synthesizeProgressText,
  errorMessage,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  // Estimate ~140 words/min
  const estimatedMinutes = Math.ceil(wordCount / 140);
  const estimatedChunks = Math.max(1, Math.ceil(wordCount / 1200));

  const formatErrorMessage = (msg: string | null | undefined): string => {
    if (!msg) return "";
    try {
      if (msg.trim().startsWith("{")) {
        const parsed = JSON.parse(msg);
        if (parsed.error?.message) {
          if (parsed.error.code === 429 || parsed.error.status === "RESOURCE_EXHAUSTED") {
            return "Gemini Free Tier Quota Limit Reached: The daily limit for speech generation on the free tier has been reached. Please wait for the daily quota reset or attach an API key in AI Studio Secrets.";
          }
          return parsed.error.message;
        }
      }
    } catch (_) {}
    return msg;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onChangeText(content);
        if (!title || title === "Untitled Story") {
          const autoTitle = file.name.replace(/\.[^/.]+$/, "");
          onChangeTitle(autoTitle);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Top Bar: Title & Sample Picker */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Story Title (e.g. The Whispering Glade)"
            className="w-full text-lg font-heading font-semibold bg-transparent border-b border-slate-800 hover:border-slate-700 focus:border-amber-500 text-slate-100 placeholder-slate-500 focus:outline-none pb-1 transition-colors"
          />
        </div>

        {/* Action buttons: Samples & Upload */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative inline-block">
            <select
              onChange={(e) => {
                const sample = SAMPLE_STORIES.find((s) => s.id === e.target.value);
                if (sample) onSelectSample(sample);
                e.target.value = "";
              }}
              defaultValue=""
              className="text-xs bg-slate-950/80 text-amber-300 border border-amber-500/30 rounded-lg px-3 py-1.5 focus:outline-none hover:bg-slate-900 transition-colors cursor-pointer font-heading font-medium"
            >
              <option value="" disabled>
                ✨ Load Preset Story...
              </option>
              {SAMPLE_STORIES.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100">
                  {s.title} ({s.genre})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs bg-slate-950/80 text-slate-300 hover:text-slate-100 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 transition-colors font-heading font-medium"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import .txt</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Paste or write your story here. The Unlimited Text Engine will automatically partition paragraphs, preserve narrative flow, and stitch flawless human speech..."
          rows={8}
          className="w-full p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/40 text-sm leading-relaxed resize-y font-sans transition-colors"
        />

        {/* Floating status badge for Unlimited Text Engine */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 px-1 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              {wordCount.toLocaleString()} words ({charCount.toLocaleString()} chars)
            </span>
            <span className="flex items-center gap-1 font-mono text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              ~{estimatedMinutes} min listening
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-300/90 font-mono text-[11px] bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            <Layers className="w-3 h-3 text-amber-400" />
            <span>
              Unlimited Engine: {estimatedChunks} {estimatedChunks === 1 ? "Segment" : "Seamless Segments"}
            </span>
          </div>
        </div>
      </div>

      {/* Error Message if any */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-heading font-semibold text-rose-200">Speech Synthesis Alert</div>
            <div className="leading-relaxed">{formatErrorMessage(errorMessage)}</div>
          </div>
        </div>
      )}

      {/* Synthesize CTA Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onSynthesize}
          disabled={isSynthesizing || !text.trim()}
          className={`w-full py-3.5 px-6 rounded-xl font-heading font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all duration-200 ${
            isSynthesizing
              ? "bg-amber-500/70 text-slate-950 cursor-wait animate-pulse"
              : !text.trim()
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
              : "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 hover:brightness-105 hover:shadow-amber-500/20 active:scale-[0.99]"
          }`}
        >
          {isSynthesizing ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
              <span>{synthesizeProgressText || "Synthesizing Lifelike Human Voice..."}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Convert Story to Speech (Unlimited)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
