import React from 'react';

const voiceModels = [
    { id: 'Standard', name: 'Standard' },
    { id: 'Wavenet', name: 'WaveNet' },
    { id: 'Neural2', name: 'Neural2' },
    { id: 'Studio', name: 'Studio' },
    { id: 'gemini-2.5-flash-tts', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro-tts', name: 'Gemini 2.5 Pro' },
];

interface VoiceModelSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export const VoiceModelSelector: React.FC<VoiceModelSelectorProps> = ({ value, onChange }) => (
    <div className="flex flex-col">
        <label className="mb-2 font-bold text-gray-700">Voice Model</label>
        <select value={value} onChange={(e) => onChange(e.target.value)}
            className="p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black">
            {voiceModels.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
            ))}
        </select>
    </div>
);
