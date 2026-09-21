import nodemailer from "nodemailer";

const appUrl = () =>
  process.env.APP_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  "http://localhost:5173";

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character]!,
  );

export async function sendTransactionalEmail(
  to: string,
  subject: string,
  html: string,
) {
  const user = process.env.GMAIL_USER?.trim();
  const password = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !password) {
    console.info(`[email-disabled] ${subject} -> ${to}`);
    return { sent: false };
  }
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user,
      pass: password,
    },
  });
  await transporter.sendMail({
    from: `VJ Carreiras <${user}>`,
    to,
    subject,
    html,
  });
  return { sent: true };
}

export function verificationEmail(name: string, token: string) {
  const url = `${appUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  return {
    subject: "Confirme seu e-mail no VJ Carreiras",
    html: `<h1>Olá, ${escapeHtml(name)}.</h1><p>Confirme seu e-mail para proteger sua jornada profissional.</p><p><a href="${url}">Confirmar meu e-mail</a></p><p>Este link expira em 24 horas.</p>`,
  };
}

export function passwordResetEmail(name: string, token: string) {
  const url = `${appUrl()}/redefinir-senha?token=${encodeURIComponent(token)}`;
  return {
    subject: "Redefina sua senha do VJ Carreiras",
    html: `<h1>Olá, ${escapeHtml(name)}.</h1><p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${url}">Criar uma nova senha</a></p><p>Este link expira em 1 hora. Ignore esta mensagem se não fez a solicitação.</p>`,
  };
}
