import React, { useState, useEffect } from "react";
import {
  X,
  HardDrive,
  Cloud,
  Play,
  Trash2,
  Download,
  Calendar,
  Clock,
  Music,
  Share2,
  HardDriveDownload,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { OfflineStory, getOfflineStories, deleteOfflineStory, getOfflineStorageUsage } from "../lib/offlineStorage";
import { formatDuration, formatBytes, downloadAudioFile } from "../lib/audioUtils";

interface CloudStorySummary {
  id: string;
  title: string;
  voiceName: string;
  voiceGender: "male" | "female";
  modeId: string;
  pitchSemi: number;
  speed: number;
  durationSeconds: number;
  createdAt: string;
  tags: string[];
  textSnippet: string;
  hasAudio: boolean;
}

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadStory: (story: {
    title: string;
    text: string;
    voiceName: string;
    modeId: string;
    pitchSemi: number;
    speed: number;
    audioBlob?: Blob;
    audioBase64?: string;
  }) => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  onLoadStory,
}) => {
  const [activeTab, setActiveTab] = useState<"offline" | "cloud">("offline");
  const [offlineStories, setOfflineStories] = useState<OfflineStory[]>([]);
  const [cloudStories, setCloudStories] = useState<CloudStorySummary[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [storageStats, setStorageStats] = useState<{ totalBytes: number; count: number }>({
    totalBytes: 0,
    count: 0,
  });

  const loadOfflineData = async () => {
    try {
      const stories = await getOfflineStories();
      setOfflineStories(stories);
      const stats = await getOfflineStorageUsage();
      setStorageStats(stats);
    } catch (err) {
      console.error("Failed to load offline stories", err);
    }
  };

  const loadCloudData = async () => {
    setIsLoadingCloud(true);
    try {
      const res = await fetch("/api/cloud-stories");
      if (res.ok) {
        const data = await res.json();
        setCloudStories(data.stories || []);
      }
    } catch (err) {
      console.error("Failed to fetch cloud stories", err);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOfflineData();
      loadCloudData();
    }
  }, [isOpen]);

  const handleDeleteOffline = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteOfflineStory(id);
    await loadOfflineData();
  };

  const handleDeleteCloud = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/cloud-stories/${id}`, { method: "DELETE" });
      await loadCloudData();
    } catch (err) {
      console.error("Failed to delete cloud story", err);
    }
  };

  const handleSelectCloudStory = async (id: string) => {
    try {
      const res = await fetch(`/api/cloud-stories/${id}`);
      if (res.ok) {
        const data = await res.json();
        const story = data.story;
        onLoadStory({
          title: story.title,
          text: story.text,
          voiceName: story.voiceName,
          modeId: story.modeId,
          pitchSemi: story.pitchSemi,
          speed: story.speed,
          audioBase64: story.audioWavBase64,
        });
        onClose();
      }
    } catch (err) {
      console.error("Failed to load story from cloud", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-heading">
                Story Vault & Audio Library
              </h2>
              <p className="text-xs text-slate-400">
                Manage offline playback cache and cloud-saved story archives.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection & storage indicator */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("offline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold flex items-center gap-2 border transition-all ${
                activeTab === "offline"
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Offline Storage ({offlineStories.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("cloud")}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold flex items-center gap-2 border transition-all ${
                activeTab === "cloud"
                  ? "bg-sky-500 text-slate-950 border-sky-400 shadow-sm"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Cloud Storage ({cloudStories.length})</span>
            </button>
          </div>

          {activeTab === "offline" && (
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Device Cache: {formatBytes(storageStats.totalBytes)}</span>
            </div>
          )}

          {activeTab === "cloud" && (
            <button
              type="button"
              onClick={loadCloudData}
              disabled={isLoadingCloud}
              className="text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCloud ? "animate-spin" : ""}`} />
              <span>Refresh Cloud</span>
            </button>
          )}
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {/* OFFLINE TAB */}
          {activeTab === "offline" && (
            <>
              {offlineStories.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-xl space-y-2">
                  <HardDrive className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-medium text-slate-300">No stories cached offline yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Generate any story audio and click "Save Offline" on the player to listen anytime without internet access.
                  </p>
                </div>
              ) : (
                offlineStories.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => {
                      onLoadStory({
                        title: story.title,
                        text: story.text,
                        voiceName: story.voiceName,
                        modeId: story.modeId,
                        pitchSemi: story.pitchSemi,
                        speed: story.speed,
                        audioBlob: story.audioBlob,
                      });
                      onClose();
                    }}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-950 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-200 text-sm group-hover:text-amber-300 transition-colors">
                          {story.title}
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Offline Ready
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {story.text}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                        <span>Voice: {story.voiceName}</span>
                        <span>•</span>
                        <span>{formatDuration(story.durationSeconds)}</span>
                        <span>•</span>
                        <span>{formatBytes(story.sizeBytes || story.audioBlob?.size || 0)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadAudioFile(story.audioBlob, `${story.title || "story"}.wav`);
                        }}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-slate-700 transition-colors"
                        title="Download WAV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteOffline(story.id, e)}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/40 transition-colors"
                        title="Delete from offline storage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="p-2 rounded-lg bg-amber-500 text-slate-950 group-hover:scale-105 transition-transform">
                        <Play className="w-4 h-4 fill-slate-950" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* CLOUD TAB */}
          {activeTab === "cloud" && (
            <>
              {isLoadingCloud ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-400 mb-2" />
                  Syncing stories with Cloud Repository...
                </div>
              ) : cloudStories.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-xl space-y-2">
                  <Cloud className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-medium text-slate-300">No stories in cloud vault</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click "Sync Cloud" on any generated story to preserve it across sessions and devices.
                  </p>
                </div>
              ) : (
                cloudStories.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => handleSelectCloudStory(story.id)}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-950 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-200 text-sm group-hover:text-sky-300 transition-colors">
                          {story.title}
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                          Cloud Synced
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{story.textSnippet}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                        <span>Voice: {story.voiceName}</span>
                        <span>•</span>
                        <span>{formatDuration(story.durationSeconds)}</span>
                        <span>•</span>
                        <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCloud(story.id, e)}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/40 transition-colors"
                        title="Delete from cloud"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="p-2 rounded-lg bg-sky-500 text-slate-950 group-hover:scale-105 transition-transform">
                        <Play className="w-4 h-4 fill-slate-950" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
