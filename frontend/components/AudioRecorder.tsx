import React, { useState, useRef } from 'react';

interface AudioRecorderProps {
    onAudioRecorded: (audioBlob: Blob) => void;
    isProcessing: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioRecorded, isProcessing }) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Microphone access is not supported in this browser or context. Please ensure you are using a secure context (HTTPS) or localhost.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onAudioRecorded(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            // Fallback for Safari/browsers that don't support audio/webm
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                chunksRef.current = [];
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksRef.current.push(e.data);
                };
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
                    onAudioRecorded(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                };
                mediaRecorder.start();
                setIsRecording(true);
            } catch (e) {
                alert("Could not access microphone or unsupported format.");
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`px-6 py-3 rounded-full font-bold text-white transition-colors ${isRecording
                    ? 'bg-red-500 hover:bg-red-600'
                    : isProcessing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
            >
                {isRecording ? 'Stop Recording' : isProcessing ? 'Processing...' : 'Start Recording'}
            </button>
            {isRecording && <p className="mt-2 text-red-500 animate-pulse">Recording...</p>}
        </div>
    );
};
