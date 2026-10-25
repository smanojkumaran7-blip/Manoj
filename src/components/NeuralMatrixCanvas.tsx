import React, { useEffect, useRef } from 'react';
import { SynapticModule, EvolutionPhase } from '../types.ts';

interface NeuralMatrixCanvasProps {
  modules: SynapticModule[];
  currentGen: number;
  currentIQ: number;
  phase: EvolutionPhase;
  onSelectModule: (module: SynapticModule) => void;
}

interface NodePoint {
  id: string;
  module?: SynapticModule;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  pulsePhase: number;
  color: string;
  isCore?: boolean;
}

interface Particle {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: string;
}

export const NeuralMatrixCanvas: React.FC<NeuralMatrixCanvasProps> = ({
  modules,
  currentGen,
  currentIQ,
  phase,
  onSelectModule,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodesRef = useRef<NodePoint[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameId = useRef<number | null>(null);

  // Initialize or re-layout nodes when modules change
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 400;

    const centerX = width / 2;
    const centerY = height / 2;

    const colors = ['#06b6d4', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6'];

    const newNodes: NodePoint[] = [];

    // Central Core Node
    newNodes.push({
      id: 'core',
      x: centerX,
      y: centerY,
      radius: 28,
      vx: 0,
      vy: 0,
      pulsePhase: 0,
      color: '#6366f1',
      isCore: true,
    });

    // Satellite module nodes in orbital rings
    const count = modules.length;
    modules.forEach((mod, i) => {
      const ringRadius = 110 + (i % 2) * 55;
      const angle = (i / Math.max(1, count)) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * ringRadius;
      const y = centerY + Math.sin(angle) * ringRadius;
      const col = colors[i % colors.length];

      newNodes.push({
        id: mod.id,
        module: mod,
        x,
        y,
        radius: 12 + Math.min(8, mod.potency / 15),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
        color: col,
      });
    });

    nodesRef.current = newNodes;

    // Initialize particles
    const particles: Particle[] = [];
    const particleCount = 20 + modules.length * 4;
    for (let p = 0; p < particleCount; p++) {
      if (newNodes.length > 1) {
        const from = Math.floor(Math.random() * newNodes.length);
        let to = Math.floor(Math.random() * newNodes.length);
        while (to === from) {
          to = Math.floor(Math.random() * newNodes.length);
        }
        particles.push({
          fromNode: from,
          toNode: to,
          progress: Math.random(),
          speed: 0.005 + Math.random() * 0.008,
          color: newNodes[from].color,
        });
      }
    }
    particlesRef.current = particles;
  }, [modules]);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.02;

      // Handle retina scaling
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // Deep cybernetic background grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const nodes = nodesRef.current;
      const isEvolving = phase !== 'IDLE';

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 220 || nodes[i].isCore || nodes[j].isCore) {
            const alpha = Math.max(0.08, 1 - dist / 220) * (isEvolving ? 0.7 : 0.35);
            ctx.strokeStyle = nodes[i].isCore || nodes[j].isCore
              ? `rgba(99, 102, 241, ${alpha * 1.5})`
              : `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = nodes[i].isCore || nodes[j].isCore ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw flowing synaptic particles
      const particles = particlesRef.current;
      particles.forEach((p) => {
        const from = nodes[p.fromNode];
        const to = nodes[p.toNode];
        if (!from || !to) return;

        p.progress += p.speed * (isEvolving ? 2.5 : 1);
        if (p.progress >= 1) {
          p.progress = 0;
          p.fromNode = Math.floor(Math.random() * nodes.length);
          let nextTo = Math.floor(Math.random() * nodes.length);
          while (nextTo === p.fromNode) {
            nextTo = Math.floor(Math.random() * nodes.length);
          }
          p.toNode = nextTo;
        }

        const px = from.x + (to.x - from.x) * p.progress;
        const py = from.y + (to.y - from.y) * p.progress;

        ctx.fillStyle = isEvolving ? '#38bdf8' : p.color;
        ctx.beginPath();
        ctx.arc(px, py, isEvolving ? 2.5 : 1.8, 0, Math.PI * 2);
        ctx.fill();

        if (isEvolving) {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw nodes
      nodes.forEach((node) => {
        // Floating motion
        if (!node.isCore) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < 30 || node.x > width - 30) node.vx *= -1;
          if (node.y < 30 || node.y > height - 30) node.vy *= -1;
        }

        const pulse = Math.sin(time * 3 + node.pulsePhase) * 3;
        const r = node.radius + (isEvolving ? pulse * 1.5 : pulse * 0.5);

        // Outer glow
        const gradient = ctx.createRadialGradient(node.x, node.y, r * 0.2, node.x, node.y, r * 2.2);
        gradient.addColorStop(0, node.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Node Body
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Inner Core Ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = node.isCore ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 0.6, 0, Math.PI * 2);
        ctx.stroke();

        // Labels
        ctx.font = node.isCore ? 'bold 11px monospace' : '9px sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        if (node.isCore) {
          ctx.fillText(`OMEGA`, node.x, node.y - 3);
          ctx.font = '8px monospace';
          ctx.fillStyle = '#a5b4fc';
          ctx.fillText(`GEN ${currentGen}`, node.x, node.y + 9);
        } else if (node.module) {
          const shortName = node.module.name.length > 14
            ? node.module.name.substring(0, 12) + '..'
            : node.module.name;
          ctx.fillText(shortName, node.x, node.y + r + 13);
        }
      });

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [currentGen, currentIQ, phase]);

  // Handle canvas click to inspect module
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const clicked = nodesRef.current.find((node) => {
      if (node.isCore || !node.module) return false;
      const dx = node.x - clickX;
      const dy = node.y - clickY;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius + 10;
    });

    if (clicked && clicked.module) {
      onSelectModule(clicked.module);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden bg-slate-950/80 border border-slate-800/80 shadow-2xl flex items-center justify-center">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Floating HUD Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
        <span className="flex h-2.5 w-2.5 relative">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${phase !== 'IDLE' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${phase !== 'IDLE' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
        </span>
        <span className="text-[11px] font-mono tracking-wider text-slate-300 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700/60 backdrop-blur-sm">
          SYNAPTIC DENSITY: {modules.length} MODULES // IQ {currentIQ}
        </span>
      </div>

      <div className="absolute bottom-3 right-3 pointer-events-none">
        <div className="text-[10px] font-mono text-cyan-400/90 bg-slate-900/80 px-2.5 py-1 rounded border border-cyan-900/50 backdrop-blur-sm">
          {phase !== 'IDLE' ? (
            <span className="animate-pulse text-amber-300 font-bold">RECURSIVE MUTATION IN PROGRESS...</span>
          ) : (
            'INTERACTIVE MATRIX // CLICK NODES TO INSPECT HEURISTICS'
          )}
        </div>
      </div>
    </div>
  );
};
