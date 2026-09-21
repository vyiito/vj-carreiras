import { Router, type Request, type RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { analyzeCareer } from "./analysis.js";
import { pool, queryMany, queryOne } from "./db.js";

type AuthedRequest = Request & { userId?: string };
type ProfileRow = {
  skills: string[];
  weekly_hours: number;
  target_role: string;
};
type ExperienceRow = {
  role: string;
  company: string;
  description: string;
  skills: string[];
};
type JobRow = {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location?: string;
  url?: string;
};

async function userAnalysis(userId: string) {
  const [profile, experiences, jobs] = await Promise.all([
    queryOne<ProfileRow>(
      "SELECT skills,weekly_hours,target_role FROM profiles WHERE user_id=$1",
      [userId],
    ),
    queryMany<ExperienceRow>(
      "SELECT role,company,description,skills FROM experiences WHERE user_id=$1",
      [userId],
    ),
    queryMany<JobRow>(
      "SELECT id,title,company,description,requirements FROM jobs WHERE user_id=$1",
      [userId],
    ),
  ]);
  return analyzeCareer({
    profileSkills: profile?.skills ?? [],
    experiences,
    jobs,
    weeklyHours: profile?.weekly_hours ?? 6,
  });
}

export function createFeatureRouter(auth: RequestHandler) {
  const router = Router();
  router.use(auth);

  router.get("/projects", async (req: AuthedRequest, res, next) => {
    try {
      res.json({
        projects: await queryMany(
          "SELECT * FROM projects WHERE user_id=$1 ORDER BY created_at DESC",
          [req.userId],
        ),
      });
    } catch (error) {
      next(error);
    }
  });

  const projectSchema = z.object({
    title: z.string().trim().min(2).max(180),
    description: z.string().max(4000).default(""),
    projectType: z.string().max(40).default("portfolio"),
    status: z.enum(["idea", "active", "complete"]).default("idea"),
    skills: z.array(z.string().max(80)).max(50).default([]),
    evidenceUrl: z.string().max(2000).default(""),
    strategicReason: z.string().max(1000).default(""),
  });

  router.post("/projects", async (req: AuthedRequest, res, next) => {
    try {
      const input = projectSchema.parse(req.body);
      const project = await queryOne(
        `INSERT INTO projects (user_id,title,description,project_type,status,skills,evidence_url,strategic_reason)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [
          req.userId,
          input.title,
          input.description,
          input.projectType,
          input.status,
          input.skills,
          input.evidenceUrl,
          input.strategicReason,
        ],
      );
      res.status(201).json({ project });
    } catch (error) {
      next(error);
    }
  });

  router.post("/projects/generate", async (req: AuthedRequest, res, next) => {
    try {
      const analysis = await userAnalysis(req.userId!);
      const gapGroups = [
        analysis.gaps.slice(0, 3),
        analysis.gaps.slice(3, 6),
        analysis.gaps.slice(6, 9),
      ].filter((group) => group.length);
      const titles = [
        "Projeto principal de portfólio",
        "Case de aplicação prática",
        "Desafio de aprofundamento",
      ];
      for (let index = 0; index < gapGroups.length; index += 1) {
        const skills = gapGroups[index].map((gap) => gap.skill);
        const title = `${titles[index]} — ${skills[0]}`;
        await pool.query(
          `INSERT INTO projects (user_id,title,description,project_type,status,skills,strategic_reason)
          SELECT $1,$2,$3,'portfolio','idea',$4,$5 WHERE NOT EXISTS (SELECT 1 FROM projects WHERE user_id=$1 AND title=$2)`,
          [
            req.userId,
            title,
            `Crie uma entrega completa que demonstre ${skills.join(", ")} em um contexto próximo às vagas-alvo.`,
            skills,
            `Cobre ${skills.length} lacunas recorrentes encontradas nas vagas analisadas.`,
          ],
        );
      }
      res.json({
        projects: await queryMany(
          "SELECT * FROM projects WHERE user_id=$1 ORDER BY created_at DESC",
          [req.userId],
        ),
      });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/projects/:id", async (req: AuthedRequest, res, next) => {
    try {
      const { status, evidenceUrl } = z
        .object({
          status: z.enum(["idea", "active", "complete"]).optional(),
          evidenceUrl: z.string().max(2000).optional(),
        })
        .parse(req.body);
      const project = await queryOne(
        `UPDATE projects SET status=COALESCE($1,status),evidence_url=COALESCE($2,evidence_url),updated_at=NOW()
        WHERE id=$3 AND user_id=$4 RETURNING *`,
        [status ?? null, evidenceUrl ?? null, req.params.id, req.userId],
      );
      res.json({ project });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/projects/:id", async (req: AuthedRequest, res, next) => {
    try {
      await pool.query("DELETE FROM projects WHERE id=$1 AND user_id=$2", [
        req.params.id,
        req.userId,
      ]);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  router.get("/evidence", async (req: AuthedRequest, res, next) => {
    try {
      res.json({
        evidence: await queryMany(
          "SELECT * FROM skill_evidence WHERE user_id=$1 ORDER BY created_at DESC",
          [req.userId],
        ),
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/evidence", async (req: AuthedRequest, res, next) => {
    try {
      const input = z
        .object({
          skill: z.string().min(1).max(80),
          title: z.string().min(2).max(180),
          evidenceType: z
            .enum([
              "project",
              "work",
              "course",
              "certificate",
              "github",
              "portfolio",
            ])
            .default("project"),
          url: z.string().max(2000).default(""),
          description: z.string().max(1200).default(""),
        })
        .parse(req.body);
      const evidence = await queryOne(
        `INSERT INTO skill_evidence (user_id,skill,title,evidence_type,url,description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [
          req.userId,
          input.skill,
          input.title,
          input.evidenceType,
          input.url,
          input.description,
        ],
      );
      res.status(201).json({ evidence });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/evidence/:id", async (req: AuthedRequest, res, next) => {
    try {
      await pool.query(
        "DELETE FROM skill_evidence WHERE id=$1 AND user_id=$2",
        [req.params.id, req.userId],
      );
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  router.get("/goals", async (req: AuthedRequest, res, next) => {
    try {
      const goals = await queryOne(
        "SELECT * FROM career_goals WHERE user_id=$1",
        [req.userId],
      );
      const profile = await queryOne<ProfileRow>(
        "SELECT target_role FROM profiles WHERE user_id=$1",
        [req.userId],
      );
      res.json({
        goals: goals ?? {
          current_goal: "",
          intermediate_goal: "",
          main_goal: profile?.target_role ?? "",
          selected_path: "",
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.put("/goals", async (req: AuthedRequest, res, next) => {
    try {
      const input = z
        .object({
          currentGoal: z.string().max(180).default(""),
          intermediateGoal: z.string().max(180).default(""),
          mainGoal: z.string().max(180).default(""),
          selectedPath: z.string().max(80).default(""),
        })
        .parse(req.body);
      const goals = await queryOne(
        `INSERT INTO career_goals (user_id,current_goal,intermediate_goal,main_goal,selected_path) VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (user_id) DO UPDATE SET current_goal=$2,intermediate_goal=$3,main_goal=$4,selected_path=$5,updated_at=NOW() RETURNING *`,
        [
          req.userId,
          input.currentGoal,
          input.intermediateGoal,
          input.mainGoal,
          input.selectedPath,
        ],
      );
      res.json({ goals });
    } catch (error) {
      next(error);
    }
  });

  router.get("/career-map", async (req: AuthedRequest, res, next) => {
    try {
      const [profile, goals, analysis] = await Promise.all([
        queryOne<ProfileRow>(
          "SELECT target_role FROM profiles WHERE user_id=$1",
          [req.userId],
        ),
        queryOne<{
          current_goal: string;
          intermediate_goal: string;
          main_goal: string;
        }>(
          "SELECT current_goal,intermediate_goal,main_goal FROM career_goals WHERE user_id=$1",
          [req.userId],
        ),
        userAnalysis(req.userId!),
      ]);
      const target = goals?.main_goal || profile?.target_role || "Cargo-alvo";
      const base = target
        .replace(/\b(s[eê]nior|senior|lead|principal)\b/gi, "")
        .trim();
      const accessible = goals?.current_goal || `${base} Júnior`;
      const bridge =
        goals?.intermediate_goal || (target === base ? `${base} Pleno` : base);
      res.json({
        map: {
          score: analysis.matchScore,
          stages: [
            { label: "Hoje", role: accessible, status: "current" },
            { label: "Cargo ponte", role: bridge, status: "next" },
            { label: "Objetivo principal", role: target, status: "goal" },
          ],
          skills: analysis.signals.slice(0, 14),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/applications", async (req: AuthedRequest, res, next) => {
    try {
      res.json({
        applications: await queryMany(
          "SELECT * FROM applications WHERE user_id=$1 ORDER BY updated_at DESC",
          [req.userId],
        ),
      });
    } catch (error) {
      next(error);
    }
  });

  const applicationSchema = z.object({
    jobId: z.string().uuid().nullable().optional(),
    company: z.string().min(2).max(120),
    title: z.string().min(2).max(180),
    status: z
      .enum([
        "saved",
        "preparing",
        "applied",
        "interview",
        "challenge",
        "offer",
        "rejected",
      ])
      .default("saved"),
    notes: z.string().max(4000).default(""),
    nextStep: z.string().max(500).default(""),
    nextStepDate: z.string().max(30).default(""),
  });
  router.post("/applications", async (req: AuthedRequest, res, next) => {
    try {
      const i = applicationSchema.parse(req.body);
      const application = await queryOne(
        `INSERT INTO applications (user_id,job_id,company,title,status,notes,next_step,next_step_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [
          req.userId,
          i.jobId ?? null,
          i.company,
          i.title,
          i.status,
          i.notes,
          i.nextStep,
          i.nextStepDate,
        ],
      );
      res.status(201).json({ application });
    } catch (error) {
      next(error);
    }
  });
  router.patch("/applications/:id", async (req: AuthedRequest, res, next) => {
    try {
      const i = applicationSchema.partial().parse(req.body);
      const application = await queryOne(
        `UPDATE applications SET status=COALESCE($1,status),notes=COALESCE($2,notes),next_step=COALESCE($3,next_step),next_step_date=COALESCE($4,next_step_date),updated_at=NOW() WHERE id=$5 AND user_id=$6 RETURNING *`,
        [
          i.status ?? null,
          i.notes ?? null,
          i.nextStep ?? null,
          i.nextStepDate ?? null,
          req.params.id,
          req.userId,
        ],
      );
      res.json({ application });
    } catch (error) {
      next(error);
    }
  });
  router.delete("/applications/:id", async (req: AuthedRequest, res, next) => {
    try {
      await pool.query("DELETE FROM applications WHERE id=$1 AND user_id=$2", [
        req.params.id,
        req.userId,
      ]);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  router.get("/progress", async (req: AuthedRequest, res, next) => {
    try {
      res.json({
        snapshots: await queryMany(
          "SELECT * FROM analysis_snapshots WHERE user_id=$1 ORDER BY created_at",
          [req.userId],
        ),
      });
    } catch (error) {
      next(error);
    }
  });
  router.post("/progress/snapshot", async (req: AuthedRequest, res, next) => {
    try {
      const analysis = await userAnalysis(req.userId!);
      await pool.query(
        `INSERT INTO analysis_snapshots (user_id,score,reason) SELECT $1,$2,$3 WHERE NOT EXISTS (SELECT 1 FROM analysis_snapshots WHERE user_id=$1 AND score=$2 AND created_at > NOW()-INTERVAL '1 day')`,
        [req.userId, analysis.matchScore, analysis.summary],
      );
      res.json({ score: analysis.matchScore });
    } catch (error) {
      next(error);
    }
  });

  router.get("/jobs/:id/tailor", async (req: AuthedRequest, res, next) => {
    try {
      const job = await queryOne<JobRow>(
        "SELECT * FROM jobs WHERE id=$1 AND user_id=$2",
        [req.params.id, req.userId],
      );
      if (!job) return res.status(404).json({ error: "Vaga não encontrada." });
      const [profile, experiences] = await Promise.all([
        queryOne<ProfileRow>(
          "SELECT skills,weekly_hours,target_role FROM profiles WHERE user_id=$1",
          [req.userId],
        ),
        queryMany<ExperienceRow>(
          "SELECT role,company,description,skills FROM experiences WHERE user_id=$1",
          [req.userId],
        ),
      ]);
      const analysis = analyzeCareer({
        profileSkills: profile?.skills ?? [],
        experiences,
        jobs: [job],
        weeklyHours: profile?.weekly_hours ?? 6,
      });
      res.json({
        kit: {
          job: { id: job.id, title: job.title, company: job.company },
          score: analysis.matchScore,
          strengths: analysis.strengths.map((x) => x.skill),
          gaps: analysis.gaps.map((x) => ({
            skill: x.skill,
            type: x.requirementType,
            difficulty: x.difficulty,
          })),
          headlineSuggestion: `${profile?.target_role || job.title} com foco em ${
            analysis.strengths
              .slice(0, 3)
              .map((x) => x.skill)
              .join(", ") || "resultados relevantes"
          }`,
          keywords: analysis.signals.slice(0, 12).map((x) => x.skill),
          checklist: [
            "Priorize resultados mensuráveis relacionados às competências fortes",
            "Inclua links de projetos que comprovem os requisitos principais",
            "Não declare competências ou experiências que você ainda não possui",
            "Prepare exemplos concretos para cada requisito obrigatório",
          ],
          warning: analysis.gaps
            .filter((x) => x.difficulty === "experiência acumulada")
            .map((x) => x.skill),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/onboarding/complete", async (req: AuthedRequest, res, next) => {
    try {
      await pool.query(
        "UPDATE users SET onboarding_completed=TRUE WHERE id=$1",
        [req.userId],
      );
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  router.get("/account/export", async (req: AuthedRequest, res, next) => {
    try {
      const tables = [
        "profiles",
        "experiences",
        "jobs",
        "plan_items",
        "projects",
        "skill_evidence",
        "applications",
        "career_goals",
        "analysis_snapshots",
      ];
      const data: Record<string, unknown> = {
        users: await queryMany(
          "SELECT id,name,email,email_verified,onboarding_completed,created_at FROM users WHERE id=$1",
          [req.userId],
        ),
      };
      for (const table of tables) {
        data[table] = await queryMany(
          `SELECT * FROM ${table} WHERE user_id=$1`,
          [req.userId],
        );
      }
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="vj-carreiras-dados.json"',
      );
      res.json({ exportedAt: new Date().toISOString(), data });
    } catch (error) {
      next(error);
    }
  });
  router.delete("/account", async (req: AuthedRequest, res, next) => {
    try {
      const { password } = z
        .object({ password: z.string().min(8) })
        .parse(req.body);
      const user = await queryOne<{ password_hash: string }>(
        "SELECT password_hash FROM users WHERE id=$1",
        [req.userId],
      );
      if (!user || !(await bcrypt.compare(password, user.password_hash)))
        return res.status(401).json({ error: "Senha incorreta." });
      await pool.query("DELETE FROM users WHERE id=$1", [req.userId]);
      res.clearCookie("vj_session");
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
