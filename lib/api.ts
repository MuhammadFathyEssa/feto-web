const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://feto-agent-production.up.railway.app";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

function apiHeaders(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) h["X-API-Key"] = API_KEY;
  return h;
}

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

export async function sendMessage(
  userId: string,
  message: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ userId, message }),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export async function getAgents(): Promise<Agent[]> {
  try {
    const res = await fetch(`${API_URL}/api/agents`);
    if (!res.ok) return defaultAgents;
    const data = await res.json();
    return data.agents || defaultAgents;
  } catch {
    return defaultAgents;
  }
}

export async function getHistory(userId: string): Promise<{ role: string; content: string; created_at?: string }[]> {
  try {
    const res = await fetch(`${API_URL}/api/history?userId=${userId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  } catch {
    return [];
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export const defaultAgents: Agent[] = [
  { id: "technology", name: "Technology Advisor", description: "IT strategy, architecture, cloud, infrastructure" },
  { id: "cybersecurity", name: "Cybersecurity Advisor", description: "CISO advisory, risk, compliance, CBE framework" },
  { id: "pentester", name: "Pentester", description: "OWASP, vulnerability assessment, WAF advisory" },
  { id: "dfir", name: "DFIR Expert", description: "Digital forensics, incident response, MITRE ATT&CK" },
  { id: "banking", name: "Banking Advisor", description: "Core banking, T24, digital channels, CBE regulations" },
  { id: "research", name: "Research Agent", description: "Deep research with live web search and synthesis" },
  { id: "content", name: "Content Agent", description: "LinkedIn posts, Arabic content, thought leadership" },
  { id: "assistant", name: "Executive Assistant", description: "Scheduling, email, calendar, productivity" },
  { id: "incident", name: "Incident Commander", description: "P1/P2 incident management, runbooks, escalation" },
  { id: "recruiter",  name: "Recruiter Agent",          description: "CV evaluation, interview questions, job matching" },
  { id: "journalist", name: "Journalist & News Analyst", description: "Breaking news, press briefings, current events analysis" },
  { id: "sports",     name: "Sports Analyst",            description: "Football, Al-Ahly, Egypt team, taekwondo, World Cup 2026" },
  { id: "political",  name: "Political Analyst",         description: "Geopolitics, MENA analysis, Egypt foreign policy, GERD" },
];
