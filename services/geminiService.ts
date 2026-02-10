import { GoogleGenAI, Schema, Type } from "@google/genai";
import { Candidate, Proposal, Assignment, Position } from '../types';
import { cleanJsonString } from '../utils/helpers';

const MODEL_NAME = 'gemini-3-flash-preview';

const getAI = (apiKey: string) => new GoogleGenAI({ apiKey });

// --- J-5 DEFINITIONS PARSING ---

const J5_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    lcats: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of Labor Category titles extracted from the document."
    }
  },
  required: ['lcats']
};

export const parseJ5Definitions = async (apiKey: string, content: { base64: string, mimeType: string }): Promise<string[]> => {
  const ai = getAI(apiKey);
  
  const prompt = `
    Analyze this J-5 / Labor Category Definition document.
    Extract a comprehensive list of all distinct Labor Category (LCAT) titles defined in the text.
    Return ONLY the list of titles as strings.
    Example: ["Program Manager", "Systems Engineer", "Cyber Security Specialist"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: content.mimeType, data: content.base64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: J5_SCHEMA
      }
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(cleanJsonString(text));
    return parsed.lcats || [];
  } catch (error) {
    console.error("J-5 Parsing Error:", error);
    throw new Error("Failed to extract LCATs from J-5 document.");
  }
};

// --- RESUME ANALYSIS ---

const CANDIDATE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    lcat: { type: Type.STRING, description: "Must match one of the J-5 allowed LCATs exactly" },
    level: { type: Type.STRING, enum: ['I', 'II', 'III', 'IV', 'V', 'PENDING'] },
    yearsExperience: { type: Type.NUMBER },
    education: { type: Type.STRING },
    certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
    clearance: { type: Type.STRING },
    location: { type: Type.STRING },
    summary: { type: Type.STRING, description: "Short summary of skills and justification for level" }
  },
  required: ['name', 'lcat', 'level', 'yearsExperience', 'summary']
};

export const parseResume = async (apiKey: string, fileBase64: string, mimeType: string, allowedLCATs: string[] = []): Promise<Omit<Candidate, 'id'>> => {
  const ai = getAI(apiKey);
  
  let lcatInstruction = "";
  if (allowedLCATs.length > 0) {
    lcatInstruction = `
    *** CRITICAL REQUIREMENT ***
    You MUST map this candidate to EXACTLY ONE of the following Labor Categories (LCATs).
    Do NOT invent a new title. Do NOT use the candidate's current title if it is not in this list.
    Select the closest fit from the list below based on their skills and experience:
    
    ALLOWED J-5 LCATS:
    ${JSON.stringify(allowedLCATs)}
    `;
  } else {
    lcatInstruction = "Determine the most appropriate Federal Labor Category for this candidate.";
  }

  const prompt = `
    Analyze this resume for a Federal Government Contracting role.
    
    ${lcatInstruction}
    
    Rules for Level Determination:
    - Level I: 0-5 years
    - Level II: 6-10 years
    - Level III: 10-15 years
    - Level IV: 15-20 years
    - Level V: 20+ years or recognized SME.
    
    If specific Clearance is not found, mark as "None".
    If Location is not found, mark as "Unknown".
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType, data: fileBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: CANDIDATE_SCHEMA
      }
    });

    const text = response.text || "{}";
    return JSON.parse(cleanJsonString(text));
  } catch (error) {
    console.error("Resume Parsing Error:", error);
    throw new Error("Failed to parse resume.");
  }
};

// --- PROPOSAL PARSING ---

const PROPOSAL_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    proposalName: { type: Type.STRING },
    positions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          lcat: { type: Type.STRING, description: "The Labor Category name for this position" },
          level: { type: Type.STRING, enum: ['I', 'II', 'III', 'IV', 'V'] },
          loe: { type: Type.NUMBER, description: "FTE count (e.g. 1.0). Convert 1880-1920 hours = 1.0 FTE" },
          location: { type: Type.STRING },
          clearance: { type: Type.STRING },
          educationReq: { type: Type.STRING },
          certificationsReq: { type: Type.ARRAY, items: { type: Type.STRING } },
          skillsReq: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['title', 'lcat', 'level', 'loe']
      }
    }
  },
  required: ['proposalName', 'positions']
};

