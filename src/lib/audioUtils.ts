import lamejs from "@breezystack/lamejs";

/**
 * Convert base64 data to Blob
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Convert Blob to Base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert an ArrayBuffer of standard 16-bit WAV to MP3 using @breezystack/lamejs
 * For 24kHz audio, MPEG-2 supports bitrates up to 160kbps (e.g., 128, 160)
 */
export async function wavBufferToMp3Blob(
  wavArrayBuffer: ArrayBuffer,
  bitrateKbps: 128 | 160 = 160
): Promise<Blob> {
  const dataView = new DataView(wavArrayBuffer);
  
  // Parse WAV header
  let numChannels = 1;
  let sampleRate = 24000;
  let dataOffset = 44;
  let dataLength = wavArrayBuffer.byteLength - 44;

  try {
    numChannels = dataView.getUint16(22, true);
    sampleRate = dataView.getUint32(24, true);

    // Find the 'data' chunk
    let pos = 12;
    while (pos < wavArrayBuffer.byteLength - 8) {
      const id = String.fromCharCode(
        dataView.getUint8(pos),
        dataView.getUint8(pos + 1),
        dataView.getUint8(pos + 2),
        dataView.getUint8(pos + 3)
      );
      const chunkSize = dataView.getUint32(pos + 4, true);
      if (id === "data") {
        dataOffset = pos + 8;
        dataLength = chunkSize;
        break;
      }
      pos += 8 + chunkSize;
    }
  } catch (err) {
    console.warn("Could not parse detailed WAV header, falling back to 44 bytes", err);
  }

  // Safely slice the buffer to ensure perfect 2-byte alignment and eliminate RangeError
  let alignedOffset = dataOffset;
  if (alignedOffset % 2 !== 0) {
    alignedOffset++;
  }
  const maxBytes = wavArrayBuffer.byteLength - alignedOffset;
  const safeLength = Math.min(dataLength, maxBytes);
  const sampleCount = Math.floor(safeLength / 2);

  // Slicing creates a new ArrayBuffer that is always 0-offset and 2-byte aligned
  const slicedBuffer = wavArrayBuffer.slice(alignedOffset, alignedOffset + sampleCount * 2);
  const pcmBytes = new Int16Array(slicedBuffer);

  const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, bitrateKbps);
  const mp3Data: Uint8Array[] = [];

  const sampleBlockSize = 1152;
  for (let i = 0; i < pcmBytes.length; i += sampleBlockSize) {
    const sampleChunk = pcmBytes.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }
  }

  const mp3End = mp3encoder.flush();
  if (mp3End.length > 0) {
    mp3Data.push(new Uint8Array(mp3End));
  }

  return new Blob(mp3Data as unknown as BlobPart[], { type: "audio/mp3" });
}

/**
 * Trigger file download reliably in browser and sandboxed iframe environments
 */
