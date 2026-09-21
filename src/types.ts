export type User = { id: string; name: string; email: string };

export type Profile = {
  user_id: string;
  headline: string;
  location: string;
  bio: string;
  target_role: string;
  target_companies: string[];
  skills: string[];
  weekly_hours: number;
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
  priority: 'crítica' | 'alta' | 'média';
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
