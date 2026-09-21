export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
};

export type Profile = {
  user_id: string;
  headline: string;
  location: string;
  bio: string;
  target_role: string;
  target_companies: string[];
  skills: string[];
  weekly_hours: number;
  portfolio_url: string;
  linkedin_url: string;
  github_url: string;
  languages: string[];
};

export type Experience = {
  id: string;
  role: string;
  company: string;
  start_date: string;
  end_date: string;
  description: string;
  skills: string[];
};

export type Job = {
  id: string;
  url: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  status: string;
  created_at: string;
};

export type SkillSignal = {
  skill: string;
  demand: number;
  hasSkill: boolean;
  evidence: string[];
  priority: "crítica" | "alta" | "média";
  evidenceDetails: Array<{ job: string; excerpt: string }>;
  requirementType: "obrigatório" | "desejável" | "diferencial";
  difficulty: "curto prazo" | "prática consistente" | "experiência acumulada";
  category: "Técnica" | "Ferramenta" | "Produto" | "Soft skill" | "Experiência";
  weight: number;
};

export type Analysis = {
  matchScore: number;
  totalJobs: number;
  strengths: SkillSignal[];
  gaps: SkillSignal[];
  signals: SkillSignal[];
  summary: string;
};

export type PlanItem = {
  id: string;
  title: string;
  skill: string;
  week: number;
  hours: number;
  outcome: string;
  completed: boolean;
};

export type CvPreview = {
  name: string;
  headline: string;
  location: string;
  bio: string;
  skills: string[];
  experiences: Array<{
    role: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
    skills: string[];
  }>;
  sourceText: string;
};

export type PortfolioProject = {
  id: string;
  title: string;
  description: string;
  project_type: string;
  status: "idea" | "active" | "complete";
  skills: string[];
  evidence_url: string;
  strategic_reason: string;
};
export type SkillEvidence = {
  id: string;
  skill: string;
  title: string;
  evidence_type: string;
  url: string;
  description: string;
};
export type Application = {
  id: string;
  job_id: string | null;
  company: string;
  title: string;
  status:
    | "saved"
    | "preparing"
    | "applied"
    | "interview"
    | "challenge"
    | "offer"
    | "rejected";
  notes: string;
  next_step: string;
  next_step_date: string;
};
export type CareerMap = {
  score: number;
  stages: Array<{ label: string; role: string; status: string }>;
  skills: SkillSignal[];
};
export type AnalysisSnapshot = {
  id: string;
  score: number;
  reason: string;
  created_at: string;
};
