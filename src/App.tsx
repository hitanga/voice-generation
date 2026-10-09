import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { VoiceSelector, VoiceOption } from "./components/VoiceSelector";
import { VoiceModeSelector, VoiceMode } from "./components/VoiceModeSelector";
import { AudioTuningStudio } from "./components/AudioTuningStudio";
import { StoryEditor } from "./components/StoryEditor";
import { StoryPlayer } from "./components/StoryPlayer";
import { LibraryModal } from "./components/LibraryModal";
import { StoryAudioEngine, AcousticFilterType } from "./lib/audioEngine";
import {
  AmbientSoundGenerator,
  base64ToBlob,
  blobToBase64,
  wavBufferToMp3Blob,
  downloadAudioFile,
} from "./lib/audioUtils";
import {
  OfflineStory,
  saveStoryOffline,
  getOfflineStories,
} from "./lib/offlineStorage";
import { synthesizeStoryAudioLocally, BrowserStoryNarrator } from "./lib/clientSpeechSynthesizer";
import { SAMPLE_STORIES, SampleStory } from "./lib/sampleStories";
import { Sparkles, Layers, ShieldCheck, Download, Mic, Music } from "lucide-react";

const FALLBACK_VOICES: VoiceOption[] = [
  {
    name: "Kore",
    gender: "female",
    character: "Warm, expressive, soothing bedtime & classic narrator",
    description: "Gentle and melodic with deep warmth. Ideal for fairy tales, children's fables, and calming bedtime journeys.",
    timbre: "Soothing & Rich",
    bestFor: ["Bedtime Stories", "Fairy Tales", "Poetic Prose", "Warm Audiobooks"],
    sampleText: "Once upon a quiet twilight, deep beneath the whispering willows, a gentle magic began to stir.",
    sampleMode: "bedtime_warm",
  },
  {
    name: "Aoede",
    gender: "female",
    character: "Lyrical, mystical, and emotionally evocative",
    description: "Elegiac and resonant voice that shines in fantasy sagas, tragic heroines, and mythic poetry.",
    timbre: "Melodic & Ethereal",
    bestFor: ["High Fantasy", "Mythology", "Poetry", "Historical Fiction"],
    sampleText: "From the misty shores of the forgotten realm, the ancient song of starlight echoes through the cosmos.",
    sampleMode: "classic_novel",
  },
  {
    name: "Zephyr",
    gender: "female",
    character: "Crisp, airy, thoughtful, and contemporary",
    description: "Clear and vivid cadence suited for mystery thrillers, modern drama, and fast-paced adventure.",
    timbre: "Crisp & Intimate",
    bestFor: ["Mystery Thrillers", "Sci-Fi", "Modern Fiction", "Adventure"],
    sampleText: "The rain drummed against the windowpane as the clock struck midnight. The mystery had only just begun.",
    sampleMode: "whisper_mystery",
  },
  {
    name: "Puck",
    gender: "female",
    character: "Playful, spirited, animated fairy & youth storyteller",
    description: "Vibrant and mischievous storytelling cadence full of animated flair. Perfect for whimsical fantasy, lively creatures, and folklore.",
    timbre: "Bright & Spirited",
    bestFor: ["Adventure", "Humorous Tales", "Young Adult", "Animated Characters"],
    sampleText: "Ho there, adventurer! Pack your courage and grab your boots, for today we hunt the goblin's hidden treasure!",
    sampleMode: "whimsical_fantasy",
  },
  {
    name: "Fenrir",
    gender: "male",
    character: "Deep, thunderous, epic, and cinematic",
    description: "Deep baritone resonance with gravitas. Built for epic fantasy battles, dark folklore, and grand narratives.",
    timbre: "Deep Baritone & Authoritative",
    bestFor: ["Epic Fantasy", "Dark Lore", "Horror", "Historical Epics"],
    sampleText: "The thunder cracked across the jagged peaks, and the ancient dragon stirred from seven centuries of slumber.",
    sampleMode: "epic_dramatic",
  },
  {
    name: "Charon",
    gender: "male",
    character: "Grave, enigmatic, noir, and contemplative",
    description: "Smoky, hypnotic pacing with suspenseful weight. Exceptional for detective noir, ghost stories, and cosmic horror.",
    timbre: "Grave & Enigmatic",
    bestFor: ["Detective Noir", "Gothic Mystery", "Cosmic Horror", "Slow Suspense"],
    sampleText: "In the shadows of this neon-drenched city, every dark alley whispers a secret waiting to be unearthed.",
    sampleMode: "noir_detective",
  },
  {
    name: "Aarav",
    gender: "male",
    origin: "indian",
    character: "Warm, traditional Indian male storyteller for Hindi and English fables",
    description: "Comforting, earthy, and expressive Indian male voice. Native Hindi & Indian English storytelling cadence with classic Panchatantra and Katha warmth.",
    timbre: "Warm, Earthy & Traditional",
    bestFor: ["Hindi Stories (हिंदी)", "Panchatantra (पंचतंत्र)", "Folk Tales", "Moral Stories"],
    sampleText: "एक समय की बात है, हरे-भरे जंगल में एक समझदार खरगोश रहता था। उसकी बुद्धिमानी की कहानियां पूरे वन में प्रसिद्ध थीं।",
    sampleMode: "bedtime_warm",
    baseVoiceName: "Fenrir",
  },
  {
    name: "Kabir",
    gender: "male",
    origin: "indian",
    character: "Resonant, charismatic Indian male narrator for epics and thrillers",
    description: "Commanding baritone resonance with majestic presence. Ideal for Vikram-Betal sagas, historical Indian chronicles, and gripping Hindi audiobooks.",
    timbre: "Deep Baritone & Cinematic",
    bestFor: ["Mythological Epics", "Vikram Betal", "Historical Sagas", "Thrillers"],
    sampleText: "राजा विक्रमादित्य ने अपनी तलवार संभाली और घनघोर अंधेरी रात में श्मशान की ओर बढ़ चले, जहां बेताल उनका इंतज़ार कर रहा था।",
    sampleMode: "epic_dramatic",
    baseVoiceName: "Charon",
  },
  {
    name: "Ananya",
    gender: "female",
    origin: "indian",
    character: "Sweet, melodic, and nurturing Indian female bedtime & Hindi Katha narrator",
    description: "Velvety, musical, and comforting cadence. Delivers traditional Dadi-Nani style Hindi bedtime stories with authentic warmth and clarity.",
    timbre: "Sweet, Melodic & Soothing",
    bestFor: ["Bedtime Tales", "Panchatantra (पंचतंत्र)", "Dadi-Nani Stories", "Children's Audio"],
    sampleText: "चांदनी रात में, जब पूरा गांव गहरी नींद में सो रहा था, नन्ही तितली ने तारों से एक बहुत प्यारी सी ख्वाहिश मांगी।",
    sampleMode: "bedtime_warm",
    baseVoiceName: "Kore",
  },
  {
    name: "Meera",
    gender: "female",
    origin: "indian",
    character: "Lyrical, graceful, and expressive Indian female voice for literature & poetry",
    description: "Rich, resonant, and emotionally expressive Indian female voice. Perfect for Premchand classics, Ramayana tales, and melodic Hindi poetry.",
    timbre: "Graceful, Poetic & Expressive",
    bestFor: ["Hindi Literature (साहित्य)", "Poetry (कविता)", "Mythology", "Cultural Stories"],
    sampleText: "गंगा की पावन लहरों पर ढलती शाम की सुनहरी किरणें नाच रही थीं, और मंदिरों से शंख की गूंज वातावरण को पावन बना रही थी।",
    sampleMode: "classic_novel",
    baseVoiceName: "Aoede",
  },
];

