'use client';

import { useEffect, useRef } from 'react';

// Monkeypatch history state manipulation to prevent "Converting circular structure to JSON"
// in iframe environments (like sandboxes) that intercept pushState/replaceState.
if (typeof window !== 'undefined') {
  // Monkeypatch JSON.stringify to handle circular structures and DOM nodes/React fibers gracefully
  // as sandbox preview containers or window messaging listeners can trigger serialization errors.
  const originalStringify = JSON.stringify;
  JSON.stringify = function (value: any, replacer?: any, space?: any): string {
    try {
      return originalStringify(value, replacer, space);
    } catch (err) {
      const seen = new WeakSet();
      const safeReplacer = function (key: string, val: any) {
        if (val === null || typeof val !== 'object') {
          if (typeof val === 'bigint') {
            return val.toString();
          }
          return val;
        }
        if (seen.has(val)) {
          return '[Circular]';
        }
        if (
          val instanceof Node || 
          (val && typeof val.nodeType === 'number') || 
          val === window || 
          val === document ||
          (val && val.constructor && val.constructor.name && (
            val.constructor.name.includes('Element') ||
            val.constructor.name.includes('Fiber') ||
            val.constructor.name.includes('Window') ||
            val.constructor.name.includes('Document')
          )) ||
          Object.keys(val).some(k => k.startsWith('__reactFiber') || k.startsWith('__reactEvents'))
        ) {
          return `[Unserializable: ${val.nodeName || val.constructor?.name || 'Object'}]`;
        }
        seen.add(val);
        if (replacer) {
          try {
            return replacer(key, val);
          } catch (e) {
            return val;
          }
        }
        return val;
      };
      try {
        return originalStringify(value, safeReplacer, space);
      } catch (e2) {
        return '"[Unserializable Object]"';
      }
    }
  };

  const safeClone = (obj: any, seen = new WeakSet()): any => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (seen.has(obj)) {
      return null;
    }
    // If it looks like a DOM node, window, or has React internal fiber properties, omit it.
    if (
      obj instanceof Node || 
      (obj && typeof obj.nodeType === 'number') || 
      obj === window || 
      obj === document ||
      Object.keys(obj).some(k => k.startsWith('__reactFiber') || k.startsWith('__reactEvents'))
    ) {
      return null;
    }
    
    seen.add(obj);
    
    if (Array.isArray(obj)) {
      return obj.map(item => safeClone(item, seen));
    }
    
    const clone: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        try {
          clone[key] = safeClone(obj[key], seen);
        } catch (e) {
          // ignore
        }
      }
    }
    return clone;
  };

  const wrapHistoryMethod = (methodName: 'pushState' | 'replaceState') => {
    const original = (window.history as any)[methodName];
    if (original && !(original as any).__isSafePatched) {
      const patched = function(this: any, state: any, title: string, url?: string | null) {
        let safeState = state;
        try {
          safeState = safeClone(state);
        } catch (e) {
          console.warn(`[History Patch] Failed to safeClone state:`, e);
        }
        return original.call(this, safeState, title, url);
      };
      (patched as any).__isSafePatched = true;
      (window.history as any)[methodName] = patched;
    }
  };

  wrapHistoryMethod('pushState');
  wrapHistoryMethod('replaceState');
}

const DisableFeatures = () => {
  useEffect(() => {
    const preventPinchZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchstart', preventPinchZoom, { passive: false });

    const preventKeyboardZoom = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && 
          (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', preventKeyboardZoom);

    const preventScrollZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    document.addEventListener('wheel', preventScrollZoom, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventPinchZoom);
      document.removeEventListener('keydown', preventKeyboardZoom);
      document.removeEventListener('wheel', preventScrollZoom);
    };
  }, []);

  return null;
};

export default function BackgroundEffects() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const initStarSystem = (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const setSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      setSize();
      window.addEventListener('resize', setSize);
      
      const stars: any[] = [];
      
      class StarParticle {
        x: number; y: number; size: number; opacity: number; fadeDirection: 'IN' | 'OUT';
        constructor() {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.size = Math.random() * 2 + 1;
          this.opacity = 0;
          this.fadeDirection = 'IN';
        }
        update() {
          if (this.fadeDirection === 'IN') {
            this.opacity += 0.01;
            if (this.opacity >= 0.8) this.fadeDirection = 'OUT';
          } else {
            this.opacity -= 0.01;
          }
        }
        draw() {
          if (!ctx) return;
          ctx.save(); ctx.translate(this.x, this.y); ctx.beginPath();
          const s = this.size;
          ctx.moveTo(0, -s); ctx.quadraticCurveTo(0, 0, s, 0); ctx.quadraticCurveTo(0, 0, 0, s); ctx.quadraticCurveTo(0, 0, -s, 0); ctx.quadraticCurveTo(0, 0, 0, -s);
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, this.opacity)})`;
          ctx.shadowBlur = 4; ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
          ctx.fill(); ctx.restore();
        }
      }
      
      let animId: number;
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (Math.random() < 0.05) stars.push(new StarParticle()); 
        for (let i = stars.length - 1; i >= 0; i--) {
          const s = stars[i];
          s.update(); s.draw();
          if (s.opacity <= 0 && s.fadeDirection === 'OUT') stars.splice(i, 1);
        }
        animId = requestAnimationFrame(animate);
      };
      animate();
      
      return () => {
        window.removeEventListener('resize', setSize);
        cancelAnimationFrame(animId);
      };
    };
    
    const cleanupBg = bgCanvasRef.current ? initStarSystem(bgCanvasRef.current) : undefined;
    const cleanupFg = fgCanvasRef.current ? initStarSystem(fgCanvasRef.current) : undefined;
    
    return () => {
      if (cleanupBg) cleanupBg();
      if (cleanupFg) cleanupFg();
    };
  }, []);

  return (
    <>
      <DisableFeatures />
      
      <div 
        className="fixed inset-0 w-full h-full pointer-events-none z-[-1]"
        style={{
          backgroundColor: '#320B0B', 
          backgroundImage: `
            radial-gradient(circle at 0% 0%, rgba(255, 80, 80, 0.25) 0%, rgba(120, 20, 20, 0.1) 40%, transparent 60%),
            radial-gradient(circle at 100% 100%, rgba(255, 215, 0, 0.15) 0%, rgba(120, 80, 0, 0.1) 40%, transparent 60%)
          `,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover'
        }}
      >
        <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full" />
      </div>
      
      <canvas ref={fgCanvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-50" />
    </>
  );
}

// sync
