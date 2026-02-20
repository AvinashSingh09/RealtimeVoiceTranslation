import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface AudioPlayerProps {
    audioBlob: Blob | null;
    label?: string;
}

export interface AudioPlayerRef {
    play: () => void;
    stop: () => void;
}

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(({ audioBlob, label }, ref) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useImperativeHandle(ref, () => ({
        play: () => {
            audioRef.current?.play().catch(e => console.error("Error playing audio:", e));
        },
        stop: () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
    }));

    useEffect(() => {
        if (audioBlob && audioRef.current) {
            const url = URL.createObjectURL(audioBlob);
            audioRef.current.src = url;
            // Removed auto-play to allow manual control for side-by-side feature, 
            // or we can keep it conditional. For now, let's strictly control it from parent if needed.
            // But user workflow implies auto-play might still be desired for the translation result?
            // "audio file that we uploaded should play and side by side the translated audio should also play"
            // This implies an orchestrated playback.
            // Let's NOT auto-play in the effect if we want to control it "side by side".

            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [audioBlob]);

    return (
        <div className="w-full flex flex-col items-center p-4 bg-white dark:bg-gray-700 rounded-lg shadow-md">
            {label && <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-300">{label}</h3>}
            {audioBlob ? (
                <audio ref={audioRef} controls className="w-full h-10" />
            ) : (
                <div className="h-10 w-full flex items-center justify-center text-gray-400 text-sm italic bg-gray-100 dark:bg-gray-600 rounded">
                    No Audio
                </div>
            )}
        </div>
    );
});

AudioPlayer.displayName = "AudioPlayer";
