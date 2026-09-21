import {
  createContext,
  type FormEvent,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Compass,
  ExternalLink,
  GraduationCap,
  LayoutDashboard,
  FileText,
  FolderKanban,
  KanbanSquare,
  Link2,
  ListChecks,
  Loader2,
  LogOut,
  Map as MapIcon,
  Menu,
  Plus,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  UploadCloud,
  X,
} from "lucide-react";
import { api, joinTags, splitTags } from "./api";
import type {
  Analysis,
  CvPreview,
  Experience,
  Job,
  PlanItem,
  Profile,
  User,
} from "./types";
import {
  ApplicationsPage,
  CareerMapPage,
  ForgotPasswordPage,
  OnboardingCard,
  ProgressPage,
  ProjectsPage,
  ResetPasswordPage,
  SettingsPage,
  TailorModal,
} from "./PhaseTwo";

type AuthValue = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthValue | null>(null);
const useAuth = () => useContext(AuthContext)!;

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    try {
      setUser((await api<{ user: User }>("/me")).user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  const logout = async () => {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={`logo ${light ? "logo-light" : ""}`}>
      <span className="logo-mark">
        <Compass size={19} />
      </span>
      <span>
        VJ <b>Carreiras</b>
      </span>
    </div>
  );
}

function Landing() {
  const navigate = useNavigate();
  return (
    <div className="landing">
      <nav className="landing-nav shell">
        <Logo />
        <div className="nav-actions">
          <button className="btn btn-ghost" onClick={() => navigate("/entrar")}>
            Entrar
          </button>
          <button
            className="btn btn-dark"
            onClick={() => navigate("/cadastro")}
          >
            Criar meu plano <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      <main>
        <section className="hero shell">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={14} /> Clareza para o seu próximo passo
            </div>
            <h1>
              Não adivinhe sua carreira.
              <br />
              <em>Construa o caminho.</em>
            </h1>
            <p>
              Transforme vagas de empresas que você admira em um mapa claro de
              competências, lacunas e ações semanais.
            </p>
            <div className="hero-ctas">
              <button
                className="btn btn-primary btn-large"
                onClick={() => navigate("/cadastro")}
              >
                Começar gratuitamente <ArrowRight size={18} />
              </button>
              <a className="text-link" href="#como-funciona">
                Ver como funciona <ChevronRight size={17} />
              </a>
            </div>
            <div className="trust-row">
              <span>
                <CheckCircle2 size={16} /> Sem achismos
              </span>
              <span>
                <CheckCircle2 size={16} /> Baseado em vagas reais
              </span>
              <span>
                <CheckCircle2 size={16} /> Plano sob medida
              </span>
            </div>
          </div>
          <div
            className="hero-visual"
            aria-label="Exemplo de análise de carreira"
          >
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="preview-card main-preview">
              <div className="preview-head">
                <div>
                  <span className="tiny-label">ADERÊNCIA AO CARGO-ALVO</span>
                  <h3>Product Manager Sênior</h3>
                </div>
                <span className="score-ring">
                  72<small>%</small>
                </span>
              </div>
              <div className="progress">
                <span style={{ width: "72%" }} />
              </div>
              <div className="signal-grid">
                <div>
                  <span className="signal-dot mint" />
                  <b>6</b>
                  <small>pontos fortes</small>
                </div>
                <div>
                  <span className="signal-dot amber" />
                  <b>3</b>
                  <small>lacunas críticas</small>
                </div>
                <div>
                  <span className="signal-dot blue" />
                  <b>12</b>
                  <small>vagas analisadas</small>
                </div>
              </div>
              <div className="next-step">
                <span className="icon-box">
                  <Rocket size={19} />
                </span>
                <div>
                  <small>PRÓXIMO PASSO</small>
                  <b>Construir case de discovery</b>
                  <span>Semana 2 · 4 horas</span>
                </div>
                <ChevronRight size={18} />
              </div>
            </div>
            <div className="preview-card floating-card card-skills">
              <small>MAIS PEDIDAS</small>
              <span>
                <b>Product Discovery</b>
                <i>92%</i>
              </span>
              <span>
                <b>SQL</b>
                <i>75%</i>
              </span>
              <span>
                <b>Métricas</b>
                <i>67%</i>
              </span>
            </div>
            <div className="preview-card floating-card card-company">
              <Building2 size={18} />
              <div>
                <small>EMPRESAS-ALVO</small>
                <b>Nubank · iFood · Loft</b>
              </div>
            </div>
          </div>
        </section>

        <section className="logos-strip">
          <div className="shell">
            <span>Feito para quem mira alto</span>
            <b>NUBANK</b>
            <b>mercado livre</b>
            <b>iFood</b>
            <b>STONE</b>
            <b>XP</b>
          </div>
        </section>

        <section className="section shell" id="como-funciona">
          <div className="section-heading">
            <span className="section-index">01 — COMO FUNCIONA</span>
            <h2>
              De vagas soltas a um plano
              <br />
              que faz sentido.
            </h2>
            <p>
              O VJ Carreiras cruza onde você está com o que o mercado realmente
              pede.
            </p>
          </div>
          <div className="steps-grid">
            <article>
              <span className="step-number">01</span>
              <div className="step-icon lilac">
                <Link2 />
              </div>
              <h3>Traga suas vagas</h3>
              <p>
                Cole links ou descrições das oportunidades que representam onde
                você quer chegar.
              </p>
            </article>
            <article>
              <span className="step-number">02</span>
              <div className="step-icon mint-bg">
                <Search />
              </div>
              <h3>Veja os padrões</h3>
              <p>
                Identificamos competências recorrentes, exigências e sinais de
                cultura nas vagas.
              </p>
            </article>
            <article>
              <span className="step-number">03</span>
              <div className="step-icon peach">
                <Target />
              </div>
              <h3>Feche as lacunas</h3>
              <p>
                Receba um plano semanal priorizado, com entregáveis que viram
                prova no portfólio.
              </p>
            </article>
          </div>
        </section>

        <section className="insight-section">
          <div className="shell insight-grid">
            <div className="insight-copy">
              <span className="section-index">02 — NÃO É SÓ UM SCORE</span>
              <h2>
                Entenda o <em>porquê</em>
                <br />
                por trás da análise.
              </h2>
              <p>
                Cada recomendação vem ligada às vagas que a originaram. Você vê
                o que é essencial, o que é diferencial e onde já tem experiência
                comprovada.
              </p>
              <ul>
                <li>
                  <Check /> Requisitos com evidências
                </li>
                <li>
                  <Check /> Prioridade pela frequência nas vagas
                </li>
                <li>
                  <Check /> Evolução visível semana a semana
                </li>
              </ul>
            </div>
            <div className="evidence-card">
              <div className="evidence-top">
                <span>MAPA DE COMPETÊNCIAS</span>
                <span>8 vagas</span>
              </div>
              <h3>O que separa você do cargo</h3>
              {[
                ["Gestão de stakeholders", 88, true],
                ["Product Discovery", 75, true],
                ["SQL para produto", 63, false],
                ["Experimentação A/B", 50, false],
              ].map(([label, value, ok]) => (
                <div className="skill-row" key={String(label)}>
                  <div>
                    <span>{label}</span>
                    <b className={ok ? "status-ok" : "status-gap"}>
                      {ok ? "Você tem" : "A desenvolver"}
                    </b>
                  </div>
                  <div className="skill-track">
                    <span
                      className={ok ? "track-ok" : "track-gap"}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <small>Pedido em {value}% das vagas</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-section shell">
          <div>
            <span className="eyebrow eyebrow-dark">
              <GraduationCap size={14} /> Seu próximo cargo começa agora
            </span>
            <h2>Transforme ambição em direção.</h2>
            <p>
              Crie seu perfil, adicione as primeiras vagas e receba seu mapa de
              carreira.
            </p>
            <button
              className="btn btn-lime btn-large"
              onClick={() => navigate("/cadastro")}
            >
              Criar meu plano <ArrowRight size={18} />
            </button>
          </div>
          <div className="cta-orb">
            <Compass size={110} />
          </div>
        </section>
      </main>
      <footer className="shell footer">
        <Logo />
        <span>© 2026 VJ Carreiras. Feito para carreiras com intenção.</span>
      </footer>
    </div>
  );
}

function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/app" replace />;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api(`/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        body: JSON.stringify(values),
      });
      await refresh();
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-panel">
        <button className="back-home" onClick={() => navigate("/")}>
          <Logo light />
        </button>
        <div className="auth-quote">
          <Sparkles />
          <blockquote>
            “Uma carreira boa não acontece por acaso. Ela é construída com
            intenção, evidência e consistência.”
          </blockquote>
          <span>SEU FUTURO, EM MOVIMENTO</span>
        </div>
      </div>
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <div className="mobile-logo">
            <Logo />
          </div>
          <span className="eyebrow">
            <Compass size={14} /> VJ Carreiras
          </span>
          <h1>
            {mode === "login"
              ? "Que bom ter você de volta."
              : "Comece pelo destino."}
          </h1>
          <p>
            {mode === "login"
              ? "Entre para continuar construindo sua próxima versão."
              : "Seu mapa de carreira começa com um perfil simples."}
          </p>
          {mode === "register" && (
            <label>
              Seu nome
              <input
                name="name"
                placeholder="Como podemos chamar você?"
                required
                minLength={2}
              />
            </label>
          )}
          <label>
            E-mail
            <input
              name="email"
              type="email"
              placeholder="voce@email.com"
              required
            />
          </label>
          {searchParams.get("verified") === "1" && (
            <div className="auth-notice">
              <CheckCircle2 /> E-mail confirmado. Você já pode entrar.
            </div>
          )}
          {searchParams.get("verified") === "invalid" && (
            <div className="form-error">
              O link de confirmação é inválido ou expirou.
            </div>
          )}
          {searchParams.get("reset") === "1" && (
            <div className="auth-notice">
              <CheckCircle2 /> Senha atualizada com sucesso.
            </div>
          )}
          <label>
            Senha
            <input
              name="password"
              type="password"
              placeholder="Mínimo de 8 caracteres"
              required
              minLength={8}
            />
          </label>
          {mode === "login" && (
            <Link className="forgot-link" to="/esqueci-senha">
              Esqueci minha senha
            </Link>
          )}
          {error && <div className="form-error">{error}</div>}
          <button
            className="btn btn-primary btn-large btn-full"
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="spin" />
            ) : mode === "login" ? (
              "Entrar"
            ) : (
              "Criar minha conta"
            )}{" "}
            {!busy && <ArrowRight size={18} />}
          </button>
          <span className="auth-switch">
            {mode === "login"
              ? "Ainda não tem uma conta?"
              : "Já tem uma conta?"}{" "}
            <button
              type="button"
              onClick={() =>
                navigate(mode === "login" ? "/cadastro" : "/entrar")
              }
            >
              {mode === "login" ? "Criar agora" : "Entrar"}
            </button>
          </span>
        </form>
      </div>
    </div>
  );
}

