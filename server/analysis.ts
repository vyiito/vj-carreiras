export type AnalysisInput = {
  profileSkills: string[];
  experiences: Array<{
    role: string;
    company: string;
    description: string;
    skills: string[];
  }>;
  jobs: Array<{
    id: string;
    title: string;
    company: string;
    description: string;
    requirements: string[];
  }>;
  weeklyHours?: number;
};

export type SkillSignal = {
  skill: string;
  demand: number;
  hasSkill: boolean;
  evidence: string[];
  evidenceDetails: Array<{ job: string; excerpt: string }>;
  priority: "crítica" | "alta" | "média";
  requirementType: "obrigatório" | "desejável" | "diferencial";
  difficulty: "curto prazo" | "prática consistente" | "experiência acumulada";
  category: "Técnica" | "Ferramenta" | "Produto" | "Soft skill" | "Experiência";
  weight: number;
};

const SKILL_ALIASES: Record<string, string[]> = {
  JavaScript: ["javascript", "js", "ecmascript"],
  TypeScript: ["typescript", "ts"],
  React: ["react", "react.js", "reactjs", "next.js", "nextjs"],
  "Node.js": ["node", "node.js", "nodejs", "express"],
  Python: ["python", "django", "flask", "fastapi"],
  Java: ["java", "spring", "spring boot"],
  SQL: ["sql", "postgresql", "postgres", "mysql", "banco de dados relacional"],
  AWS: ["aws", "amazon web services"],
  Azure: ["azure"],
  GCP: ["gcp", "google cloud"],
  Docker: ["docker", "containers", "containerização"],
  Kubernetes: ["kubernetes", "k8s"],
  Git: ["git", "github", "gitlab"],
  "CI/CD": ["ci/cd", "continuous integration", "integração contínua"],
  "APIs REST": ["rest", "restful", "api", "apis"],
  GraphQL: ["graphql"],
  Testes: ["testes", "testing", "jest", "vitest", "cypress", "playwright"],
  Agile: ["agile", "scrum", "kanban", "metodologias ágeis"],
  Comunicação: ["comunicação", "communication", "stakeholders", "apresentação"],
  Liderança: ["liderança", "leadership", "mentoria", "mentoring"],
  Produto: ["produto", "product discovery", "roadmap", "métricas de produto"],
  Dados: [
    "análise de dados",
    "data analysis",
    "analytics",
    "power bi",
    "tableau",
  ],
  "Machine Learning": [
    "machine learning",
    "ml",
    "inteligência artificial",
    "ai",
  ],
  Figma: ["figma", "prototipação", "prototyping"],
  "UX Research": ["ux research", "pesquisa com usuários", "user research"],
  Blender: ["blender"],
  Maya: ["autodesk maya", "maya"],
  "Substance Painter": ["substance painter", "adobe substance 3d painter"],
  ZBrush: ["zbrush"],
  "Unreal Engine": ["unreal engine", "unreal 5", "ue5", "ue4"],
  Unity: ["unity 3d", "unity3d", "unity engine"],
  Houdini: ["houdini", "sidefx"],
  "Hard Surface": ["hard surface", "hard-surface"],
  "UV Mapping": ["uv mapping", "uv unwrapping", "unwrap", "mapeamento uv"],
  PBR: ["pbr", "physically based rendering"],
  LOD: ["lod", "level of detail"],
  Topology: ["topology", "retopology", "retopo", "topologia"],
  Baking: ["texture baking", "normal baking", "baking", "bake de textura"],
  Photoshop: ["photoshop", "adobe photoshop"],
  "C++": ["c++", "cpp"],
  Portfólio: ["portfolio", "portfólio", "artstation"],
  Inglês: ["inglês", "english", "fluent english"],
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^$(){}|[\]\\]/g, "\\const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
");

