import React from 'react';

interface LanguageSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const languages = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-IN', name: 'English (India)' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'bn-IN', name: 'Bengali' },
  { code: 'gu-IN', name: 'Gujarati' },
  { code: 'kn-IN', name: 'Kannada' },
  { code: 'ml-IN', name: 'Malayalam' },
  { code: 'mr-IN', name: 'Marathi' },
  { code: 'pa-IN', name: 'Punjabi' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'te-IN', name: 'Telugu' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ label, value, onChange }) => {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select-dark focus:ring-blue-500/50"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-zinc-900 text-zinc-100">
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};
