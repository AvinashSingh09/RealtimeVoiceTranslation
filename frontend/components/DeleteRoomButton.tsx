"use client";

import { Trash2, AlertTriangle, X } from "lucide-react";
import { deleteRoom } from "@/app/admin/dashboard/actions";
import { useTransition, useState } from "react";

export function DeleteRoomButton({ roomId }: { roomId: string }) {
    const [isPending, startTransition] = useTransition();
    const [showModal, setShowModal] = useState(false);

    const handleDelete = () => {
        startTransition(() => {
            const formData = new FormData();
            formData.append("roomId", roomId);
            deleteRoom(formData);
            setShowModal(false);
        });
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                disabled={isPending}
                className={`p-1.5 rounded-md transition-colors ${isPending ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'}`}
                title="Delete Room"
            >
                <Trash2 className={`w-4 h-4 ${isPending ? 'animate-pulse' : ''}`} />
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="surface-card p-6 w-full max-w-sm rounded-2xl shadow-2xl border border-white/10 relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Delete Room?</h3>
                                <p className="text-zinc-400 text-sm">This action cannot be undone.</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleDelete}
                                disabled={isPending}
                                className="w-full py-3 bg-red-500/90 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                            >
                                {isPending ? 'Deleting...' : 'Yes, Delete Room'}
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={isPending}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold rounded-xl transition-all border border-white/10 active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
