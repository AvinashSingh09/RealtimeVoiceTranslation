"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function LandingPage() {
    const router = useRouter();
    const [joinId, setJoinId] = useState('');

    const createSession = () => {
        const newRoomId = uuidv4().substring(0, 8); // Short ID for easier sharing
        router.push(`/admin/${newRoomId}`);
    };

    const joinSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinId.trim()) {
            // If someone types an ID here, let's assume they want the listener link by default
            // Usually they will just click the link the admin copied, but this is a fallback.
            router.push(`/room/${joinId.trim()}/listener`);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-8">

                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">Voice Translator</h1>
                    <p className="text-gray-500 dark:text-gray-400">Realtime Multilingual Broadcasting</p>
                </div>

                <div className="space-y-6 pt-4">
                    <button
                        onClick={createSession}
                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg transform transition hover:scale-105 active:scale-95 flex items-center justify-center space-x-3"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span>Create New Session</span>
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-semibold uppercase">Or Join Existing</span>
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                    </div>

                    <form onSubmit={joinSession} className="space-y-4">
                        <div>
                            <label htmlFor="roomId" className="sr-only">Room ID</label>
                            <input
                                id="roomId"
                                type="text"
                                value={joinId}
                                onChange={(e) => setJoinId(e.target.value)}
                                placeholder="Enter Room ID (e.g. 8a3f9e2b)"
                                className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg font-mono tracking-wider dark:text-white"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!joinId.trim()}
                            className="w-full py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-xl font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Join Session
                        </button>
                    </form>
                </div>

            </div>
        </main>
    );
}
