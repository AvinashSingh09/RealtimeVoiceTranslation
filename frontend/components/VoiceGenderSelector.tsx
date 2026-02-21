import React from 'react';

interface VoiceGenderSelectorProps {
    value: string;
    onChange: (value: string) => void;
    voiceModel?: string;
}

const geminiSpeakers = [
    { id: 'Kore', name: 'Kore (Female)' },
    { id: 'Aoede', name: 'Aoede (Female)' },
    { id: 'Callirrhoe', name: 'Callirrhoe (Female)' },
    { id: 'Charon', name: 'Charon (Male)' },
    { id: 'Fenrir', name: 'Fenrir (Male)' },
    { id: 'Puck', name: 'Puck (Male)' },
];

export const VoiceGenderSelector: React.FC<VoiceGenderSelectorProps> = ({ value, onChange, voiceModel }) => {
    const isAdvancedAI = voiceModel?.startsWith('gemini') || voiceModel?.toLowerCase().includes('chirp');

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                {isAdvancedAI ? 'Speaker (Gemini/Chirp)' : 'Voice Gender'}
            </label>
            <select value={value} onChange={(e) => onChange(e.target.value)}
                className="select-dark focus:ring-amber-500/50">
                {isAdvancedAI ? (
                    geminiSpeakers.map(s => (
                        <option key={s.id} value={s.id} className="bg-zinc-900 text-zinc-100">{s.name}</option>
                    ))
                ) : (
                    <>
                        <option value="NEUTRAL" className="bg-zinc-900 text-zinc-100">Neutral</option>
                        <option value="MALE" className="bg-zinc-900 text-zinc-100">Male</option>
                        <option value="FEMALE" className="bg-zinc-900 text-zinc-100">Female</option>
                    </>
                )}
            </select>
        </div>
    );
};
