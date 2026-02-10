import React from 'react';
import { Candidate, LCATLevel } from '../types';
import { downloadCSV } from '../utils/csvHelper';

interface CandidateListProps {
  candidates: Candidate[];
  onRemove: (id: string) => void;
}

const getLevelBadgeColor = (level: LCATLevel) => {
  switch (level) {
    case 'V': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'IV': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'III': return 'bg-green-100 text-green-800 border-green-200';
    case 'II': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'I': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const CandidateList: React.FC<CandidateListProps> = ({ candidates, onRemove }) => {
  const handleExport = () => {
    const headers = [
      'Name', 'LCAT', 'Level', 
      'Years Experience', 'Education', 'Clearance', 
      'Location', 'Summary', 'Certifications'
    ];
    
    const rows = candidates.map(c => [
      c.name,
      c.lcat,
      c.level,
      c.yearsExperience,
      c.education,
      c.clearance,
      c.location,
      c.summary,
      c.certifications.join('; ')
    ]);

    downloadCSV(`Candidate_Matrix_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  if (candidates.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded shadow-sm border border-slate-200">
        <p className="text-slate-500">No candidates analyzed yet. Upload a resume to begin.</p>
      </div>
    );
  }

  // Sort candidates by Name
  const sortedCandidates = [...candidates].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    <div className="rounded-lg border border-slate-200 shadow-sm bg-white flex flex-col">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
        <div className="text-sm text-slate-500">
          Showing <span className="font-bold text-slate-800">{candidates.length}</span> candidates
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded shadow-sm transition-colors"
          title="Download as CSV"
        >
          <i className="fas fa-file-excel"></i> Export Matrix
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Candidate Identity</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Preferred LCAT</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Qualifications</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">LCAT Summary</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {sortedCandidates.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{c.name}</span>
                      <span className="text-xs text-slate-500"><i className="fas fa-map-marker-alt mr-1"></i> {c.location || 'Unknown Location'}</span>
                      <span className="text-xs text-slate-500 mt-1">Clx: {c.clearance || 'None'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-slate-900">{c.lcat}</span>
                      <div>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getLevelBadgeColor(c.level)}`}>
                          Level {c.level}
                          </span>
                      </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-900 font-medium">{c.yearsExperience} Years Exp.</div>
                  <div className="text-xs text-slate-600 mt-1">{c.education}</div>
                  {c.certifications.length > 0 && (
                     <div className="text-xs text-brand-600 mt-1 italic">
                         Certs: {c.certifications.join(", ")}
                     </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed" title={c.summary}>
                    {c.summary}
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => onRemove(c.id)}
                    className="text-red-400 hover:text-red-700 transition-colors p-2"
                    title="Remove Candidate"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandidateList;