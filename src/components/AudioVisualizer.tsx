import React, { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyser,
  isPlaying,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);

        const barCount = 48;
        const barWidth = width / barCount - 2;
        let x = 1;

        for (let i = 0; i < barCount; i++) {
          const sampleIndex = Math.floor((i / barCount) * (bufferLength / 1.5));
          const value = dataArray[sampleIndex] || 0;
          const percent = value / 255;
          const barHeight = Math.max(4, percent * (height - 8));

          // Radiant gradient from amber-400 to violet-500
          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, "rgba(245, 158, 11, 0.4)");
          gradient.addColorStop(0.6, "rgba(251, 191, 36, 0.9)");
          gradient.addColorStop(1, "rgba(168, 85, 247, 1)");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, Math.max(2, barWidth), barHeight, [2, 2, 0, 0]);
          ctx.fill();

          x += barWidth + 2;
        }
      } else {
        // Idle gentle wave
        const time = Date.now() * 0.002;
        ctx.strokeStyle = "rgba(245, 158, 11, 0.25)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const midY = height / 2;

        for (let x = 0; x < width; x += 4) {
          const wave = Math.sin(x * 0.03 + time) * 3 + Math.sin(x * 0.01 - time * 0.5) * 2;
          if (x === 0) {
            ctx.moveTo(x, midY + wave);
          } else {
            ctx.lineTo(x, midY + wave);
          }
        }
        ctx.stroke();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, isPlaying]);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-950/80 border border-slate-800/80 ${className}`}>
      <canvas
        ref={canvasRef}
        width={600}
        height={90}
        className="w-full h-full block"
      />
      <div className="absolute top-2 right-3 flex items-center gap-1.5 pointer-events-none">
        <span
          className={`w-2 h-2 rounded-full ${
            isPlaying ? "bg-amber-400 animate-pulse" : "bg-slate-600"
          }`}
        />
        <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">
          {isPlaying ? "Live 24kHz Acoustic Signal" : "Engine Ready"}
        </span>
      </div>
    </div>
  );
};