function aliasRegex(alias: string) {
  const normalizedAlias = normalize(alias).trim();
  return new RegExp(
    `(?:^|[^\\p{L}\\p{N}])${escapeRegExp(normalizedAlias)}(?=$|[^\\p{L}\\p{N}])`,
    "iu",
  );
}

function hasAlias(text: string, alias: string) {
  return aliasRegex(alias).test(normalize(text));
}

function aliasIndex(text: string, aliases: string[]) {
  const normalizedText = normalize(text);
  for (const alias of aliases) {
    const match = aliasRegex(alias).exec(normalizedText);
    if (match?.index !== undefined) {
      const leadingBoundary = match[0].length - normalize(alias).length;
      return Math.max(0, match.index + leadingBoundary);
    }
  }
  return -1;
}

const toolSkills = new Set([
  "Figma",
  "Blender",
  "Maya",
  "Substance Painter",
  "ZBrush",
  "Unreal Engine",
  "Unity",
  "Houdini",
  "Photoshop",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "Git",
]);
const softSkills = new Set(["Comunicação", "Liderança", "Agile", "Inglês"]);
const productSkills = new Set(["Produto", "UX Research", "Dados"]);

function categoryFor(skill: string): SkillSignal["category"] {
  if (toolSkills.has(skill)) return "Ferramenta";
  if (softSkills.has(skill)) return "Soft skill";
  if (productSkills.has(skill)) return "Produto";
  if (/experiência|portfolio|portfólio/i.test(skill)) return "Experiência";
  return "Técnica";
}

function excerptFor(text: string, skill: string) {
  const aliases = SKILL_ALIASES[skill] ?? [skill];
  const index = aliasIndex(text, aliases);
  if (index < 0) return text.slice(0, 170);
  return text
    .slice(Math.max(0, index - 70), Math.min(text.length, index + 180))
    .replace(/\s+/g, " ")
    .trim();
}

function requirementTypeFor(
  text: string,
  skill: string,
): SkillSignal["requirementType"] {
  const normalized = normalize(text);
  const aliases = SKILL_ALIASES[skill] ?? [skill];
  const foundIndex = aliasIndex(text, aliases);
  const skillIndex = foundIndex >= 0 ? foundIndex : 0;
  const closestMarker = (
    pattern: RegExp,
  ): { type: SkillSignal["requirementType"]; distance: number } | null => {
    const matches = [...normalized.matchAll(pattern)];
    if (!matches.length) return null;
    const match = matches.reduce((closest, current) =>
      Math.abs((current.index ?? 0) - skillIndex) <
      Math.abs((closest.index ?? 0) - skillIndex)
        ? current
        : closest,
    );
    return {
      type: pattern.source.startsWith("obrigat")
        ? "obrigatório"
        : "diferencial",
      distance: Math.abs((match.index ?? 0) - skillIndex),
    };
  };
  const required = closestMarker(
    /obrigat|required|must have|essencial|necessari/g,
  );
  const bonus = closestMarker(/diferencial|bonus|plus|nice to have|prefer/g);
  const closest = [required, bonus]
    .filter((marker): marker is NonNullable<typeof marker> => Boolean(marker))
    .sort((a, b) => a.distance - b.distance)[0];
  if (closest && closest.distance <= 100) return closest.type;
  return "desejável";
}

function difficultyFor(skill: string): SkillSignal["difficulty"] {
  if (/experiência|aaa|liderança/i.test(skill)) return "experiência acumulada";
  if (
    [
      "Comunicação",
      "Produto",
      "UX Research",
      "Machine Learning",
      "Topology",
      "Hard Surface",
    ].includes(skill)
  )
    return "prática consistente";
  return "curto prazo";
}

export function detectSkills(text: string): string[] {
  return Object.entries(SKILL_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => hasAlias(text, alias)))
    .map(([skill]) => skill);
}

