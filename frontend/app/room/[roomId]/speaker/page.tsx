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
            ws.connect();
            setIsStreaming(true);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            mediaRecorderRef.current = mr;
            mr.ondataavailable = (e) => { if (e.data.size > 0) ws.sendMessage(e.data); };
            mr.start(250);
        } catch {
            setError('Microphone access denied');
        }
    };

    const stopMic = () => {
        const mr = mediaRecorderRef.current;
        if (mr && mr.state === 'recording') {
            mr.stop();
            mr.stream.getTracks().forEach(t => t.stop());
        }
        ws.sendMessage('END_OF_AUDIO');
    };

    const playAndStreamFile = () => {
        if (!fileAudioRef.current) return;
        setOriginalText(''); setError('');
        const audioEl = fileAudioRef.current;
        // @ts-ignore
        if (!audioEl.captureStream) return setError("Browser doesn't support captureStream.");

        ws.connect();
        setIsStreaming(true);
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

    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-8 mt-12">
                <h1 className="text-3xl font-extrabold text-blue-600">🎙️ Speaker Console ({roomId})</h1>

                <div className="w-1/2">
                    <LanguageSelector label="I am speaking in:" value={sourceLang} onChange={setSourceLang} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-700/50">
                        <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Option 1: Live Mic</h3>
                        <button onClick={isStreaming ? stopMic : startMic}
                            className={`px-8 py-3 rounded-full font-bold text-white transition-all shadow-md ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'}`}
                        >
                            {isStreaming ? '🛑 Stop Broadcasting' : '🎙️ Start Broadcasting'}
                        </button>
                    </div>

                    <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Option 2: Upload File</h3>
                        <input type="file" accept="audio/*" onChange={(e) => { if (e.target.files?.[0]) setSourceAudio(e.target.files[0]); }}
                            className="block w-full text-sm text-gray-500 ml-12 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 cursor-pointer" />
                        {sourceAudio && (
                            <div className="mt-4 flex flex-col items-center">
                                <audio ref={fileAudioRef} controls className="w-full mb-2 h-8" />
                                <button onClick={playAndStreamFile} disabled={isStreaming} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">{isStreaming ? 'Broadcasting...' : 'Play & Broadcast'}</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg h-48 overflow-y-auto">
                    <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Live Transcript</h3>
                    <p className="text-lg">{originalText}</p>
                </div>

                {error && <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
            </div>
        </main>
    );
}
