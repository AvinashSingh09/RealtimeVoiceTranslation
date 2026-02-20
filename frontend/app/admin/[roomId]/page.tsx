"use client";

import React, { useState, useEffect } from 'react';
import { VoiceModelSelector } from '../../../components/VoiceModelSelector';
import { VoiceGenderSelector } from '../../../components/VoiceGenderSelector';
import { LanguageSelector } from '../../../components/LanguageSelector';

export default function AdminDashboard({ params }: { params: Promise<{ roomId: string }> }) {
    const resolvedParams = React.use(params);
    const roomId = resolvedParams.roomId;

    const [voiceModel, setVoiceModel] = useState('Standard');
    const [voiceGender, setVoiceGender] = useState('NEUTRAL');

    const handleModelChange = (model: string) => {
        setVoiceModel(model);
        // Auto-switch gender/speaker when toggling between Gemini and Standard
        if (model.startsWith('gemini') && !voiceGender.match(/^[A-Z][a-z]/)) {
            setVoiceGender('Kore'); // Default Gemini speaker
        } else if (!model.startsWith('gemini') && voiceGender.match(/^[A-Z][a-z]/)) {
            setVoiceGender('NEUTRAL'); // Default standard gender
        }
    };
    const [voicePrompt, setVoicePrompt] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState('');

    const saveRoomConfig = async () => {
        try {
            const hostname = window.location.hostname;
            const res = await fetch(`http://${hostname}:8080/api/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, voiceModel, voiceGender, voicePrompt })
            });
            if (!res.ok) throw new Error('Failed to save room config');
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
            setError('');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getLink = (role: 'speaker' | 'listener') => {
        if (typeof window === 'undefined') return '';
        const base = `${window.location.protocol}//${window.location.host}`;
        return `${base}/room/${roomId}/${role}`;
    };

    const copyLink = (role: 'speaker' | 'listener') => {
        const link = getLink(role);
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(link);
        } else {
            // Fallback for non-HTTPS / HTTP IP access
            const textArea = document.createElement("textarea");
            textArea.value = link;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }
            document.body.removeChild(textArea);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-8 mt-12">
                <h1 className="text-3xl font-extrabold text-blue-600">🛡️ Admin Dashboard</h1>
                <p className="text-gray-500">Configure room <strong>{roomId}</strong> settings for all listeners.</p>

                <div className="space-y-4 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
                    <VoiceModelSelector value={voiceModel} onChange={handleModelChange} />
                    <VoiceGenderSelector value={voiceGender} onChange={setVoiceGender} voiceModel={voiceModel} />
                    {voiceModel.startsWith('gemini') && (
                        <div className="flex flex-col">
                            <label className="mb-2 font-bold text-gray-700 dark:text-gray-300">Global Voice Prompt</label>
                            <input type="text" value={voicePrompt} onChange={(e) => setVoicePrompt(e.target.value)}
                                placeholder="e.g. Speak highly dramatically" className="p-3 border rounded-md text-black" />
                        </div>
                    )}
                    <button onClick={saveRoomConfig} className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">
                        {isSaved ? '✅ Saved!' : 'Save Room Settings'}
                    </button>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <h3 className="font-bold text-purple-700 dark:text-purple-300 mb-2">🎤 Speaker Link</h3>
                        <p className="text-xs text-gray-500 truncate mb-3">{getLink('speaker')}</p>
                        <button onClick={() => copyLink('speaker')} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm w-full">Copy Speaker Link</button>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <h3 className="font-bold text-green-700 dark:text-green-300 mb-2">🎧 Listener Link</h3>
                        <p className="text-xs text-gray-500 truncate mb-3">{getLink('listener')}</p>
                        <button onClick={() => copyLink('listener')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm w-full">Copy Listener Link</button>
                    </div>
                </div>
            </div>
        </main>
    );
}
