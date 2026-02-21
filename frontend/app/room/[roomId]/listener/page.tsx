"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '../../../../hooks/useWebSocket';
import { LanguageSelector } from '../../../../components/LanguageSelector';
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';
import { AlertTriangle } from 'lucide-react';

export default function ListenerPage({ params }: { params: Promise<{ roomId: string }> }) {
    const resolvedParams = React.use(params);
    const roomId = resolvedParams.roomId;

    const [targetLang, setTargetLang] = useState('hi-IN');
    const [translatedText, setTranslatedText] = useState('');
    const [config, setConfig] = useState<any>(null);
    const [error, setError] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    const audioQueueRef = useRef<Blob[]>([]);
    const isPlayingQueue = useRef(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const hostname = window.location.hostname;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || `http://${hostname}:8080`;
        fetch(`${apiUrl}/api/rooms/${roomId}`)
            .then(res => res.json())
            .then(setConfig).catch(() => setError('Room not found or not set by Admin'));
    }, [roomId]);

    const playNextInQueue = useCallback(async () => {
        if (audioQueueRef.current.length === 0) { isPlayingQueue.current = false; return; }
        isPlayingQueue.current = true;
        const blob = audioQueueRef.current.shift();
        if (!blob || !audioRef.current) { isPlayingQueue.current = false; return; }

        audioRef.current.src = URL.createObjectURL(blob);
        try {
            await audioRef.current.play();
        } catch (err) {
            console.error('Audio playback failed (likely iOS block):', err);
            isPlayingQueue.current = false;
            playNextInQueue(); // Try to skip and continue
        }
    }, []);

    const baseWsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8080/ws`;

    const ws = useWebSocket({
        url: config ? `${baseWsUrl}/translate?roomId=${roomId}&role=listener&source=en-US&target=${targetLang}&voice=${config.voiceModel}&gender=${config.voiceGender}&prompt=${encodeURIComponent(config.voicePrompt)}` : '',
        onMessage: useCallback((e: MessageEvent) => {
            if (typeof e.data === 'string' && e.data.startsWith('TRANSLATION:')) {
                setTranslatedText(prev => (prev + " " + e.data.replace('TRANSLATION:', '')).trim());
            } else if (e.data instanceof Blob) {
                audioQueueRef.current.push(e.data);
                if (!isPlayingQueue.current) playNextInQueue();
            }
        }, [playNextInQueue]),
    });

    const joinBroadcast = () => {
        if (!config) return;
        setTranslatedText('');

        // Initialize and unlock the persistent audio element synchronously inside the click handler to bypass iOS Safari auto-play restrictions
        if (audioRef.current) {
            audioRef.current.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
            audioRef.current.play().catch(() => { });
        }

        ws.connect();
        setIsConnected(true);
    };

    // Loading state
    if (!config) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
            <div className="flex items-center gap-3 text-zinc-500">
                <svg className="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="font-medium text-sm">Loading room configuration...</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col surface-base relative overflow-hidden">
            <AnimatedBackground />
            <Navbar roomId={roomId as string} role="Listener" />

            <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 z-10 relative">
                <div className="w-full max-w-3xl space-y-8 flex flex-col items-center">

                    {/* Header Text & Language Selection */}
                    <div className="flex flex-col items-center justify-center text-center gap-6">
                        <div className="space-y-3">
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-100">
                                Live <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-transparent bg-clip-text">Translation</span>
                            </h1>
                            <p className="text-zinc-400">Join the room to hear the broadcast in your preferred language.</p>
                        </div>

                        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
                            <div className="w-48"><LanguageSelector label="" value={targetLang} onChange={setTargetLang} /></div>
                        </div>
                    </div>

                    {/* Connect / Status */}
                    {!isConnected ? (
                        <button onClick={joinBroadcast}
                            className="w-full max-w-sm py-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold rounded-2xl shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 text-lg">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9.172 15.828a5 5 0 010-7.071m5.656 0a5 5 0 010 7.071M12 12h.01" />
                            </svg>
                            Connect to Broadcast
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 px-5 py-3 surface-elevated border-yellow-500/20 rounded-2xl backdrop-blur-md">
                            <div className="status-dot status-dot-live shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                            <span className="text-sm font-semibold text-yellow-400 tracking-wide">Connected — receiving translations in real-time</span>
                        </div>
                    )}

                    {/* Translation Display */}
                    <div className="w-full surface-card glow-gold p-8 flex flex-col h-[400px] sm:h-[500px] relative overflow-hidden mt-4">
                        {isConnected && <div className="absolute inset-0 bg-yellow-500/5 animate-glow pointer-events-none" />}

                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                            <div className={`status-dot ${isConnected ? 'status-dot-live shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse' : 'status-dot-idle'}`} />
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Real-Time Translation</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 sm:px-4">
                            <p className="text-2xl sm:text-3xl leading-relaxed text-zinc-100 font-semibold tracking-wide">
                                {translatedText || (
                                    <span className="text-zinc-500 font-normal text-lg sm:text-xl">
                                        {isConnected ? 'Waiting for the speaker to begin...' : 'Connect to start receiving translations'}
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Audio wave indicator */}
                        {isConnected && translatedText && (
                            <div className="flex items-center justify-center gap-1 pt-6 border-t border-white/10 mt-6 relative shrink-0">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                                    <div key={i} className="w-1.5 bg-yellow-400/80 rounded-full animate-soundwave shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                                        style={{ height: '16px', animationDelay: `${i * 0.1}s`, animationDuration: `${0.7 + i * 0.08}s` }} />
                                ))}
                                <span className="absolute bg-black/50 px-3 py-1 rounded-full text-[10px] text-yellow-400 font-bold tracking-widest uppercase border border-yellow-500/20 backdrop-blur-sm -top-3">
                                    Incoming Audio
                                </span>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-4 bg-red-400/10 border border-red-400/20 text-red-400 text-sm font-medium rounded-xl flex items-center gap-3 w-full backdrop-blur-md">
                            <AlertTriangle className="w-4 h-4 min-w-[16px]" /><span>{error}</span>
                        </div>
                    )}
                </div>
            </main>

            {/* Hidden audio element for Safari compatibility */}
            <audio ref={audioRef} className="hidden" playsInline onEnded={playNextInQueue} />
        </div>
    );
}
