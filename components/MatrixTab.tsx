import React, { useState } from 'react';
    import { Candidate, Proposal, Assignment } from '../types';
    import { optimizeStaffing } from '../services/geminiService';
    import { downloadCSV } from '../utils/csvHelper';
    
    interface Props {
      apiKey: string;
      candidates: Candidate[];
      proposals: Proposal[];
      assignments: Assignment[];
      setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
    }
    
    export const MatrixTab: React.FC<Props> = ({ apiKey, candidates, proposals, assignments, setAssignments }) => {
      const [optimizing, setOptimizing] = useState(false);
    
      const handleRun = async () => {
        setOptimizing(true);
        try {
          const results = await optimizeStaffing(apiKey, candidates, proposals);
          setAssignments(results.map(r => ({ ...r, id: crypto.randomUUID() })));
        } catch (err) {
          alert("Optimization failed. Try simpler data.");
        }
        setOptimizing(false);
      };

      const handleExport = () => {
        const rows: (string | number)[][] = [];
        proposals.forEach(prop => {
            prop.positions.forEach(pos => {
                const match = assignments.find(a => a.positionId === pos.id);
                const candidate = match ? candidates.find(c => c.id === match.candidateId) : null;
                rows.push([
                    prop.name,
                    pos.title,
                    pos.lcat,
                    pos.level,
                    candidate ? candidate.name : 'UNFILLED',
                    match ? match.score : 0,
                    match ? match.reasoning : ''
                ]);
            });
        });
        downloadCSV('staffing_matrix.csv', ['Proposal', 'Position', 'LCAT', 'Level', 'Candidate', 'Fit Score', 'Reason'], rows);
      };
    
      return (
        <div className="p-6 h-full flex flex-col">
           <div className="flex justify-between items-center mb-6">
             <h2 className="text-2xl font-bold text-slate-800">Staffing Matrix</h2>
             <div className="flex gap-3">
                 {assignments.length > 0 && (
                     <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700">
                         Export CSV
                     </button>
                 )}
                 <button 
                   onClick={handleRun}
                   disabled={optimizing || candidates.length === 0 || proposals.length === 0}
                   className="bg-indigo-600 text-white px-6 py-2 rounded font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                 >
                   {optimizing ? <i className="fas fa-cog fa-spin"></i> : <i className="fas fa-bolt"></i>}
                   Run AI Optimization
                 </button>
             </div>
           </div>
    
           <div className="flex-1 overflow-auto bg-slate-50 rounded-lg border border-slate-200 p-4">
             {proposals.length === 0 ? (
               <div className="text-center text-slate-400 mt-20">Add proposals to generate matrix.</div>
             ) : (
               <div className="space-y-8">
                 {proposals.map(prop => (
                   <div key={prop.id} className="bg-white shadow rounded-lg overflow-hidden">
                     <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 font-bold text-slate-800">
                       {prop.name}
                     </div>
                     <table className="w-full text-sm">
                       <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                         <tr>
                           <th className="px-6 py-3 text-left">Position Requirement</th>
                           <th className="px-6 py-3 text-left">Assigned Candidate</th>
                           <th className="px-6 py-3 text-left">Fit Analysis</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {prop.positions.map(pos => {
                           const match = assignments.find(a => a.positionId === pos.id);
                           const candidate = match ? candidates.find(c => c.id === match.candidateId) : null;
                           
                           return (
                             <tr key={pos.id} className="hover:bg-slate-50">
                               <td className="px-6 py-4 w-1/3">
                                 <div className="font-bold text-slate-900">{pos.title}</div>
                                 <div className="text-xs text-slate-500">{pos.lcat} | Level {pos.level}</div>
                                 <div className="text-xs text-slate-500 mt-1">
                                    {pos.educationReq && pos.educationReq !== 'None' && <span className="bg-slate-100 px-1 rounded mr-1">{pos.educationReq}</span>}
                                    {(pos.certificationsReq || []).map(c => <span key={c} className="bg-purple-50 text-purple-700 px-1 rounded mr-1">{c}</span>)}
                                 </div>
                               </td>
                               <td className="px-6 py-4 w-1/3">
                                 {candidate ? (
                                   <div>
                                     <div className="font-bold text-blue-700">{candidate.name}</div>
                                     <div className="text-xs text-slate-500">
                                       Level {candidate.level} | {candidate.yearsExperience} yrs
                                     </div>
                                   </div>
                                 ) : (
                                   <span className="text-red-400 font-bold text-xs uppercase tracking-wide">Unfilled</span>
                                 )}
                               </td>
                               <td className="px-6 py-4 w-1/3">
                                 {match ? (
                                   <div>
                                     <div className="flex items-center gap-2 mb-1">
                                        <div className="w-16 bg-slate-200 rounded-full h-2">
                                           <div className={`h-2 rounded-full ${match.score > 80 ? 'bg-green-500' : 'bg-orange-500'}`} style={{width: `${match.score}%`}}></div>
                                        </div>
                                        <span className="font-bold text-xs">{match.score}%</span>
                                     </div>
                                     <p className="text-xs text-slate-600">{match.reasoning}</p>
                                   </div>
                                 ) : (
                                   <span className="text-slate-300">-</span>
                                 )}
                               </td>
                             </tr>
                           );
                         })}
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
    