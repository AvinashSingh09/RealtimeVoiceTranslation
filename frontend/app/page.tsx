"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LanguageSelector } from '../components/LanguageSelector';
import { VoiceModelSelector } from '../components/VoiceModelSelector';
import { VoiceGenderSelector } from '../components/VoiceGenderSelector';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Home() {
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

  const ws = useWebSocket({
    url: `ws://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8080/ws/translate?source=${sourceLang}&target=${targetLang}&voice=${voiceModel}&gender=${voiceGender}&prompt=${encodeURIComponent(voicePrompt)}`,
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
      ws.connect();
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">Voice Translator</h1>
          <p className="text-gray-500 dark:text-gray-400">Realtime Voice-to-Voice Streaming</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <LanguageSelector label="Input Language" value={sourceLang} onChange={setSourceLang} />
          <LanguageSelector label="Output Language" value={targetLang} onChange={setTargetLang} />
          <VoiceModelSelector value={voiceModel} onChange={setVoiceModel} />
          <VoiceGenderSelector value={voiceGender} onChange={setVoiceGender} voiceModel={voiceModel} />
        </div>

        {voiceModel.startsWith('gemini') && (
          <div className="flex flex-col">
            <label className="mb-2 font-bold text-gray-700">Voice Prompt (Expressiveness)</label>
            <input
              type="text"
              value={voicePrompt}
              onChange={(e) => setVoicePrompt(e.target.value)}
              placeholder="e.g. Say this in a highly dramatic and fast-paced way"
              className="p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-black"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Option 1: Live Mic</h3>
              <button onClick={isStreaming ? stopMic : startMic}
                className={`px-6 py-3 rounded-full font-bold text-white transition-colors ${isStreaming ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
              >{isStreaming ? 'Stop Streaming' : 'Start Streaming'}</button>
            </div>

            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Option 2: Upload & Stream</h3>
              <input type="file" accept="audio/*"
                onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}
                className="block w-full text-sm text-gray-500 ml-12 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {sourceAudio && (
                <div className="mt-4 flex flex-col items-center">
                  <audio ref={fileAudioRef} controls className="w-full mb-2" />
                  <button onClick={playAndStreamFile} disabled={isStreaming}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded-lg font-semibold"
                  >{isStreaming ? 'Translating...' : 'Play & Translate Realtime'}</button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 flex flex-col justify-center">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg h-48 overflow-y-auto">
              <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Live Transcript</h3>
              <p className="text-lg">{originalText}</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg h-48 overflow-y-auto">
              <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">Live Translation</h3>
              <p className="text-lg">{translatedText}</p>
            </div>
          </div>
        </div>

        {error && <div className="p-4 bg-red-100 text-red-700 rounded-md border border-red-200">{error}</div>}
      </div>
    </main>
  );
}
