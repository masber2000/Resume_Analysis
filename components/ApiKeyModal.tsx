import React, { useState } from 'react';

export const ApiKeyModal = ({ onSubmit }: { onSubmit: (key: string) => void }) => {
  const [key, setKey] = useState('');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-slate-800">Enter Gemini API Key</h2>
        <p className="text-sm text-slate-600 mb-4">Required for analysis. Key is not stored permanently.</p>
        <input 
          type="password" 
          className="w-full border border-slate-300 rounded p-2 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="AIzaSy..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <button 
          onClick={() => key && onSubmit(key)}
          disabled={!key}
          className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Start System
        </button>
      </div>
    </div>
  );
};
