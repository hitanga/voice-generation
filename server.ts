import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import lamejs from "@breezystack/lamejs";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "50mb" }));

// Initialize GoogleGenAI SDK
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Storage folder for cloud-saved stories
const DATA_DIR = path.resolve(process.cwd(), ".data");
const STORIES_FILE = path.join(DATA_DIR, "stories.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface CloudStory {
  id: string;
  title: string;
  text: string;
  voiceName: string;
  voiceGender: "male" | "female";
  modeId: string;
  pitchSemi: number;
  speed: number;
  durationSeconds: number;
  audioWavBase64?: string;
  createdAt: string;
  tags: string[];
}

function loadCloudStories(): CloudStory[] {
  try {
    if (fs.existsSync(STORIES_FILE)) {
      const data = fs.readFileSync(STORIES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to load stories file", err);
  }
  return [];
}

function saveCloudStories(stories: CloudStory[]) {
  try {
    fs.writeFileSync(STORIES_FILE, JSON.stringify(stories, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save stories file", err);
  }
}

// Voices configuration
export const AVAILABLE_VOICES = [
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

// Voice Modes configuration
export const VOICE_MODES = [
  {
    id: "epic_dramatic",
    name: "Dramatic & Epic",
    icon: "Swords",
    stylePrompt: "Cinematic, dramatic, intense storytelling pacing with deliberate dramatic pauses, theatrical emotional range, and majestic resonance.",
    description: "Thunderous climaxes and cinematic tension for battle scenes and grand chronicles.",
  },
  {
    id: "bedtime_warm",
    name: "Warm Bedtime Fable",
    icon: "Moon",
    stylePrompt: "Soft, gentle, warm, and soothing bedtime narrator voice. Calm breathing, tender comforting cadence, peaceful and reassuring rhythm.",
    description: "Velvety, calm rhythm that lulls listeners into wonder and peaceful dreams.",
  },
  {
    id: "whisper_mystery",
    name: "Mysterious & Whispering",
    icon: "Eye",
    stylePrompt: "Intriguing, mysterious, slightly lowered hushed tones with atmospheric suspense, eerie curiosity, and captivating secretive cadence.",
    description: "Hushed, atmospheric suspense for secrets, haunted hallways, and twilight riddles.",
  },
  {
    id: "whimsical_fantasy",
    name: "Whimsical & Fairy Tale",
    icon: "Sparkles",
    stylePrompt: "Charming, playful, animated, cheerful cadence filled with childlike wonder and fairy tale enchantment.",
    description: "Playful cadence bursting with magic, mischievous creatures, and happy wonders.",
  },
  {
    id: "noir_detective",
    name: "Dark Noir & Contemplative",
    icon: "Flame",
    stylePrompt: "Low, gritty, brooding, reflective voice with vintage detective novel cadence, cynical pauses, and world-weary undertones.",
    description: "Rain-slicked streets, smoky jazz tones, and hardboiled introspection.",
  },
  {
    id: "classic_novel",
    name: "Classic Audio Novelist",
    icon: "BookOpen",
    stylePrompt: "Master audiobook narrator, pristine diction, elegant rhythm, neutral yet richly expressive literary cadence.",
    description: "The gold standard of literary narration with refined diction and natural flow.",
  },
];

// Helper: Extract raw PCM from WAV buffer (24kHz, 16-bit, mono)
function extractPcmFromWav(wavBuffer: Buffer): { pcmData: Buffer; sampleRate: number; channels: number } {
  if (wavBuffer.length < 44) {
    return { pcmData: wavBuffer, sampleRate: 24000, channels: 1 };
  }

  // Look for "data" chunk
  let pos = 12;
  let dataOffset = 44;
  let sampleRate = 24000;
  let channels = 1;

  try {
    // Read sample rate at byte 24
    if (wavBuffer.toString("ascii", 0, 4) === "RIFF") {
      channels = wavBuffer.readUInt16LE(22);
      sampleRate = wavBuffer.readUInt32LE(24);
      while (pos < wavBuffer.length - 8) {
        const subchunkId = wavBuffer.toString("ascii", pos, pos + 4);
        const subchunkSize = wavBuffer.readUInt32LE(pos + 4);
        if (subchunkId === "data") {
          dataOffset = pos + 8;
          return {
            pcmData: wavBuffer.subarray(dataOffset, dataOffset + subchunkSize),
            sampleRate,
            channels,
          };
        }
        pos += 8 + subchunkSize;
      }
    }
  } catch (e) {
    console.warn("WAV parse warning, falling back to 44-byte header offset", e);
  }

  return {
    pcmData: wavBuffer.subarray(44),
    sampleRate: 24000,
    channels: 1,
  };
}

// Helper: Build a standard 44-byte WAV header for concatenated PCM
function buildWavBuffer(pcmBuffer: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Helper: Split long story text into intelligent chunks
function splitStoryIntoChunks(text: string, maxWordsPerChunk = 1200): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const wordsInPara = trimmed.split(/\s+/).length;
    const currentWords = currentChunk ? currentChunk.split(/\s+/).length : 0;

    if (currentWords + wordsInPara <= maxWordsPerChunk) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmed}` : trimmed;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
      // If a single paragraph is larger than maxWordsPerChunk, split by sentences (supporting Hindi । as well)
      if (wordsInPara > maxWordsPerChunk) {
        const sentences = trimmed.match(/[^.!?।]+[.!?।]+(?:\s+|$)|[^.!?।]+$/g) || [trimmed];
        let sentenceChunk = "";
        for (const sentence of sentences) {
          const sentTrimmed = sentence.trim();
          if (!sentTrimmed) continue;
          const sentWords = sentTrimmed.split(/\s+/).length;
          const curSentWords = sentenceChunk ? sentenceChunk.split(/\s+/).length : 0;
          if (curSentWords + sentWords <= maxWordsPerChunk) {
            sentenceChunk = sentenceChunk ? `${sentenceChunk} ${sentTrimmed}` : sentTrimmed;
          } else {
            if (sentenceChunk) chunks.push(sentenceChunk);
            sentenceChunk = sentTrimmed;
          }
        }
        if (sentenceChunk) chunks.push(sentenceChunk);
      } else {
        currentChunk = trimmed;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [text];
}

// REST Endpoints
app.get("/api/tts/voices", (_req, res) => {
  res.json({ voices: AVAILABLE_VOICES });
});

app.get("/api/tts/modes", (_req, res) => {
  res.json({ modes: VOICE_MODES });
});

// Storage for temporary downloadable files (survives sandboxed iframe limitations)
interface CachedDownload {
  buffer: Buffer;
  mimeType: string;
  filename: string;
  createdAt: number;
}
const downloadCache = new Map<string, CachedDownload>();

// Clean up download cache every 10 minutes (keep for 1 hour)
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [id, item] of downloadCache.entries()) {
    if (item.createdAt < cutoff) {
      downloadCache.delete(id);
    }
  }
}, 10 * 60 * 1000);

// Helper: Convert WAV buffer to MP3 buffer using lamejs on the server
function convertWavBufferToMp3Buffer(wavBuffer: Buffer, bitrateKbps: 128 | 160 = 160): Buffer {
  try {
    const { pcmData, sampleRate, channels } = extractPcmFromWav(wavBuffer);
    const pcmInt16 = new Int16Array(
      pcmData.buffer,
      pcmData.byteOffset,
      Math.floor(pcmData.byteLength / 2)
    );

    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrateKbps);
    const mp3Data: Buffer[] = [];
    const sampleBlockSize = 1152;

    for (let i = 0; i < pcmInt16.length; i += sampleBlockSize) {
      const sampleChunk = pcmInt16.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(Buffer.from(mp3buf));
      }
    }

    const mp3End = mp3encoder.flush();
    if (mp3End.length > 0) {
      mp3Data.push(Buffer.from(mp3End));
    }

    return Buffer.concat(mp3Data);
  } catch (err) {
    console.error("Server-side MP3 conversion error, fallback to WAV", err);
    return wavBuffer;
  }
}

// Helper: Call Gemini TTS with high-throughput Flash Lite TTS and automatic retry
async function synthesizeChunkWithRetry(
  chunkText: string,
  styleInstruction: string,
  actualVoiceName: string,
  maxRetries = 2
): Promise<{ buffer: Buffer; modelUsed: string }> {
  // Always use gemini-3.8-flash-lite-tts: designated high-throughput model for narrative TTS
  const model = "gemini-3.8-flash-lite-tts";
  let lastErr: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: chunkText,
                speechMetadata: {
                  style: styleInstruction,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: actualVoiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return { buffer: Buffer.from(base64Audio, "base64"), modelUsed: model };
      }
      throw new Error("No audio content returned in model response");
    } catch (err: any) {
      lastErr = err;
      const isQuotaOrRateLimit =
        err?.message?.includes("429") ||
        err?.message?.includes("quota") ||
        err?.message?.includes("RESOURCE_EXHAUSTED");

      if (isQuotaOrRateLimit && attempt < maxRetries) {
        const delay = 1500 * Math.pow(2, attempt);
        console.warn(`Gemini TTS rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      break;
    }
  }

  throw lastErr || new Error("Failed to generate speech with available TTS model.");
}

// Cache for generated voice samples to ensure instant zero-latency playback
const sampleAudioCache = new Map<string, string>();

// Endpoint to preview voice with a storytelling line
app.get("/api/tts/sample/:voiceName", async (req, res) => {
  try {
    const { voiceName } = req.params;
    const voice = AVAILABLE_VOICES.find(
      (v) => v.name.toLowerCase() === voiceName.toLowerCase()
    );

    if (!voice) {
      return res.status(404).json({ error: "Voice not found" });
    }

    if (sampleAudioCache.has(voice.name)) {
      return res.json({
        success: true,
        voiceName: voice.name,
        audioBase64: sampleAudioCache.get(voice.name),
        sampleText: voice.sampleText,
      });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in the environment.",
      });
    }

    const selectedMode = VOICE_MODES.find((m) => m.id === voice.sampleMode) || VOICE_MODES[0];
    const actualVoiceName = (voice as any).baseVoiceName || voice.name;
    let sampleStyle = selectedMode.stylePrompt;
    if ((voice as any).origin === "indian") {
      sampleStyle = `Authentic native Indian storyteller cadence. Speaks fluent Hindi (हिंदी) and Indian English with natural pronunciation, warm emotional inflection, clear diction, and traditional storytelling warmth. ${selectedMode.stylePrompt}`;
    }

    const { buffer: sampleBuffer } = await synthesizeChunkWithRetry(
      voice.sampleText || "Once upon a time...",
      sampleStyle,
      actualVoiceName
    );

    const base64Audio = sampleBuffer.toString("base64");
    sampleAudioCache.set(voice.name, base64Audio);

    res.json({
      success: true,
      voiceName: voice.name,
      audioBase64: base64Audio,
      sampleText: voice.sampleText,
    });
  } catch (err: any) {
    console.error("Voice sample error:", err);
    let errorMsg = err?.message || "Failed to generate sample voice";
    if (err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
      errorMsg = "Speech quota reached for this model on free tier. Please wait for the daily reset or provide an API key in Secrets.";
    }
    res.status(500).json({ error: errorMsg });
  }
});