const FALLBACK_MODES: VoiceMode[] = [
  {
    id: "bedtime_warm",
    name: "Warm Bedtime Fable",
    stylePrompt: "Soft, gentle, warm, and soothing bedtime narrator voice. Calm breathing, tender comforting cadence, peaceful and reassuring rhythm.",
    description: "Velvety, calm rhythm that lulls listeners into wonder and peaceful dreams.",
  },
  {
    id: "epic_dramatic",
    name: "Dramatic & Epic",
    stylePrompt: "Cinematic, dramatic, intense storytelling pacing with deliberate dramatic pauses, theatrical emotional range, and majestic resonance.",
    description: "Thunderous climaxes and cinematic tension for battle scenes and grand chronicles.",
  },
  {
    id: "whisper_mystery",
    name: "Mysterious & Whispering",
    stylePrompt: "Intriguing, mysterious, slightly lowered hushed tones with atmospheric suspense, eerie curiosity, and captivating secretive cadence.",
    description: "Hushed, atmospheric suspense for secrets, haunted hallways, and twilight riddles.",
  },
  {
    id: "whimsical_fantasy",
    name: "Whimsical & Fairy Tale",
    stylePrompt: "Charming, playful, animated, cheerful cadence filled with childlike wonder and fairy tale enchantment.",
    description: "Playful cadence bursting with magic, mischievous creatures, and happy wonders.",
  },
  {
    id: "noir_detective",
    name: "Dark Noir & Contemplative",
    stylePrompt: "Low, gritty, brooding, reflective voice with vintage detective novel cadence, cynical pauses, and world-weary undertones.",
    description: "Rain-slicked streets, smoky jazz tones, and hardboiled introspection.",
  },
  {
    id: "classic_novel",
    name: "Classic Audio Novelist",
    stylePrompt: "Master audiobook narrator, pristine diction, elegant rhythm, neutral yet richly expressive literary cadence.",
    description: "The gold standard of literary narration with refined diction and natural flow.",
  },
];

