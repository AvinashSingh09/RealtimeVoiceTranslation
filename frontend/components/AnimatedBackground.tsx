"use client";

import React, { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        const linesCount = 20;

        const draw = () => {
            // Dark background clearing with trailing effect
            ctx.fillStyle = 'rgba(10, 10, 15, 0.4)'; // Match var(--background) with trail
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.globalCompositeOperation = 'lighter';

            for (let i = 0; i < linesCount; i++) {
                ctx.beginPath();

                const lineSpacing = i / linesCount;

                // Using slightly varied steps for performance
                for (let x = 0; x <= canvas.width; x += 5) {
                    // Create fluid, organic wave movement
                    const mainWave = Math.sin(x * 0.002 + time * 0.01) * (canvas.height * 0.2);
                    const secondaryWave = Math.sin(x * 0.004 - time * 0.015) * (canvas.height * 0.1);

                    // Variation to create 3D ribbon volume effect
                    const volume = Math.sin(x * 0.001 + time * 0.005) * 120 * lineSpacing;
                    const phaseOffset = Math.cos(time * 0.008 + i * 0.15) * 40;

                    const y = (canvas.height / 2) + mainWave + secondaryWave + volume + phaseOffset;

                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }

                // Vary opacity and width to enhance depth
                const alpha = 0.02 + (1 - lineSpacing) * 0.15;
                ctx.strokeStyle = `rgba(212, 160, 23, ${alpha})`; // Gold color matching D4A017
                ctx.lineWidth = 1 + lineSpacing * 1.5;

                // Add glow to specific lines to mimic the reference image
                if (i % 4 === 0) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = 'rgba(212, 160, 23, 0.6)';
                } else {
                    ctx.shadowBlur = 0;
                }

                ctx.stroke();
            }

            ctx.globalCompositeOperation = 'source-over';

            time += 1;
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
            style={{ background: '#0a0a0f' }}
        />
    );
}
