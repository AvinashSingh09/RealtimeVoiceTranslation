import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';
import { signout } from '@/app/login/actions';
import { createNewRoom } from './actions';
import { AlertTriangle, Mic } from 'lucide-react';
import { DeleteRoomButton } from '@/components/DeleteRoomButton';

export default async function DashboardPage() {
    const supabase = await createClient();

    // 1. Auth Check - Boot to login if no session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect('/login');
    }

    // 2. Fetch User's Rooms
    const { data: rooms, error: dbError } = await supabase
        .from('rooms')
        .select('*')
        .eq('admin_id', user.id)
        .order('created_at', { ascending: false });

    return (
        <div className="min-h-screen surface-base flex flex-col font-sans selection:bg-yellow-500/30">
            <AnimatedBackground />
            <Navbar role="Dashboard" />

            <main className="flex-1 max-w-5xl w-full mx-auto p-6 relative z-10 my-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">Active Rooms</h1>
                        <p className="text-zinc-500 text-sm mt-1">Manage your created translation sessions</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <form action={createNewRoom}>
                            <button className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold text-sm rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all active:scale-[0.98]">
                                + New Room
                            </button>
                        </form>
                        <form action={signout}>
                            <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-bold text-sm rounded-xl transition-all">
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>

                {dbError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl flex items-center gap-3 w-full mb-8 backdrop-blur-md">
                        <AlertTriangle className="w-4 h-4 min-w-[16px]" /><span>Could not load rooms. Are you sure you ran the Supabase SQL script?</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rooms?.length === 0 ? (
                        <div className="col-span-full surface-card p-12 flex flex-col items-center justify-center text-center border-dashed border-white/20">
                            <Mic className="w-10 h-10 mb-4 opacity-50" />
                            <h3 className="text-xl font-bold text-zinc-300">No rooms yet</h3>
                            <p className="text-zinc-500 max-w-sm mt-2">You haven't created any translation sessions. Click "New Room" to start broadcasting.</p>
                        </div>
                    ) : (
                        rooms?.map((room) => (
                            <div key={room.id} className="surface-elevated p-6 flex flex-col gap-5 group hover:border-yellow-500/30 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                                            <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest font-mono">{room.id}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-zinc-100">{room.voice_model}</h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-zinc-500 bg-black/40 px-2.5 py-1 rounded-md border border-white/5">
                                            {new Date(room.created_at).toLocaleDateString()}
                                        </span>
                                        <DeleteRoomButton roomId={room.id} />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm text-zinc-400 flex justify-between"><span className="text-zinc-600">Gender:</span> {room.voice_gender}</p>
                                    <p className="text-sm text-zinc-400 flex justify-between truncate"><span className="text-zinc-600">Prompt:</span> {room.voice_prompt || 'None'}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-white/5">
                                    <Link href={`/admin/${room.id}`} className="py-2 text-center bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 text-xs font-bold rounded-lg border border-white/10 transition-colors">
                                        Config Admin
                                    </Link>
                                    <Link href={`/room/${room.id}/speaker`} className="py-2 text-center bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 text-xs font-bold rounded-lg border border-white/10 transition-colors">
                                        Speaker Mic
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
