import React from 'react';
import { AppState, Assignment } from '../types';
import { downloadCSV } from '../utils/csvHelper';

interface StaffingMatrixProps {
  state: AppState;
  onOptimize: () => void;
  isOptimizing: boolean;
}

const StaffingMatrix: React.FC<StaffingMatrixProps> = ({ state, onOptimize, isOptimizing }) => {
  const { candidates, proposals, assignments } = state;

  // Helpers to look up data
  const getCandidate = (id: string) => candidates.find(c => c.id === id);
  const getProposal = (id: string) => proposals.find(p => p.id === id);

  // Stats
  const totalPositions = proposals.reduce((acc, p) => acc + p.positions.length, 0);
  const filledPositions = new Set(assignments.map(a => a.positionId)).size;
  const coverageRate = totalPositions > 0 ? Math.round((filledPositions / totalPositions) * 100) : 0;
  
  const getCandidateUtilization = (cid: string) => {
    const candidateAssignments = assignments.filter(a => a.candidateId === cid);
    const totalFTE = candidateAssignments.reduce((sum, a) => sum + a.assignedLoe, 0);
    return Math.round(totalFTE * 100);
  };

  // Sort proposals alphabetically for the "staffing grouping" view
  const sortedProposals = [...proposals].sort((a, b) => a.name.localeCompare(b.name));

  const handleExport = () => {
    const headers = [
      'Proposal Name', 'Position Title', 'Required LCAT', 'Required Level', 'Location',
      'Assigned Candidate Name', 
      'Candidate LCAT', 'Candidate Level', 'Fit Score', 'Assigned FTE', 'Fit Reason'
    ];

    const rows: (string | number | undefined | null)[][] = [];

    sortedProposals.forEach(p => {
      p.positions.forEach(pos => {
        const match = assignments.find(a => a.positionId === pos.id);
        const candidate = match ? getCandidate(match.candidateId) : null;

        rows.push([
          p.name,
          pos.title,
          pos.lcat,
          pos.level,
          pos.location,
          candidate ? candidate.name : 'VACANT',
          candidate ? candidate.lcat : '',
          candidate ? candidate.level : '',
          match ? match.score : '',
          match ? match.assignedLoe : '',
          match ? match.reasoning : ''
        ]);
      });
    });

    downloadCSV(`Staffing_Matrix_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header / Actions */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex gap-8">
           <div className="text-center">
              <p className="text-xs text-slate-500 uppercase font-bold">Total Candidates</p>
              <p className="text-2xl font-bold text-slate-800">{candidates.length}</p>
           </div>
           <div className="text-center">
              <p className="text-xs text-slate-500 uppercase font-bold">Positions Filled</p>
              <p className="text-2xl font-bold text-brand-600">{filledPositions} <span className="text-slate-400 text-lg">/ {totalPositions}</span></p>
           </div>
           <div className="text-center">
              <p className="text-xs text-slate-500 uppercase font-bold">Coverage</p>
              <p className="text-2xl font-bold text-slate-800">{coverageRate}%</p>
           </div>
        </div>
        <div className="flex gap-3">
          {assignments.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-3 rounded-md text-green-700 bg-green-50 border border-green-200 font-bold shadow-sm hover:bg-green-100 transition"
            >
              <i className="fas fa-file-excel"></i> Export Matrix
            </button>
          )}
          <button
            onClick={onOptimize}
            disabled={isOptimizing || candidates.length === 0 || proposals.length === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-md text-white font-bold shadow-md transition ${isOptimizing ? 'bg-slate-400' : 'bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700'}`}
          >
            {isOptimizing ? (
              <><i className="fas fa-cog fa-spin"></i> Optimizing...</>
            ) : (
              <><i className="fas fa-magic"></i> Run AI Optimization</>
            )}
          </button>
        </div>
      </div>

      {/* Main Matrix Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 rounded-lg shadow-inner border border-slate-200 custom-scrollbar p-6">
        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <i className="fas fa-chess-board text-5xl mb-4"></i>
            <p>No assignments generated yet.</p>
            <p className="text-sm">Upload candidates and proposals, then click "Run AI Optimization".</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Break down by Proposal (Grouped View) */}
            {sortedProposals.map(proposal => {
              // Calculate proposal specific stats
              const propPositions = proposal.positions;
              const propAssignments = assignments.filter(a => a.proposalId === proposal.id);
              const propFilled = propAssignments.length;
              const propTotal = propPositions.length;
              
              return (
              <div key={proposal.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-lg">{proposal.name}</h3>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Staffing Status: <span className={propFilled === propTotal ? "text-green-600" : "text-orange-600"}>{propFilled}/{propTotal} Filled</span>
                  </div>
                </div>
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">Position / Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/5">Requirement</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">Assigned Candidate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/6">Fit Analysis</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Justification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {propPositions.map(pos => {
                      const match = assignments.find(a => a.positionId === pos.id);
                      const candidate = match ? getCandidate(match.candidateId) : null;
                      
                      return (
                        <tr key={pos.id} className={`hover:bg-slate-50 transition-colors ${!match ? "bg-red-50/50" : ""}`}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-800">{pos.title}</div>
                            <div className="text-xs text-slate-500">{pos.location}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-700 font-medium">{pos.lcat}</div>
                            <div className="text-xs text-slate-500 mb-1">Level {pos.level} • {pos.loe} FTE</div>
                            {pos.educationReq && pos.educationReq !== 'None' && (
                                <span className="inline-block bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded mr-1">
                                    {pos.educationReq}
                                </span>
                            )}
                            {pos.certificationsReq && pos.certificationsReq.map((c, i) => (
                                <span key={i} className="inline-block bg-purple-50 text-purple-700 text-[10px] px-1.5 py-0.5 rounded mr-1 border border-purple-100">
                                    {c}
                                </span>
                            ))}
                          </td>
                          <td className="px-6 py-4">
                            {candidate ? (
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 text-sm">{candidate.name}</span>
                                <span className={`text-xs w-max mt-1 px-2 py-0.5 rounded-full font-medium border ${
                                  match?.assignedLoe === pos.loe 
                                    ? 'bg-green-100 border-green-200 text-green-700' 
                                    : 'bg-yellow-100 border-yellow-200 text-yellow-700'
                                }`}>
                                  {match?.assignedLoe.toFixed(1)} FTE Assigned
                                </span>
                              </div>
                            ) : (
                              <span className="flex items-center text-red-500 text-sm font-bold">
                                <i className="fas fa-exclamation-circle mr-2"></i> VACANT
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {match ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-full bg-slate-200 rounded-full h-1.5 max-w-[80px]">
                                    <div className={`h-1.5 rounded-full ${
                                      match.score >= 90 ? 'bg-green-500' : match.score >= 70 ? 'bg-blue-500' : 'bg-orange-500'
                                    }`} style={{ width: `${match.score}%` }}></div>
                                  </div>
                                  <span className="text-xs font-bold text-slate-600">{match.score}%</span>
                                </div>
                                <span className="text-[10px] text-slate-400">Match Score</span>
                              </div>
                            ) : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-slate-600 leading-snug" title={match?.reasoning}>
                              {match?.reasoning || '-'}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Utilization Grid */}
      {candidates.length > 0 && assignments.length > 0 && (
         <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <i className="fas fa-chart-pie text-brand-600"></i> Staff Utilization Report
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {candidates.map(c => {
                const util = getCandidateUtilization(c.id);
                const isOver = util > 120;
                const isUnder = util < 50 && util > 0;
                const isOptimal = util >= 90 && util <= 110;
                
                return (
                  <div key={c.id} className={`p-3 rounded border shadow-sm text-sm transition-all ${
                    isOver ? 'bg-red-50 border-red-200' : 
                    util === 0 ? 'bg-slate-50 border-slate-200 opacity-60' : 
                    'bg-white border-slate-200'
                  }`}>
                    <div className="font-bold text-slate-800 truncate" title={`${c.name}`}>{c.name}</div>
                    <div className="flex justify-between items-center mt-2">
                       <span className={`font-mono font-bold text-lg ${
                         isOver ? 'text-red-600' : isOptimal ? 'text-green-600' : 'text-slate-600'
                       }`}>
                         {util}%
                       </span>
                       <span className="text-[10px] text-slate-400 uppercase">Load</span>
                    </div>
                  </div>
                )
              })}
            </div>
         </div>
      )}
    </div>
  );
};

export default StaffingMatrix;