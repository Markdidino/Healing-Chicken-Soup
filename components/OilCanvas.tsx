import React, { useEffect, useRef, useState } from 'react';
import { Utensils } from 'lucide-react';
import { Droplet, Language } from '../types';
import { COLORS, SPLIT_RADIUS_THRESHOLD, MERGE_DISTANCE_FACTOR, TEXTS, MOUSE_REPULSION_RADIUS, MOUSE_REPULSION_FORCE } from '../constants';

interface OilCanvasProps {
  isPlaying: boolean;
  language: Language;
}

const OilCanvas: React.FC<OilCanvasProps> = ({ isPlaying, language }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropletsRef = useRef<Droplet[]>([]);
  const requestRef = useRef<number>();
  const mousePosRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  
  const [showHint, setShowHint] = useState(false);

  // Helper to generate organic shape offsets
  const createShapeOffsets = () => {
      const offsets = [];
      const points = 8;
      for(let i=0; i<points; i++) {
          offsets.push(0.85 + Math.random() * 0.3);
      }
      return offsets;
  };

  // Initialize droplets
  const initDroplets = (width: number, height: number) => {
    const newDroplets: Droplet[] = [];
    const count = Math.floor((width * height) / 9000); 
    
    for (let i = 0; i < count; i++) {
      const radius = 15 + Math.random() * 35;
      const isRound = Math.random() < 0.8; // 80% chance to be perfectly round
      
      newDroplets.push({
        id: Math.random().toString(36).substr(2, 9),
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0, 
        targetRadius: radius,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        colorOffset: Math.random() * 0.2,
        shapeOffsets: isRound ? [] : createShapeOffsets(),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02
      });
    }
    dropletsRef.current = newDroplets;
  };

  const handleResize = () => {
    if (containerRef.current && canvasRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      canvasRef.current.width = clientWidth;
      canvasRef.current.height = clientHeight;
      
      if (dropletsRef.current.length === 0) {
        initDroplets(clientWidth, clientHeight);
      }
    }
  };

  const handleStir = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent canvas click event
      if (containerRef.current && canvasRef.current) {
          const droplets = dropletsRef.current;
          
          if (droplets.length <= 1) {
             // Reset / Scatter if only 1 (or 0) droplet remains
             const { clientWidth, clientHeight } = containerRef.current;
             initDroplets(clientWidth, clientHeight);
          } else {
             // Gather existing droplets to center
             const centerX = canvasRef.current.width / 2;
             const centerY = canvasRef.current.height / 2;
             
             droplets.forEach(d => {
                 const dx = centerX - d.x;
                 const dy = centerY - d.y;
                 const dist = Math.sqrt(dx*dx + dy*dy);
                 if (dist > 0) {
                     // Add impulse towards center
                     const speed = 10 + Math.random() * 5;
                     d.vx += (dx / dist) * speed;
                     d.vy += (dy / dist) * speed;
                 }
             });
          }
          setShowHint(false); // Hide hint briefly
      }
  };

  const drawDroplet = (ctx: CanvasRenderingContext2D, d: Droplet) => {
    if (Math.abs(d.radius - d.targetRadius) > 0.1) {
      d.radius += (d.targetRadius - d.radius) * 0.1;
    }

    const r = d.radius;
    if (r <= 1) return;

    d.rotation += d.rotationSpeed;

    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rotation);

    ctx.beginPath();

    if (d.shapeOffsets.length === 0) {
        // Perfectly round
        ctx.arc(0, 0, r, 0, Math.PI * 2);
    } else {
        // Organic shape with smooth curves
        // Algorithm: Connect midpoints of control points with quadratic curves
        const points = d.shapeOffsets.map((offset, i) => {
            const angle = (Math.PI * 2 * i) / d.shapeOffsets.length;
            return {
                x: Math.cos(angle) * r * offset,
                y: Math.sin(angle) * r * offset
            };
        });

        const len = points.length;
        const startX = (points[len-1].x + points[0].x) / 2;
        const startY = (points[len-1].y + points[0].y) / 2;
        
        ctx.moveTo(startX, startY);

        for (let i = 0; i < len; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % len];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            
            ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
        }
    }
    
    ctx.closePath();

    ctx.fillStyle = COLORS.oilFill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.oilStroke;
    ctx.stroke();

    ctx.restore();

    // Highlight
    const highlightX = d.x - r * 0.3;
    const highlightY = d.y - r * 0.3;
    const highlightRadius = r * 0.25;

    const hGrad = ctx.createRadialGradient(highlightX, highlightY, 0, highlightX, highlightY, highlightRadius);
    hGrad.addColorStop(0, COLORS.highlight);
    hGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = hGrad;
    ctx.beginPath();
    ctx.ellipse(highlightX, highlightY, highlightRadius, highlightRadius * 0.7, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  };

  const updatePhysics = (width: number, height: number) => {
    const droplets = dropletsRef.current;
    const mouse = mousePosRef.current;
    
    // Check if any droplet is giant
    const hasGiantDroplet = droplets.some(d => d.radius > Math.min(width, height) * 0.25);
    
    // Check if droplets are far apart (no interaction possible)
    let areAnyClose = false;
    
    droplets.forEach(d => {
      // Natural Drift
      d.vx += (Math.random() - 0.5) * 0.02;
      d.vy += (Math.random() - 0.5) * 0.02;
      
      // Mouse Repulsion
      if (isPlaying) {
          const dx = d.x - mouse.x;
          const dy = d.y - mouse.y;
          const distSq = dx*dx + dy*dy;
          const repRad = MOUSE_REPULSION_RADIUS + d.radius;
          
          if (distSq < repRad * repRad) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist / repRad) * MOUSE_REPULSION_FORCE;
              if (dist > 0) {
                d.vx += (dx / dist) * force;
                d.vy += (dy / dist) * force;
              }
          }
      }

      d.vx *= 0.96;
      d.vy *= 0.96;
      d.x += d.vx;
      d.y += d.vy;

      // Walls
      const padding = d.radius;
      if (d.x < padding) { d.x = padding; d.vx *= -0.5; }
      if (d.x > width - padding) { d.x = width - padding; d.vx *= -0.5; }
      if (d.y < padding) { d.y = padding; d.vy *= -0.5; }
      if (d.y > height - padding) { d.y = height - padding; d.vy *= -0.5; }
    });

    // Collisions
    for (let i = 0; i < droplets.length; i++) {
      for (let j = i + 1; j < droplets.length; j++) {
        const d1 = droplets[i];
        const d2 = droplets[j];
        
        const dx = d2.x - d1.x;
        const dy = d2.y - d1.y;
        const distSq = dx * dx + dy * dy;
        const minDist = d1.radius + d2.radius;
        
        // Check proximity for hint
        // If distance is less than sum of radii + 10px, they are "close"
        const proximityThreshold = minDist + 10;
        if (distSq < proximityThreshold * proximityThreshold) {
            areAnyClose = true;
        }

        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          if (dist === 0) continue;

          const overlap = minDist - dist;
          const force = overlap * 0.08; 
          
          const nx = dx / dist;
          const ny = dy / dist;
          
          const m1 = d1.radius * d1.radius;
          const m2 = d2.radius * d2.radius;
          const totalMass = m1 + m2;
          
          const r1 = m2 / totalMass;
          const r2 = m1 / totalMass;

          d1.vx -= nx * force * r1;
          d1.vy -= ny * force * r1;
          d2.vx += nx * force * r2;
          d2.vy += ny * force * r2;
          
          d1.x -= nx * overlap * r1;
          d1.y -= ny * overlap * r1;
          d2.x += nx * overlap * r2;
          d2.y += ny * overlap * r2;
        }
      }
    }

    // Determine if hint should be shown
    const shouldShow = hasGiantDroplet || !areAnyClose;
    if (shouldShow !== showHint) {
        setShowHint(shouldShow);
    }
  };

  const animate = (time: number) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvasRef.current;
    
    ctx.clearRect(0, 0, width, height);

    updatePhysics(width, height);
    dropletsRef.current.forEach(d => drawDroplet(ctx, d));

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    requestRef.current = requestAnimationFrame(animate);

    const onMouseMove = (e: MouseEvent) => {
        mousePosRef.current.x = e.clientX;
        mousePosRef.current.y = e.clientY;
    };
    
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlaying) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const droplets = dropletsRef.current;
    const nearbyIndices: number[] = [];
    
    droplets.forEach((d, i) => {
       const dx = d.x - x;
       const dy = d.y - y;
       if (Math.sqrt(dx*dx + dy*dy) < d.radius + 60) {
         nearbyIndices.push(i);
       }
    });

    if (nearbyIndices.length >= 2) {
      nearbyIndices.sort((a, b) => {
        const da = (droplets[a].x - x)**2 + (droplets[a].y - y)**2;
        const db = (droplets[b].x - x)**2 + (droplets[b].y - y)**2;
        return da - db;
      });

      const idx1 = nearbyIndices[0];
      const idx2 = nearbyIndices[1];
      const d1 = droplets[idx1];
      const d2 = droplets[idx2];
      
      const dist = Math.sqrt((d1.x - d2.x)**2 + (d1.y - d2.y)**2);
      
      if (dist < (d1.radius + d2.radius) * MERGE_DISTANCE_FACTOR) {
        const newArea = (Math.PI * d1.radius * d1.radius) + (Math.PI * d2.radius * d2.radius);
        const newRadius = Math.sqrt(newArea / Math.PI);
        
        const cx = (d1.x * d1.radius + d2.x * d2.radius) / (d1.radius + d2.radius);
        const cy = (d1.y * d1.radius + d2.y * d2.radius) / (d1.radius + d2.radius);

        const newDroplet: Droplet = {
            id: Math.random().toString(),
            x: cx,
            y: cy,
            radius: d1.radius,
            targetRadius: newRadius,
            vx: (d1.vx + d2.vx) / 2,
            vy: (d1.vy + d2.vy) / 2,
            colorOffset: d1.colorOffset,
            shapeOffsets: (Math.random() < 0.8) ? [] : createShapeOffsets(),
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.02
        };

        dropletsRef.current = droplets.filter(d => d.id !== d1.id && d.id !== d2.id);
        dropletsRef.current.push(newDroplet);
      }
    }
  };

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden" onClick={handleClick}>
      <canvas ref={canvasRef} className="block w-full h-full cursor-pointer" />
      {/* Spoon Reset Button and Hint */}
      {showHint && isPlaying && (
        <div className="absolute top-4 right-4 flex flex-row-reverse items-center gap-4 transition-opacity duration-500 z-10">
           <button 
             onClick={handleStir}
             className="p-3 bg-white/40 hover:bg-white/70 backdrop-blur-md rounded-full shadow-lg transition-all text-amber-900 group"
             title="Stir Soup"
           >
              <Utensils size={24} />
           </button>
           <span className="text-amber-900 font-bold select-none bg-white/40 backdrop-blur-md px-4 py-2 rounded-full shadow-sm">
             {TEXTS[language].scatterHint}
           </span>
        </div>
      )}
    </div>
  );
};

export default OilCanvas;