import React, { useState } from 'react';
import { Proposal } from '../types';
import FileUpload from './FileUpload';
import { parseProposal } from '../services/geminiService';
import { downloadCSV } from '../utils/csvHelper';

interface ProposalViewProps {
  apiKey: string;
  proposals: Proposal[];
  setProposals: React.Dispatch<React.SetStateAction<Proposal[]>>;
}

const ProposalView: React.FC<ProposalViewProps> = ({ apiKey, proposals, setProposals }) => {
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddFiles = async (files: {file: File, base64: string}[]) => {
    setIsProcessing(true);
    for (const { file, base64 } of files) {
      try {
        const data = await parseProposal(apiKey, { base64, mimeType: file.type });
        setProposals(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
      } catch (err) {
        console.error(`Failed to parse ${file.name}`, err);
        alert(`Failed to parse ${file.name}`);
      }
    }
    setIsProcessing(false);
  };

  const handleAddText = async () => {
    if (!textInput.trim()) return;
    setIsProcessing(true);
    try {
      const data = await parseProposal(apiKey, textInput);
      setProposals(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
      setTextInput('');
    } catch (err) {
      alert("Parsing failed. Please check the text and try again.");
    }
    setIsProcessing(false);
  };

  const handleRemoveProposal = (id: string) => {
    setProposals(prev => prev.filter(p => p.id !== id));
  };

  const handleExport = () => {
    const headers = [
      'Proposal Name', 'Position Title', 'Required LCAT',
      'Required Level', 'LOE (FTE)', 'Location',
      'Education', 'Certifications',
      'Clearance Required', 'Skills'
    ];

    const rows: (string | number | undefined | null)[][] = [];

    proposals.forEach(p => {
      p.positions.forEach(pos => {
        rows.push([
          p.name,
          pos.title,
          pos.lcat,
          pos.level,
          pos.loe,
          pos.location,
          pos.educationReq,
          (pos.certificationsReq || []).join('; '),
          pos.clearance,
          (pos.skillsReq || []).join('; ')
        ]);
      });
    });

    downloadCSV(`Proposal_Matrix_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full p-6">
      {/* Input Column */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-slate-800">Ingest Proposal</h3>
              <p className="text-[10px] text-slate-400">PDF or Text</p>
            </div>
          </div>

          <div className="mb-6">
             <FileUpload
                label="Upload RFP Documents"
                multiple={true}
                onFilesSelect={handleAddFiles}
                isProcessing={isProcessing}
             />
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase">Or Paste Text</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <textarea
            className="w-full h-40 p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm font-mono custom-scrollbar mt-2"
            placeholder="Paste RFP Section B, Section L, or Staffing Table..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          ></textarea>
          <button
            onClick={handleAddText}
            disabled={isProcessing || !textInput.trim()}
            className={`mt-4 w-full py-2 px-4 rounded text-white font-bold transition ${isProcessing ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isProcessing ? 'Analyzing RFP...' : 'Extract Requirements'}
          </button>
        </div>
      </div>

      {/* List Column */}
      <div className="lg:col-span-3 overflow-y-auto custom-scrollbar flex flex-col h-full">
        {proposals.length > 0 && (
          <div className="mb-4 flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-800">RFP Requirements Matrix</h2>
              <p className="text-xs text-slate-500">Positions and mandatory qualifications extracted from solicitation documents.</p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              <i className="fas fa-file-excel"></i> Export Matrix
            </button>
          </div>
        )}

        {proposals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
            <i className="fas fa-file-contract text-4xl mb-2"></i>
            <p>No proposals added yet.</p>
            <p className="text-sm mt-2">Upload an RFP to extract Labor Categories and Requirements.</p>
          </div>
        ) : (
          <div className="space-y-6 pb-6">
            {proposals.map((p) => (
              <div key={p.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">{p.name || "Untitled Proposal"}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{p.positions.length} Positions</span>
                    <button
                      onClick={() => handleRemoveProposal(p.id)}
                      className="text-red-400 hover:text-red-700 transition-colors p-1"
                      title="Remove Proposal"
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 w-1/5">Position / LCAT</th>
                        <th className="px-4 py-2 w-24">LOE/Loc</th>
                        <th className="px-4 py-2 w-1/6">Education & Certs</th>
                        <th className="px-4 py-2 w-1/4">Mandatory Skills</th>
                        <th className="px-4 py-2 w-24">Clearance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {p.positions.map((pos) => (
                        <tr key={pos.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800">{pos.title}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              {pos.lcat} <span className="text-slate-300">|</span> Lvl {pos.level}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <div className="font-medium">{(pos.loe ?? 0).toFixed(1)} FTE</div>
                            <div className="text-slate-500">{pos.location}</div>
                          </td>
                          <td className="px-4 py-3">
                            {pos.educationReq && pos.educationReq !== 'None' && (
                               <div className="text-xs font-semibold text-slate-700 mb-1"><i className="fas fa-graduation-cap text-slate-400 mr-1"></i> {pos.educationReq}</div>
                            )}
                            {pos.certificationsReq && pos.certificationsReq.length > 0 ? (
                               <div className="flex flex-wrap gap-1">
                                  {pos.certificationsReq.map((c, i) => (
                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                      {c}
                                    </span>
                                  ))}
                               </div>
                            ) : <span className="text-xs text-slate-400">-</span>}
                          </td>
                          <td className="px-4 py-3">
                             {pos.skillsReq && pos.skillsReq.length > 0 ? (
                                <ul className="list-disc list-inside text-xs text-slate-600 leading-tight">
                                  {pos.skillsReq.slice(0, 3).map((s, i) => (
                                    <li key={i} className="truncate" title={s}>{s}</li>
                                  ))}
                                  {pos.skillsReq.length > 3 && <li className="text-slate-400 italic">+{pos.skillsReq.length - 3} more</li>}
                                </ul>
                             ) : <span className="text-xs text-slate-400">-</span>}
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-slate-600">
                            {pos.clearance || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalView;