import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Download,
  ExternalLink,
  FileCheck2,
  GitBranch,
  GraduationCap,
  KanbanSquare,
  Lightbulb,
  Link2,
  Loader2,
  LockKeyhole,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { api, splitTags } from "./api";
import type {
  AnalysisSnapshot,
  Application,
  CareerMap,
  Job,
  PortfolioProject,
  SkillEvidence,
  User,
} from "./types";

export function OnboardingCard({
  profileReady,
  jobsCount,
  planReady,
}: {
  profileReady: boolean;
  jobsCount: number;
  planReady: boolean;
}) {
  const steps = [
    {
      label: "Importe ou complete seu perfil",
      done: profileReady,
      to: "/app/perfil",
    },
    {
      label: "Adicione pelo menos 3 vagas-alvo",
      done: jobsCount >= 3,
      to: "/app/vagas",
    },
    {
      label: "Descubra seus gaps prioritários",
      done: jobsCount > 0,
      to: "/app/analise",
    },
    {
      label: "Gere projetos e um plano",
      done: planReady,
      to: "/app/projetos",
    },
  ];
  const done = steps.filter((step) => step.done).length;
  if (done === steps.length) return null;
  return (
    <section className="onboarding-card">
      <div className="onboarding-copy">
        <span>COMECE POR AQUI</span>
        <h2>Seu primeiro diagnóstico em poucos minutos</h2>
        <p>
          Complete os passos abaixo para transformar seu objetivo em um plano
          baseado no mercado.
        </p>
        <div className="onboarding-progress">
          <i style={{ width: `${(done / steps.length) * 100}%` }} />
        </div>
        <small>
          {done} de {steps.length} passos concluídos
        </small>
      </div>
      <div className="onboarding-steps">
        {steps.map((step, index) => (
          <Link
            to={step.to}
            className={step.done ? "done" : ""}
            key={step.label}
          >
            <span>{step.done ? <Check /> : index + 1}</span>
            <b>{step.label}</b>
            <ChevronRight />
          </Link>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
function Loading() {
  return (
    <div className="page-loader">
      <Loader2 className="spin" />
      <span>Organizando sua jornada…</span>
    </div>
  );
}

export function CareerMapPage() {
  const [map, setMap] = useState<CareerMap | null>(null);
  const [goals, setGoals] = useState({
    current_goal: "",
    intermediate_goal: "",
    main_goal: "",
    selected_path: "",
  });
  const [saving, setSaving] = useState(false);
  const load = () =>
    Promise.all([
      api<{ map: CareerMap }>("/career-map"),
      api<{ goals: typeof goals }>("/goals"),
    ]).then(([m, g]) => {
      setMap(m.map);
      setGoals(g.goals);
    });
  useEffect(() => {
    void load();
  }, []);
  if (!map) return <Loading />;
  const categories = [...new Set(map.skills.map((skill) => skill.category))];
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await api("/goals", {
      method: "PUT",
      body: JSON.stringify({
        currentGoal: goals.current_goal,
        intermediateGoal: goals.intermediate_goal,
        mainGoal: goals.main_goal,
        selectedPath: goals.selected_path,
      }),
    });
    await load();
    setSaving(false);
  };
  return (
    <main className="page">
      <SectionHeader
        eyebrow="MAPA DE CARREIRA"
        title="Do ponto atual ao objetivo"
        description="Visualize cargos ponte e as competências que sustentam cada avanço."
      />
      <section className="career-path">
        {map.stages.map((stage, index) => (
          <div className={`career-stage ${stage.status}`} key={stage.label}>
            <span>{stage.label}</span>
            <h2>{stage.role}</h2>
            {index < map.stages.length - 1 && <ArrowRight />}
          </div>
        ))}
      </section>
      <div className="phase-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <span>SKILL GRAPH</span>
              <h2>Árvore de competências</h2>
            </div>
            <strong className="map-score">{map.score}%</strong>
          </div>
          <div className="skill-tree">
            <div className="tree-root">
              <Target />
              <b>{map.stages.at(-1)?.role}</b>
            </div>
            {categories.map((category) => (
              <div className="tree-branch" key={category}>
                <div className="branch-title">
                  <GitBranch />
                  <b>{category}</b>
                </div>
                <div>
                  {map.skills
                    .filter((skill) => skill.category === category)
                    .map((skill) => (
                      <span
                        className={skill.hasSkill ? "owned" : "gap"}
                        key={skill.skill}
                      >
                        <i>{skill.hasSkill ? <Check /> : <Circle />}</i>
                        {skill.skill}
                        <small>{skill.demand}%</small>
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        <form className="panel goals-form" onSubmit={save}>
          <div className="panel-head">
            <div>
              <span>SEUS MARCOS</span>
              <h2>Ajustar caminho</h2>
            </div>
          </div>
          <label>
            Objetivo atual
            <input
              value={goals.current_goal}
              onChange={(e) =>
                setGoals({ ...goals, current_goal: e.target.value })
              }
              placeholder="Ex.: construir portfólio"
            />
          </label>
          <label>
            Cargo ponte
            <input
              value={goals.intermediate_goal}
              onChange={(e) =>
                setGoals({ ...goals, intermediate_goal: e.target.value })
              }
              placeholder="Ex.: 3D Artist Júnior"
            />
          </label>
          <label>
            Objetivo principal
            <input
              value={goals.main_goal}
              onChange={(e) =>
                setGoals({ ...goals, main_goal: e.target.value })
              }
              placeholder="Ex.: Vehicle Artist AAA"
            />
          </label>
          <label>
            Caminho preferido
            <input
              value={goals.selected_path}
              onChange={(e) =>
                setGoals({ ...goals, selected_path: e.target.value })
              }
              placeholder="Ex.: Arte técnica para games"
            />
          </label>
          <button className="btn btn-primary" disabled={saving}>
            {saving && <Loader2 className="spin" />}Salvar caminho
          </button>
        </form>
      </div>
    </main>
  );
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<PortfolioProject[] | null>(null);
  const [evidence, setEvidence] = useState<SkillEvidence[]>([]);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const load = () =>
    Promise.all([
      api<{ projects: PortfolioProject[] }>("/projects"),
      api<{ evidence: SkillEvidence[] }>("/evidence"),
    ]).then(([p, e]) => {
      setProjects(p.projects);
      setEvidence(e.evidence);
    });
  useEffect(() => {
    void load();
  }, []);
  if (!projects) return <Loading />;
  const generate = async () => {
    setGenerating(true);
    await api("/projects/generate", { method: "POST" });
    await load();
    setGenerating(false);
  };
  return (
    <main className="page">
      <SectionHeader
        eyebrow="PROJETOS E EVIDÊNCIAS"
        title="Prove o que você sabe fazer"
        description="Projetos estratégicos transformam gaps em evidências visíveis para recrutadores."
        action={
          <div className="header-actions">
            <button
              className="btn btn-outline"
              onClick={() => setShowEvidence(true)}
            >
              <FileCheck2 />
              Nova evidência
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setShowForm(true)}
            >
              <Plus />
              Novo projeto
            </button>
            <button
              className="btn btn-primary"
              onClick={() => void generate()}
              disabled={generating}
            >
              {generating ? <Loader2 className="spin" /> : <Sparkles />}Gerar
              projetos
            </button>
          </div>
        }
      />
      <div className="project-stats">
        <div>
          <Rocket />
          <span>
            <b>{projects.length}</b> projetos
          </span>
        </div>
        <div>
          <CheckCircle2 />
          <span>
            <b>{projects.filter((p) => p.status === "complete").length}</b>{" "}
            concluídos
          </span>
        </div>
        <div>
          <FileCheck2 />
          <span>
            <b>{evidence.length}</b> evidências
          </span>
        </div>
      </div>
      {projects.length ? (
        <div className="projects-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.id}>
              <div className="project-card-top">
                <span className={`project-status ${project.status}`}>
                  {project.status === "idea"
                    ? "Ideia"
                    : project.status === "active"
                      ? "Em andamento"
                      : "Concluído"}
                </span>
                <select
                  value={project.status}
                  onChange={async (e) => {
                    await api(`/projects/${project.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ status: e.target.value }),
                    });
                    void load();
                  }}
                >
                  <option value="idea">Ideia</option>
                  <option value="active">Em andamento</option>
                  <option value="complete">Concluído</option>
                </select>
              </div>
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <div className="tag-list">
                {project.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <div className="strategic-reason">
                <Lightbulb />
                <span>
                  <small>POR QUE ESTE PROJETO</small>
                  {project.strategic_reason}
                </span>
              </div>
              {project.evidence_url && (
                <a href={project.evidence_url} target="_blank" rel="noreferrer">
                  Ver evidência <ExternalLink />
                </a>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-start compact">
          <div className="empty-illustration">
            <Rocket />
          </div>
          <h2>Crie projetos com intenção.</h2>
          <p>
            Geramos ideias que cobrem várias lacunas do seu objetivo ao mesmo
            tempo.
          </p>
          <button className="btn btn-primary" onClick={() => void generate()}>
            Gerar meus projetos
          </button>
        </div>
      )}
      {evidence.length > 0 && (
        <section className="panel evidence-library">
          <div className="panel-head">
            <div>
              <span>BIBLIOTECA DE PROVAS</span>
              <h2>Competências comprovadas</h2>
            </div>
          </div>
          <div className="evidence-grid">
            {evidence.map((item) => (
              <article key={item.id}>
                <span>{item.evidence_type}</span>
                <h3>{item.title}</h3>
                <b>{item.skill}</b>
                {item.description && <p>{item.description}</p>}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    Abrir prova <ExternalLink />
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
      {showForm && (
        <SimpleModal title="Novo projeto" onClose={() => setShowForm(false)}>
          <ProjectForm
            onSaved={() => {
              setShowForm(false);
              void load();
            }}
          />
        </SimpleModal>
      )}
      {showEvidence && (
        <SimpleModal
          title="Adicionar evidência"
          onClose={() => setShowEvidence(false)}
        >
          <EvidenceForm
            onSaved={() => {
              setShowEvidence(false);
              void load();
            }}
          />
        </SimpleModal>
      )}
    </main>
  );
}

function EvidenceForm({ onSaved }: { onSaved: () => void }) {
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/evidence", {
      method: "POST",
      body: JSON.stringify({
        skill: form.get("skill"),
        title: form.get("title"),
        evidenceType: form.get("type"),
        url: form.get("url"),
        description: form.get("description"),
      }),
    });
    onSaved();
  };
  return (
    <form className="modal-form" onSubmit={submit}>
      <label>
        Competência
        <input name="skill" required placeholder="Ex.: Unreal Engine" />
      </label>
      <label>
        Título da evidência
        <input
          name="title"
          required
          placeholder="Ex.: Projeto Vehicle Showcase"
        />
      </label>
      <label>
        Tipo
        <select name="type">
          <option value="project">Projeto</option>
          <option value="work">Experiência profissional</option>
          <option value="course">Curso</option>
          <option value="certificate">Certificado</option>
          <option value="github">GitHub</option>
          <option value="portfolio">Portfólio</option>
        </select>
      </label>
      <label>
        Link
        <input name="url" type="url" />
      </label>
      <label>
        O que esta prova demonstra?
        <textarea name="description" rows={3} />
      </label>
      <button className="btn btn-primary btn-full">Salvar evidência</button>
    </form>
  );
}

function ProjectForm({ onSaved }: { onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    await api("/projects", {
      method: "POST",
      body: JSON.stringify({
        title: f.get("title"),
        description: f.get("description"),
        skills: splitTags(String(f.get("skills"))),
        strategicReason: f.get("reason"),
        evidenceUrl: f.get("url"),
        status: "idea",
        projectType: "portfolio",
      }),
    });
    onSaved();
  };
  return (
    <form className="modal-form" onSubmit={submit}>
      <label>
        Título
        <input name="title" required />
      </label>
      <label>
        Descrição
        <textarea name="description" rows={4} />
      </label>
      <label>
        Competências separadas por vírgulas
        <input name="skills" />
      </label>
      <label>
        Objetivo estratégico
        <textarea name="reason" rows={2} />
      </label>
      <label>
        Link da evidência
        <input name="url" type="url" />
      </label>
      <button className="btn btn-primary btn-full" disabled={busy}>
        {busy && <Loader2 className="spin" />}Criar projeto
      </button>
    </form>
  );
}

const columns: Array<{ status: Application["status"]; label: string }> = [
  { status: "saved", label: "Salva" },
  { status: "preparing", label: "Preparando" },
  { status: "applied", label: "Enviada" },
  { status: "interview", label: "Entrevista" },
  { status: "challenge", label: "Desafio" },
  { status: "offer", label: "Oferta" },
];
export function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const load = () =>
    Promise.all([
      api<{ applications: Application[] }>("/applications"),
      api<{ jobs: Job[] }>("/jobs"),
    ]).then(([a, j]) => {
      setApplications(a.applications);
      setJobs(j.jobs);
    });
  useEffect(() => {
    void load();
  }, []);
  if (!applications) return <Loading />;
  const addJob = async (jobId: string) => {
    const job = jobs.find((item) => item.id === jobId);
    if (!job) return;
    await api("/applications", {
      method: "POST",
      body: JSON.stringify({
        jobId: job.id,
        company: job.company,
        title: job.title,
        status: "saved",
      }),
    });
    void load();
  };
  return (
    <main className="page wide">
      <SectionHeader
        eyebrow="CANDIDATURAS"
        title="Seu pipeline de oportunidades"
        description="Acompanhe cada vaga e saiba exatamente qual é o próximo passo."
        action={
          <select
            className="add-job-select"
            defaultValue=""
            onChange={(e) => {
              void addJob(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="" disabled>
              + Adicionar vaga salva
            </option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.company} — {job.title}
              </option>
            ))}
          </select>
        }
      />
      <div className="kanban">
        {columns.map((column) => (
          <section className="kanban-column" key={column.status}>
            <div className="kanban-head">
              <b>{column.label}</b>
              <span>
                {
                  applications.filter((item) => item.status === column.status)
                    .length
                }
              </span>
            </div>
            {applications
              .filter((item) => item.status === column.status)
              .map((application) => (
                <article className="application-card" key={application.id}>
                  <small>{application.company}</small>
                  <h3>{application.title}</h3>
                  {application.next_step && (
                    <p>
                      <Target />
                      {application.next_step}
                    </p>
                  )}
                  <select
                    value={application.status}
                    onChange={async (e) => {
                      await api(`/applications/${application.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ status: e.target.value }),
                      });
                      void load();
                    }}
                  >
                    {columns.map((item) => (
                      <option value={item.status} key={item.status}>
                        {item.label}
                      </option>
                    ))}
                    <option value="rejected">Encerrada</option>
                  </select>
                </article>
              ))}
          </section>
        ))}
      </div>
    </main>
  );
}

export function ProgressPage() {
  const [data, setData] = useState<AnalysisSnapshot[] | null>(null);
  useEffect(() => {
    api<{ snapshots: AnalysisSnapshot[] }>("/progress").then((r) =>
      setData(r.snapshots),
    );
  }, []);
  if (!data) return <Loading />;
  return (
    <main className="page">
      <SectionHeader
        eyebrow="EVOLUÇÃO"
        title="Sua carreira em movimento"
        description="Veja como sua aderência muda conforme você adiciona provas e fecha lacunas."
        action={
          <button
            className="btn btn-outline"
            onClick={async () => {
              await api("/progress/snapshot", { method: "POST" });
              setData(
                (await api<{ snapshots: AnalysisSnapshot[] }>("/progress"))
                  .snapshots,
              );
            }}
          >
            <TrendingUp />
            Registrar hoje
          </button>
        }
      />
      <section className="panel progress-chart">
        <div className="panel-head">
          <div>
            <span>CAREER READINESS</span>
            <h2>Histórico de aderência</h2>
          </div>
        </div>
        {data.length ? (
          <div className="readiness-chart">
            {data.map((item) => (
              <div className="readiness-point" key={item.id}>
                <b>{item.score}%</b>
                <i style={{ height: `${Math.max(item.score, 4)}%` }} />
                <span>
                  {new Date(item.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="inline-empty">
            Registre a análise atual para iniciar seu histórico.
          </div>
        )}
      </section>
    </main>
  );
}

export function SettingsPage({ user }: { user: User | null }) {
  const [message, setMessage] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const exportData = async () => {
    const response = await fetch("/api/account/export");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "vj-carreiras-dados.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="page">
      <SectionHeader
        eyebrow="CONTA E PRIVACIDADE"
        title="Controle dos seus dados"
        description="Segurança, portabilidade e transparência para sua jornada."
      />
      <div className="settings-grid">
        <section className="panel settings-card">
          <ShieldCheck />
          <div>
            <h2>Segurança da conta</h2>
            <p>{user?.email}</p>
            <span className={user?.emailVerified ? "verified" : "pending"}>
              {user?.emailVerified
                ? "E-mail confirmado"
                : "E-mail ainda não confirmado"}
            </span>
            {!user?.emailVerified && (
              <button
                className="btn btn-outline"
                onClick={async () => {
                  const result = await api<{ message: string }>(
                    "/auth/resend-verification",
                    { method: "POST" },
                  );
                  setMessage(result.message);
                }}
              >
                Reenviar confirmação
              </button>
            )}
          </div>
        </section>
        <section className="panel settings-card">
          <Download />
          <div>
            <h2>Exportar meus dados</h2>
            <p>
              Baixe perfil, vagas, projetos, candidaturas e histórico em JSON.
            </p>
            <button
              className="btn btn-outline"
              onClick={() => void exportData()}
            >
              Baixar exportação
            </button>
          </div>
        </section>
        <section className="panel settings-card">
          <LockKeyhole />
          <div>
            <h2>Privacidade</h2>
            <p>
              Seus dados são usados apenas para gerar suas análises e permanecem
              associados à sua conta.
            </p>
            <div className="settings-links">
              <Link to="/privacidade">Política de privacidade</Link>
              <Link to="/termos">Termos de uso</Link>
            </div>
          </div>
        </section>
        <section className="panel settings-card danger-zone">
          <Trash2 />
          <div>
            <h2>Excluir conta</h2>
            <p>
              Apague permanentemente a conta e todos os dados associados a ela.
            </p>
            <button
              className="btn btn-danger"
              onClick={() => setShowDelete(true)}
            >
              Excluir minha conta
            </button>
          </div>
        </section>
      </div>
      {message && <div className="settings-message">{message}</div>}
      {showDelete && (
        <SimpleModal
          title="Excluir conta permanentemente"
          onClose={() => setShowDelete(false)}
        >
          <form
            className="modal-form"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              try {
                await api("/account", {
                  method: "DELETE",
                  body: JSON.stringify({ password: form.get("password") }),
                });
                window.location.assign("/");
              } catch (error) {
                setMessage(
                  error instanceof Error
                    ? error.message
                    : "Não foi possível excluir.",
                );
                setShowDelete(false);
              }
            }}
          >
            <p>
              Esta ação não pode ser desfeita. Digite sua senha para confirmar.
            </p>
            <label>
              Senha
              <input name="password" type="password" minLength={8} required />
            </label>
            <button className="btn btn-danger">Excluir definitivamente</button>
          </form>
        </SimpleModal>
      )}
    </main>
  );
}

export function TailorModal({
  job,
  onClose,
}: {
  job: Job;
  onClose: () => void;
}) {
  const [kit, setKit] = useState<any>(null);
  useEffect(() => {
    api<{ kit: any }>(`/jobs/${job.id}/tailor`).then((r) => setKit(r.kit));
  }, [job.id]);
  return (
    <SimpleModal title="Kit de candidatura" onClose={onClose}>
      {!kit ? (
        <Loading />
      ) : (
        <div className="tailor-kit">
          <div className="tailor-score">
            <span>ADERÊNCIA À VAGA</span>
            <strong>{kit.score}%</strong>
          </div>
          <h3>Título sugerido</h3>
          <p className="suggestion">{kit.headlineSuggestion}</p>
          <h3>Palavras-chave verdadeiras</h3>
          <div className="tag-list">
            {kit.keywords.map((item: string) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="tailor-columns">
            <div>
              <h3>Pontos fortes</h3>
              {kit.strengths.map((item: string) => (
                <p key={item}>
                  <Check />
                  {item}
                </p>
              ))}
            </div>
            <div>
              <h3>Antes de enviar</h3>
              {kit.gaps.slice(0, 5).map((item: any) => (
                <p key={item.skill}>
                  <Circle />
                  {item.skill} · {item.type}
                </p>
              ))}
            </div>
          </div>
          <div className="info-box">
            <ShieldCheck />
            <p>
              As sugestões reorganizam informações reais do seu perfil. Nunca
              adicionamos experiência que você não possui.
            </p>
          </div>
        </div>
      )}
    </SimpleModal>
  );
}

export function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const r = await api<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: f.get("email") }),
    });
    setMessage(r.message);
    setBusy(false);
  };
  return (
    <RecoveryShell
      title="Recuperar acesso"
      subtitle="Enviaremos um link com validade de uma hora."
    >
      {message ? (
        <div className="auth-success">
          <CheckCircle2 />
          <p>{message}</p>
          <Link to="/entrar">Voltar para o login</Link>
        </div>
      ) : (
        <form className="auth-form recovery-form" onSubmit={submit}>
          <label>
            E-mail
            <input name="email" type="email" required />
          </label>
          <button className="btn btn-primary btn-full" disabled={busy}>
            {busy && <Loader2 className="spin" />}Enviar instruções
          </button>
        </form>
      )}
    </RecoveryShell>
  );
}
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: params.get("token"),
          password: f.get("password"),
        }),
      });
      navigate("/entrar?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Link inválido.");
    }
  };
  return (
    <RecoveryShell
      title="Criar nova senha"
      subtitle="Escolha uma senha longa e exclusiva."
    >
      <form className="auth-form recovery-form" onSubmit={submit}>
        <label>
          Nova senha
          <input name="password" type="password" minLength={8} required />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-primary btn-full">Atualizar senha</button>
      </form>
    </RecoveryShell>
  );
}
function RecoveryShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="recovery-page">
      <div className="recovery-box">
        <span className="logo-mark">
          <GraduationCap />
        </span>
        <span>VJ CARREIRAS</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
function SimpleModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          <X />
        </button>
        <span className="modal-kicker">VJ CARREIRAS</span>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