const nav = [
  { to: "/app", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/app/perfil", label: "Meu perfil", icon: CircleUserRound },
  { to: "/app/vagas", label: "Vagas-alvo", icon: BriefcaseBusiness },
  { to: "/app/analise", label: "Minha análise", icon: BarChart3 },
  { to: "/app/plano", label: "Plano de ação", icon: BookOpenCheck },
  { to: "/app/mapa", label: "Mapa de carreira", icon: MapIcon },
  { to: "/app/projetos", label: "Projetos", icon: FolderKanban },
  { to: "/app/candidaturas", label: "Candidaturas", icon: KanbanSquare },
  { to: "/app/evolucao", label: "Evolução", icon: TrendingUp },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
];

function AppLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-head">
          <Logo light />
          <button onClick={() => setMenuOpen(false)}>
            <X />
          </button>
        </div>
        <nav>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-tip">
          <Sparkles size={17} />
          <b>Dica da semana</b>
          <p>Adicione pelo menos 5 vagas para enxergar padrões confiáveis.</p>
        </div>
        <div className="sidebar-user">
          <span>{user?.name.slice(0, 1).toUpperCase()}</span>
          <div>
            <b>{user?.name}</b>
            <small>{user?.email}</small>
          </div>
          <button title="Sair" onClick={() => void logout()}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)}>
            <Menu />
          </button>
          <div />
          <span className="privacy-pill">
            <ShieldCheck size={15} /> Seus dados são privados
          </span>
        </header>
        <Outlet />
      </div>
    </div>
  );
}

