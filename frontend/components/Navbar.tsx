"use client";

import React from 'react';
import Link from 'next/link';

export default function Navbar({ roomId, role }: { roomId?: string, role?: string }) {
    return (
        <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800/60 relative z-10 bg-black/50 backdrop-blur-md">
            {role ? (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <span className="text-lg font-bold tracking-tight text-zinc-100 hidden sm:block">VoxFlow</span>
                </div>
            ) : (
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <span className="text-lg font-bold tracking-tight text-zinc-100 hidden sm:block">VoxFlow</span>
                </Link>
            )}

            {roomId && (
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{role || 'Room'}</span>
                    <span className="text-sm font-mono text-yellow-400 font-bold tracking-wider">{roomId}</span>
                </div>
            )}

            <div className="w-9"></div> {/* Spacer for perfect centering if needed */}
        </nav>
    );
}
