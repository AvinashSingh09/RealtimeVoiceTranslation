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
        fetch(`http://${hostname}:8080/api/rooms/${roomId}`)
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

    const ws = useWebSocket({
        url: config ? `ws://${window.location.hostname}:8080/ws/translate?roomId=${roomId}&role=listener&source=en-US&target=${targetLang}&voice=${config.voiceModel}&gender=${config.voiceGender}&prompt=${encodeURIComponent(config.voicePrompt)}` : '',
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

    if (!config) return <div className="p-8 text-center text-gray-500">Loading room configuration...</div>;

    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-8 mt-12">
                <h1 className="text-3xl font-extrabold text-green-600">🎧 Listener View ({roomId})</h1>

                <div className="flex gap-4 items-end border-b pb-6 border-gray-200 dark:border-gray-700">
                    <div className="w-1/2">
                        <LanguageSelector label="Translate to:" value={targetLang} onChange={setTargetLang} />
                    </div>
                    <button onClick={joinBroadcast} disabled={isConnected}
                        className={`px-8 py-3 rounded-lg font-bold text-white transition-all shadow-md ${isConnected ? 'bg-green-600 opacity-50 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                        {isConnected ? 'Connected ✅' : 'Connect to Broadcast'}
                    </button>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg h-64 overflow-y-auto border border-purple-100 dark:border-purple-800">
                    <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">Live Translation</h3>
                    <p className="text-xl leading-relaxed">{translatedText || <span className="text-gray-400 italic">Waiting...</span>}</p>
                </div>

                {error && <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
            </div>
        </main>
    );
}
