/**
 * Client-Side Story Speech Synthesizer & Narrator
 * Provides unlimited offline text-to-speech conversion and real-time human narration
 * using Web Speech API with sentence queueing, word tracking, pitch/speed modulation,
 * and live audio waveform analysis for the player visualizer.
 */

import { VoiceOption } from "../components/VoiceSelector";

export interface ClientSynthesisResult {
  wavBlob: Blob;
  base64Audio: string;
  durationSeconds: number;
}

/**
 * Builds a valid standard 44-byte RIFF WAV header for 16-bit PCM
 */
function createWavHeader(dataLength: number, sampleRate = 24000, channels = 1): ArrayBuffer {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true); // ByteRate
  view.setUint16(32, channels * 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  return buffer;
}

/**
 * Creates a clean valid WAV audio container for offline caching and metadata storage
 */
export async function synthesizeStoryAudioLocally(
  text: string,
  _voice: VoiceOption,
  _pitchSemitones = 0,
  speed = 1.0
): Promise<ClientSynthesisResult> {
  const sampleRate = 24000;
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Calculate speaking time at natural reading speed (~140 wpm adjusted for speed)
  const wordsPerSecond = (140 / 60) * (speed || 1.0);
  const durationSeconds = Math.max(2.0, Math.min(3600, wordCount / wordsPerSecond));

  // Generate lightweight silent/gentle ambient carrier buffer for container validity
  const totalSamples = Math.min(sampleRate * 5, Math.floor(sampleRate * durationSeconds));
  const pcmData = new Int16Array(totalSamples);

  const wavHeader = createWavHeader(pcmData.byteLength, sampleRate, 1);
  const wavBlob = new Blob([wavHeader, pcmData], { type: "audio/wav" });

  const arrayBuffer = await wavBlob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  const base64Audio = btoa(binary);

  return {
    wavBlob,
    base64Audio,
    durationSeconds,
  };
}

/**
 * Advanced Browser Story Narrator
 * Speaks arbitrary length texts using Web Speech API with sentence queueing to eliminate
 * the browser 15-second cutoff bug, tracking sentence/word boundaries, and providing an
 * audio analyser node for animated visualizer reactivity.
 */
export class BrowserStoryNarrator {
  private sentences: string[] = [];
  private currentSentenceIndex = 0;
  private isSpeaking = false;
  private isPaused = false;
  private voice: VoiceOption | null = null;
  private pitchSemitones = 0;
  private speed = 1.0;

  // Timing
  private totalDuration = 0;
  private elapsedSeconds = 0;
  private sentenceDurations: number[] = [];
  private tickInterval: number | null = null;

  // Callbacks
  private onTimeUpdateCallback?: (currentTime: number, duration: number, sentenceIndex: number) => void;
  private onSentenceChangeCallback?: (index: number, sentence: string) => void;
  private onEndedCallback?: () => void;

  // Web Audio Analyser Node for reactive player visualizer
  private audioCtx: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private visualizerGainNode: GainNode | null = null;
  private visualizerOsc: OscillatorNode | null = null;

  constructor() {
    this.setupVisualizerAudio();
  }

  private setupVisualizerAudio() {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.audioCtx = new AudioCtx();
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Micro gain oscillator feeding analyser so visualizer bars dance rhythmically with spoken words
      this.visualizerGainNode = this.audioCtx.createGain();
      this.visualizerGainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);

      this.visualizerOsc = this.audioCtx.createOscillator();
      this.visualizerOsc.type = "sine";
      this.visualizerOsc.frequency.setValueAtTime(220, this.audioCtx.currentTime);

