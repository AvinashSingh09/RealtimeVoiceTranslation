import React from 'react';

interface LanguageSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const languages = [
  { code: 'en-US', name: 'English' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'mr-IN', name: 'Marathi' },
  { code: 'gu-IN', name: 'Gujarati' },
  { code: 'bn-IN', name: 'Bengali' },
  { code: 'ne-NP', name: 'Nepali' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ label, value, onChange }) => {
  return (
    <div className="flex flex-col">
      <label className="mb-2 font-bold text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};
