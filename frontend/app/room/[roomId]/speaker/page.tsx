"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useWebSocket } from '../../../../hooks/useWebSocket';
import { LanguageSelector } from '../../../../components/LanguageSelector';
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';
import { AlertTriangle } from 'lucide-react';

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

    const baseWsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8080/ws`;

    const ws = useWebSocket({
        url: `${baseWsUrl}/translate?roomId=${roomId}&role=speaker&lang=${sourceLang}`,
        onMessage: useCallback((e: MessageEvent) => {
            if (typeof e.data === 'string' && e.data.startsWith('TRANSCRIPT:')) {
                setOriginalText(prev => prev + ' ' + e.data.replace('TRANSCRIPT:', ''));
            } else if (typeof e.data === 'string' && e.data.startsWith('ERROR:')) {
                setError(e.data.replace('ERROR:', ''));
            }
        }, []),
        onClose: () => setIsStreaming(false)
    });

    const startMic = async () => {
        try {
            setError(''); setOriginalText('');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Connect WS securely
            ws.connect();
            setIsStreaming(true);

            // Give WS a moment to handshake before pulsing binary
            setTimeout(() => {
                const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
                mediaRecorderRef.current = mr;
                mr.ondataavailable = (e) => { if (e.data.size > 0) ws.sendMessage(e.data); };
                mr.start(250);
            }, 500);

        } catch (err) {
            setError("Could not access microphone.");
            setIsStreaming(false);
        }
    };

    const stopMic = () => {
        setIsStreaming(false);
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
                    className="w-1 bg-yellow-400 rounded-full animate-soundwave shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                    style={{ height: '100%', animationDelay: `${i * 0.15}s`, animationDuration: `${0.8 + i * 0.1}s` }}
                />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col surface-base relative overflow-hidden">
            <AnimatedBackground />
            <Navbar roomId={roomId as string} role="Speaker" />

            <main className="flex-1 flex flex-col items-center px-6 py-12 z-10 relative">
                <div className="w-full max-w-3xl flex flex-col items-center gap-8">

                    {/* Header Text & Language Selection */}
                    <div className="flex flex-col items-center justify-center text-center gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2">
                                <div className={`status-dot ${isStreaming ? 'status-dot-live' : 'bg-yellow-500/50'}`} />
                                <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">
                                    {isStreaming ? 'Live Broadcast Active' : 'Broadcast Ready'}
                                </span>
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-100">
                                Global <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-transparent bg-clip-text">Transmitter</span>
                            </h1>
                            <p className="text-zinc-400">Speak into the microphone to cast real-time translations.</p>
                        </div>

                        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
                            {isStreaming && <SoundWave />}
                            <div className="w-48"><LanguageSelector label="" value={sourceLang} onChange={setSourceLang} /></div>
                        </div>
                    </div>

                    {/* Microphone Control Pod */}
                    <div className="w-full surface-card glow-gold p-10 flex flex-col items-center justify-center relative overflow-hidden mt-4">
                        {/* Background glow when live */}
                        {isStreaming && <div className="absolute inset-0 bg-yellow-500/10 animate-glow pointer-events-none" />}

                        {/* Interactive Radar Ring */}
                        <div className="relative mb-8">
                            {isStreaming && (
                                <>
                                    <div className="absolute inset-0 rounded-full border border-yellow-400/30 animate-ping opacity-75" />
                                    <div className="absolute -inset-4 rounded-full border-2 border-yellow-400/20 animate-pulse-slow" />
                                </>
                            )}
                            <button onClick={isStreaming ? stopMic : startMic}
                                className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center gap-3 transition-all duration-300 shadow-2xl border-2 z-10 ${isStreaming
                                    ? 'bg-red-500/90 border-red-400 shadow-[0_0_50px_rgba(239,68,68,0.5)] hover:bg-red-600 scale-105 backdrop-blur-md'
                                    : 'bg-gradient-to-br from-yellow-500 to-amber-600 border-yellow-400/50 shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:scale-105 active:scale-95'
                                    }`}>
                                <svg className={`w-12 h-12 text-white ${isStreaming ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    {isStreaming ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    )}
                                </svg>
                                <span className="text-white text-xs font-bold tracking-widest uppercase">{isStreaming ? 'STOP' : 'START'}</span>
                            </button>
                        </div>

                        {/* File Upload (Fallback) */}
                        <div className="w-full max-w-sm space-y-3 z-10">
                            <label className="cursor-pointer text-sm font-medium text-zinc-400 bg-black/40 border border-white/5 border-dashed py-3 px-4 rounded-xl hover:border-white/20 hover:text-zinc-300 transition-colors flex justify-center items-center gap-2 truncate backdrop-blur-md">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                {sourceAudio ? sourceAudio.name : "Upload audio file to broadcast"}
                                <input type="file" accept="audio/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setSourceAudio(e.target.files[0]); }} />
                            </label>
                            {sourceAudio && (
                                <div className="space-y-2 animate-in fade-in duration-200">
                                    <audio ref={fileAudioRef} controls className="w-full h-9 rounded-lg opacity-70" />
                                    <button onClick={playAndStreamFile} disabled={isStreaming}
                                        className="w-full py-3 bg-white/5 hover:bg-white/10 text-zinc-200 rounded-xl text-sm font-bold border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                        {isStreaming ? 'Broadcasting...' : '▶ Play & Broadcast'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Transcript Console */}
                    <div className="w-full surface-elevated flex flex-col p-6 h-[250px] sm:h-[350px] relative mt-4">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                            <div className={`status-dot ${isStreaming ? 'status-dot-live' : 'status-dot-idle'}`} />
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Live Transcript</h3>
                        </div>
                        <div className="absolute top-[88px] left-0 right-0 bottom-0 overflow-y-auto custom-scrollbar px-6 pb-6 pr-4">
                            <p className="text-lg leading-relaxed text-zinc-200 font-medium whitespace-pre-wrap">
                                {originalText ? (
                                    <>{originalText}<span className={`blink-cursor ${!isStreaming && 'hidden'}`} /></>
                                ) : (
                                    <span className="text-zinc-600 italic font-normal text-sm">Waiting for audio input...</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl flex items-center gap-3 w-full backdrop-blur-md">
                            <AlertTriangle className="w-4 h-4 min-w-[16px]" /><span>{error}</span>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
