"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import AnimatedBackground from '@/components/AnimatedBackground';
import LanguageDemo from '@/components/LanguageDemo';

export default function LandingPage() {
    const router = useRouter();
    const [joinId, setJoinId] = useState('');

    const createSession = () => {
        router.push(`/admin/${uuidv4().substring(0, 8)}`);
    };

    const joinSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinId.trim()) router.push(`/room/${joinId.trim()}/listener`);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <AnimatedBackground />
            {/* Top Bar */}
            <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800/60">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <span className="text-lg font-bold tracking-tight text-zinc-100">VoxFlow</span>
                </div>

            </nav>

            {/* Hero */}
            <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 px-6 sm:px-8 py-12 lg:py-16 max-w-7xl mx-auto w-full">

                {/* Left: Typography */}
                <div className="w-full lg:w-1/2 flex flex-col gap-8 max-w-2xl items-center lg:items-start text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-2">
                        <div className="status-dot status-dot-live" />
                        <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Live Translation Engine</span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
                        <span className="text-zinc-100">Speak once.</span>
                        <br />
                        <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-transparent bg-clip-text">
                            Be understood everywhere.
                        </span>
                    </h1>

                    <p className="text-lg text-zinc-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                        Broadcast your voice in real-time to listeners worldwide.
                        AI translates and speaks your words in their language — instantly.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 pt-2">
                        <button onClick={createSession}
                            className="group px-8 py-4 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-black font-bold rounded-xl shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3 text-lg">
                            <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Create Room
                        </button>
                    </div>
                </div>

                {/* Right: Language Demo Widget */}
                <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
                    <LanguageDemo />
                </div>
            </main>

            {/* Footer */}
            <footer className="px-8 py-5 border-t border-zinc-800/60 flex justify-between items-center text-xs text-zinc-600">
                <span></span>
                <span className="font-mono">v2.0</span>
            </footer>
        </div>
    );
}
