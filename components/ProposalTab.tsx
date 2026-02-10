import React, { useState } from 'react';
    import { Proposal } from '../types';
    import { parseProposal } from '../services/geminiService';
    
    interface Props {
      apiKey: string;
      proposals: Proposal[];
      setProposals: React.Dispatch<React.SetStateAction<Proposal[]>>;
    }
    
    export const ProposalTab: React.FC<Props> = ({ apiKey, proposals, setProposals }) => {
      const [loading, setLoading] = useState(false);
      const [text, setText] = useState('');
    
      const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setLoading(true);
        
        const files = Array.from(e.target.files) as File[];
        
        // Process files sequentially to ensure state updates correctly and manage rate limits
        for (const file of files) {
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = async (ev) => {
              const base64 = (ev.target?.result as string)?.split(',')[1];
              if (base64) {
                try {
                  const data = await parseProposal(apiKey, { base64, mimeType: file.type });
                  setProposals(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
                } catch (err) {
                  console.error(`Failed to parse ${file.name}`, err);
                  alert(`Failed to parse ${file.name}`);
                }
              }
              resolve();
            };
            reader.onerror = () => {
                alert(`Error reading ${file.name}`);
                resolve();
            };
            reader.readAsDataURL(file);
          });
        }
        
        setLoading(false);
        e.target.value = ''; // Reset input
      };
    
      const handleTextSubmit = async () => {
        if (!text) return;
        setLoading(true);
        try {
          const data = await parseProposal(apiKey, text);
          setProposals(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
          setText('');
        } catch (err) {
          alert("Parsing failed");
        }
        setLoading(false);
      };
    
      return (
        <div className="p-6 h-full flex flex-col md:flex-row gap-6">
          {/* Input Area */}
          <div className="w-full md:w-1/3 bg-white p-4 rounded-lg shadow border border-slate-200 h-fit">
            <h3 className="font-bold text-lg mb-4 text-slate-800">Ingest RFP</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload Proposals (PDF)</label>
              <input 
                type="file" 
                accept=".pdf" 
                multiple
                onChange={handleFileUpload}
                disabled={loading}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-slate-400 mt-1">Select multiple files to batch process.</p>
            </div>
    
            <div className="relative flex py-2 items-center mb-4">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase">Or Paste Text</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
    
            <textarea
              className="w-full h-40 p-2 border border-slate-300 rounded text-sm mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Paste Section B or Staffing Table..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            ></textarea>
            
            <button 
              onClick={handleTextSubmit}
              disabled={loading || !text}
              className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading && <i className="fas fa-spinner fa-spin"></i>}
              {loading ? 'Processing...' : 'Extract Positions'}
            </button>
          </div>
    
          {/* List Area */}
          <div className="w-full md:w-2/3 overflow-y-auto">
            {proposals.length === 0 ? (
               <div className="h-full flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                 No proposals loaded.
               </div>
            ) : (
              <div className="space-y-6">
                {proposals.map(p => (
                  <div key={p.id} className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between">
                       <h4 className="font-bold text-slate-800">{p.name}</h4>
                       <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{p.positions.length} Positions</span>
                    </div>
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                        <tr>
                          <th className="px-4 py-2">Position</th>
                          <th className="px-4 py-2">LCAT/Lvl</th>
                          <th className="px-4 py-2">LOE</th>
                          <th className="px-4 py-2">Reqs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.positions.map(pos => (
                          <tr key={pos.id} className="border-b last:border-0 hover:bg-slate-50">
                            <td className="px-4 py-2 font-medium">{pos.title}</td>
                            <td className="px-4 py-2">{pos.lcat} ({pos.level})</td>
                            <td className="px-4 py-2">{(pos.loe ?? 0).toFixed(1)}</td>
                            <td className="px-4 py-2 text-xs text-slate-500">
                              {pos.educationReq && pos.educationReq !== 'None' && <div>{pos.educationReq}</div>}
                              {(pos.certificationsReq || []).length > 0 && <div>{(pos.certificationsReq || []).join(', ')}</div>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    };