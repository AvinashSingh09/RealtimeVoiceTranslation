"use client";

import React, { useState, useEffect } from 'react';
import { VoiceModelSelector } from '../../../components/VoiceModelSelector';
import { VoiceGenderSelector } from '../../../components/VoiceGenderSelector';
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Mic, Headphones } from 'lucide-react';

export default function AdminDashboardClient({ params }: { params: Promise<{ roomId: string }> }) {
    const resolvedParams = React.use(params);
    const roomId = resolvedParams.roomId;

    const [voiceModel, setVoiceModel] = useState('Standard');
    const [voiceGender, setVoiceGender] = useState('NEUTRAL');
    const [voicePrompt, setVoicePrompt] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        const hostname = window.location.hostname;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || `http://${hostname}:8080`;
        fetch(`${apiUrl}/api/rooms/${roomId}`)
            .then(res => res.json())
            .then(data => {
                if (data) {
                    if (data.voiceModel) setVoiceModel(data.voiceModel);
                    if (data.voiceGender) setVoiceGender(data.voiceGender);
                    if (data.voicePrompt) setVoicePrompt(data.voicePrompt);
                }
            })
            .catch(err => console.error("Failed to load room config:", err));
    }, [roomId]);

    const handleModelChange = (model: string) => {
        setVoiceModel(model);
        const isAdvancedAI = model.startsWith('gemini') || model.toLowerCase().includes('chirp');

        if (isAdvancedAI && !voiceGender.match(/^[A-Z][a-z]/)) setVoiceGender('Kore');
        else if (!isAdvancedAI && voiceGender.match(/^[A-Z][a-z]/)) setVoiceGender('NEUTRAL');
    };

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
        <div className="min-h-screen flex flex-col surface-base relative overflow-hidden">
            <AnimatedBackground />
            <Navbar roomId={roomId as string} role="Admin" />

            <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 px-6 sm:px-8 py-12 lg:py-16 max-w-7xl mx-auto w-full z-10">

                {/* Left: Typography & Share Links */}
                <div className="w-full lg:w-1/2 flex flex-col gap-8 max-w-2xl items-center lg:items-start text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-2">
                        <div className="status-dot status-dot-live" />
                        <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Pipeline Control</span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05]">
                        <span className="text-zinc-100">Configure</span>
                        <br />
                        <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-transparent bg-clip-text">
                            Your Broadcast
                        </span>
                    </h1>

                    <p className="text-lg text-zinc-400 leading-relaxed max-w-xl">
                        Select your AI voice model and tune the expressiveness prompt before locking the room configuration.
                    </p>

                    {/* Share Links moved to left column */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {(['speaker', 'listener'] as const).map(role => (
                            <div key={role} className="surface-elevated p-5 space-y-3 group hover:bg-white/5 transition-colors duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
                                        {role === 'speaker' ? <Mic className="w-6 h-6" /> : <Headphones className="w-6 h-6" />}
                                    </div>
                                    <h3 className="font-bold text-zinc-100 capitalize">{role} Portal</h3>
                                </div>
                                <div className="relative">
                                    <p className="text-xs text-zinc-400 font-mono truncate bg-black/40 px-3 py-2.5 rounded-lg border border-white/5 shadow-inner">{getLink(role)}</p>
                                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/40 to-transparent pointer-events-none rounded-r-lg" />
                                </div>
                                <button onClick={() => copyLink(role)}
                                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-300 active:scale-[0.98] ${copied === role
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                        : 'bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 hover:border-white/20'
                                        }`}>
                                    {copied === role ? '✓ Copied' : 'Copy Link'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Config Card (Floating) */}
                <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
                    <div className="w-full max-w-md surface-card glow-gold p-8 space-y-6 relative overflow-hidden">
                        {/* Decorative background glow */}
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

                        <VoiceModelSelector value={voiceModel} onChange={handleModelChange} />
                        <VoiceGenderSelector value={voiceGender} onChange={setVoiceGender} voiceModel={voiceModel} />

                        {(voiceModel.startsWith('gemini') || voiceModel.toLowerCase().includes('chirp')) && (
                            <div className="flex flex-col gap-2 animate-in fade-in duration-300">
                                <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Expressiveness Prompt</label>
                                <input type="text" value={voicePrompt} onChange={(e) => setVoicePrompt(e.target.value)}
                                    placeholder="e.g. Speak dramatically and excitedly" className="input-dark focus:ring-yellow-500/50" />
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/5">
                            <button onClick={saveRoomConfig}
                                className={`w-full py-4 font-bold rounded-xl transition-all duration-300 active:scale-[0.98] flex justify-center items-center gap-2 text-base ${isSaved
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                    : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]'
                                    }`}>
                                {isSaved ? '✓ Locked' : 'Save Configuration'}
                            </button>
                        </div>
                        {error && <p className="text-sm text-red-400 bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20 text-center backdrop-blur-md">{error}</p>}
                    </div>
                </div>
            </main>
        </div>
    );
}
