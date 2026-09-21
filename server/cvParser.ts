import mammoth from 'mammoth';
import { createRequire } from 'node:module';
import { detectSkills } from './analysis.js';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse/lib/pdf-parse.js') as (buffer: Buffer) => Promise<{ text: string }>;

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

const sectionPattern = /^(experi[eê]ncia(?: profissional)?|experience|hist[oó]rico profissional|forma[cç][aã]o|education|compet[eê]ncias|skills|projetos?|projects?|idiomas?|languages?)\s*:?[\s]*$/i;
const experienceSectionPattern = /^(experi[eê]ncia(?: profissional)?|experience|hist[oó]rico profissional)\s*:?[\s]*$/i;
const dateRangePattern = /(?:jan(?:eiro|uary)?|fev(?:ereiro)?|feb(?:ruary)?|mar(?:[cç]o|ch)?|abr(?:il)?|apr(?:il)?|mai(?:o)?|may|jun(?:ho|e)?|jul(?:ho|y)?|ago(?:sto)?|aug(?:ust)?|set(?:embro)?|sep(?:tember)?|out(?:ubro)?|oct(?:ober)?|nov(?:embro|ember)?|dez(?:embro)?|dec(?:ember)?|\d{1,2})?[\s./-]*(?:19|20)\d{2}\s*(?:[-–—]|a|to)\s*(?:atual|presente|present|current|(?:jan(?:eiro|uary)?|fev(?:ereiro)?|feb(?:ruary)?|mar(?:[cç]o|ch)?|abr(?:il)?|apr(?:il)?|mai(?:o)?|may|jun(?:ho|e)?|jul(?:ho|y)?|ago(?:sto)?|aug(?:ust)?|set(?:embro)?|sep(?:tember)?|out(?:ubro)?|oct(?:ober)?|nov(?:embro|ember)?|dez(?:embro)?|dec(?:ember)?|\d{1,2})?[\s./-]*(?:19|20)\d{2})/i;

function cleanText(value: string) {
  return value
    .replace(/\u0000/g, '')
    .replace(/\r/g, '')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function extractCvText(file: Express.Multer.File) {
  const extension = file.originalname.toLowerCase().split('.').pop();
  if (extension === 'pdf' || file.mimetype === 'application/pdf') {
    return cleanText((await pdf(file.buffer)).text);
  }
  if (extension === 'docx' || file.mimetype.includes('wordprocessingml')) {
    return cleanText((await mammoth.extractRawText({ buffer: file.buffer })).value);
  }
  if (extension === 'txt' || file.mimetype.startsWith('text/')) {
    return cleanText(file.buffer.toString('utf8'));
  }
  throw new Error('Formato não suportado. Envie um currículo em PDF, DOCX ou TXT.');
}

function splitDateRange(value: string) {
  const parts = value.split(/\s+(?:[-–—]|a|to)\s+/i);
  return { startDate: parts[0]?.trim() || '', endDate: parts.slice(1).join(' ').trim() || '' };
}

function looksLikeContact(value: string) {
  return /@|linkedin|github|https?:|www\.|\+?\d[\d\s()+-]{7,}/i.test(value);
}

export function parseCvText(rawText: string): CvPreview {
  const text = cleanText(rawText);
  const lines = text.split('\n').map((line) => line.replace(/^[•●▪◦*-]\s*/, '').trim()).filter(Boolean);
  const experienceHeader = lines.findIndex((line) => experienceSectionPattern.test(line));
  const experienceEnd = experienceHeader >= 0
    ? lines.findIndex((line, index) => index > experienceHeader && sectionPattern.test(line))
    : -1;
  const experienceLines = experienceHeader >= 0
    ? lines.slice(experienceHeader + 1, experienceEnd > experienceHeader ? experienceEnd : undefined)
    : lines;

  const experiences: CvPreview['experiences'] = [];
  experienceLines.forEach((line, index) => {
    const match = line.match(dateRangePattern);
    if (!match) return;
    const previous = experienceLines.slice(Math.max(0, index - 2), index).filter((item) => !sectionPattern.test(item));
    if (!previous.length) return;
    const nextDateIndex = experienceLines.findIndex((candidate, candidateIndex) => candidateIndex > index && dateRangePattern.test(candidate));
    const blockEnd = nextDateIndex > index ? nextDateIndex - 2 : Math.min(experienceLines.length, index + 7);
    const descriptionLines = experienceLines.slice(index + 1, Math.max(index + 1, blockEnd)).filter((item) => !sectionPattern.test(item));
    const role = previous.at(-1) || '';
    const company = previous.length > 1 ? previous.at(-2)! : 'Empresa não identificada';
    if (experiences.some((item) => item.role === role && item.company === company)) return;
    const dates = splitDateRange(match[0]);
    const description = descriptionLines.join(' ').slice(0, 3000);
    experiences.push({
      role: role.slice(0, 120),
      company: company.slice(0, 120),
      ...dates,
      description,
      skills: detectSkills(`${role} ${description}`),
    });
  });

  const firstContentLines = lines.filter((line) => !looksLikeContact(line) && !sectionPattern.test(line)).slice(0, 6);
  const name = firstContentLines.find((line) => line.length >= 3 && line.length <= 80) || '';
  const headline = firstContentLines.find((line) => line !== name && line.length <= 120) || '';
  const location = lines.find((line) => /(?:São Paulo|Rio de Janeiro|Belo Horizonte|Curitiba|Porto Alegre|Brasília|Brazil|Brasil|remoto|remote)/i.test(line) && line.length < 100) || '';

  return {
    name,
    headline,
    location,
    bio: lines.filter((line) => !sectionPattern.test(line) && !looksLikeContact(line)).slice(1, 6).join(' ').slice(0, 800),
    skills: detectSkills(text),
    experiences: experiences.slice(0, 8),
    sourceText: text.slice(0, 30000),
  };
}
