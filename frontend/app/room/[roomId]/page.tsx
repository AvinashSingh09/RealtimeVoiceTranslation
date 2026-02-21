"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LanguageSelector } from '../../../components/LanguageSelector';
import { VoiceModelSelector } from '../../../components/VoiceModelSelector';
import { VoiceGenderSelector } from '../../../components/VoiceGenderSelector';
import { useWebSocket } from '../../../hooks/useWebSocket';

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const [role, setRole] = useState<'speaker' | 'listener' | null>(null);

  const [sourceLang, setSourceLang] = useState('en-US');
  const [targetLang, setTargetLang] = useState('hi-IN');
  const [voiceModel, setVoiceModel] = useState('Standard');
  const [voiceGender, setVoiceGender] = useState('NEUTRAL');
  const [voicePrompt, setVoicePrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sourceAudio, setSourceAudio] = useState<Blob | null>(null);
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingQueue = useRef(false);

  const playNextInQueue = useCallback(async () => {
    if (audioQueueRef.current.length === 0) { isPlayingQueue.current = false; return; }
    isPlayingQueue.current = true;
    const blob = audioQueueRef.current.shift();
    if (!blob) return;
    const audio = new Audio(URL.createObjectURL(blob));
    audio.onended = () => playNextInQueue();
    try { await audio.play(); } catch { isPlayingQueue.current = false; }
  }, []);

  const onWebSocketMessage = useCallback((event: MessageEvent) => {
    const data = event.data;
    if (typeof data === 'string') {
      if (data.startsWith('TRANSCRIPT:'))
        setOriginalText(prev => (prev + " " + data.replace('TRANSCRIPT:', '')).trim());
      else if (data.startsWith('TRANSLATION:'))
        setTranslatedText(prev => (prev + " " + data.replace('TRANSLATION:', '')).trim());
      else if (data === 'STREAM_COMPLETE') {
        console.log('All processing complete');
        setIsStreaming(false);
        // Don't auto-disconnect — let audio queue finish first
      }
    } else if (data instanceof Blob) {
      audioQueueRef.current.push(data);
      if (!isPlayingQueue.current) playNextInQueue();
    }
  }, [playNextInQueue]);

  const baseWsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8080/ws`;

  const ws = useWebSocket({
    url: `${baseWsUrl}/translate?source=${sourceLang}&target=${targetLang}&voice=${voiceModel}&gender=${voiceGender}&prompt=${encodeURIComponent(voicePrompt)}`,
    onMessage: onWebSocketMessage,
  });

  const resetState = () => {
    setOriginalText(''); setTranslatedText(''); setError('');
    audioQueueRef.current = []; isPlayingQueue.current = false;
  };

  // 1. Live Mic
  const startMic = async () => {
    if (!navigator.mediaDevices) return;
    try {
      resetState();
      // Allow Vercel environment variables to ovverride the localhost port
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';
      ws.connect(`${wsUrl}?role=creator&roomId=${params.roomId}`);
      setIsStreaming(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) ws.sendMessage(e.data); };
      mr.start(250); // Send audio chunks every 250ms
    } catch { setError('Microphone access denied'); }
  };

  const stopMic = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === 'recording') {
      mr.stop();
      mr.stream.getTracks().forEach(t => t.stop());
    }
    ws.sendMessage('END_OF_AUDIO');
    // WS stays open — backend sends STREAM_COMPLETE when done
  };

  // 2. File Upload
  const handleFileUpload = (file: File) => { resetState(); setSourceAudio(file); };

  useEffect(() => {
    if (sourceAudio && fileAudioRef.current) {
      const url = URL.createObjectURL(sourceAudio);
      fileAudioRef.current.src = url;
      fileAudioRef.current.load();
      return () => URL.revokeObjectURL(url);
    }
  }, [sourceAudio]);

  const playAndStreamFile = () => {
    if (!fileAudioRef.current) return;
    resetState();
    const audioEl = fileAudioRef.current;

    // @ts-ignore
    if (!audioEl.captureStream) { setError("Browser doesn't support captureStream."); return; }

    ws.connect();
    setIsStreaming(true);

    audioEl.onplaying = () => {
      // @ts-ignore
      const stream = audioEl.captureStream() as MediaStream;
      if (stream.getAudioTracks().length === 0) { setError("No audio tracks."); return; }

      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) ws.sendMessage(e.data); };
      mr.start(250);

      audioEl.onended = () => {
        mr.stop();
        ws.sendMessage('END_OF_AUDIO');
      };
    };

    // Small delay for WS handshake
    setTimeout(() => audioEl.play(), 500);
  };

  if (!role) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-8 text-center">
          <h2 className="text-3xl font-bold">Room: {params.roomId}</h2>
          <p className="text-gray-500">How would you like to join?</p>
          <div className="grid grid-cols-1 gap-4 pt-4">
            <button
              onClick={() => setRole('speaker')}
              className="py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-lg shadow-md transition"
            >
              🎤 Join as Speaker
            </button>
            <button
              onClick={() => setRole('listener')}
              className="py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold text-lg shadow-md transition"
            >
              🎧 Join as Listener
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-8 mt-12">
        <div className="flex justify-between items-center border-b pb-4 dark:border-gray-700">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              {role === 'speaker' ? '🎙️ Speaker Console' : '🎧 Listener View'}
            </h1>
            <p className="text-sm font-mono text-gray-500 mt-1">Room ID: {params.roomId}</p>
          </div>
          <button onClick={() => setRole(null)} className="text-sm text-gray-500 hover:underline">Leave Room</button>
        </div>

        {/* --- SPEAKER UI --- */}
        {role === 'speaker' && (
          <div className="space-y-6">
            <div className="w-1/2">
              <LanguageSelector label="I am speaking in:" value={sourceLang} onChange={setSourceLang} />
            </div>

            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-blue-300 dark:border-blue-700/50 rounded-xl bg-blue-50/50 dark:bg-blue-900/10">
              <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Broadcast Controls</h3>
              <button onClick={isStreaming ? stopMic : startMic}
                className={`px-8 py-4 rounded-full font-bold text-white transition-all shadow-lg text-lg ${isStreaming ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                {isStreaming ? '🛑 Stop Broadcasting' : '🎙️ Start Broadcasting'}
              </button>
              {isStreaming && <p className="mt-4 text-red-500 font-semibold animate-pulse">Live...</p>}
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg h-48 overflow-y-auto">
              <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">My Live Transcript</h3>
              <p className="text-lg">{originalText}</p>
            </div>
          </div>
        )}

        {/* --- LISTENER UI --- */}
        {role === 'listener' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <LanguageSelector label="Translate to:" value={targetLang} onChange={setTargetLang} />
              <VoiceModelSelector value={voiceModel} onChange={setVoiceModel} />
              <VoiceGenderSelector value={voiceGender} onChange={setVoiceGender} voiceModel={voiceModel} />
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg h-64 overflow-y-auto border border-purple-100 dark:border-purple-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300">Live Translation</h3>
                {isStreaming && <span className="flex h-3 w-3"><span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-purple-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span></span>}
              </div>
              <p className="text-xl leading-relaxed">{translatedText || <span className="text-gray-400 italic">Waiting for speaker...</span>}</p>
            </div>
          </div>
        )}

        {error && <div className="p-4 bg-red-100 text-red-700 rounded-md border border-red-200">{error}</div>}
      </div>
    </main>
  );
}