// Single or multi-chunk TTS Generation
app.post("/api/tts/generate", async (req, res) => {
  try {
    const { text, title = "Story", voiceName = "Kore", modeId = "bedtime_warm", customStyle = "" } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Story text is required" });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in the environment. Please check the Secrets panel in AI Studio.",
      });
    }

    const targetVoice =
      AVAILABLE_VOICES.find((v) => v.name.toLowerCase() === voiceName.toLowerCase()) ||
      AVAILABLE_VOICES[0];
    const actualVoiceName = (targetVoice as any).baseVoiceName || targetVoice.name;

    const selectedMode = VOICE_MODES.find((m) => m.id === modeId) || VOICE_MODES[0];
    let styleInstruction = customStyle ? `${selectedMode.stylePrompt} Additional direction: ${customStyle}` : selectedMode.stylePrompt;

    if ((targetVoice as any).origin === "indian") {
      styleInstruction = `Authentic native Indian storyteller cadence. Speaks fluent Hindi (हिंदी) and Indian English with natural pronunciation, warm emotional inflection, clear diction, and traditional storytelling warmth. ${styleInstruction}`;
    }

    // Split story text into generous 1,000-word chunks (minimizing API calls and preventing rate limits)
    const chunks = splitStoryIntoChunks(text.trim(), 1000);
    const audioWavBuffers: Buffer[] = [];
    let usedModel = "gemini-3.8-flash-lite-tts";

    // Synthesize each chunk using Gemini 3.8 Flash Lite TTS with automatic retry
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      if (i > 0) {
        // Respect API rate pacing between chunks (300ms pause)
        await new Promise((r) => setTimeout(r, 300));
      }
      const result = await synthesizeChunkWithRetry(chunkText, styleInstruction, actualVoiceName);
      usedModel = result.modelUsed;
      audioWavBuffers.push(result.buffer);
    }

    // Combine chunks
    let finalWavBuffer: Buffer;
    if (audioWavBuffers.length === 1) {
      finalWavBuffer = audioWavBuffers[0];
    } else {
      // Extract PCM data from all chunks and concatenate with a slight natural pause (200ms silence = 9600 bytes at 24kHz 16-bit mono)
      const silenceBytes = 9600;
      const silence = Buffer.alloc(silenceBytes);
      const combinedPcmParts: Buffer[] = [];

      for (let i = 0; i < audioWavBuffers.length; i++) {
        const { pcmData } = extractPcmFromWav(audioWavBuffers[i]);
        combinedPcmParts.push(pcmData);
        if (i < audioWavBuffers.length - 1) {
          combinedPcmParts.push(silence);
        }
      }

      const fullPcm = Buffer.concat(combinedPcmParts);
      finalWavBuffer = buildWavBuffer(fullPcm, 24000, 1, 16);
    }

    // Estimate duration: (wavBuffer length - 44) / (24000 * 2)
    const pcmBytes = Math.max(0, finalWavBuffer.length - 44);
    const estimatedDurationSeconds = pcmBytes / (24000 * 2);

    // Save into server-side download cache for direct 1-click download even in sandboxed iframes
    const audioId = "aud_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const safeTitle = (title || "Story").toLowerCase().replace(/[^a-z0-9]/g, "_");

    downloadCache.set(audioId, {
      buffer: finalWavBuffer,
      mimeType: "audio/wav",
      filename: safeTitle,
      createdAt: Date.now(),
    });

    res.json({
      success: true,
      audioId,
      audioBase64: finalWavBuffer.toString("base64"),
      downloadUrlWav: `/api/tts/download-file/${audioId}?format=wav&filename=${encodeURIComponent(safeTitle + "_master.wav")}`,
      downloadUrlMp3: `/api/tts/download-file/${audioId}?format=mp3&filename=${encodeURIComponent(safeTitle + "_160kbps.mp3")}`,
      mimeType: "audio/wav",
      chunksCount: chunks.length,
      durationSeconds: estimatedDurationSeconds,
      voiceName,
      modeId,
      sampleRate: 24000,
      modelUsed: usedModel,
    });
  } catch (error: any) {
    console.error("TTS generation error:", error);
    let errorMsg = error?.message || "Failed to generate speech. Please try again.";
    if (error?.message?.includes("429") || error?.message?.includes("quota") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      errorMsg = "Gemini Free Tier Quota Reached: Daily speech requests limit reached for this free tier project. Please retry later or provide a custom API key in Secrets.";
    }
    res.status(500).json({
      error: errorMsg,
    });
  }
});