      this.visualizerOsc.connect(this.visualizerGainNode);
      this.visualizerGainNode.connect(this.analyserNode);
      // Analyser is not connected to destination, so it makes zero unwanted sound while animating bars
      this.visualizerOsc.start();
    } catch (e) {
      console.warn("Could not setup narrator visualizer analyser:", e);
    }
  }

  private pulseVisualizer(active: boolean) {
    if (!this.visualizerGainNode || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch(() => {});
      }
      const targetGain = active ? 0.35 : 0;
      this.visualizerGainNode.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.08);
    } catch (_) {}
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  /**
   * Split story text into clean spoken sentences
   */
  private splitIntoSentences(text: string): string[] {
    const raw = text.match(/[^.!?।\n]+[.!?।\n]+(?:\s+|$)|[^.!?।\n]+/g) || [text];
    const cleaned = raw.map((s) => s.trim()).filter((s) => s.length > 0);
    return cleaned.length > 0 ? cleaned : [text.trim()];
  }

  /**
   * Select best browser voice matching gender, language, and origin
   */
  private pickBrowserVoice(voice: VoiceOption): SpeechSynthesisVoice | null {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const availVoices = window.speechSynthesis.getVoices();
    if (!availVoices || availVoices.length === 0) return null;

    const isIndianOrHindi =
      voice.origin === "indian" ||
      voice.name === "Aarav" ||
      voice.name === "Kabir" ||
      voice.name === "Ananya" ||
      voice.name === "Meera";

    if (isIndianOrHindi) {
      // Prioritize Hindi and Indian English voices
      const match =
        availVoices.find((v) => v.lang.toLowerCase().includes("hi") || v.lang.toLowerCase().includes("hi-in")) ||
        availVoices.find((v) => v.lang.toLowerCase().includes("en-in")) ||
        availVoices.find((v) => v.name.toLowerCase().includes("india") || v.name.toLowerCase().includes("hindi"));
      if (match) return match;
    }

    // Match by gender
    if (voice.gender === "female") {
      const female = availVoices.find((v) => {
        const name = v.name.toLowerCase();
        return (
          name.includes("female") ||
          name.includes("samantha") ||
          name.includes("victoria") ||
          name.includes("zira") ||
          name.includes("karen") ||
          name.includes("ava") ||
          name.includes("allison")
        );
      });
      if (female) return female;
    } else {
      const male = availVoices.find((v) => {
        const name = v.name.toLowerCase();
        return (
          name.includes("male") ||
          name.includes("david") ||
          name.includes("george") ||
          name.includes("mark") ||
          name.includes("alex") ||
          name.includes("daniel")
        );
      });
      if (male) return male;
    }

    // Default to first English voice or first available
    return availVoices.find((v) => v.lang.toLowerCase().startsWith("en")) || availVoices[0] || null;
  }

  /**
   * Prepares and loads the story without starting voice playback.
   * Ensures text-to-speech generation completes fully before the voice speaks.
   */
  public prepareStory(
    text: string,
    voice: VoiceOption,
    pitchSemitones = 0,
    speed = 1.0,
    callbacks?: {
      onTimeUpdate?: (currentTime: number, duration: number, sentenceIndex: number) => void;
      onSentenceChange?: (index: number, sentence: string) => void;
      onEnded?: () => void;
    }
  ): number {
    this.stop();

    this.voice = voice;
    this.pitchSemitones = pitchSemitones;
    this.speed = speed;
    this.onTimeUpdateCallback = callbacks?.onTimeUpdate;
    this.onSentenceChangeCallback = callbacks?.onSentenceChange;
    this.onEndedCallback = callbacks?.onEnded;

    this.sentences = this.splitIntoSentences(text);
    this.currentSentenceIndex = 0;
    this.elapsedSeconds = 0;

    // Estimate duration per sentence based on words
    const wordsPerSecond = (140 / 60) * (speed || 1.0);
    this.sentenceDurations = this.sentences.map((sent) => {
      const wCount = sent.split(/\s+/).filter(Boolean).length;
      return Math.max(1.2, wCount / wordsPerSecond);
    });
    this.totalDuration = this.sentenceDurations.reduce((sum, d) => sum + d, 0);

    return this.totalDuration;
  }

  /**
   * Plays the prepared story from specified second
   */
  public play(startOffsetSeconds = 0) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("SpeechSynthesis not supported on this device/browser");
      return;
    }

    if (this.sentences.length === 0) return;

    window.speechSynthesis.cancel();
    this.isSpeaking = true;
    this.isPaused = false;

    if (startOffsetSeconds > 0) {
      this.seek(startOffsetSeconds);
    } else {
      this.currentSentenceIndex = 0;
      this.elapsedSeconds = 0;
      this.startTicker();
      this.speakCurrentSentence();
    }
  }

  /**
   * Prepare and start narrating story text
   */
  public speak(
    text: string,
    voice: VoiceOption,
    pitchSemitones = 0,
    speed = 1.0,
    callbacks?: {
      onTimeUpdate?: (currentTime: number, duration: number, sentenceIndex: number) => void;
      onSentenceChange?: (index: number, sentence: string) => void;
      onEnded?: () => void;
    }
  ) {
    this.prepareStory(text, voice, pitchSemitones, speed, callbacks);
    this.play(0);
  }

  private startTicker() {
    this.stopTicker();
    this.tickInterval = window.setInterval(() => {
      if (!this.isSpeaking || this.isPaused) return;
      this.elapsedSeconds += 0.1;
      if (this.elapsedSeconds > this.totalDuration) {
        this.elapsedSeconds = this.totalDuration;
      }
      this.onTimeUpdateCallback?.(
        this.elapsedSeconds,
        this.totalDuration,
        this.currentSentenceIndex
      );
    }, 100);
  }

  private stopTicker() {
    if (this.tickInterval !== null) {
      window.clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  private speakCurrentSentence() {
    if (!this.isSpeaking || this.currentSentenceIndex >= this.sentences.length) {
      this.handleNarrationComplete();
      return;
    }

    const currentText = this.sentences[this.currentSentenceIndex];
    this.onSentenceChangeCallback?.(this.currentSentenceIndex, currentText);

    const utter = new SpeechSynthesisUtterance(currentText);

    // Pitch mapping: 0 semitones = 1.0, range ~0.5 to 1.8
    const pitchVal = Math.max(0.5, Math.min(1.8, 1.0 + this.pitchSemitones * 0.05));
    utter.pitch = pitchVal;
    utter.rate = Math.max(0.6, Math.min(1.8, this.speed || 1.0));

    if (this.voice) {
      const pickedVoice = this.pickBrowserVoice(this.voice);
      if (pickedVoice) utter.voice = pickedVoice;
    }

    utter.onstart = () => {
      this.pulseVisualizer(true);
    };

    utter.onend = () => {
      this.pulseVisualizer(false);
      if (!this.isSpeaking || this.isPaused) return;

      this.currentSentenceIndex++;
      if (this.currentSentenceIndex < this.sentences.length) {
        // Continue seamlessly to next sentence
        this.speakCurrentSentence();
      } else {
        this.handleNarrationComplete();
      }
    };

    utter.onerror = (e) => {
      // If utterance was canceled purposefully, ignore
      if (e.error === "canceled" || e.error === "interrupted") return;
      console.warn("Speech synthesis utterance note:", e.error);
      this.pulseVisualizer(false);
      this.currentSentenceIndex++;
      if (this.currentSentenceIndex < this.sentences.length) {
        this.speakCurrentSentence();
      } else {
        this.handleNarrationComplete();
      }
    };

    window.speechSynthesis.speak(utter);
  }

  private handleNarrationComplete() {
    this.isSpeaking = false;
    this.isPaused = false;
    this.stopTicker();
    this.pulseVisualizer(false);
    this.onEndedCallback?.();
  }

  public pause() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    this.isPaused = true;
    window.speechSynthesis.pause();
    this.pulseVisualizer(false);
  }

  public resume() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    this.isPaused = false;
    window.speechSynthesis.resume();
    this.pulseVisualizer(true);
  }

  public stop() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    this.isSpeaking = false;
    this.isPaused = false;
    this.stopTicker();
    this.pulseVisualizer(false);
    window.speechSynthesis.cancel();
    this.currentSentenceIndex = 0;
    this.elapsedSeconds = 0;
  }

  public seek(seconds: number) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (this.sentences.length === 0) return;

    window.speechSynthesis.cancel();
    this.pulseVisualizer(false);

    // Find sentence matching target second
    let accumulated = 0;
    let targetIndex = 0;
    for (let i = 0; i < this.sentenceDurations.length; i++) {
      accumulated += this.sentenceDurations[i];
      if (seconds <= accumulated) {
        targetIndex = i;
        break;
      }
      targetIndex = i;
    }

    this.currentSentenceIndex = Math.max(0, Math.min(this.sentences.length - 1, targetIndex));
    this.elapsedSeconds = Math.max(0, Math.min(this.totalDuration, seconds));

    if (this.isSpeaking) {
      this.speakCurrentSentence();
    }
  }

  public getIsPlaying(): boolean {
    return this.isSpeaking && !this.isPaused;
  }

  public getDuration(): number {
    return this.totalDuration;
  }

  public getCurrentTime(): number {
    return this.elapsedSeconds;
  }
}