export function analyzeCareer(input: AnalysisInput) {
  const profileText = [
    ...input.profileSkills,
    ...input.experiences.flatMap((experience) => [
      experience.role,
      experience.description,
      ...experience.skills,
    ]),
  ].join(" ");
  const profileDetected = new Set(
    [...input.profileSkills, ...detectSkills(profileText)].map(normalize),
  );

  const demandMap = new Map<
    string,
    {
      count: number;
      evidence: string[];
      details: Array<{
        job: string;
        excerpt: string;
        type: SkillSignal["requirementType"];
      }>;
    }
  >();
  input.jobs.forEach((job) => {
    const skills = new Set([
      ...job.requirements,
      ...detectSkills(
        `${job.title} ${job.description} ${job.requirements.join(" ")}`,
      ),
    ]);
    skills.forEach((skill) => {
      const current = demandMap.get(skill) ?? {
        count: 0,
        evidence: [],
        details: [],
      };
      current.count += 1;
      current.evidence.push(`${job.title} · ${job.company}`);
      current.details.push({
        job: `${job.title} · ${job.company}`,
        excerpt: excerptFor(job.description, skill),
        type: requirementTypeFor(job.description, skill),
      });
      demandMap.set(skill, current);
    });
  });

  const totalJobs = Math.max(input.jobs.length, 1);
  const signals: SkillSignal[] = [...demandMap.entries()]
    .map(([skill, value]) => {
      const ratio = value.count / totalJobs;
      const requiredCount = value.details.filter(
        (detail) => detail.type === "obrigatório",
      ).length;
      const bonusCount = value.details.filter(
        (detail) => detail.type === "diferencial",
      ).length;
      const requirementType =
        requiredCount >= Math.max(1, value.count / 2)
          ? ("obrigatório" as const)
          : bonusCount >= Math.max(1, value.count / 2)
            ? ("diferencial" as const)
            : ("desejável" as const);
      const priority =
        ratio >= 0.67
          ? ("crítica" as const)
          : ratio >= 0.34
            ? ("alta" as const)
            : ("média" as const);
      return {
        skill,
        demand: Math.round(ratio * 100),
        hasSkill: profileDetected.has(normalize(skill)),
        evidence: value.evidence,
        evidenceDetails: value.details.map(({ job, excerpt }) => ({
          job,
          excerpt,
        })),
        priority,
        requirementType,
        difficulty: difficultyFor(skill),
        category: categoryFor(skill),
        weight:
          requirementType === "obrigatório"
            ? 5
            : priority === "crítica"
              ? 4
              : priority === "alta"
                ? 3
                : requirementType === "diferencial"
                  ? 1
                  : 2,
      };
    })
    .sort(
      (a, b) => b.demand - a.demand || Number(a.hasSkill) - Number(b.hasSkill),
    );

  const weighted = signals.reduce(
    (acc, signal) =>
      acc + (signal.hasSkill ? signal.demand * signal.weight : 0),
    0,
  );
  const possible = signals.reduce(
    (acc, signal) => acc + signal.demand * signal.weight,
    0,
  );
  const matchScore = possible ? Math.round((weighted / possible) * 100) : 0;
  const strengths = signals.filter((signal) => signal.hasSkill).slice(0, 5);
  const gaps = signals.filter((signal) => !signal.hasSkill).slice(0, 8);
  const hours = input.weeklyHours || 6;

  const plan = gaps.slice(0, 6).map((gap, index) => ({
    id: `plan-${index + 1}`,
    week: index + 1,
    title:
      index === 0
        ? `Fundamentos de ${gap.skill}`
        : `Aplicação prática de ${gap.skill}`,
    skill: gap.skill,
    hours,
    outcome:
      index % 2 === 0
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
      ? `Seu perfil cobre ${matchScore}% dos sinais encontrados em ${input.jobs.length} ${input.jobs.length === 1 ? "vaga analisada" : "vagas analisadas"}.`
      : "Adicione vagas-alvo para gerar sua análise comparativa.",
  };
}
