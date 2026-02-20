"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useWebSocket } from '../../../../hooks/useWebSocket';
import { LanguageSelector } from '../../../../components/LanguageSelector';

export default function SpeakerPage({ params }: { params: Promise<{ roomId: string }> }) {
    const resolvedParams = React.use(params);
    const roomId = resolvedParams.roomId;

    const [sourceLang, setSourceLang] = useState('en-US');
    const [isStreaming, setIsStreaming] = useState(false);
    const [originalText, setOriginalText] = useState('');
    const [error, setError] = useState('');
    const [sourceAudio, setSourceAudio] = useState<File | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const fileAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (sourceAudio && fileAudioRef.current) {
            const url = URL.createObjectURL(sourceAudio);
            fileAudioRef.current.src = url;
            fileAudioRef.current.load();
            return () => URL.revokeObjectURL(url);
        }
    }, [sourceAudio]);

    const ws = useWebSocket({
        url: `ws://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8080/ws/translate?roomId=${roomId}&role=speaker&source=${sourceLang}&target=en-US&voice=Standard&gender=NEUTRAL&prompt=`,
        onMessage: useCallback((e: MessageEvent) => {
            if (typeof e.data === 'string' && e.data.startsWith('TRANSCRIPT:')) {
                setOriginalText(prev => (prev + " " + e.data.replace('TRANSCRIPT:', '')).trim());
            } else if (e.data === 'STREAM_COMPLETE') {
                setIsStreaming(false);
            }
        }, []),
    });

    const startMic = async () => {
        if (!navigator.mediaDevices) return;
        try {
            setOriginalText(''); setError('');

            // Allow Vercel environment variables to ovverride the localhost port
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';
            ws.connect(`${wsUrl}?role=speaker&roomId=${roomId}&sourceLang=${sourceLang}`);

            setIsStreaming(true);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            mediaRecorderRef.current = mr;
            mr.ondataavailable = (e) => { if (e.data.size > 0) ws.sendMessage(e.data); };
            mr.start(250);
        } catch { setError('Microphone access denied'); }
    };

    const stopMic = () => {
        const mr = mediaRecorderRef.current;
        if (mr && mr.state === 'recording') { mr.stop(); mr.stream.getTracks().forEach(t => t.stop()); }
        ws.sendMessage('END_OF_AUDIO');
    };

    const playAndStreamFile = () => {
        if (!fileAudioRef.current) return;
        setOriginalText(''); setError('');
        const audioEl = fileAudioRef.current;
        // @ts-ignore
        if (!audioEl.captureStream) return setError("Browser doesn't support captureStream.");
        ws.connect(); setIsStreaming(true);
        audioEl.onplaying = () => {
            // @ts-ignore
            const stream = audioEl.captureStream() as MediaStream;
            if (stream.getAudioTracks().length === 0) return setError("No audio tracks.");
            const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            mediaRecorderRef.current = mr;
            mr.ondataavailable = (e) => { if (e.data.size > 0) ws.sendMessage(e.data); };
            mr.start(250);
            audioEl.onended = () => { mr.stop(); ws.sendMessage('END_OF_AUDIO'); };
        };
        setTimeout(() => audioEl.play(), 500);
    };

    // Sound wave bars component
    const SoundWave = () => (
        <div className="flex items-end gap-1 h-8">
            {[0, 1, 2, 3, 4].map(i => (
                <div key={i}
                    className="w-1 bg-yellow-400 rounded-full animate-soundwave"
                    style={{ height: '100%', animationDelay: `${i * 0.15}s`, animationDuration: `${0.8 + i * 0.1}s` }}
                />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col">
            {/* Status Bar */}
            <div className={`h-1 transition-all duration-500 ${isStreaming ? 'accent-border-gold' : 'bg-zinc-800'}`} />

            <main className="flex-1 flex flex-col items-center px-6 py-10">
                <div className="w-full max-w-5xl space-y-8">
                    {/* Top Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-zinc-100">Broadcast Deck</h1>
                                <p className="text-xs text-zinc-500 font-mono">Room: {roomId}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {isStreaming && <SoundWave />}
                            <div className="w-48"><LanguageSelector label="" value={sourceLang} onChange={setSourceLang} /></div>
                        </div>
                    </div>

                    {/* Main Area */}
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Mic Section */}
                        <div className="flex-1 surface-card p-10 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
                            {/* Background glow */}
                            {isStreaming && <div className="absolute inset-0 bg-yellow-500/5 animate-glow pointer-events-none" />}

                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-10">
                                {isStreaming ? 'BROADCASTING  LIVE' : 'READY TO BROADCAST'}
                            </p>

                            <div className="relative">
                                {/* Outer ring animation */}
                                {isStreaming && (
                                    <div className="absolute -inset-4 rounded-full border-2 border-yellow-400/30 animate-pulse-slow" />
                                )}
                                <button onClick={isStreaming ? stopMic : startMic}
                                    className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300 shadow-2xl border-2 ${isStreaming
                                        ? 'bg-red-500 border-red-400 shadow-red-500/30 hover:bg-red-600 scale-105'
                                        : 'bg-gradient-to-br from-yellow-500 to-amber-600 border-yellow-400/50 shadow-yellow-500/20 hover:shadow-yellow-500/40 hover:scale-105 active:scale-95'
                                        }`}>
                                    <svg className={`w-14 h-14 text-white ${isStreaming ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        {isStreaming ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        )}
                                    </svg>
                                    <span className="text-white text-xs font-bold tracking-widest uppercase">{isStreaming ? 'STOP' : 'START'}</span>
                                </button>
                            </div>

                            {/* File Upload */}
                            <div className="mt-10 w-full max-w-xs space-y-3">
                                <label className="cursor-pointer text-sm font-medium text-zinc-400 bg-zinc-800/60 border border-zinc-700/40 border-dashed py-3 px-4 rounded-xl hover:border-zinc-600 hover:text-zinc-300 transition-colors flex justify-center items-center gap-2 truncate">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                    {sourceAudio ? sourceAudio.name : "Upload audio file"}
                                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setSourceAudio(e.target.files[0]); }} />
                                </label>
                                {sourceAudio && (
                                    <div className="space-y-2 animate-in fade-in duration-200">
                                        <audio ref={fileAudioRef} controls className="w-full h-9 rounded-lg opacity-70" />
                                        <button onClick={playAndStreamFile} disabled={isStreaming}
                                            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-sm font-bold border border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                            {isStreaming ? 'Broadcasting...' : '▶ Play & Broadcast'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Transcript */}
                        <div className="w-full lg:w-[400px] surface-card p-6 flex flex-col h-[520px]">
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800/60">
                                <div className={`status-dot ${isStreaming ? 'status-dot-live' : 'status-dot-idle'}`} />
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Live Transcript</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <p className={`text-base leading-relaxed text-zinc-300 font-medium ${isStreaming && originalText ? 'blink-cursor' : ''}`}>
                                    {originalText || <span className="text-zinc-600 italic">Waiting for audio input...</span>}
                                </p>
                            </div>
                        </div>
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
