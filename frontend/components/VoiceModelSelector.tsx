import React from 'react';

const voiceModels = [
    { id: 'Standard', name: 'Standard' },
    { id: 'Wavenet', name: 'WaveNet' },
    { id: 'Neural2', name: 'Neural2' },
    { id: 'Studio', name: 'Studio' },
    { id: 'gemini-2.5-flash-tts', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro-tts', name: 'Gemini 2.5 Pro' },
    { id: 'chirp3-hd', name: 'Chirp 3 HD' }
];

interface VoiceModelSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export const VoiceModelSelector: React.FC<VoiceModelSelectorProps> = ({ value, onChange }) => (
    <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Voice Model</label>
        <select value={value} onChange={(e) => onChange(e.target.value)}
            className="select-dark focus:ring-amber-500/50">
            {voiceModels.map((m) => (
                <option key={m.id} value={m.id} className="bg-zinc-900 text-zinc-100">
                    {m.name}
                </option>
            ))}
        </select>
    </div>
);