export default function App() {
  // Story details
  const [title, setTitle] = useState("The Whispering Willow & The Silver Moth");
  const [text, setText] = useState(SAMPLE_STORIES[0].fullText);

  // Voice & Mode selection
  const [voices, setVoices] = useState<VoiceOption[]>(FALLBACK_VOICES);
  const [modes, setModes] = useState<VoiceMode[]>(FALLBACK_MODES);
  const [selectedVoice, setSelectedVoice] = useState<string>("Kore");
  const [selectedModeId, setSelectedModeId] = useState<string>("bedtime_warm");
  const [customStyle, setCustomStyle] = useState<string>("");

  // Audio studio settings
  const [pitchSemitones, setPitchSemitones] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [acousticFilter, setAcousticFilter] = useState<AcousticFilterType>("studio");
  const [ambientType, setAmbientType] = useState<"none" | "rain" | "fireplace" | "forest" | "space">("none");
  const [ambientVolume, setAmbientVolume] = useState<number>(0.25);

  // Playback & Audio Engine State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [downloadUrlWav, setDownloadUrlWav] = useState<string | null>(null);
  const [downloadUrlMp3, setDownloadUrlMp3] = useState<string | null>(null);
  const [activeEngineMode, setActiveEngineMode] = useState<"gemini" | "browser">("gemini");

  // Synthesis State
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEncodingMp3, setIsEncodingMp3] = useState<boolean>(false);

  // Offline & Cloud State
  const [isSavedOffline, setIsSavedOffline] = useState<boolean>(false);
  const [isSavedCloud, setIsSavedCloud] = useState<boolean>(false);
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [savedOfflineCount, setSavedOfflineCount] = useState<number>(0);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);

  // Audio Engine Refs
  const engineRef = useRef<StoryAudioEngine | null>(null);
  const ambientRef = useRef<AmbientSoundGenerator | null>(null);
  const narratorRef = useRef<BrowserStoryNarrator | null>(null);

  // Initialize Engines
  useEffect(() => {
    const engine = new StoryAudioEngine();
    engine.init();
    engine.onTimeUpdate((time, dur) => {
      setCurrentTime(time);
      if (dur > 0) setDuration(dur);
    });
    engine.onEnded(() => {
      setIsPlaying(false);
      setCurrentTime(0);
    });
    engineRef.current = engine;

    const ambient = new AmbientSoundGenerator();
    ambientRef.current = ambient;

    const narrator = new BrowserStoryNarrator();
    narratorRef.current = narrator;

    // Fetch remote voices & modes if available
    fetch("/api/tts/voices")
      .then((res) => res.json())
      .then((data) => {
        if (data.voices?.length) setVoices(data.voices);
      })
      .catch(() => {});

    fetch("/api/tts/modes")
      .then((res) => res.json())
      .then((data) => {
        if (data.modes?.length) setModes(data.modes);
      })
      .catch(() => {});

    // Count offline stories
    getOfflineStories()
      .then((stories) => setSavedOfflineCount(stories.length))
      .catch(() => {});

    return () => {
      engine.stop();
      ambient.stop();
      narrator.stop();
    };
  }, []);

  // Update pitch, speed, and filters on audio engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setPitchSemitones(pitchSemitones);
      engineRef.current.setPlaybackRate(speed);
      engineRef.current.setAcousticFilter(acousticFilter);
    }
  }, [pitchSemitones, speed, acousticFilter]);

  // Update ambient sound
  useEffect(() => {
    if (ambientRef.current && ambientType !== "none") {
      ambientRef.current.play(ambientType);
      ambientRef.current.setVolume(ambientVolume);
    } else if (ambientRef.current && ambientType === "none") {
      ambientRef.current.stop();
    }
  }, [ambientType, ambientVolume]);

  // Load a sample story
  const handleSelectSample = (sample: SampleStory) => {
    setTitle(sample.title);
    setText(sample.fullText);
    setSelectedVoice(sample.recommendedVoice);
    setSelectedModeId(sample.recommendedMode);
    setPitchSemitones(sample.recommendedPitch);
    setErrorMessage(null);
  };

  // Reset audio controls
  const handleResetDefaults = () => {
    setPitchSemitones(0);
    setSpeed(1.0);
    setAcousticFilter("studio");
    setAmbientType("none");
    setAmbientVolume(0.25);
  };

  // Start Unlimited Browser Narrator (Web Speech with sentence queueing & live word tracking)
  const startBrowserNarration = async (notice?: string) => {
    if (!text.trim()) return;

    // Immediately stop and silence any current playback
    if (engineRef.current) engineRef.current.stop();
    if (narratorRef.current) narratorRef.current.stop();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsPlaying(false);
    setIsSynthesizing(true);
    setProgressText("Generating speech audio segments...");

    try {
      setActiveEngineMode("browser");
      const targetVoiceObj = voices.find((v) => v.name === selectedVoice) || voices[0];

      // Prepare local audio container and sentence queue silently without reading aloud
      const localResult = await synthesizeStoryAudioLocally(
        text.trim(),
        targetVoiceObj,
        pitchSemitones,
        speed
      );

      setAudioBlob(localResult.wavBlob);
      setAudioBase64(localResult.base64Audio);
      setDownloadUrlWav(null);
      setDownloadUrlMp3(null);

      if (notice) {
        setErrorMessage(notice);
      }

      let plannedDuration = localResult.durationSeconds;

      if (narratorRef.current) {
        plannedDuration = narratorRef.current.prepareStory(
          text.trim(),
          targetVoiceObj,
          pitchSemitones,
          speed,
          {
            onTimeUpdate: (cur, dur) => {
              setCurrentTime(cur);
              if (dur > 0) setDuration(dur);
            },
            onEnded: () => {
              setIsPlaying(false);
              setCurrentTime(0);
            },
          }
        );
      }

      setDuration(plannedDuration || localResult.durationSeconds);
      setCurrentTime(0);

      setProgressText("Speech generation complete!");
      // Brief pause so the user sees generation completed cleanly
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Mark generation as completely finished FIRST
      setIsSynthesizing(false);
      setProgressText("");

      // Voice only comes AFTER text to speech generation is fully completed
      if (narratorRef.current) {
        narratorRef.current.play(0);
        setIsPlaying(true);
      }
    } catch (err: any) {
      console.error("Narration generation error:", err);
      setIsSynthesizing(false);
      setProgressText("");
      setErrorMessage("Could not complete speech generation. Please try again.");
    }
  };

  // Convert Text to Speech (Dual Studio / Unlimited Engine)
  const handleSynthesize = async (forceBrowserMode = false) => {
    if (!text.trim()) return;

    // Stop and silence any audio currently playing
    if (engineRef.current) engineRef.current.stop();
    if (narratorRef.current) narratorRef.current.stop();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);

    if (forceBrowserMode) {
      await startBrowserNarration();
      return;
    }

    setIsSynthesizing(true);
    setErrorMessage(null);
    setProgressText("Synthesizing lifelike voice via Gemini 3.8 Flash TTS...");
    setIsSavedOffline(false);
    setIsSavedCloud(false);

    try {
      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          title: title.trim() || "Story",
          voiceName: selectedVoice,
          modeId: selectedModeId,
          customStyle,
        }),
      });

      const data = await response.json();

      if (data.quotaExceeded || !response.ok || !data.success) {
        const msg =
          data.message ||
          "Gemini Free Tier daily quota limit reached (10 requests/day). Continuing with Unlimited Speech Narrator!";
        console.warn("Gemini Speech quota notice, switching seamlessly to Unlimited Story Narrator:", msg);
        // Seamlessly switch to narrator while keeping generation silent until complete
        await startBrowserNarration(msg);
        return;
      }

      setProgressText("Preparing pristine 24kHz master audio buffer...");
      const wavBlob = base64ToBlob(data.audioBase64, "audio/wav");
      setAudioBlob(wavBlob);
      setAudioBase64(data.audioBase64);
      if (data.downloadUrlWav) setDownloadUrlWav(data.downloadUrlWav);
      if (data.downloadUrlMp3) setDownloadUrlMp3(data.downloadUrlMp3);

      setActiveEngineMode("gemini");
      if (narratorRef.current) {
        narratorRef.current.stop();
      }

      if (engineRef.current) {
        const decodedDuration = await engineRef.current.loadAudioBlob(wavBlob);
        setDuration(decodedDuration);
        setCurrentTime(0);
      }

      setProgressText("Speech generation complete!");
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Mark generation as completely finished FIRST
      setIsSynthesizing(false);
      setProgressText("");

      // Start playback ONLY AFTER text-to-speech generation has completed
      if (engineRef.current) {
        engineRef.current.play(0);
        setIsPlaying(true);
      }
    } catch (err: any) {
      console.warn("Cloud synthesize connection note, switching to Unlimited Story Narrator:", err?.message || err);
      await startBrowserNarration("Continuing with Unlimited Speech Narrator.");
    } finally {
      setIsSynthesizing(false);
      setProgressText("");
    }
  };

  // Player controls
  const handlePlay = () => {
    if (activeEngineMode === "browser") {
      if (narratorRef.current) {
        if (narratorRef.current.getIsPlaying()) return;
        if (currentTime > 0) {
          narratorRef.current.resume();
        } else {
          narratorRef.current.play(0);
        }
        setIsPlaying(true);
      }
    } else if (engineRef.current && audioBlob) {
      engineRef.current.play(currentTime);
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (activeEngineMode === "browser") {
      narratorRef.current?.pause();
      setIsPlaying(false);
    } else if (engineRef.current) {
      engineRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (seconds: number) => {
    if (activeEngineMode === "browser") {
      narratorRef.current?.seek(seconds);
      setCurrentTime(seconds);
    } else if (engineRef.current) {
      engineRef.current.seek(seconds);
      setCurrentTime(seconds);
    }
  };

  const handleSkip = (offset: number) => {
    const target = Math.max(0, Math.min(duration, currentTime + offset));
    handleSeek(target);
  };

  // Downloads
  const handleDownloadWav = async () => {
    if (!audioBlob) return;
    const safeTitle = (title || "Story").toLowerCase().replace(/[^a-z0-9]/g, "_");
    await downloadAudioFile(
      audioBlob,
      `${safeTitle}_master.wav`,
      audioBase64 || undefined,
      downloadUrlWav || undefined
    );
  };

  const handleDownloadMp3 = async (bitrate: 128 | 160) => {
    if (!audioBlob) return;
    setIsEncodingMp3(true);
    try {
      const safeTitle = (title || "Story").toLowerCase().replace(/[^a-z0-9]/g, "_");
      if (downloadUrlMp3) {
        await downloadAudioFile(
          audioBlob,
          `${safeTitle}_${bitrate}kbps.mp3`,
          audioBase64 || undefined,
          downloadUrlMp3
        );
      } else {
        const arrayBuf = await audioBlob.arrayBuffer();
        const mp3Blob = await wavBufferToMp3Blob(arrayBuf, bitrate);
        await downloadAudioFile(mp3Blob, `${safeTitle}_${bitrate}kbps.mp3`);
      }
    } catch (err: any) {
      console.error("MP3 conversion failed, providing master WAV:", err);
      const safeTitle = (title || "Story").toLowerCase().replace(/[^a-z0-9]/g, "_");
      await downloadAudioFile(
        audioBlob,
        `${safeTitle}_master.wav`,
        audioBase64 || undefined,
        downloadUrlWav || undefined
      );
    } finally {
      setIsEncodingMp3(false);
    }
  };

  // Save to IndexedDB (Offline Storage)
  const handleSaveOffline = async () => {
    if (!audioBlob) return;
    const voice = voices.find((v) => v.name === selectedVoice);
    const offlineItem: OfflineStory = {
      id: "offline_" + Date.now(),
      title: title || "Untitled Story",
      text,
      audioBlob,
      mimeType: "audio/wav",
      durationSeconds: duration,
      voiceName: selectedVoice,
      voiceGender: voice?.gender || "female",
      modeId: selectedModeId,
      pitchSemi: pitchSemitones,
      speed,
      tags: ["Story", selectedVoice, selectedModeId],
      createdAt: new Date().toISOString(),
      sizeBytes: audioBlob.size,
    };

    await saveStoryOffline(offlineItem);
    setIsSavedOffline(true);
    const updated = await getOfflineStories();
    setSavedOfflineCount(updated.length);
  };

  // Save to Server Cloud Storage
  const handleSaveCloud = async () => {
    if (!audioBlob) return;
    setIsSavingCloud(true);
    try {
      const b64 = audioBase64 || (await blobToBase64(audioBlob));
      const voice = voices.find((v) => v.name === selectedVoice);
      const res = await fetch("/api/cloud-stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Untitled Story",
          text,
          voiceName: selectedVoice,
          voiceGender: voice?.gender || "female",
          modeId: selectedModeId,
          pitchSemi: pitchSemitones,
          speed,
          durationSeconds: duration,
          audioWavBase64: b64,
          tags: ["Story", selectedVoice, selectedModeId],
        }),
      });

      if (res.ok) {
        setIsSavedCloud(true);
      } else {
        throw new Error("Cloud save failed");
      }
    } catch (err) {
      console.error("Cloud save error", err);
      setErrorMessage("Could not save to cloud storage right now. You can still save offline!");
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Load story from Vault Modal
  const handleLoadStoryFromVault = async (story: {
    title: string;
    text: string;
    voiceName: string;
    modeId: string;
    pitchSemi: number;
    speed: number;
    audioBlob?: Blob;
    audioBase64?: string;
  }) => {
    setTitle(story.title);
    setText(story.text);
    setSelectedVoice(story.voiceName);
    setSelectedModeId(story.modeId);
    setPitchSemitones(story.pitchSemi || 0);
    setSpeed(story.speed || 1.0);

    let blob = story.audioBlob;
    if (!blob && story.audioBase64) {
      blob = base64ToBlob(story.audioBase64, "audio/wav");
    }

    if (blob) {
      setAudioBlob(blob);
      setAudioBase64(story.audioBase64 || null);
      if (engineRef.current) {
        const dur = await engineRef.current.loadAudioBlob(blob);
        setDuration(dur);
        setCurrentTime(0);
        engineRef.current.play(0);
        setIsPlaying(true);
      }
      setIsSavedOffline(Boolean(story.audioBlob));
      setIsSavedCloud(Boolean(story.audioBase64));
    }
  };

  const selectedMode = modes.find((m) => m.id === selectedModeId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header */}
      <Header
        onOpenLibrary={() => setIsLibraryOpen(true)}
        savedOfflineCount={savedOfflineCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-heading font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Next-Gen Human Speech Synthesis • Model gemini-3.8-flash-tts</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight text-white leading-tight">
              Bring Your Stories to Life with Human Speech
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Convert unlimited story text into cinematic, breath-infused human speech with male & female voices, dynamic voice modes, pitch shifter, offline playback, and studio-grade MP3/WAV download.
            </p>

            {/* Feature Highlights Pills */}
            <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-heading font-medium text-slate-300">
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
                <Mic className="w-3 h-3 text-amber-400" /> Male & Female Human Voices
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-emerald-400" /> Unlimited Text Chunker
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
                <Music className="w-3 h-3 text-sky-400" /> Pitch & Speed Customizer
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-rose-400" /> Offline IndexedDB & Cloud Vault
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
                <Download className="w-3 h-3 text-amber-400" /> High-Quality WAV & MP3
              </span>
            </div>
          </div>
        </div>

        {/* Master Player Deck (Displays prominently when audio is generated) */}
        {(audioBlob || duration > 0) && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <StoryPlayer
              storyTitle={title}
              storyText={text}
              voiceName={selectedVoice}
              modeName={selectedMode?.name || "Standard Narrator"}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              analyser={activeEngineMode === "browser" ? narratorRef.current?.getAnalyser() || null : engineRef.current?.getAnalyser() || null}
              engineType={activeEngineMode}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              onSkip={handleSkip}
              onDownloadWav={handleDownloadWav}
              onDownloadMp3={handleDownloadMp3}
              isEncodingMp3={isEncodingMp3}
              onSaveOffline={handleSaveOffline}
              isSavedOffline={isSavedOffline}
              onSaveCloud={handleSaveCloud}
              isSavedCloud={isSavedCloud}
              isSavingCloud={isSavingCloud}
            />
          </div>
        )}

        {/* Story Editor Section */}
        <StoryEditor
          title={title}
          onChangeTitle={setTitle}
          text={text}
          onChangeText={setText}
          onSelectSample={handleSelectSample}
          onSynthesize={() => handleSynthesize(false)}
          onSynthesizeInstant={() => handleSynthesize(true)}
          isSynthesizing={isSynthesizing}
          synthesizeProgressText={progressText}
          errorMessage={errorMessage}
        />

        {/* Voice Selection (Male & Female) */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
          <VoiceSelector
            voices={voices}
            selectedVoice={selectedVoice}
            onSelectVoice={setSelectedVoice}
          />
        </div>

        {/* Voice Modes & Moods */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
          <VoiceModeSelector
            modes={modes}
            selectedModeId={selectedModeId}
            onSelectMode={setSelectedModeId}
            customStyle={customStyle}
            onChangeCustomStyle={setCustomStyle}
          />
        </div>

        {/* Audio Tuning & Immersive Controls */}
        <AudioTuningStudio
          pitchSemitones={pitchSemitones}
          onChangePitch={setPitchSemitones}
          speed={speed}
          onChangeSpeed={setSpeed}
          acousticFilter={acousticFilter}
          onChangeAcousticFilter={setAcousticFilter}
          ambientType={ambientType}
          onChangeAmbientType={setAmbientType}
          ambientVolume={ambientVolume}
          onChangeAmbientVolume={setAmbientVolume}
          onResetDefaults={handleResetDefaults}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>
          FableVoice • Crafted for storytellers, novelists, and audio lovers. Unlimited text synthesis powered by Gemini 3.8 Flash TTS.
        </p>
      </footer>

      {/* Story Vault / Library Modal */}
      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onLoadStory={handleLoadStoryFromVault}
      />
    </div>
  );
}