// Cloud Storage API
app.get("/api/cloud-stories", (_req, res) => {
  const stories = loadCloudStories();
  // Return stories without large audio buffer in the list endpoint to save bandwidth
  const summaries = stories.map((s) => ({
    id: s.id,
    title: s.title,
    voiceName: s.voiceName,
    voiceGender: s.voiceGender,
    modeId: s.modeId,
    pitchSemi: s.pitchSemi,
    speed: s.speed,
    durationSeconds: s.durationSeconds,
    createdAt: s.createdAt,
    tags: s.tags,
    textSnippet: s.text.slice(0, 140) + (s.text.length > 140 ? "..." : ""),
    hasAudio: Boolean(s.audioWavBase64),
  }));
  res.json({ stories: summaries });
});

app.get("/api/cloud-stories/:id", (req, res) => {
  const stories = loadCloudStories();
  const story = stories.find((s) => s.id === req.params.id);
  if (!story) {
    return res.status(404).json({ error: "Story not found in cloud storage" });
  }
  res.json({ story });
});

app.post("/api/cloud-stories", (req, res) => {
  try {
    const { title, text, voiceName, voiceGender, modeId, pitchSemi, speed, durationSeconds, audioWavBase64, tags } = req.body;
    if (!title || !text) {
      return res.status(400).json({ error: "Title and text are required" });
    }

    const stories = loadCloudStories();
    const newStory: CloudStory = {
      id: "story_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      title: title.trim(),
      text: text.trim(),
      voiceName: voiceName || "Kore",
      voiceGender: voiceGender || "female",
      modeId: modeId || "bedtime_warm",
      pitchSemi: pitchSemi ?? 0,
      speed: speed ?? 1.0,
      durationSeconds: durationSeconds ?? 0,
      audioWavBase64,
      createdAt: new Date().toISOString(),
      tags: tags || ["Audio Story"],
    };

    stories.unshift(newStory);
    // Keep up to 50 cloud stories
    if (stories.length > 50) {
      stories.splice(50);
    }
    saveCloudStories(stories);

    res.json({ success: true, story: newStory });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save story to cloud storage" });
  }
});

