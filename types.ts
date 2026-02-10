export type LCATLevel = 'I' | 'II' | 'III' | 'IV' | 'V' | 'PENDING';

export interface Candidate {
  id: string;
  name: string;
  email?: string;
  lcat: string;
  level: LCATLevel;
  yearsExperience: number;
  education: string;
  certifications: string[];
  clearance: string;
  location: string;
  summary: string; // Brief justification/skills summary
}

export interface Position {
  id: string;
  title: string;
  lcat: string;
  level: LCATLevel;
  loe: number; // 1.0 = Full Time
  location: string;
  clearance: string;
  educationReq: string;
  certificationsReq: string[];
  skillsReq: string[];
}

export interface Proposal {
  id: string;
  name: string;
  positions: Position[];
}

export interface Assignment {
  id: string;
  proposalId: string;
  positionId: string;
  candidateId: string;
  score: number; // 0-100
  reasoning: string;
  assignedLoe: number;
}

export interface AppState {
  candidates: Candidate[];
  proposals: Proposal[];
  assignments: Assignment[];
}
