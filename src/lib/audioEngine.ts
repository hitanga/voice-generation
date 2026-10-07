export type AcousticFilterType = "studio" | "cathedral" | "warm_vinyl" | "vintage_radio";

export interface AudioEngineState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  pitchSemitones: number;
  acousticFilter: AcousticFilterType;
  ambientType: "none" | "rain" | "fireplace" | "forest" | "space";
  ambientVolume: number;
}

export class StoryAudioEngine {
  private ctx: AudioContext | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  
  // Playback tracking
  private startTime: number = 0;
  private pauseOffset: number = 0;
  private isPlaying: boolean = false;
  private playbackRate: number = 1.0;
  private pitchSemitones: number = 0; // -12 to +12
  private currentFilter: AcousticFilterType = "studio";

  // Callbacks
  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private animationFrameId: number | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      try {
        this.ctx = new AudioCtx();
      } catch (err) {
        console.warn("Failed to create AudioContext with default options", err);
        this.ctx = new AudioCtx();
      }
      this.gainNode = this.ctx.createGain();
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.filterNode = this.ctx.createBiquadFilter();
      this.applyFilterSettings(this.currentFilter);

      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  public async loadAudioBlob(blob: Blob): Promise<number> {
    this.init();
    if (!this.ctx) throw new Error("AudioContext not ready");

    this.stop();
    this.pauseOffset = 0;

    const arrayBuffer = await blob.arrayBuffer();
    this.currentBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    return this.currentBuffer.duration;
  }

  public getDuration(): number {
    return this.currentBuffer ? this.currentBuffer.duration : 0;
  }

  public getCurrentTime(): number {
    if (!this.isPlaying || !this.ctx) return this.pauseOffset;
    const effectiveRate = this.getEffectiveRate();
    const elapsed = (this.ctx.currentTime - this.startTime) * effectiveRate;
    const time = this.pauseOffset + elapsed;
    return Math.min(time, this.getDuration());
  }

  private getEffectiveRate(): number {
    // Pitch shift formula: rate = 2 ^ (semitones / 12) * speedRate
    const pitchFactor = Math.pow(2, this.pitchSemitones / 12);
    return Math.max(0.2, Math.min(4.0, this.playbackRate * pitchFactor));
  }

  public play(fromTime?: number) {
    this.init();
    if (!this.ctx || !this.currentBuffer) return;

    if (this.isPlaying) {
      this.stopSource();
    }

    const duration = this.currentBuffer.duration;
    if (typeof fromTime === "number") {
      this.pauseOffset = Math.max(0, Math.min(fromTime, duration));
    }
    if (this.pauseOffset >= duration) {
      this.pauseOffset = 0;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.currentBuffer;
    source.playbackRate.value = this.getEffectiveRate();

    if (this.filterNode) {
      source.connect(this.filterNode);
    } else if (this.gainNode) {
      source.connect(this.gainNode);
    }

    source.onended = () => {
      if (this.isPlaying) {
        const time = this.getCurrentTime();
        if (time >= duration - 0.1) {
          this.isPlaying = false;
          this.pauseOffset = 0;
          this.cancelTimeTracking();
          this.onEndedCallback?.();
        }
      }
    };

    const effectiveRate = this.getEffectiveRate();
    const sourceOffset = this.pauseOffset;

    this.startTime = this.ctx.currentTime;
    source.start(0, sourceOffset);
    this.sourceNode = source;
    this.isPlaying = true;

    this.startTimeTracking();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.pauseOffset = this.getCurrentTime();
    this.stopSource();
    this.isPlaying = false;
    this.cancelTimeTracking();
  }

  public stop() {
    this.stopSource();
    this.isPlaying = false;
    this.pauseOffset = 0;
    this.cancelTimeTracking();
  }

  public seek(seconds: number) {
    const duration = this.getDuration();
    const clamped = Math.max(0, Math.min(seconds, duration));
    const wasPlaying = this.isPlaying;
    this.pause();
    this.pauseOffset = clamped;
    if (wasPlaying) {
      this.play(clamped);
    } else {
      this.onTimeUpdateCallback?.(clamped, duration);
    }
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = Math.max(0.5, Math.min(2.5, rate));
    if (this.sourceNode && this.ctx) {
      this.sourceNode.playbackRate.setValueAtTime(this.getEffectiveRate(), this.ctx.currentTime);
    }
  }

  public setPitchSemitones(semitones: number) {
    this.pitchSemitones = Math.max(-12, Math.min(12, semitones));
    if (this.sourceNode && this.ctx) {
      this.sourceNode.playbackRate.setValueAtTime(this.getEffectiveRate(), this.ctx.currentTime);
    }
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1.5, volume)), this.ctx.currentTime);
    }
  }

  public setAcousticFilter(type: AcousticFilterType) {
    this.currentFilter = type;
    this.applyFilterSettings(type);
  }

  private applyFilterSettings(type: AcousticFilterType) {
    if (!this.filterNode) return;
    switch (type) {
      case "cathedral":
        this.filterNode.type = "peaking";
        this.filterNode.frequency.value = 2400;
        this.filterNode.gain.value = 6;
        this.filterNode.Q.value = 1.2;
        break;
      case "warm_vinyl":
        this.filterNode.type = "lowshelf";
        this.filterNode.frequency.value = 350;
        this.filterNode.gain.value = 5;
        break;
      case "vintage_radio":
        this.filterNode.type = "bandpass";
        this.filterNode.frequency.value = 1800;
        this.filterNode.Q.value = 2.5;
        break;
      case "studio":
      default:
        this.filterNode.type = "allpass";
        this.filterNode.frequency.value = 1000;
        break;
    }
  }

  private stopSource() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (_) {}
      this.sourceNode = null;
    }
  }

  private startTimeTracking() {
    this.cancelTimeTracking();
    const update = () => {
      if (this.isPlaying) {
        const time = this.getCurrentTime();
        const duration = this.getDuration();
        this.onTimeUpdateCallback?.(time, duration);
        this.animationFrameId = requestAnimationFrame(update);
      }
    };
    this.animationFrameId = requestAnimationFrame(update);
  }

  private cancelTimeTracking() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public onTimeUpdate(cb: (time: number, duration: number) => void) {
    this.onTimeUpdateCallback = cb;
  }

  public onEnded(cb: () => void) {
    this.onEndedCallback = cb;
  }
}
