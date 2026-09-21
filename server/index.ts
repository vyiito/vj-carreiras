import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeCareer, detectSkills } from './analysis.js';
import { migrate, pool, queryMany, queryOne } from './db.js';
import { parseJobUrl } from './jobParser.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const secret = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

type AuthedRequest = Request & { userId?: string };
type UserRow = { id: string; name: string; email: string; password_hash: string };
type ProfileRow = {
  user_id: string; headline: string; location: string; bio: string; target_role: string;
  target_companies: string[]; skills: string[]; weekly_hours: number;
};
type ExperienceRow = {
  id: string; role: string; company: string; start_date: string; end_date: string;
  description: string; skills: string[];
};
type JobRow = {
  id: string; url: string; title: string; company: string; location: string;
  description: string; requirements: string[]; status: string; created_at: string;
};

function issueToken(res: Response, userId: string) {
  const token = jwt.sign({ sub: userId }, secret, { expiresIn: '30d' });
  res.cookie('vj_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function auth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies.vj_session;
  if (!token) return res.status(401).json({ error: 'Faça login para continuar.' });
  try {
    const payload = jwt.verify(token, secret) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    res.clearCookie('vj_session');
    return res.status(401).json({ error: 'Sua sessão expirou.' });
  }
}

const credentialsSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(6).max(100),
});

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const input = credentialsSchema.extend({ name: z.string().trim().min(2).max(80) }).parse(req.body);
    const exists = await queryOne('SELECT id FROM users WHERE email = $1', [input.email]);
    if (exists) return res.status(409).json({ error: 'Esse e-mail já está cadastrado.' });
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await queryOne<UserRow>(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [input.name, input.email, passwordHash],
    );
    if (!user) throw new Error('Não foi possível criar a conta.');
    await pool.query('INSERT INTO profiles (user_id) VALUES ($1)', [user.id]);
    issueToken(res, user.id);
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) { next(error); }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const input = credentialsSchema.parse(req.body);
    const user = await queryOne<UserRow>('SELECT * FROM users WHERE email = $1', [input.email]);
    if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }
    issueToken(res, user.id);
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) { next(error); }
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('vj_session');
  res.status(204).end();
});

app.get('/api/me', auth, async (req: AuthedRequest, res, next) => {
  try {
    const user = await queryOne<UserRow>('SELECT * FROM users WHERE id = $1', [req.userId]);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) { next(error); }
});

