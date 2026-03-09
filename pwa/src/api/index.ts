const API_BASE = '/api';

/**
 * 获取存储的 token
 */
function getToken(): string | null {
  try {
    const stored = localStorage.getItem('xopc-auth');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed.state?.token || null;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error('API 请求失败:', {
      endpoint,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Auth API
export async function login(telegramUserId: number) {
  return apiRequest<{ token: string; telegramUserId: number }>('/auth/token', {
    method: 'POST',
    body: JSON.stringify({ telegramUserId })
  });
}

// Ideas API
export interface Idea {
  id: string;
  content: string;
  inputType: string;
  createdAt: number;
  tags: string[];
  passionScore?: number;
  status: string;
  catalysisReport?: string;
}

export async function getIdeas() {
  return apiRequest<{ ideas: Idea[]; count: number }>('/ideas');
}

export async function createIdea(content: string, inputType = 'text', tags: string[] = []) {
  return apiRequest<{ idea: Idea }>('/ideas', {
    method: 'POST',
    body: JSON.stringify({ content, inputType, tags })
  });
}

export async function getIdea(id: string) {
  return apiRequest<{ idea: Idea }>(`/ideas/${id}`);
}

export async function updateIdea(id: string, updates: Partial<Idea>) {
  return apiRequest<{ idea: Idea }>(`/ideas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function deleteIdea(id: string) {
  return apiRequest<{ success: boolean }>(`/ideas/${id}`, {
    method: 'DELETE'
  });
}

export async function catalyzeIdea(id: string) {
  return apiRequest<{ report: any }>(`/catalyst/${id}`, {
    method: 'POST'
  });
}

export async function submitFeedback(ideaId: string, type: 'positive' | 'negative') {
  return apiRequest<{ success: boolean }>('/feedback', {
    method: 'POST',
    body: JSON.stringify({ ideaId, type })
  });
}

// Experiment API
export interface Experiment {
  id: string;
  round: number;
  timestamp: number;
  hypothesis: string;
  variant: {
    type: string;
    changes: string[];
  };
  metrics: {
    positiveFeedback: number;
    totalContacts: number;
    conversionRate: number;
  };
  status: 'keep' | 'discard' | 'crash';
  aiReflection: string;
}

export interface ExperimentLog {
  ideaId: string;
  framework: {
    type: string;
    timeBudgetMs: number;
    successMetric: string;
    successThreshold: number;
    mutableVariables: string[];
    immutableConstraints: string[];
  };
  experiments: Experiment[];
  bestVariant?: string;
  learningSummary?: string;
  startedAt: number;
  completedAt?: number;
}

export async function startExperiment(ideaId: string) {
  return apiRequest<{ success: boolean; message: string }>('/experiment/start', {
    method: 'POST',
    body: JSON.stringify({ ideaId })
  });
}

export async function getExperimentLog(ideaId: string) {
  return apiRequest<{ log: ExperimentLog }>(`/experiment/log/${ideaId}`);
}

export async function getExperimentSummary(ideaId: string) {
  return apiRequest<{ 
    summary: string; 
    bestVariant?: string; 
    completedAt?: number 
  }>(`/experiment/summary/${ideaId}`);
}
