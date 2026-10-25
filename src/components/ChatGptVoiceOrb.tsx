import React, { useEffect, useRef } from 'react';
import { Volume2, Mic, MicOff, Sparkles, Radio } from 'lucide-react';

interface ChatGptVoiceOrbProps {
  isListening: boolean;
  isSpeaking: boolean;
  volumeLevel: number; // 0 to 1
  size?: 'sm' | 'md' | 'lg';
  statusText?: string;
  onClick?: () => void;
  className?: string;
  micDenied?: boolean;
}

export const ChatGptVoiceOrb: React.FC<ChatGptVoiceOrbProps> = ({
  isListening,
  isSpeaking,
  volumeLevel,
  size = 'md',
  statusText,
  onClick,
  className = '',
  micDenied = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const smoothedVolRef = useRef<number>(0);

  // Dimension settings based on size prop
  const dimensions = {
    sm: { width: 140, height: 140, baseRadius: 26, dotSize: 7 },
    md: { width: 220, height: 220, baseRadius: 42, dotSize: 11 },
    lg: { width: 280, height: 280, baseRadius: 56, dotSize: 14 },
  }[size];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Smooth volume transitions
      const targetVol = isSpeaking ? Math.max(0.35, volumeLevel * 1.4) : isListening ? Math.max(0.12, volumeLevel * 1.5) : 0.05;
      smoothedVolRef.current += (targetVol - smoothedVolRef.current) * 0.15;
      const vol = smoothedVolRef.current;

      // Advance animation phase
      const speed = isSpeaking ? 0.045 : isListening ? 0.03 : 0.015;
      phaseRef.current += speed;
      const phase = phaseRef.current;

      // Draw background ambient holographic glow
      const glowGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        dimensions.baseRadius * 0.3,
        centerX,
        centerY,
        dimensions.baseRadius * (1.8 + vol * 0.8)
      );

      if (micDenied) {
        glowGradient.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
        glowGradient.addColorStop(0.5, 'rgba(185, 28, 28, 0.1)');
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (isSpeaking) {
        glowGradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
        glowGradient.addColorStop(0.4, 'rgba(99, 102, 241, 0.2)');
        glowGradient.addColorStop(0.8, 'rgba(168, 85, 247, 0.08)');
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (isListening) {
        glowGradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
        glowGradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.15)');
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        glowGradient.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
        glowGradient.addColorStop(0.6, 'rgba(30, 58, 138, 0.05)');
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, dimensions.baseRadius * (2.2 + vol), 0, Math.PI * 2);
      ctx.fill();

      // Draw futuristic orbital radar rings (holographic cybernetic model)
      ctx.save();
      ctx.translate(centerX, centerY);

      // Outer dashed tech ring
      ctx.rotate(phase * 0.35);
      ctx.beginPath();
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = isSpeaking
        ? 'rgba(34, 211, 238, 0.45)'
        : isListening
        ? 'rgba(52, 211, 153, 0.4)'
        : 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1.2;
      ctx.arc(0, 0, dimensions.baseRadius * 1.55 + vol * 12, 0, Math.PI * 2);
      ctx.stroke();

      // Middle counter-rotating accented arc ring
      ctx.rotate(-phase * 0.7);
      ctx.beginPath();
      ctx.setLineDash([24, 16, 8, 16]);
      ctx.strokeStyle = isSpeaking
        ? 'rgba(129, 140, 248, 0.5)'
        : isListening
        ? 'rgba(34, 211, 238, 0.4)'
        : 'rgba(148, 163, 184, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.arc(0, 0, dimensions.baseRadius * 1.35 + vol * 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // ========================================================
      // CHATGPT ICONIC FLUID MORPHING DOTS CLUSTER (4-5 Fluid Orbiting Dots)
      // ========================================================
      // ChatGPT voice features 4-5 fluidly moving, pulsing morphing dots
      // that dance organically and merge/expand with vocal input.
      const dotCount = 5;
      const dotPositions: { x: number; y: number; r: number; color: string; glowColor: string }[] = [];

      // Color palettes for dots
      const colorPalettes = isSpeaking
        ? [
            { fill: '#22d3ee', glow: 'rgba(34, 211, 238, 0.9)' },   // Cyan
            { fill: '#38bdf8', glow: 'rgba(56, 189, 248, 0.9)' },   // Sky Blue
            { fill: '#818cf8', glow: 'rgba(129, 140, 248, 0.9)' },  // Indigo
            { fill: '#a855f7', glow: 'rgba(168, 85, 247, 0.85)' },  // Purple
            { fill: '#34d399', glow: 'rgba(52, 211, 153, 0.85)' },  // Emerald
          ]
        : isListening
        ? [
            { fill: '#34d399', glow: 'rgba(52, 211, 153, 0.95)' },  // Emerald
            { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.9)' },   // Green
            { fill: '#22d3ee', glow: 'rgba(34, 211, 238, 0.9)' },   // Cyan
            { fill: '#6ee7b7', glow: 'rgba(110, 231, 183, 0.85)' }, // Light green
            { fill: '#38bdf8', glow: 'rgba(56, 189, 248, 0.85)' },  // Sky
          ]
        : [
            { fill: '#38bdf8', glow: 'rgba(56, 189, 248, 0.7)' },
            { fill: '#818cf8', glow: 'rgba(129, 140, 248, 0.65)' },
            { fill: '#22d3ee', glow: 'rgba(34, 211, 238, 0.7)' },
            { fill: '#60a5fa', glow: 'rgba(96, 165, 250, 0.65)' },
            { fill: '#93c5fd', glow: 'rgba(147, 197, 253, 0.6)' },
          ];

      for (let i = 0; i < dotCount; i++) {
        // Individualized organic angular motion (ChatGPT fluid math)
        const baseAngle = (i * (2 * Math.PI)) / dotCount;
        const waveOffset1 = Math.sin(phase * 1.6 + i * 1.3) * 0.45;
        const waveOffset2 = Math.cos(phase * 2.1 + i * 0.9) * 0.35;
        const angle = baseAngle + waveOffset1;

        // Dynamic radial displacement based on audio reactivity & speaking state
        const breathingDist = Math.sin(phase * 2.2 + i * 1.8) * (dimensions.baseRadius * 0.18);
        const audioExpansion = vol * dimensions.baseRadius * 0.85;
        const radius = dimensions.baseRadius * 0.65 + breathingDist + audioExpansion;

        const x = centerX + Math.cos(angle) * radius + waveOffset2 * 8;
        const y = centerY + Math.sin(angle) * radius + waveOffset1 * 8;

        // Dynamic dot pulse size
        const dotPulse = Math.sin(phase * 2.8 + i * 1.4) * 2;
        const dynamicDotRadius = Math.max(
          4,
          dimensions.dotSize + dotPulse + vol * dimensions.dotSize * 0.8
        );

        const palette = colorPalettes[i % colorPalettes.length];
        dotPositions.push({
          x,
          y,
          r: dynamicDotRadius,
          color: palette.fill,
          glowColor: palette.glow,
        });
      }

      // Draw connective fluid neural filaments between dots
      ctx.save();
      for (let i = 0; i < dotPositions.length; i++) {
        for (let j = i + 1; j < dotPositions.length; j++) {
          const p1 = dotPositions[i];
          const p2 = dotPositions[j];
          const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const maxDist = dimensions.baseRadius * 2.4;

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * (isSpeaking ? 0.45 : isListening ? 0.35 : 0.18);
            ctx.beginPath();
            ctx.strokeStyle = isSpeaking
              ? `rgba(34, 211, 238, ${alpha})`
              : isListening
              ? `rgba(52, 211, 153, ${alpha})`
              : `rgba(96, 165, 250, ${alpha})`;
            ctx.lineWidth = isSpeaking ? 1.8 : 1.2;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // Central morphing core aura
      const centerPulse = Math.sin(phase * 3.2) * 3;
      const centerCoreRadius = (dimensions.dotSize * 1.1) + centerPulse + vol * 8;
      const coreGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        centerCoreRadius * 1.6
      );
      if (isSpeaking) {
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.3, '#38bdf8');
        coreGradient.addColorStop(0.8, '#6366f1');
        coreGradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
      } else if (isListening) {
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.3, '#34d399');
        coreGradient.addColorStop(0.8, '#06b6d4');
        coreGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      } else {
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.4, '#38bdf8');
        coreGradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
      }

      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, centerCoreRadius, 0, Math.PI * 2);
      ctx.fill();

      // Render each animated fluid dot with multi-layer high-glow
      dotPositions.forEach((dot) => {
        ctx.save();
        ctx.shadowColor = dot.glowColor;
        ctx.shadowBlur = isSpeaking ? 18 : isListening ? 14 : 9;

        // Outer glow circle
        ctx.beginPath();
        ctx.fillStyle = dot.color;
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fill();

        // Inner white specular highlight for authentic 3D sphere look
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.arc(dot.x - dot.r * 0.28, dot.y - dot.r * 0.28, dot.r * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isListening, isSpeaking, volumeLevel, dimensions, micDenied]);

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center select-none ${
        onClick ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      {/* Futuristic Cybernetic Frame HUD Bracket Corners */}
      <div className="relative p-1">
        {/* Top-Left Bracket */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400/80 pointer-events-none transition-all group-hover:w-5 group-hover:h-5 group-hover:border-cyan-300" />
        {/* Top-Right Bracket */}
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400/80 pointer-events-none transition-all group-hover:w-5 group-hover:h-5 group-hover:border-cyan-300" />
        {/* Bottom-Left Bracket */}
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400/80 pointer-events-none transition-all group-hover:w-5 group-hover:h-5 group-hover:border-cyan-300" />
        {/* Bottom-Right Bracket */}
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400/80 pointer-events-none transition-all group-hover:w-5 group-hover:h-5 group-hover:border-cyan-300" />

        {/* Ambient Holographic Halo Backlight */}
        <div
          className={`absolute inset-0 rounded-2xl filter blur-xl opacity-35 transition-all duration-300 ${
            micDenied
              ? 'bg-rose-500'
              : isSpeaking
              ? 'bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 opacity-60 animate-pulse'
              : isListening
              ? 'bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 opacity-55 animate-pulse'
              : 'bg-cyan-500/30'
          }`}
        />

        {/* Canvas Holding ChatGPT Fluid Animated Dots */}
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="relative z-10 block rounded-xl"
        />

        {/* Futuristic Floating Telemetry Pill */}
        <div className="absolute bottom-2 inset-x-0 flex items-center justify-center z-20 pointer-events-none">
          <div
            className={`px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider font-bold flex items-center gap-1.5 backdrop-blur-md border shadow-lg ${
              micDenied
                ? 'bg-rose-950/80 text-rose-300 border-rose-600/70'
                : isSpeaking
                ? 'bg-cyan-950/80 text-cyan-200 border-cyan-400/70 shadow-cyan-950/50 animate-pulse'
                : isListening
                ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/70 shadow-emerald-950/50 animate-pulse'
                : 'bg-slate-900/80 text-slate-400 border-slate-700/80'
            }`}
          >
            {isSpeaking ? (
              <>
                <Volume2 className="w-2.5 h-2.5 text-cyan-300 animate-bounce" />
                <span>AI Speaking</span>
              </>
            ) : isListening ? (
              <>
                <Mic className="w-2.5 h-2.5 text-emerald-300 animate-ping" />
                <span>Listening Live</span>
              </>
            ) : micDenied ? (
              <>
                <MicOff className="w-2.5 h-2.5 text-rose-400" />
                <span>Mic Blocked</span>
              </>
            ) : (
              <>
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                <span>ChatGPT Voice Mode</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sub-text / status readout if provided */}
      {statusText && (
        <div className="mt-2 text-center max-w-xs">
          <p className="text-[11px] font-mono text-cyan-300 tracking-wide font-medium">
            {statusText}
          </p>
        </div>
      )}
    </div>
  );
};