export const parseProposal = async (apiKey: string, content: string | { base64: string, mimeType: string }): Promise<Omit<Proposal, 'id'>> => {
  const ai = getAI(apiKey);
  
  const prompt = `
    Analyze this RFP/SOW document. Extract all staffing positions.
    For each position, identify the Title, LCAT, Level (I-V), LOE (FTE), Location, Clearance, and specific Education/Cert requirements.
    
    If hours are listed instead of FTE, convert 1880 or 1920 hours to 1.0 FTE.
  `;

  const parts = [];
  if (typeof content === 'string') {
    parts.push({ text: `Proposal Text:\n${content}\n\n${prompt}` });
  } else {
    parts.push({ inlineData: { mimeType: content.mimeType, data: content.base64 } });
    parts.push({ text: prompt });
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: PROPOSAL_SCHEMA
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(cleanJsonString(text));
    
    return {
      name: data.proposalName || "Parsed Proposal",
      positions: (data.positions || []).map((p: any) => ({
        ...p,
        id: crypto.randomUUID(),
        loe: p.loe ?? 1.0,
        level: p.level || 'I',
        location: p.location || 'TBD',
        clearance: p.clearance || 'None',
        educationReq: p.educationReq || 'None',
        certificationsReq: p.certificationsReq || [],
        skillsReq: p.skillsReq || []
      }))
    };
  } catch (error) {
    console.error("Proposal Parsing Error:", error);
    throw new Error("Failed to parse proposal.");
  }
};

// --- STAFFING OPTIMIZATION ---

const MATCHING_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    assignments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          proposalId: { type: Type.STRING, description: "Exact proposal ID from input" },
          positionId: { type: Type.STRING, description: "Exact position ID from input" },
          candidateId: { type: Type.STRING, description: "Exact candidate ID from input" },
          score: { type: Type.NUMBER, description: "Fit score 0-100" },
          reasoning: { type: Type.STRING, description: "Brief justification for this match" },
          assignedLoe: { type: Type.NUMBER, description: "FTE assigned (e.g. 1.0)" }
        },
        required: ['proposalId', 'positionId', 'candidateId', 'score', 'reasoning', 'assignedLoe']
      }
    }
  },
  required: ['assignments']
};

export const optimizeStaffing = async (apiKey: string, candidates: Candidate[], proposals: Proposal[]): Promise<Assignment[]> => {
  const ai = getAI(apiKey);

  // Minimize token usage by sending only relevant fields
  const candidateMin = candidates.map(c => ({
    id: c.id,
    name: c.name,
    lcat: c.lcat,
    level: c.level,
    edu: c.education,
    certs: c.certifications,
    clearance: c.clearance
  }));

  const proposalMin = proposals.map(p => ({
    id: p.id,
    name: p.name,
    positions: p.positions.map(pos => ({
      id: pos.id,
      title: pos.title,
      lcat: pos.lcat,
      level: pos.level,
      loe: pos.loe,
      clearance: pos.clearance,
      reqs: [pos.educationReq, ...(pos.certificationsReq || [])],
      skills: pos.skillsReq || []
    }))
  }));

  const prompt = `
    Perform Staffing Optimization. Match candidates to proposal positions.

    Candidates: ${JSON.stringify(candidateMin)}
    Proposals: ${JSON.stringify(proposalMin)}

    Rules:
    1. Match candidates to positions based on LCAT match, Level, Education, Certifications, Clearance, and Skills.
    2. LCAT alignment is the PRIMARY matching criterion — a candidate's lcat should match or closely align with the position's lcat.
    3. A Candidate cannot be assigned to more than 1.0 FTE total across all proposals.
    4. assignedLoe should equal the position's loe value.
    5. Maximize the 'score' (0-100) based on overall fit quality.
    6. Provide a brief reasoning for each match explaining why this candidate fits.
    7. Use the EXACT id values from the input data for proposalId, positionId, and candidateId.
    8. If no suitable candidate exists for a position, omit that position from assignments.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME, 
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: MATCHING_SCHEMA
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(cleanJsonString(text));
    return data.assignments || [];
  } catch (error) {
    console.error("Optimization Error:", error);
    throw new Error("Failed to optimize staffing.");
  }
};