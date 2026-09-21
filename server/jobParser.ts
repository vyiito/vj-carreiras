import * as cheerio from 'cheerio';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { detectSkills } from './analysis.js';

const clean = (value: string) => value.replace(/\s+/g, ' ').trim();

type ImportQuality = {
  score: number;
  level: 'alta' | 'média' | 'baixa';
  source: string;
  warnings: string[];
};

function isPrivateAddress(address: string) {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  const normalized = address.toLowerCase();
  return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
}

async function safeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Use um link HTTP ou HTTPS válido.');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') {
    throw new Error('Esse endereço não pode ser importado.');
  }
  const addresses = await lookup(host, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('Esse endereço não pode ser importado.');
  }
  return url;
}

function findJobPosting(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJobPosting(item);
      if (found) return found;
    }
    return undefined;
  }

  const entry = value as Record<string, unknown>;
  const type = entry['@type'];
  if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) return entry;

  for (const nested of Object.values(entry)) {
    const found = findJobPosting(nested);
    if (found) return found;
  }
  return undefined;
}

function addressFromPosting(posting?: Record<string, unknown>) {
  const jobLocation = posting?.jobLocation;
  const locations = Array.isArray(jobLocation) ? jobLocation : jobLocation ? [jobLocation] : [];
  const parts: string[] = [];

  for (const location of locations) {
    if (!location || typeof location !== 'object') continue;
    const address = (location as Record<string, unknown>).address;
    if (!address || typeof address !== 'object') continue;
    const value = address as Record<string, unknown>;
    const city = String(value.addressLocality || '').trim();
    const region = String(value.addressRegion || '').trim();
    const countryValue = value.addressCountry;
    const country = typeof countryValue === 'object' && countryValue
      ? String((countryValue as Record<string, unknown>).name || '')
      : String(countryValue || '');
    const label = [city, region, country].filter(Boolean).join(', ');
    if (label) parts.push(label);
  }

  return [...new Set(parts)].join(' / ');
}

function stripNoise($: cheerio.CheerioAPI) {
  $('script, style, noscript, nav, footer, header, aside, form, iframe, svg, canvas').remove();
  [
    '[class*="cookie"]',
    '[id*="cookie"]',
    '[class*="consent"]',
    '[id*="consent"]',
    '[class*="banner"]',
    '[class*="related-job"]',
    '[class*="similar-job"]',
    '[class*="recommended-job"]',
    '[class*="job-list"]',
    '[class*="jobs-list"]',
    '[aria-label*="cookie" i]',
  ].forEach((selector) => $(selector).remove());
}

function textFromHtml(value: string) {
  const fragment = cheerio.load(`<div>${value}</div>`);
  stripNoise(fragment);
  return clean(fragment.root().text());
}

function qualityFor(description: string, source: string, title: string, company: string): ImportQuality {
  let score = source === 'JobPosting' ? 92 : source === 'seletor específico' ? 80 : 62;
  const warnings: string[] = [];
  const lower = description.toLowerCase();

  if (description.length >= 900) score += 5;
  else if (description.length < 350) {
    score -= 24;
    warnings.push('A descrição encontrada é curta; revise antes de salvar.');
  }

  const noiseTerms = [
    'privacy policy',
    'política de privacidade',
    'cookie',
    'all jobs',
    'todas as vagas',
    'related jobs',
    'vagas relacionadas',
    'sign in',
    'entrar na conta',
  ];
  const noisy = noiseTerms.filter((term) => lower.includes(term));
  if (noisy.length) {
    score -= Math.min(24, noisy.length * 6);
    warnings.push('A página contém sinais de navegação/rodapé misturados à vaga.');
  }

  if (!title) {
    score -= 15;
    warnings.push('O cargo não foi identificado com confiança.');
  }
  if (!company) {
    score -= 10;
    warnings.push('A empresa não foi identificada com confiança.');
  }

  score = Math.max(0, Math.min(100, score));
  return {
    score,
    level: score >= 80 ? 'alta' : score >= 55 ? 'média' : 'baixa',
    source,
    warnings,
  };
}

function pickDescription($: cheerio.CheerioAPI, posting?: Record<string, unknown>) {
  if (posting?.description) {
    const description = textFromHtml(String(posting.description)).slice(0, 25000);
    if (description.length >= 80) return { description, source: 'JobPosting' };
  }

  const selectors = [
    '[data-automation-id="jobPostingDescription"]',
    '[data-testid*="job-description" i]',
    '[data-testid*="description" i]',
    '#job-description',
    '#jobDescription',
    '.job-description',
    '.jobDescription',
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[itemprop="description"]',
    'main article',
    'article',
    'main',
  ];

  const candidates = selectors
    .map((selector, index) => {
      const node = $(selector).first().clone();
      if (!node.length) return null;
      const fragment = cheerio.load(`<div>${node.html() || ''}</div>`);
      stripNoise(fragment);
      const text = clean(fragment.root().text()).slice(0, 25000);
      if (text.length < 80) return null;
      let score = Math.min(10000, text.length);
      if (index < 9) score += 12000;
      return { text, score, specific: index < 9 };
    })
    .filter((item): item is { text: string; score: number; specific: boolean } => Boolean(item))
    .sort((a, b) => b.score - a.score);

  if (candidates[0]) {
    return {
      description: candidates[0].text,
      source: candidates[0].specific ? 'seletor específico' : 'conteúdo principal',
    };
  }

  return { description: '', source: 'não identificado' };
}

export async function parseJobUrl(rawUrl: string) {
  let url = await safeUrl(rawUrl);
  let response: Response | undefined;
  for (let redirect = 0; redirect < 5; redirect += 1) {
    response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; VJCarreiras/1.1; +https://github.com/vyiito/vj-carreiras)',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get('location');
    if (!location) break;
    url = await safeUrl(new URL(location, url).toString());
  }
  if (!response) throw new Error('Não foi possível acessar a vaga.');
  if (!response.ok) throw new Error(`A página respondeu com status ${response.status}. Cole o texto da vaga para continuar.`);
  const html = await response.text();
  const $ = cheerio.load(html);

  let posting: Record<string, unknown> | undefined;
  $('script[type="application/ld+json"]').each((_, element) => {
    if (posting) return;
    try {
      posting = findJobPosting(JSON.parse($(element).text()));
    } catch { /* páginas frequentemente têm JSON-LD inválido */ }
  });

  const org = posting?.hiringOrganization as { name?: string } | undefined;
  const title = clean(String(
    posting?.title
      || $('meta[property="og:title"]').attr('content')
      || $('[data-automation-id="jobPostingHeader"] h1').first().text()
      || $('h1').first().text()
      || $('title').text(),
  ));
  const company = clean(String(
    org?.name
      || $('[data-automation-id="company"]').first().text()
      || $('[class*="company"]').first().text()
      || url.hostname.replace(/^www\./, ''),
  ));
  const location = clean(String(
    addressFromPosting(posting)
      || $('[data-automation-id="locations"]').first().text()
      || $('[class*="location"]').first().text(),
  )).slice(0, 120);

  const picked = pickDescription($, posting);
  const description = picked.description;
  if (!title || description.length < 80) {
    throw new Error('Não consegui ler conteúdo suficiente da vaga. Cole a descrição para continuar.');
  }

  const importQuality = qualityFor(description, picked.source, title, company);

  return {
    url: url.toString(),
    title: title.slice(0, 180),
    company: company.slice(0, 120),
    location,
    description,
    requirements: detectSkills(description),
    importQuality,
  };
}