app.get('/api/profile', auth, async (req: AuthedRequest, res, next) => {
  try {
    const [profile, experiences] = await Promise.all([
      queryOne<ProfileRow>('SELECT * FROM profiles WHERE user_id = $1', [req.userId]),
      queryMany<ExperienceRow>('SELECT * FROM experiences WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]),
    ]);
    res.json({ profile, experiences });
  } catch (error) { next(error); }
});

const profileSchema = z.object({
  headline: z.string().max(160).default(''),
  location: z.string().max(100).default(''),
  bio: z.string().max(1200).default(''),
  targetRole: z.string().max(160).default(''),
  targetCompanies: z.array(z.string().max(100)).max(20).default([]),
  skills: z.array(z.string().max(80)).max(100).default([]),
  weeklyHours: z.number().int().min(1).max(40).default(6),
});

app.put('/api/profile', auth, async (req: AuthedRequest, res, next) => {
  try {
    const input = profileSchema.parse(req.body);
    const profile = await queryOne<ProfileRow>(`UPDATE profiles SET
      headline=$1, location=$2, bio=$3, target_role=$4, target_companies=$5,
      skills=$6, weekly_hours=$7, updated_at=NOW() WHERE user_id=$8 RETURNING *`,
    [input.headline, input.location, input.bio, input.targetRole, input.targetCompanies, input.skills, input.weeklyHours, req.userId]);
    res.json({ profile });
  } catch (error) { next(error); }
});

const experienceSchema = z.object({
  role: z.string().trim().min(2).max(120),
  company: z.string().trim().min(2).max(120),
  startDate: z.string().max(20).default(''),
  endDate: z.string().max(20).default(''),
  description: z.string().max(3000).default(''),
  skills: z.array(z.string().max(80)).max(50).default([]),
});

app.post('/api/experiences', auth, async (req: AuthedRequest, res, next) => {
  try {
    const input = experienceSchema.parse(req.body);
    const experience = await queryOne<ExperienceRow>(`INSERT INTO experiences
      (user_id, role, company, start_date, end_date, description, skills)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.userId, input.role, input.company, input.startDate, input.endDate, input.description, input.skills]);
    res.status(201).json({ experience });
  } catch (error) { next(error); }
});

app.delete('/api/experiences/:id', auth, async (req: AuthedRequest, res, next) => {
  try {
    await pool.query('DELETE FROM experiences WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.status(204).end();
  } catch (error) { next(error); }
});

const jobSchema = z.object({
  url: z.string().max(2000).default(''),
  title: z.string().trim().min(2).max(180),
  company: z.string().trim().min(2).max(120),
  location: z.string().max(120).default(''),
  description: z.string().min(20).max(25000),
  requirements: z.array(z.string().max(100)).max(100).default([]),
});

async function saveJob(userId: string, input: z.infer<typeof jobSchema>) {
  const requirements = input.requirements.length ? input.requirements : detectSkills(input.description);
  return queryOne<JobRow>(`INSERT INTO jobs
    (user_id,url,title,company,location,description,requirements)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
  [userId, input.url, input.title, input.company, input.location, input.description, requirements]);
}

app.get('/api/jobs', auth, async (req: AuthedRequest, res, next) => {
  try {
    const jobs = await queryMany<JobRow>('SELECT * FROM jobs WHERE user_id=$1 ORDER BY created_at DESC', [req.userId]);
    res.json({ jobs });
  } catch (error) { next(error); }
});

app.post('/api/jobs', auth, async (req: AuthedRequest, res, next) => {
  try {
    const job = await saveJob(req.userId!, jobSchema.parse(req.body));
    res.status(201).json({ job });
  } catch (error) { next(error); }
});

app.post('/api/jobs/import', auth, async (req: AuthedRequest, res, next) => {
  try {
    const { url } = z.object({ url: z.string().url().max(2000) }).parse(req.body);
    const parsed = await parseJobUrl(url);
    const job = await saveJob(req.userId!, jobSchema.parse(parsed));
    res.status(201).json({ job });
  } catch (error) { next(error); }
});

app.delete('/api/jobs/:id', auth, async (req: AuthedRequest, res, next) => {
  try {
    await pool.query('DELETE FROM jobs WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.status(204).end();
  } catch (error) { next(error); }
});

async function buildAnalysis(userId: string) {
  const [profile, experiences, jobs] = await Promise.all([
    queryOne<ProfileRow>('SELECT * FROM profiles WHERE user_id=$1', [userId]),
    queryMany<ExperienceRow>('SELECT * FROM experiences WHERE user_id=$1', [userId]),
    queryMany<JobRow>('SELECT * FROM jobs WHERE user_id=$1', [userId]),
  ]);
  return analyzeCareer({
    profileSkills: profile?.skills ?? [],
    experiences: experiences.map((item) => ({ role: item.role, company: item.company, description: item.description, skills: item.skills })),
    jobs: jobs.map((item) => ({ id: item.id, title: item.title, company: item.company, description: item.description, requirements: item.requirements })),
    weeklyHours: profile?.weekly_hours ?? 6,
  });
}

app.get('/api/analysis', auth, async (req: AuthedRequest, res, next) => {
  try { res.json({ analysis: await buildAnalysis(req.userId!) }); }
  catch (error) { next(error); }
});

app.post('/api/plan/generate', auth, async (req: AuthedRequest, res, next) => {
  const client = await pool.connect();
  try {
    const analysis = await buildAnalysis(req.userId!);
    await client.query('BEGIN');
    await client.query('DELETE FROM plan_items WHERE user_id=$1', [req.userId]);
    for (const item of analysis.plan) {
      await client.query(`INSERT INTO plan_items (user_id,title,skill,week,hours,outcome)
        VALUES ($1,$2,$3,$4,$5,$6)`, [req.userId, item.title, item.skill, item.week, item.hours, item.outcome]);
    }
    await client.query('COMMIT');
    const plan = await queryMany('SELECT * FROM plan_items WHERE user_id=$1 ORDER BY week', [req.userId]);
    res.json({ plan });
  } catch (error) {
    await client.query('ROLLBACK'); next(error);
  } finally { client.release(); }
});

app.get('/api/plan', auth, async (req: AuthedRequest, res, next) => {
  try {
    const plan = await queryMany('SELECT * FROM plan_items WHERE user_id=$1 ORDER BY week', [req.userId]);
    res.json({ plan });
  } catch (error) { next(error); }
});

app.patch('/api/plan/:id', auth, async (req: AuthedRequest, res, next) => {
  try {
    const { completed } = z.object({ completed: z.boolean() }).parse(req.body);
    const item = await queryOne('UPDATE plan_items SET completed=$1 WHERE id=$2 AND user_id=$3 RETURNING *', [completed, req.params.id, req.userId]);
    res.json({ item });
  } catch (error) { next(error); }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

app.use(express.static(publicDir));
app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  if (error instanceof z.ZodError) return res.status(400).json({ error: 'Revise os campos enviados.', details: error.issues });
  const message = error instanceof Error ? error.message : 'Erro inesperado.';
  res.status(500).json({ error: message });
});

migrate()
  .then(() => app.listen(port, '0.0.0.0', () => console.log(`VJ Carreiras disponível na porta ${port}`)))
  .catch((error) => { console.error('Falha ao preparar o banco:', error); process.exit(1); });