app.delete("/api/cloud-stories/:id", (req, res) => {
  const stories = loadCloudStories();
  const index = stories.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Story not found" });
  }
  stories.splice(index, 1);
  saveCloudStories(stories);
  res.json({ success: true, message: "Story deleted from cloud storage" });
});

// Download Audio Attachment Endpoint (works reliably in sandboxed iframes)
app.post("/api/tts/download", (req, res) => {
  try {
    const { audioBase64, filename = "story_audio.wav", format = "wav" } = req.body;
    if (!audioBase64) {
      return res.status(400).send("No audio data provided");
    }
    const buffer = Buffer.from(audioBase64, "base64");
    const mime = format === "mp3" ? "audio/mpeg" : "audio/wav";
    const safeFilename = filename.endsWith(`.${format}`) ? filename : `${filename}.${format}`;
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(safeFilename)}"`);
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).send("Download processing error");
  }
});

// Direct GET download endpoint with Content-Disposition attachment header
app.get("/api/tts/download-file/:id", (req, res) => {
  try {
    const { id } = req.params;
    const format = (req.query.format as string) === "mp3" ? "mp3" : "wav";
    const requestedName = (req.query.filename as string) || "story_audio";

    const item = downloadCache.get(id);
    if (!item) {
      return res.status(404).send("Download link expired or not found. Please click Convert Story to Speech to generate a fresh master audio file.");
    }

    let outBuffer = item.buffer;
    let outMime = "audio/wav";
    let finalFilename = requestedName;

    if (format === "mp3") {
      outBuffer = convertWavBufferToMp3Buffer(item.buffer, 160);
      outMime = "audio/mpeg";
      if (!finalFilename.toLowerCase().endsWith(".mp3")) {
        finalFilename = finalFilename.replace(/\.[^/.]+$/, "") + ".mp3";
      }
    } else {
      if (!finalFilename.toLowerCase().endsWith(".wav")) {
        finalFilename = finalFilename.replace(/\.[^/.]+$/, "") + ".wav";
      }
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(finalFilename)}"; filename*=UTF-8''${encodeURIComponent(finalFilename)}`
    );
    res.setHeader("Content-Type", outMime);
    res.setHeader("Content-Length", outBuffer.length);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(outBuffer);
  } catch (err: any) {
    console.error("Direct file download error:", err);
    res.status(500).send("Error serving audio download");
  }
});

// Setup Vite or static serving
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FableVoice server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
