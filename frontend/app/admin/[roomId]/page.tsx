"use client";

import React, { useState } from 'react';
import { VoiceModelSelector } from '../../../components/VoiceModelSelector';
import { VoiceGenderSelector } from '../../../components/VoiceGenderSelector';

export default function AdminDashboard({ params }: { params: Promise<{ roomId: string }> }) {
    const resolvedParams = React.use(params);
    const roomId = resolvedParams.roomId;

    const [voiceModel, setVoiceModel] = useState('Standard');
    const [voiceGender, setVoiceGender] = useState('NEUTRAL');
    const handleModelChange = (model: string) => {
        setVoiceModel(model);
        const isAdvancedAI = model.startsWith('gemini') || model.toLowerCase().includes('chirp');

        if (isAdvancedAI && !voiceGender.match(/^[A-Z][a-z]/)) setVoiceGender('Kore');
        else if (!isAdvancedAI && voiceGender.match(/^[A-Z][a-z]/)) setVoiceGender('NEUTRAL');
    };
    const [voicePrompt, setVoicePrompt] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState<string | null>(null);

    const saveRoomConfig = async () => {
        try {
            const hostname = window.location.hostname;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || `http://${hostname}:8080`;
            const res = await fetch(`${apiUrl}/api/rooms`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, voiceModel, voiceGender, voicePrompt })
            });
            if (!res.ok) throw new Error('Failed to save room config');
            setIsSaved(true); setTimeout(() => setIsSaved(false), 3000); setError('');
        } catch (err: any) { setError(err.message); }
    };

    const getLink = (role: 'speaker' | 'listener') => {
        if (typeof window === 'undefined') return '';
        return `${window.location.protocol}//${window.location.host}/room/${roomId}/${role}`;
    };

    const copyLink = (role: 'speaker' | 'listener') => {
        const link = getLink(role);
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(link);
        } else {
            const ta = document.createElement("textarea"); ta.value = link;
            ta.style.cssText = "position:fixed;left:-9999px;top:-9999px";
            document.body.appendChild(ta); ta.focus(); ta.select();
            try { document.execCommand('copy'); } catch { }
            document.body.removeChild(ta);
        }
        setCopied(role); setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Top accent line */}
            <div className="h-1 accent-border-gold" />

            <main className="flex-1 flex flex-col items-center px-6 py-12">
                <div className="w-full max-w-2xl space-y-8">
                    {/* Header */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-zinc-100">Room Configuration</h1>
                                <p className="text-sm text-zinc-500">Room <code className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded font-mono text-xs border border-yellow-500/20">{roomId}</code></p>
                            </div>
                        </div>
                    </div>

                    {/* Config Card */}
                    <div className="surface-card p-8 space-y-6">
                        <VoiceModelSelector value={voiceModel} onChange={handleModelChange} />
                        <VoiceGenderSelector value={voiceGender} onChange={setVoiceGender} voiceModel={voiceModel} />
                        {(voiceModel.startsWith('gemini') || voiceModel.toLowerCase().includes('chirp')) && (
                            <div className="flex flex-col gap-2 animate-in fade-in duration-200">
                                <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Expressiveness Prompt</label>
                                <input type="text" value={voicePrompt} onChange={(e) => setVoicePrompt(e.target.value)}
                                    placeholder="e.g. Speak dramatically and excitedly" className="input-dark focus:ring-yellow-500/50" />
                            </div>
                        )}
                        <button onClick={saveRoomConfig}
                            className={`w-full py-4 mt-4 font-bold rounded-xl transition-all duration-300 active:scale-[0.97] flex justify-center items-center gap-2 text-base ${isSaved
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black shadow-lg shadow-yellow-500/20'
                                }`}>
                            {isSaved ? '✓ Saved' : 'Save Configuration'}
                        </button>
                        {error && <p className="text-sm text-red-400 bg-red-400/10 px-4 py-3 rounded-xl border border-red-400/20 text-center">{error}</p>}
                    </div>

                    {/* Share Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(['speaker', 'listener'] as const).map(role => (
                            <div key={role} className="surface-card p-5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{role === 'speaker' ? '🎙️' : '🎧'}</span>
                                    <h3 className="font-bold text-zinc-100 capitalize">{role} Link</h3>
                                </div>
                                <p className="text-xs text-zinc-500 font-mono truncate bg-zinc-800/50 px-3 py-2.5 rounded-lg border border-zinc-700/30">{getLink(role)}</p>
                                <button onClick={() => copyLink(role)}
                                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.97] ${copied === role
                                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                                        }`}>
                                    {copied === role ? '✓ Copied!' : 'Copy Link'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
