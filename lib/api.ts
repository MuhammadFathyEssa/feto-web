// All backend calls go through same-origin /api/proxy/* routes.
// The backend API key lives ONLY on the server (BACKEND_API_KEY) and is
// never shipped to the browser. userId is derived from the session server-side.

export interface ChatResponse {
  success: boolean;
  response: string;
  agentType: string;
  timestamp: string;
  error?: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
}

export async function sendMessage(message: string): Promise<ChatResponse> {
  const res = await fetch(`/api/proxy/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

export async function getAgents(): Promise<Agent[]> {
  try {
    const res = await fetch(`/api/proxy/agents`);
    if (!res.ok) return defaultAgents;
    const data = await res.json();
    return data.agents || defaultAgents;
  } catch {
    return defaultAgents;
  }
}

export async function getHistory(): Promise<{ role: string; content: string; created_at?: string }[]> {
  try {
    const res = await fetch(`/api/proxy/history`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  } catch {
    return [];
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`/api/proxy/agents`);
    return res.ok;
  } catch {
    return false;
  }
}

export const defaultAgents: Agent[] = [
  { id: "assistant", name: "Executive Assistant", description: "Scheduling, email, calendar, productivity" },
  { id: "banking", name: "Banking Advisor", description: "Core banking, T24, digital channels, CBE regulations" },
  { id: "board",       name: "Board Advisor",         description: "Board papers, governance, regulator comms, RAG reporting" },
  { id: "chiefofstaff",name: "Chief of Staff",        description: "Top-3 triage, delegation drafting, decision queue, memory" },
  { id: "content", name: "Content Agent", description: "LinkedIn posts, Arabic content, thought leadership" },
  { id: "correspondence", name: "Executive Correspondence", description: "Executive business email: draft, reply, rewrite, Arabic→Business English" },
  { id: "cybersecurity", name: "Cybersecurity Advisor", description: "CISO advisory, risk, compliance, CBE framework" },
  { id: "dfir", name: "DFIR Expert", description: "Digital forensics, incident response, MITRE ATT&CK" },
  { id: "coach",       name: "Executive Coach",       description: "Executive presence, managing up, GROW, MENA career trajectory" },
  { id: "memo", name: "Executive Memo (Arabic)", description: "Board-grade Arabic memos: decision request, risks, financials, benefits" },
  { id: "incident", name: "Incident Commander", description: "P1/P2 incident management, runbooks, escalation" },
  { id: "innovation",  name: "Innovation Advisor",    description: "Three horizons, pilot design, fintech bets, GenAI value" },
  { id: "investment",  name: "Investment Advisor",    description: "TCO/NPV, vendor negotiation, business case, Broadcom economics" },
  { id: "journalist", name: "Journalist & News Analyst", description: "Breaking news, press briefings, current events analysis" },
  { id: "negotiation", name: "Negotiation Coach",     description: "Fisher-Ury + Voss toolkit, prep sheet, Egyptian/GCC dynamics" },
  { id: "pentester", name: "Pentester", description: "OWASP, vulnerability assessment, WAF advisory" },
  { id: "personality", name: "Personality Assessment",description: "8-stage diagnostic: motivation, leadership, trust, blind spots" },
  { id: "political",  name: "Political Analyst",         description: "Geopolitics, MENA analysis, Egypt foreign policy, GERD" },
  { id: "recruiter",  name: "Recruiter Agent",          description: "CV evaluation, interview questions, job matching" },
  { id: "research", name: "Research Agent", description: "Deep research with live web search and synthesis" },
  { id: "sports",     name: "Sports Analyst",            description: "Football, Al-Ahly, Egypt team, taekwondo, World Cup 2026" },
  { id: "technology", name: "Technology Advisor", description: "IT strategy, architecture, cloud, infrastructure" },
  { id: "tutor",       name: "Adaptive Tutor",        description: "Step-by-step teaching with testing on hard technical topics" },
];
