export type AnalysisInput = {
  profileSkills: string[];
  experiences: Array<{ role: string; company: string; description: string; skills: string[] }>;
  jobs: Array<{ id: string; title: string; company: string; description: string; requirements: string[] }>;
  weeklyHours?: number;
};

export type SkillSignal = {
  skill: string;
  demand: number;
  hasSkill: boolean;
  evidence: string[];
  priority: 'crítica' | 'alta' | 'média';
};

const SKILL_ALIASES: Record<string, string[]> = {
  'JavaScript': ['javascript', 'js', 'ecmascript'],
  'TypeScript': ['typescript', 'ts'],
  'React': ['react', 'react.js', 'reactjs', 'next.js', 'nextjs'],
  'Node.js': ['node', 'node.js', 'nodejs', 'express'],
  'Python': ['python', 'django', 'flask', 'fastapi'],
  'Java': ['java', 'spring', 'spring boot'],
  'SQL': ['sql', 'postgresql', 'postgres', 'mysql', 'banco de dados relacional'],
  'AWS': ['aws', 'amazon web services'],
  'Azure': ['azure'],
  'GCP': ['gcp', 'google cloud'],
  'Docker': ['docker', 'containers', 'containerização'],
  'Kubernetes': ['kubernetes', 'k8s'],
  'Git': ['git', 'github', 'gitlab'],
  'CI/CD': ['ci/cd', 'continuous integration', 'integração contínua'],
  'APIs REST': ['rest', 'restful', 'api', 'apis'],
  'GraphQL': ['graphql'],
  'Testes': ['testes', 'testing', 'jest', 'vitest', 'cypress', 'playwright'],
  'Agile': ['agile', 'scrum', 'kanban', 'metodologias ágeis'],
  'Comunicação': ['comunicação', 'communication', 'stakeholders', 'apresentação'],
  'Liderança': ['liderança', 'leadership', 'mentoria', 'mentoring'],
  'Produto': ['produto', 'product discovery', 'roadmap', 'métricas de produto'],
  'Dados': ['análise de dados', 'data analysis', 'analytics', 'power bi', 'tableau'],
  'Machine Learning': ['machine learning', 'ml', 'inteligência artificial', 'ai'],
  'Figma': ['figma', 'prototipação', 'prototyping'],
  'UX Research': ['ux research', 'pesquisa com usuários', 'user research'],
};

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

export function detectSkills(text: string): string[] {
  const haystack = normalize(text);
  return Object.entries(SKILL_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => haystack.includes(normalize(alias))))
    .map(([skill]) => skill);
}

export function analyzeCareer(input: AnalysisInput) {
  const profileText = [
    ...input.profileSkills,
    ...input.experiences.flatMap((experience) => [experience.role, experience.description, ...experience.skills]),
  ].join(' ');
  const profileDetected = new Set([...input.profileSkills, ...detectSkills(profileText)].map(normalize));

  const demandMap = new Map<string, { count: number; evidence: string[] }>();
  input.jobs.forEach((job) => {
    const skills = new Set([...job.requirements, ...detectSkills(`${job.title} ${job.description} ${job.requirements.join(' ')}`)]);
    skills.forEach((skill) => {
      const current = demandMap.get(skill) ?? { count: 0, evidence: [] };
      current.count += 1;
      current.evidence.push(`${job.title} · ${job.company}`);
      demandMap.set(skill, current);
    });
  });

  const totalJobs = Math.max(input.jobs.length, 1);
  const signals: SkillSignal[] = [...demandMap.entries()]
    .map(([skill, value]) => {
      const ratio = value.count / totalJobs;
      return {
        skill,
        demand: Math.round(ratio * 100),
        hasSkill: profileDetected.has(normalize(skill)),
        evidence: value.evidence,
        priority: ratio >= 0.67 ? 'crítica' as const : ratio >= 0.34 ? 'alta' as const : 'média' as const,
      };
    })
    .sort((a, b) => b.demand - a.demand || Number(a.hasSkill) - Number(b.hasSkill));

  const weighted = signals.reduce((acc, signal) => acc + (signal.hasSkill ? signal.demand : 0), 0);
  const possible = signals.reduce((acc, signal) => acc + signal.demand, 0);
  const matchScore = possible ? Math.round((weighted / possible) * 100) : 0;
  const strengths = signals.filter((signal) => signal.hasSkill).slice(0, 5);
  const gaps = signals.filter((signal) => !signal.hasSkill).slice(0, 8);
  const hours = input.weeklyHours || 6;

  const plan = gaps.slice(0, 6).map((gap, index) => ({
    id: `plan-${index + 1}`,
    week: index + 1,
    title: index === 0 ? `Fundamentos de ${gap.skill}` : `Aplicação prática de ${gap.skill}`,
    skill: gap.skill,
    hours,
    outcome: index % 2 === 0
      ? `Criar uma evidência prática de ${gap.skill} para o portfólio`
      : `Resolver um desafio próximo ao contexto das vagas-alvo`,
    completed: false,
  }));

  return {
    matchScore,
    totalJobs: input.jobs.length,
    strengths,
    gaps,
    signals,
    plan,
    summary: input.jobs.length
      ? `Seu perfil cobre ${matchScore}% dos sinais encontrados em ${input.jobs.length} ${input.jobs.length === 1 ? 'vaga analisada' : 'vagas analisadas'}.`
      : 'Adicione vagas-alvo para gerar sua análise comparativa.',
  };
}

