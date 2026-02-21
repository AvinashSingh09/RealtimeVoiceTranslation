import Navbar from '@/components/Navbar';
import { login, signup } from './actions';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Key, AlertTriangle } from 'lucide-react';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message: string }> }) {
    const message = (await searchParams).message;

    return (
        <div className="min-h-screen surface-base flex flex-col font-sans selection:bg-yellow-500/30">
            <AnimatedBackground />
            <Navbar />

            <main className="flex-1 flex items-center justify-center p-6 relative z-10 w-full mb-16">
                <div className="w-full max-w-md surface-elevated glow-gold p-8 xs:p-12 relative overflow-hidden flex flex-col gap-8">
                    {/* Header */}
                    <div className="text-center space-y-3">
                        <div className="inline-flex items-center justify-center p-3 surface-card rounded-2xl mb-4 border border-white/10 shadow-xl">
                            <Key className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Admin Access
                        </h2>
                        <p className="text-zinc-500 font-medium text-sm">
                            Sign in to manage your real-time translation sessions.
                        </p>
                    </div>

                    {/* Auth Form */}
                    <form className="flex flex-col gap-5 w-full">
                        <div className="space-y-4">
                            <div className="space-y-1.5 focus-within:text-yellow-500 text-zinc-400 transition-colors">
                                <label className="text-xs font-bold uppercase tracking-widest pl-1">Email Space</label>
                                <input id="email" name="email" type="email" required
                                    className="w-full input-dark"
                                    placeholder="admin@voxflow.com" />
                            </div>

                            <div className="space-y-1.5 focus-within:text-yellow-500 text-zinc-400 transition-colors">
                                <div className="flex justify-between items-center pl-1 pr-1">
                                    <label className="text-xs font-bold uppercase tracking-widest">Passkey</label>
                                </div>
                                <input id="password" name="password" type="password" required
                                    className="w-full input-dark tracking-widest"
                                    placeholder="••••••••" />
                            </div>
                        </div>

                        {message && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl flex items-center gap-3 backdrop-blur-md">
                                <AlertTriangle className="w-4 h-4 min-w-[16px]" /><span>{message}</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 pt-6 border-t border-white/10 mt-2">
                            <button formAction={login} className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold tracking-wide rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] transition-all active:scale-[0.98]">
                                Secure Login
                            </button>

                            <button formAction={signup} className="w-full py-4 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 font-bold tracking-wide rounded-xl border border-white/10 transition-all active:scale-[0.98]">
                                Register Access
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