export async function downloadAudioFile(
  blob: Blob,
  filename: string,
  fallbackBase64?: string,
  serverDownloadUrl?: string
) {
  // Strategy 1: If server direct download URL is available (has Content-Disposition attachment header)
  if (serverDownloadUrl) {
    try {
      // Trigger via invisible iframe (highly effective in sandboxed iframes)
      const hiddenIframe = document.createElement("iframe");
      hiddenIframe.style.display = "none";
      hiddenIframe.src = serverDownloadUrl;
      document.body.appendChild(hiddenIframe);
      setTimeout(() => {
        hiddenIframe.remove();
      }, 15000);

      // Also trigger via anchor
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = serverDownloadUrl;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 2000);
      return;
    } catch (e) {
      console.warn("Direct server URL download failed, trying form and blob fallbacks", e);
    }
  }

  // Strategy 2: Try direct Blob ObjectURL download
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 5000);
  } catch (err) {
    console.warn("Direct blob download failed, falling back to server form POST", err);
  }

  // Strategy 3: Server form POST fallback (forces native file save dialog from server Content-Disposition)
  try {
    const b64 = fallbackBase64 || (await blobToBase64(blob));
    if (b64) {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/tts/download";
      form.style.display = "none";

      const inputData = document.createElement("input");
      inputData.type = "hidden";
      inputData.name = "audioBase64";
      inputData.value = b64;
      form.appendChild(inputData);

      const inputName = document.createElement("input");
      inputName.type = "hidden";
      inputName.name = "filename";
      inputName.value = filename;
      form.appendChild(inputName);

      const inputFormat = document.createElement("input");
      inputFormat.type = "hidden";
      inputFormat.name = "format";
      inputFormat.value = filename.endsWith(".mp3") ? "mp3" : "wav";
      form.appendChild(inputFormat);

      document.body.appendChild(form);
      form.submit();
      setTimeout(() => form.remove(), 3000);
    }
  } catch (formErr) {
    console.error("Server form download fallback failed", formErr);
  }
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs.toString().padStart(2, "0")}:${remMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format bytes to readable size (KB, MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Procedural ambient sound synthesis using Web Audio API
 */
export class AmbientSoundGenerator {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseNode: AudioNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private crackleInterval: number | null = null;
  private currentType: string = "none";

  public init(audioCtx?: AudioContext) {
    if (!this.ctx) {
      if (audioCtx) {
        this.ctx = audioCtx;
      } else {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public setVolume(volume: number) {
    if (!this.masterGain || !this.ctx) return;
    this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.05);
  }

  public stop() {
    if (this.crackleInterval) {
      window.clearInterval(this.crackleInterval);
      this.crackleInterval = null;
    }
    if (this.noiseNode) {
      try {
        (this.noiseNode as any).stop?.();
        this.noiseNode.disconnect();
      } catch (_) {}
      this.noiseNode = null;
    }
    if (this.lfoNode) {
      try {
        this.lfoNode.stop();
        this.lfoNode.disconnect();
      } catch (_) {}
      this.lfoNode = null;
    }
    this.currentType = "none";
  }

  public play(type: "rain" | "fireplace" | "forest" | "space" | "none") {
    if (!this.ctx || !this.masterGain) {
      this.init();
    }
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    this.stop();
    if (type === "none") return;

    this.currentType = type;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    if (type === "rain") {
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.15;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1200;

      noise.connect(filter);
      filter.connect(this.masterGain);
      noise.start();
      this.noiseNode = noise;
    } else if (type === "fireplace") {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 1.2;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 350;
      filter.Q.value = 1.0;

      noise.connect(filter);
      filter.connect(this.masterGain);
      noise.start();
      this.noiseNode = noise;

      this.crackleInterval = window.setInterval(() => {
        if (!this.ctx || !this.masterGain || Math.random() > 0.4) return;
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        clickOsc.frequency.setValueAtTime(600 + Math.random() * 1200, this.ctx.currentTime);
        clickGain.gain.setValueAtTime(0.08 * Math.random(), this.ctx.currentTime);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.03);
        clickOsc.connect(clickGain);
        clickGain.connect(this.masterGain);
        clickOsc.start();
        clickOsc.stop(this.ctx.currentTime + 0.04);
      }, 180);
    } else if (type === "forest") {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.08;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 600;
      filter.Q.value = 3.0;

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.2;
      lfoGain.gain.value = 250;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.lfoNode = lfo;

      noise.connect(filter);
      filter.connect(this.masterGain);
      noise.start();
      this.noiseNode = noise;
    } else if (type === "space") {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = "sine";
      osc2.type = "triangle";
      osc1.frequency.value = 55;
      osc2.frequency.value = 110;
      const droneGain = this.ctx.createGain();
      droneGain.gain.value = 0.12;
      osc1.connect(droneGain);
      osc2.connect(droneGain);
      droneGain.connect(this.masterGain);
      osc1.start();
      osc2.start();
      this.noiseNode = osc1;
    }
  }
}