function PageHeader({
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

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<{
    profile: Profile | null;
    experiences: Experience[];
    jobs: Job[];
    analysis: Analysis | null;
    plan: PlanItem[];
  } | null>(null);
  useEffect(() => {
    Promise.all([
      api<{ profile: Profile; experiences: Experience[] }>("/profile"),
      api<{ jobs: Job[] }>("/jobs"),
      api<{ analysis: Analysis }>("/analysis"),
      api<{ plan: PlanItem[] }>("/plan"),
    ]).then(([p, j, a, pl]) => setData({ ...p, ...j, ...a, ...pl }));
  }, []);
  if (!data) return <PageLoader />;
  const complete = data.plan.filter((item) => item.completed).length;
  return (
    <main className="page">
      <PageHeader
        eyebrow="VISÃO GERAL"
        title={`Olá, ${user?.name.split(" ")[0]}.`}
        description="Aqui está o retrato atual da sua jornada."
        action={
          <NavLink className="btn btn-dark" to="/app/vagas">
            <Plus size={17} /> Adicionar vaga
          </NavLink>
        }
      />
      <OnboardingCard
        profileReady={Boolean(
          data.profile?.headline ||
          data.profile?.skills?.length ||
          data.experiences.length,
        )}
        jobsCount={data.jobs.length}
        planReady={data.plan.length > 0}
      />
      {data.jobs.length === 0 ? (
        <EmptyStart />
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card score-kpi">
              <span>ADERÊNCIA MÉDIA</span>
              <strong>
                {data.analysis?.matchScore ?? 0}
                <small>%</small>
              </strong>
              <div className="progress">
                <i style={{ width: `${data.analysis?.matchScore ?? 0}%` }} />
              </div>
              <small>com base nas suas vagas-alvo</small>
            </div>
            <div className="kpi-card">
              <span>VAGAS ANALISADAS</span>
              <strong>{data.jobs.length}</strong>
              <small>de 5 recomendadas para bons padrões</small>
            </div>
            <div className="kpi-card">
              <span>LACUNAS PRIORITÁRIAS</span>
              <strong>{data.analysis?.gaps.length ?? 0}</strong>
              <small>competências para desenvolver</small>
            </div>
            <div className="kpi-card">
              <span>PROGRESSO DO PLANO</span>
              <strong>
                {data.plan.length
                  ? Math.round((complete / data.plan.length) * 100)
                  : 0}
                <small>%</small>
              </strong>
              <small>
                {complete} de {data.plan.length} ações concluídas
              </small>
            </div>
          </div>
          <div className="dashboard-grid">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <span>PRIORIDADES</span>
                  <h2>Suas maiores oportunidades</h2>
                </div>
                <NavLink to="/app/analise">
                  Ver análise <ArrowRight size={15} />
                </NavLink>
              </div>
              <div className="gap-list">
                {data.analysis?.gaps.slice(0, 4).map((gap, index) => (
                  <div className="gap-item" key={gap.skill}>
                    <span className="rank">0{index + 1}</span>
                    <div>
                      <b>{gap.skill}</b>
                      <small>Pedida em {gap.demand}% das vagas</small>
                    </div>
                    <span className={`priority priority-${gap.priority}`}>
                      {gap.priority}
                    </span>
                  </div>
                ))}
              </div>
            </section>
            <section className="panel next-actions">
              <div className="panel-head">
                <div>
                  <span>ESTA SEMANA</span>
                  <h2>Próximas ações</h2>
                </div>
                <NavLink to="/app/plano">
                  Abrir plano <ArrowRight size={15} />
                </NavLink>
              </div>
              {data.plan.length ? (
                data.plan
                  .filter((item) => !item.completed)
                  .slice(0, 3)
                  .map((item) => (
                    <div className="action-row" key={item.id}>
                      <span>
                        <Clock3 size={17} />
                      </span>
                      <div>
                        <b>{item.title}</b>
                        <small>
                          {item.hours}h · {item.outcome}
                        </small>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="mini-empty">
                  <BookOpenCheck />
                  <p>Gere seu plano na página de análise.</p>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  );
}

function EmptyStart() {
  return (
    <div className="empty-start">
      <div className="empty-illustration">
        <Target size={54} />
        <span className="mini-orbit" />
      </div>
      <span>PRIMEIRO PASSO</span>
      <h2>Seu mapa começa pelas vagas.</h2>
      <p>
        Adicione oportunidades que representam o cargo e as empresas em que você
        gostaria de trabalhar. Nós cuidamos dos padrões.
      </p>
      <NavLink className="btn btn-primary btn-large" to="/app/vagas">
        <Plus size={18} /> Adicionar primeira vaga
      </NavLink>
      <div className="empty-steps">
        <span>
          <b>1</b> Adicione vagas
        </span>
        <i />
        <span>
          <b>2</b> Complete o perfil
        </span>
        <i />
        <span>
          <b>3</b> Receba o plano
        </span>
      </div>
    </div>
  );
}

function ProfilePage() {
  const { refresh } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [message, setMessage] = useState("");
  const [showExperience, setShowExperience] = useState(false);
  const [showCvImport, setShowCvImport] = useState(false);
  const load = () =>
    api<{ profile: Profile; experiences: Experience[] }>("/profile").then(
      (data) => {
        setProfile(data.profile);
        setExperiences(data.experiences);
      },
    );
  useEffect(() => {
    void load();
  }, []);
  if (!profile) return <PageLoader />;
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    await api("/profile", {
      method: "PUT",
      body: JSON.stringify({
        headline: f.get("headline"),
        location: f.get("location"),
        bio: f.get("bio"),
        targetRole: f.get("targetRole"),
        targetCompanies: splitTags(String(f.get("targetCompanies"))),
        skills: splitTags(String(f.get("skills"))),
        weeklyHours: Number(f.get("weeklyHours")),
        portfolioUrl: f.get("portfolioUrl"),
        linkedinUrl: f.get("linkedinUrl"),
        githubUrl: f.get("githubUrl"),
        languages: splitTags(String(f.get("languages"))),
      }),
    });
    setMessage("Perfil salvo. Sua análise já foi atualizada.");
    setTimeout(() => setMessage(""), 3000);
    void load();
  };
  return (
    <main className="page">
      <PageHeader
        eyebrow="MEU PERFIL"
        title="Sua história profissional"
        description="Quanto mais contexto você trouxer, mais precisa será a comparação."
        action={
          <button
            className="btn btn-dark"
            onClick={() => setShowCvImport(true)}
          >
            <UploadCloud size={17} /> Importar currículo
          </button>
        }
      />
      <form className="profile-grid" onSubmit={save}>
        <section className="panel form-panel">
          <div className="panel-title">
            <CircleUserRound />
            <div>
              <h2>Direção profissional</h2>
              <p>Onde você está e onde quer chegar.</p>
            </div>
          </div>
          <div className="form-grid">
            <label className="span-2">
              Título profissional
              <input
                name="headline"
                defaultValue={profile.headline}
                placeholder="Ex.: Product Designer Pleno"
              />
            </label>
            <label>
              Cidade / região
              <input
                name="location"
                defaultValue={profile.location}
                placeholder="São Paulo, SP"
              />
            </label>
            <label>
              Cargo-alvo
              <input
                name="targetRole"
                defaultValue={profile.target_role}
                placeholder="Ex.: Product Manager Sênior"
              />
            </label>
            <label className="span-2">
              Resumo profissional
              <textarea
                name="bio"
                defaultValue={profile.bio}
                placeholder="Conte sobre sua trajetória, resultados e o tipo de problema que gosta de resolver."
                rows={5}
              />
            </label>
            <label className="span-2">
              Empresas-alvo <small>separe por vírgulas</small>
              <input
                name="targetCompanies"
                defaultValue={joinTags(profile.target_companies)}
                placeholder="Nubank, iFood, Mercado Livre"
              />
            </label>
            <label className="span-2">
              Competências <small>separe por vírgulas</small>
              <input
                name="skills"
                defaultValue={joinTags(profile.skills)}
                placeholder="React, TypeScript, Liderança, SQL"
              />
            </label>
            <label>
              Idiomas <small>separe por vírgulas</small>
              <input
                name="languages"
                defaultValue={joinTags(profile.languages)}
                placeholder="Português, Inglês avançado"
              />
            </label>
            <label>
              Horas disponíveis por semana
              <input
                name="weeklyHours"
                type="number"
                min="1"
                max="40"
                defaultValue={profile.weekly_hours}
              />
            </label>
            <label>
              Portfólio
              <input
                name="portfolioUrl"
                type="url"
                defaultValue={profile.portfolio_url}
                placeholder="https://meuportfolio.com"
              />
            </label>
            <label>
              LinkedIn
              <input
                name="linkedinUrl"
                type="url"
                defaultValue={profile.linkedin_url}
                placeholder="https://linkedin.com/in/..."
              />
            </label>
            <label className="span-2">
              GitHub ou ArtStation
              <input
                name="githubUrl"
                type="url"
                defaultValue={profile.github_url}
                placeholder="https://github.com/..."
              />
            </label>
          </div>
          <div className="form-actions">
            {message && (
              <span className="success-message">
                <CheckCircle2 /> {message}
              </span>
            )}
            <button className="btn btn-primary">Salvar perfil</button>
          </div>
        </section>
      </form>
      <section className="panel experience-panel">
        <div className="panel-head">
          <div>
            <span>EXPERIÊNCIA</span>
            <h2>Sua base de evidências</h2>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => setShowExperience(true)}
          >
            <Plus size={16} /> Adicionar experiência
          </button>
        </div>
        {experiences.length ? (
          <div className="experience-list">
            {experiences.map((experience) => (
              <div className="experience-item" key={experience.id}>
                <span className="company-avatar">
                  {experience.company.slice(0, 1)}
                </span>
                <div>
                  <h3>{experience.role}</h3>
                  <b>{experience.company}</b>
                  <small>
                    {experience.start_date} — {experience.end_date || "Atual"}
                  </small>
                  <p>{experience.description}</p>
                  <div className="tag-list">
                    {experience.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                </div>
                <button
                  className="icon-button danger"
                  onClick={async () => {
                    await api(`/experiences/${experience.id}`, {
                      method: "DELETE",
                    });
                    void load();
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="inline-empty">
            Adicione suas experiências para provar o que você já sabe fazer.
          </div>
        )}
      </section>
      {showExperience && (
        <ExperienceModal
          onClose={() => setShowExperience(false)}
          onSaved={() => {
            setShowExperience(false);
            void load();
          }}
        />
      )}
      {showCvImport && (
        <CvImportModal
          onClose={() => setShowCvImport(false)}
          onImported={() => {
            setShowCvImport(false);
            void load();
            void refresh();
            setMessage("Currículo importado. Revise os dados quando quiser.");
          }}
        />
      )}
    </main>
  );
}

function CvImportModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CvPreview | null>(null);
  const [included, setIncluded] = useState<boolean[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const parse = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("cv", file);
    try {
      const result = await api<{ preview: CvPreview }>("/cv/parse", {
        method: "POST",
        body: form,
      });
      setPreview(result.preview);
      setIncluded(result.preview.experiences.map(() => true));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível ler o currículo.",
      );
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!preview) return;
    setBusy(true);
    setError("");
    try {
      await api("/cv/apply", {
        method: "POST",
        body: JSON.stringify({
          ...preview,
          experiences: preview.experiences.filter(
            (_, index) => included[index],
          ),
        }),
      });
      onImported();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível importar os dados.",
      );
      setBusy(false);
    }
  };

  return (
    <Modal
      title={preview ? "Revise os dados encontrados" : "Importar currículo"}
      subtitle={
        preview
          ? "Você decide o que entra no seu perfil antes de salvar."
          : "Envie seu CV e evite preencher tudo manualmente."
      }
      onClose={onClose}
    >
      {!preview ? (
        <div className="cv-upload-step">
          <label className={`dropzone ${file ? "has-file" : ""}`}>
            <input
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
            {file ? (
              <>
                <FileText />
                <b>{file.name}</b>
                <span>
                  {(file.size / 1024 / 1024).toFixed(1)} MB · pronto para
                  analisar
                </span>
              </>
            ) : (
              <>
                <UploadCloud />
                <b>Escolha seu currículo</b>
                <span>PDF, DOCX ou TXT · máximo de 8 MB</span>
              </>
            )}
          </label>
          <div className="info-box">
            <ShieldCheck />
            <p>
              O arquivo é usado apenas para extrair os dados nesta importação.
              Você revisa tudo antes de salvar.
            </p>
          </div>
          {error && <div className="form-error">{error}</div>}
          <button
            className="btn btn-primary btn-full"
            disabled={!file || busy}
            onClick={() => void parse()}
          >
            {busy ? <Loader2 className="spin" /> : <Sparkles />} Ler meu
            currículo
          </button>
        </div>
      ) : (
        <div className="cv-review">
          <div className="form-grid">
            <label>
              Nome
              <input
                value={preview.name}
                onChange={(event) =>
                  setPreview({ ...preview, name: event.target.value })
                }
              />
            </label>
            <label>
              Título profissional
              <input
                value={preview.headline}
                onChange={(event) =>
                  setPreview({ ...preview, headline: event.target.value })
                }
              />
            </label>
            <label className="span-2">
              Localização
              <input
                value={preview.location}
                onChange={(event) =>
                  setPreview({ ...preview, location: event.target.value })
                }
              />
            </label>
            <label className="span-2">
              Resumo
              <textarea
                rows={4}
                value={preview.bio}
                onChange={(event) =>
                  setPreview({ ...preview, bio: event.target.value })
                }
              />
            </label>
            <label className="span-2">
              Competências encontradas
              <input
                value={joinTags(preview.skills)}
                onChange={(event) =>
                  setPreview({
                    ...preview,
                    skills: splitTags(event.target.value),
                  })
                }
              />
            </label>
          </div>
          <div className="cv-experiences">
            <div>
              <span>EXPERIÊNCIAS ENCONTRADAS</span>
              <b>{included.filter(Boolean).length} selecionadas</b>
            </div>
            {preview.experiences.length ? (
              preview.experiences.map((experience, index) => (
                <label
                  className="cv-experience"
                  key={`${experience.company}-${index}`}
                >
                  <input
                    type="checkbox"
                    checked={included[index]}
                    onChange={(event) =>
                      setIncluded(
                        included.map((value, itemIndex) =>
                          itemIndex === index ? event.target.checked : value,
                        ),
                      )
                    }
                  />
                  <span>
                    <Check />
                  </span>
                  <div>
                    <b>{experience.role || "Cargo não identificado"}</b>
                    <small>
                      {experience.company} · {experience.startDate} —{" "}
                      {experience.endDate || "Atual"}
                    </small>
                  </div>
                </label>
              ))
            ) : (
              <p className="cv-warning">
                Não encontramos blocos de experiência com datas. Você ainda pode
                importar o resumo e as competências.
              </p>
            )}
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="cv-actions">
            <button
              className="btn btn-ghost"
              onClick={() => {
                setPreview(null);
                setError("");
              }}
            >
              Trocar arquivo
            </button>
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => void apply()}
            >
              {busy ? <Loader2 className="spin" /> : <Check />} Confirmar
              importação
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ExperienceModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const f = new FormData(event.currentTarget);
    try {
      await api("/experiences", {
        method: "POST",
        body: JSON.stringify({
          role: f.get("role"),
          company: f.get("company"),
          startDate: f.get("startDate"),
          endDate: f.get("endDate"),
          description: f.get("description"),
          skills: splitTags(String(f.get("skills"))),
        }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Adicionar experiência"
      subtitle="Resultados e contexto valem mais que uma lista de tarefas."
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={submit}>
        <div className="form-grid">
          <label>
            Cargo
            <input name="role" required />
          </label>
          <label>
            Empresa
            <input name="company" required />
          </label>
          <label>
            Início
            <input name="startDate" placeholder="Jan 2023" />
          </label>
          <label>
            Fim
            <input name="endDate" placeholder="Atual" />
          </label>
          <label className="span-2">
            O que você fez e qual foi o impacto?
            <textarea
              name="description"
              rows={5}
              placeholder="Ex.: Liderei a descoberta de uma nova jornada que aumentou a ativação em 18%."
            />
          </label>
          <label className="span-2">
            Competências usadas
            <input name="skills" placeholder="Discovery, Figma, Métricas" />
          </label>
        </div>
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-primary btn-full" disabled={busy}>
          {busy && <Loader2 className="spin" />} Salvar experiência
        </button>
      </form>
    </Modal>
  );
}

function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [filter, setFilter] = useState("");
  const load = () =>
    api<{ jobs: Job[] }>("/jobs").then((data) => setJobs(data.jobs));
  useEffect(() => {
    void load();
  }, []);
  const visible = jobs.filter((job) =>
    `${job.title} ${job.company}`.toLowerCase().includes(filter.toLowerCase()),
  );
  return (
    <main className="page">
      <PageHeader
        eyebrow="VAGAS-ALVO"
        title="O mercado que você quer"
        description="Reúna aqui as oportunidades que definem seu próximo passo."
        action={
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={17} /> Adicionar vaga
          </button>
        }
      />
      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar por cargo ou empresa"
          />
        </div>
        <span>
          {jobs.length} {jobs.length === 1 ? "vaga salva" : "vagas salvas"}
        </span>
      </div>
      {jobs.length ? (
        <div className="jobs-grid">
          {visible.map((job) => (
            <article className="job-card" key={job.id}>
              <div className="job-top">
                <span className="company-avatar">
                  {job.company.slice(0, 1)}
                </span>
                <div>
                  <small>{job.company}</small>
                  <h2>{job.title}</h2>
                  <span>{job.location || "Local não informado"}</span>
                </div>
                <button
                  className="icon-button danger"
                  onClick={async () => {
                    await api(`/jobs/${job.id}`, { method: "DELETE" });
                    void load();
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <p>
                {job.description.slice(0, 180)}
                {job.description.length > 180 ? "…" : ""}
              </p>
              <div className="tag-list">
                {job.requirements.slice(0, 6).map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <div className="job-footer">
                <span>
                  <CheckCircle2 size={15} /> Analisada
                </span>
                <div className="job-actions">
                  <button onClick={() => setSelectedJob(job)}>
                    Preparar candidatura <Sparkles size={14} />
                  </button>
                  {job.url && (
                    <a href={job.url} target="_blank" rel="noreferrer">
                      Original <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyStart />
      )}
      {showAdd && (
        <JobModal
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            void load();
          }}
        />
      )}
      {selectedJob && (
        <TailorModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </main>
  );
}

function JobModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<"link" | "text">("link");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(event.currentTarget);
    try {
      if (tab === "link") {
        await api("/jobs/import", {
          method: "POST",
          body: JSON.stringify({ url: f.get("url") }),
        });
      } else {
        await api("/jobs", {
          method: "POST",
          body: JSON.stringify({
            url: "",
            title: f.get("title"),
            company: f.get("company"),
            location: f.get("location"),
            description: f.get("description"),
            requirements: [],
          }),
        });
      }
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível importar.",
      );
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Adicionar vaga-alvo"
      subtitle="Cada vaga melhora a leitura dos padrões do seu mercado."
      onClose={onClose}
    >
      <div className="tabs">
        <button
          className={tab === "link" ? "active" : ""}
          onClick={() => setTab("link")}
        >
          <Link2 /> Colar link
        </button>
        <button
          className={tab === "text" ? "active" : ""}
          onClick={() => setTab("text")}
        >
          <BriefcaseBusiness /> Colar descrição
        </button>
      </div>
      <form className="modal-form" onSubmit={submit}>
        {tab === "link" ? (
          <>
            <label>
              Link da vaga
              <input
                name="url"
                type="url"
                required
                placeholder="https://empresa.com/carreiras/vaga"
              />
            </label>
            <div className="info-box">
              <Sparkles />
              <p>
                Vamos buscar cargo, empresa, descrição e competências. Se a
                página bloquear a leitura, use a opção “Colar descrição”.
              </p>
            </div>
          </>
        ) : (
          <div className="form-grid">
            <label>
              Cargo
              <input name="title" required />
            </label>
            <label>
              Empresa
              <input name="company" required />
            </label>
            <label className="span-2">
              Local
              <input name="location" placeholder="Remoto / São Paulo" />
            </label>
            <label className="span-2">
              Descrição completa
              <textarea name="description" required minLength={20} rows={9} />
            </label>
          </div>
        )}
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-primary btn-full" disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="spin" /> Lendo e analisando…
            </>
          ) : (
            <>
              Adicionar à análise <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}

function AnalysisPage() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();
  const load = () =>
    api<{ analysis: Analysis }>("/analysis").then((d) =>
      setAnalysis(d.analysis),
    );
  useEffect(() => {
    void load();
  }, []);
  if (!analysis) return <PageLoader />;
  const generate = async () => {
    setGenerating(true);
    await api("/plan/generate", { method: "POST" });
    navigate("/app/plano");
  };
  return (
    <main className="page">
      <PageHeader
        eyebrow="MINHA ANÁLISE"
        title="O seu mapa de aderência"
        description="Uma leitura objetiva entre sua experiência e o padrão das vagas-alvo."
        action={
          <button
            className="btn btn-primary"
            disabled={!analysis.totalJobs || generating}
            onClick={() => void generate()}
          >
            {generating ? <Loader2 className="spin" /> : <Sparkles size={17} />}{" "}
            Gerar plano de ação
          </button>
        }
      />
      {!analysis.totalJobs ? (
        <EmptyStart />
      ) : (
        <>
          <section className="analysis-hero">
            <div className="big-score">
              <span>ADERÊNCIA ATUAL</span>
              <strong>
                {analysis.matchScore}
                <small>%</small>
              </strong>
              <p>{analysis.summary}</p>
            </div>
            <div className="analysis-summary">
              <div>
                <CheckCircle2 />
                <span>
                  <b>{analysis.strengths.length}</b> forças comprovadas
                </span>
              </div>
              <div>
                <Target />
                <span>
                  <b>{analysis.gaps.length}</b> lacunas priorizadas
                </span>
              </div>
              <div>
                <Building2 />
                <span>
                  <b>{analysis.totalJobs}</b> vagas na amostra
                </span>
              </div>
            </div>
          </section>
          <div className="analysis-grid">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <span>GAPS</span>
                  <h2>O que desenvolver primeiro</h2>
                </div>
              </div>
              <div className="signal-list">
                {analysis.gaps.map((gap, index) => (
                  <div className="signal-item" key={gap.skill}>
                    <span className="rank">0{index + 1}</span>
                    <div className="signal-main">
                      <div>
                        <b>{gap.skill}</b>
                        <span className={`priority priority-${gap.priority}`}>
                          {gap.priority}
                        </span>
                      </div>
                      <div className="skill-track">
                        <i style={{ width: `${gap.demand}%` }} />
                      </div>
                      <small>
                        Presente em {gap.demand}% das vagas ·{" "}
                        {gap.evidence.slice(0, 2).join(", ")}
                      </small>
                      <div className="signal-meta">
                        <span>{gap.requirementType}</span>
                        <span>{gap.difficulty}</span>
                      </div>
                      {gap.evidenceDetails?.[0] && (
                        <blockquote>
                          “{gap.evidenceDetails[0].excerpt}”
                        </blockquote>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <span>FORÇAS</span>
                  <h2>O que já joga a seu favor</h2>
                </div>
              </div>
              <div className="strength-list">
                {analysis.strengths.length ? (
                  analysis.strengths.map((item) => (
                    <div key={item.skill}>
                      <span>
                        <Check />
                      </span>
                      <div>
                        <b>{item.skill}</b>
                        <small>
                          Reconhecida no perfil · exigida em {item.demand}%
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="mini-empty">
                    <p>
                      Complete suas competências e experiências para mapear
                      forças.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
          <section className="panel matrix-panel">
            <div className="panel-head">
              <div>
                <span>MATRIZ COMPLETA</span>
                <h2>Sinais por competência</h2>
              </div>
            </div>
            <div className="matrix">
              <div className="matrix-head">
                <span>Competência</span>
                <span>Demanda</span>
                <span>Status</span>
                <span>Tipo</span>
              </div>
              {analysis.signals.map((signal) => (
                <div className="matrix-row" key={signal.skill}>
                  <b>{signal.skill}</b>
                  <span>{signal.demand}%</span>
                  <span
                    className={signal.hasSkill ? "status-ok" : "status-gap"}
                  >
                    {signal.hasSkill ? "No seu perfil" : "A desenvolver"}
                  </span>
                  <small>{signal.requirementType}</small>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function PlanPage() {
  const [plan, setPlan] = useState<PlanItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const load = () =>
    api<{ plan: PlanItem[] }>("/plan").then((d) => setPlan(d.plan));
  useEffect(() => {
    void load();
  }, []);
  if (!plan) return <PageLoader />;
  const complete = plan.filter((i) => i.completed).length;
  const generate = async () => {
    setBusy(true);
    await api("/plan/generate", { method: "POST" });
    await load();
    setBusy(false);
  };
  return (
    <main className="page">
      <PageHeader
        eyebrow="PLANO DE AÇÃO"
        title="Da intenção à evidência"
        description="Um passo por semana para aproximar seu perfil do cargo-alvo."
        action={
          <button
            className="btn btn-outline"
            disabled={busy}
            onClick={() => void generate()}
          >
            {busy ? <Loader2 className="spin" /> : <Sparkles size={17} />}{" "}
            {plan.length ? "Recalcular plano" : "Gerar plano"}
          </button>
        }
      />
      {plan.length ? (
        <>
          <section className="plan-progress">
            <div>
              <span>PROGRESSO GERAL</span>
              <h2>
                {complete} de {plan.length} etapas concluídas
              </h2>
            </div>
            <strong>{Math.round((complete / plan.length) * 100)}%</strong>
            <div className="progress">
              <i style={{ width: `${(complete / plan.length) * 100}%` }} />
            </div>
          </section>
          <div className="timeline">
            {plan.map((item, index) => (
              <article
                className={`timeline-item ${item.completed ? "done" : ""}`}
                key={item.id}
              >
                <div className="timeline-marker">
                  {item.completed ? <Check /> : index + 1}
                </div>
                <div className="timeline-card">
                  <div className="timeline-top">
                    <span>SEMANA {item.week}</span>
                    <span>
                      <Clock3 size={15} />
                      {item.hours} horas
                    </span>
                  </div>
                  <h2>{item.title}</h2>
                  <span className="focus-tag">Foco: {item.skill}</span>
                  <div className="deliverable">
                    <Rocket size={18} />
                    <div>
                      <small>ENTREGÁVEL</small>
                      <p>{item.outcome}</p>
                    </div>
                  </div>
                  <label className="check-action">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={async (e) => {
                        await api(`/plan/${item.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({ completed: e.target.checked }),
                        });
                        void load();
                      }}
                    />
                    <span>
                      <Check />
                    </span>{" "}
                    Marcar como concluída
                  </label>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-start">
          <div className="empty-illustration">
            <BookOpenCheck size={52} />
          </div>
          <span>PLANO PERSONALIZADO</span>
          <h2>Primeiro, precisamos dos sinais.</h2>
          <p>
            Adicione vagas e complete seu perfil. Depois, geramos um roteiro
            baseado nas lacunas mais importantes.
          </p>
          <button
            className="btn btn-primary btn-large"
            onClick={() => void generate()}
            disabled={busy}
          >
            {busy && <Loader2 className="spin" />} Gerar meu plano
          </button>
        </div>
      )}
    </main>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          <X />
        </button>
        <span className="modal-kicker">VJ CARREIRAS</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
function PageLoader() {
  return (
    <div className="page-loader">
      <Loader2 className="spin" />
      <span>Organizando sua jornada…</span>
    </div>
  );
}
function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/entrar" state={{ from: location }} replace />
  );
}

function SettingsRoute() {
  const { user } = useAuth();
  return <SettingsPage user={user} />;
}

function LegalPage({ type }: { type: "privacy" | "terms" }) {
  const privacy = type === "privacy";
  return (
    <main className="legal-page shell">
      <Link to="/">
        <Logo />
      </Link>
      <span>ÚLTIMA ATUALIZAÇÃO — 21 DE SETEMBRO DE 2026</span>
      <h1>{privacy ? "Política de Privacidade" : "Termos de Uso"}</h1>
      <p>
        {privacy
          ? "O VJ Carreiras utiliza seus dados exclusivamente para organizar seu perfil, analisar vagas e gerar recomendações personalizadas."
          : "O VJ Carreiras é uma ferramenta de planejamento. As análises são orientativas e não garantem contratação, promoção ou resultado profissional."}
      </p>
      <section>
        <h2>{privacy ? "Dados que armazenamos" : "Uso responsável"}</h2>
        <p>
          {privacy
            ? "Armazenamos dados de conta, currículo, experiências, vagas, projetos, candidaturas e progresso. Senhas são protegidas por hash e nunca ficam disponíveis em texto aberto."
            : "Você deve fornecer apenas informações verdadeiras e tem responsabilidade sobre currículos e candidaturas produzidos a partir das recomendações."}
        </p>
        <h2>{privacy ? "Controle e exclusão" : "Limitações"}</h2>
        <p>
          {privacy
            ? "Você pode exportar seus dados nas configurações e solicitar exclusão integral da conta. Currículos enviados são processados em memória e não são mantidos como arquivos."
            : "Requisitos de vagas podem mudar e páginas externas podem bloquear importações. Sempre revise os dados antes de utilizá-los em uma candidatura."}
        </p>
        <h2>Contato</h2>
        <p>
          Para dúvidas sobre a plataforma, utilize o contato informado pelo
          responsável do projeto.
        </p>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/entrar" element={<AuthPage mode="login" />} />
        <Route path="/cadastro" element={<AuthPage mode="register" />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="/privacidade" element={<LegalPage type="privacy" />} />
        <Route path="/termos" element={<LegalPage type="terms" />} />
        <Route element={<RequireAuth />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route path="vagas" element={<JobsPage />} />
            <Route path="analise" element={<AnalysisPage />} />
            <Route path="plano" element={<PlanPage />} />
            <Route path="mapa" element={<CareerMapPage />} />
            <Route path="projetos" element={<ProjectsPage />} />
            <Route path="candidaturas" element={<ApplicationsPage />} />
            <Route path="evolucao" element={<ProgressPage />} />
            <Route path="configuracoes" element={<SettingsRoute />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
