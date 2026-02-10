import React, { useState } from 'react';
import { Candidate } from '../types';
import { parseResume, parseJ5Definitions } from '../services/geminiService';
import CandidateList from './CandidateList';

interface Props {
  apiKey: string;
  candidates: Candidate[];
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
  j5LCATs: string[];
  setJ5LCATs: React.Dispatch<React.SetStateAction<string[]>>;
}

export const CandidateTab: React.FC<Props> = ({ apiKey, candidates, setCandidates, j5LCATs, setJ5LCATs }) => {
  const [loading, setLoading] = useState(false);
  const [j5Loading, setJ5Loading] = useState(false);

  const handleJ5Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setJ5Loading(true);
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string)?.split(',')[1];
        if (base64) {
            try {
                const lcats = await parseJ5Definitions(apiKey, { base64, mimeType: file.type });
                setJ5LCATs(lcats);
            } catch (err) {
                alert("Failed to parse J-5 Document. Please ensure it contains a list of Labor Categories.");
            }
            setJ5Loading(false);
        }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    if (j5LCATs.length === 0) {
        alert("Please upload a J-5 Definitions document first. We need strict LCATs to map candidates correctly.");
        return;
    }

    setLoading(true);
    const files = Array.from(e.target.files) as File[];

    for (const file of files) {
      await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = async (ev) => {
            const base64 = (ev.target?.result as string)?.split(',')[1];
            if (base64) {
              try {
                // Pass j5LCATs to enforce strict mapping
                const data = await parseResume(apiKey, base64, file.type, j5LCATs);
                setCandidates(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
              } catch (err) {
                console.error(err);
              }
            }
            resolve();
          };
          reader.readAsDataURL(file);
      });
    }
    setLoading(false);
    e.target.value = '';
  };

  const handleRemove = (id: string) => {
      setCandidates(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        
      {/* Sidebar: Configuration & Upload */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Step 1: J-5 Configuration */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">
                1. J-5 Configuration
            </h3>
            <p className="text-xs text-slate-500 mb-4">
                Upload your Labor Category Definitions (J-5) to enforce strict role mapping.
            </p>

            <div className={`p-3 rounded mb-4 text-xs font-medium border ${j5LCATs.length > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {j5Loading ? (
                    <span className="flex items-center gap-2"><i className="fas fa-spinner fa-spin"></i> Parsing J-5...</span>
                ) : j5LCATs.length > 0 ? (
                    <span className="flex items-center gap-2"><i className="fas fa-check-circle"></i> {j5LCATs.length} LCATs Active</span>
                ) : (
                    <span className="flex items-center gap-2"><i className="fas fa-exclamation-circle"></i> No LCATs Loaded</span>
                )}
            </div>

            <label className={`block w-full py-2 px-3 text-center rounded border border-dashed cursor-pointer transition ${j5LCATs.length > 0 ? 'border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100' : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                <span className="text-sm font-bold">{j5LCATs.length > 0 ? 'Update J-5 File' : 'Upload J-5 PDF'}</span>
                <input type="file" accept=".pdf,.txt" className="hidden" onChange={handleJ5Upload} disabled={j5Loading} />
            </label>

            {j5LCATs.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto custom-scrollbar border border-slate-100 rounded bg-slate-50 p-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Allowed Titles:</p>
                    <ul className="text-[10px] text-slate-600 space-y-0.5">
                        {j5LCATs.map((l, i) => <li key={i} className="truncate">• {l}</li>)}
                    </ul>
                </div>
            )}
        </div>

        {/* Step 2: Resume Ingestion */}
        <div className={`bg-white p-5 rounded-lg shadow-sm border border-slate-200 ${j5LCATs.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">
                2. Ingest Resumes
            </h3>
            <p className="text-xs text-slate-500 mb-4">
                Upload resumes. The AI will strictly map them to the J-5 LCATs above.
            </p>

            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-brand-300 border-dashed rounded-lg cursor-pointer bg-brand-50 hover:bg-brand-100 transition">
                {loading ? (
                    <div className="flex flex-col items-center text-brand-600">
                        <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                        <span className="text-xs font-bold">Analyzing...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-brand-600">
                        <i className="fas fa-file-upload text-2xl mb-2"></i>
                        <span className="text-sm font-bold">Upload Resumes</span>
                        <span className="text-[10px] opacity-75">PDF or TXT</span>
                    </div>
                )}
                <input type="file" multiple accept=".pdf,.txt" className="hidden" onChange={handleFileUpload} disabled={loading} />
            </label>
            <p className="text-center text-[10px] text-slate-400 mt-2">Supports batch upload</p>
        </div>

      </div>

      {/* Main Content: Registry List */}
      <div className="lg:col-span-3 h-full overflow-hidden flex flex-col">
        <CandidateList candidates={candidates} onRemove={handleRemove} />
      </div>

    </div>
  );
};
