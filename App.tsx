import React, { useState } from 'react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { CandidateTab } from './components/CandidateTab';
import ProposalView from './components/ProposalView';
import { MatrixTab } from './components/MatrixTab';
import { Candidate, Proposal, Assignment } from './types';

const App = () => {
  const [apiKey, setApiKey] = useState('');
  const [activeTab, setActiveTab] = useState<'candidates' | 'proposals' | 'matrix'>('candidates');
  
  // Central State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  // New State for J-5 Enforcement
  const [j5LCATs, setJ5LCATs] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col">
      {!apiKey && <ApiKeyModal onSubmit={setApiKey} />}

      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <i className="fas fa-project-diagram text-blue-500 text-xl"></i>
             <h1 className="text-xl font-bold tracking-tight">ATEPS II <span className="text-slate-400 font-normal">LCAT Analyst</span></h1>
          </div>
          <nav className="flex space-x-2">
             <button 
               onClick={() => setActiveTab('candidates')}
               className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'candidates' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
             >
               Candidates ({candidates.length})
             </button>
             <button 
               onClick={() => setActiveTab('proposals')}
               className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'proposals' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
             >
               Proposals ({proposals.length})
             </button>
             <button 
               onClick={() => setActiveTab('matrix')}
               className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'matrix' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
             >
               Matrix
             </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full py-6 px-4">
        <div className="bg-white rounded-lg shadow-xl border border-slate-200 min-h-[600px] flex flex-col">
          {activeTab === 'candidates' && (
            <CandidateTab 
                apiKey={apiKey} 
                candidates={candidates} 
                setCandidates={setCandidates} 
                j5LCATs={j5LCATs}
                setJ5LCATs={setJ5LCATs}
            />
          )}
          {activeTab === 'proposals' && (
            <ProposalView apiKey={apiKey} proposals={proposals} setProposals={setProposals} />
          )}
          {activeTab === 'matrix' && (
            <MatrixTab 
              apiKey={apiKey} 
              candidates={candidates} 
              proposals={proposals} 
              assignments={assignments} 
              setAssignments={setAssignments} 
            />
          )}
        </div>
      </main>
      
      <footer className="py-4 text-center text-xs text-slate-400">
        GovTech LCAT Analyst • Powered by Google Gemini 3 Flash
      </footer>
    </div>
  );
};

export default App;