"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '../../../../hooks/useWebSocket';
import { LanguageSelector } from '../../../../components/LanguageSelector';

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
        if (!blob) return;
        const audio = new Audio(URL.createObjectURL(blob));
        audio.onended = () => playNextInQueue();
        try { await audio.play(); } catch { isPlayingQueue.current = false; }
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
        <div className="min-h-screen flex flex-col">
            {/* Status Bar */}
            <div className={`h-1 transition-all duration-500 ${isConnected ? 'accent-border-gold' : 'bg-zinc-800'}`} />

            <main className="flex-1 flex flex-col items-center px-6 py-10">
                <div className="w-full max-w-4xl space-y-8">
                    {/* Top Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-zinc-100">Listener Station</h1>
                                <p className="text-xs text-zinc-500 font-mono">Room: {roomId}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-48"><LanguageSelector label="" value={targetLang} onChange={setTargetLang} /></div>
                        </div>
                    </div>

                    {/* Connect / Status */}
                    {!isConnected ? (
                        <button onClick={joinBroadcast}
                            className="w-full py-5 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-black font-bold rounded-2xl shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 text-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9.172 15.828a5 5 0 010-7.071m5.656 0a5 5 0 010 7.071M12 12h.01" />
                            </svg>
                            Connect to Broadcast
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 px-5 py-3 surface-card">
                            <div className="status-dot status-dot-live" />
                            <span className="text-sm font-semibold text-yellow-400">Connected — receiving translations in real-time</span>
                        </div>
                    )}

                    {/* Translation Display */}
                    <div className="surface-card p-8 flex flex-col min-h-[400px] relative overflow-hidden">
                        {isConnected && <div className="absolute inset-0 bg-yellow-500/3 pointer-events-none" />}

                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/60">
                            <div className={`status-dot ${isConnected ? 'status-dot-live' : 'status-dot-idle'}`} />
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Real-Time Translation</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <p className="text-2xl leading-relaxed text-zinc-100 font-semibold">
                                {translatedText || (
                                    <span className="text-zinc-600 italic font-normal text-lg">
                                        {isConnected ? 'Waiting for the speaker to begin...' : 'Connect to start receiving translations'}
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Audio wave indicator */}
                        {isConnected && translatedText && (
                            <div className="flex items-center gap-1 pt-4 border-t border-zinc-800/60 mt-4">
                                {[0, 1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="w-1 bg-yellow-400/60 rounded-full animate-soundwave"
                                        style={{ height: '16px', animationDelay: `${i * 0.1}s`, animationDuration: `${0.7 + i * 0.08}s` }} />
                                ))}
                                <span className="text-xs text-zinc-600 ml-3 font-medium">Receiving audio</span>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-4 bg-red-400/10 border border-red-400/20 text-red-400 text-sm font-medium rounded-xl flex items-center gap-3">
                            <span>⚠</span><span>{error}</span>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
