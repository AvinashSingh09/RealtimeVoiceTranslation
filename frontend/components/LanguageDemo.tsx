"use client";

import React, { useState, useRef, useEffect } from 'react';

type AudioDemo = {
    id: string;
    label: string;
    language: string;
    src: string;
    isPrimary?: boolean;
};

const demos: AudioDemo[] = [
    { id: 'en', label: 'English', language: 'Original', src: '/audio/demo-en.mp3', isPrimary: true },
    { id: 'hi', label: 'Hindi', language: 'Translation', src: '/audio/demo-hi.mp3' },
    { id: 'mr', label: 'Marathi', language: 'Translation', src: '/audio/demo-mr.mp3' },
];

export default function LanguageDemo() {
    const [activeAudio, setActiveAudio] = useState<string | null>(null);
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
    const [progress, setProgress] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        // Initialize progress for all demos
        const initialProgress = demos.reduce((acc, demo) => ({ ...acc, [demo.id]: 0 }), {});
        setProgress(initialProgress);
    }, []);

    const togglePlay = (id: string) => {
        const audio = audioRefs.current[id];
        if (!audio) return;

        if (activeAudio === id) {
            audio.pause();
            setActiveAudio(null);
        } else {
            // Stop currently playing
            if (activeAudio && audioRefs.current[activeAudio]) {
                audioRefs.current[activeAudio]?.pause();
            }
            audio.play().catch(e => console.warn("Audio playback failed:", e));
            setActiveAudio(id);
        }
    };

    const handleTimeUpdate = (id: string) => {
        const audio = audioRefs.current[id];
        if (!audio || !audio.duration) return;
        setProgress((prev) => ({
            ...prev,
            [id]: (audio.currentTime / audio.duration) * 100,
        }));
    };

    const handleEnded = (id: string) => {
        setActiveAudio(null);
        setProgress((prev) => ({ ...prev, [id]: 0 }));
    };

    return (
        <div className="w-full max-w-sm xl:max-w-md mx-auto surface-card p-6 xl:p-8 space-y-6 relative overflow-hidden group">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[50px] rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-150" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-150" />

            <div className="relative z-10 space-y-2">
                <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Experience Real-Time
                </h3>
                <p className="text-sm text-zinc-400">Listen to how seamless the AI translation sounds across languages.</p>
            </div>

            <div className="relative z-10 space-y-4">
                {demos.map((demo) => {
                    const isPlaying = activeAudio === demo.id;
                    return (
                        <div key={demo.id} className="relative group/btn">
                            <audio
                                ref={(el) => { audioRefs.current[demo.id] = el; }}
                                src={demo.src}
                                onTimeUpdate={() => handleTimeUpdate(demo.id)}
                                onEnded={() => handleEnded(demo.id)}
                            />

                            <button
                                onClick={() => togglePlay(demo.id)}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 relative overflow-hidden
                                    ${demo.isPrimary
                                        ? 'bg-zinc-800/80 hover:bg-zinc-800 border-zinc-700 hover:border-zinc-600 shadow-md shadow-black/20'
                                        : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
                                    }
                                    ${isPlaying ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20 ring-1 ring-yellow-500/30' : ''}
                                `}
                            >
                                {/* Progress Bar Background */}
                                <div
                                    className="absolute inset-0 bg-yellow-500/5 transition-all duration-100 ease-linear pointer-events-none"
                                    style={{ width: `${progress[demo.id] || 0}%` }}
                                />

                                {/* Play/Pause Icon Container */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 z-10
                                    ${isPlaying ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-400 group-hover/btn:bg-zinc-700 group-hover/btn:text-zinc-200'}
                                    ${demo.isPrimary && !isPlaying ? 'bg-zinc-700/80 text-zinc-300' : ''}
                                `}>
                                    {isPlaying ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <rect x="6" y="4" width="4" height="16" rx="1" />
                                            <rect x="14" y="4" width="4" height="16" rx="1" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    )}
                                </div>

                                {/* Text Content */}
                                <div className="flex-1 text-left z-10">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-zinc-100">{demo.label}</span>
                                        {demo.isPrimary && (
                                            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-zinc-800 text-zinc-400 rounded-md">
                                                {demo.language}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-sm transition-colors duration-300 ${isPlaying ? 'text-yellow-400/80' : 'text-zinc-500'}`}>
                                        {isPlaying ? (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <span className="w-1 h-3 bg-yellow-500 rounded-full animate-soundwave [animation-delay:0s]"></span>
                                                <span className="w-1 h-4 bg-yellow-500 rounded-full animate-soundwave [animation-delay:0.2s]"></span>
                                                <span className="w-1 h-2 bg-yellow-500 rounded-full animate-soundwave [animation-delay:0.4s]"></span>
                                                <span className="w-1 h-4 bg-yellow-500 rounded-full animate-soundwave [animation-delay:0.6s]"></span>
                                                <span className="ml-1 text-xs">Playing...</span>
                                            </div>
                                        ) : (
                                            !demo.isPrimary ? demo.language : 'Listen to source'
                                        )}
                                    </span>
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
