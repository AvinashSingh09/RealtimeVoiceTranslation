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
    const isGemini = voiceModel?.startsWith('gemini');

    return (
        <div className="flex flex-col">
            <label className="mb-2 font-bold text-gray-700">{isGemini ? 'Speaker (Gemini)' : 'Voice Gender'}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)}
                className="p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black">
                {isGemini ? (
                    geminiSpeakers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                ) : (
                    <>
                        <option value="NEUTRAL">Neutral</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                    </>
                )}
            </select>
        </div>
    );
};
