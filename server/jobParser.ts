import * as cheerio from 'cheerio';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { detectSkills } from './analysis.js';

const clean = (value: string) => value.replace(/\s+/g, ' ').trim();
const browserHeaders = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
  'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
};

type ImportQuality = {
  score: number;
  level: 'alta' | 'média' | 'baixa';
  source: string;
  warnings: string[];
};

type DescriptionCandidate = {
  text: string;
  score: number;
  source: string;
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

async function fetchDirectPage(initialUrl: URL) {
  let url = initialUrl;
  let response: Response | undefined;
  for (let redirect = 0; redirect < 5; redirect += 1) {
    response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(12000),
      headers: browserHeaders,
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get('location');
    if (!location) break;
    url = await safeUrl(new URL(location, url).toString());
  }
  return { response, url };
}

async function fetchReaderFallback(url: URL) {
  try {
    const response = await fetch(`https://r.jina.ai/${url.toString()}`, {
      signal: AbortSignal.timeout(15000),
      headers: {
        accept: 'text/plain,text/markdown;q=0.9,*/*;q=0.8',
        'user-agent': browserHeaders['user-agent'],
      },
    });
    if (!response.ok) return '';
    return (await response.text()).slice(0, 120000);
  } catch {
    return '';
  }
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

function candidateScore(text: string, key = '') {
  const normalizedKey = key.toLowerCase();
  let score = Math.min(12000, text.length);
  if (/job.?description|description|responsibil|qualif|requirement|about.?role|about.?job|content|body/.test(normalizedKey)) {
    score += 16000;
  }
  if (/benefit|privacy|cookie|footer|navigation|header|related/.test(normalizedKey)) {
    score -= 10000;
  }
  const lower = text.toLowerCase();
  if (/responsibilit|responsabilidades|qualifica|requirements|requisitos|what you.?ll do|o que você fará/.test(lower)) {
    score += 5000;
  }
  return score;
}

function collectJsonText(
  value: unknown,
  candidates: DescriptionCandidate[],
  key = '',
  depth = 0,
) {
  if (depth > 12 || candidates.length > 500) return;
  if (typeof value === 'string') {
    const text = textFromHtml(value);
    if (text.length >= 80) {
      candidates.push({
        text: text.slice(0, 25000),
        score: candidateScore(text, key),
        source: 'dados estruturados da página',
      });
    }
    return;
  }
  if (!value || typeof value !== 'object') return;

  if (Array.isArray(value)) {
    for (const item of value) collectJsonText(item, candidates, key, depth + 1);
    return;
  }

  for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
    collectJsonText(childValue, candidates, childKey, depth + 1);
  }
}

function embeddedCandidates($: cheerio.CheerioAPI) {
  const candidates: DescriptionCandidate[] = [];
  $('script').each((_, element) => {
    const type = ($(element).attr('type') || '').toLowerCase();
    const id = ($(element).attr('id') || '').toLowerCase();
    if (
      !type.includes('json')
      && id !== '__next_data__'
      && id !== '__nuxt_data__'
      && !id.includes('apollo')
    ) return;

    const raw = $(element).text().trim();
    if (!raw || raw.length > 2_000_000) return;
    try {
      collectJsonText(JSON.parse(raw), candidates);
    } catch {
      // Alguns sites guardam JSON parcial/serializado; o fallback de DOM/leitor cobre esses casos.
    }
  });
  return candidates;
}

function qualityFor(description: string, source: string, title: string, company: string): ImportQuality {
  let score =
    source === 'JobPosting'
      ? 94
      : source === 'seletor específico'
        ? 84
        : source === 'dados estruturados da página'
          ? 78
          : source === 'leitor alternativo'
            ? 72
            : 58;
  const warnings: string[] = [];
  const lower = description.toLowerCase();

  if (description.length >= 900) score += 5;
  else if (description.length < 350) {
    score -= 22;
    warnings.push('A página forneceu pouco texto; confira a prévia antes de salvar.');
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
    warnings.push('Foram encontrados sinais de conteúdo externo à descrição da vaga.');
  }

  if (!title) {
    score -= 15;
    warnings.push('O cargo não foi identificado com confiança.');
  }
  if (!company) {
    score -= 10;
    warnings.push('A empresa não foi identificada com confiança.');
  }

  if (source === 'leitor alternativo') {
    warnings.push('A página original é dinâmica ou restringe leitura automática; usamos uma leitura alternativa do mesmo link.');
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
  const candidates: DescriptionCandidate[] = [];

  if (posting?.description) {
    const description = textFromHtml(String(posting.description)).slice(0, 25000);
    if (description.length >= 80) {
      candidates.push({ description, text: description, score: 40000 + description.length, source: 'JobPosting' } as DescriptionCandidate & { description: string });
    }
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
    '[class*="description"]',
    '[id*="description"]',
    'main article',
    'article',
    'main',
  ];

  selectors.forEach((selector, index) => {
    $(selector).slice(0, 4).each((_, element) => {
      const node = $(element).clone();
      const fragment = cheerio.load(`<div>${node.html() || ''}</div>`);
      stripNoise(fragment);
      const text = clean(fragment.root().text()).slice(0, 25000);
      if (text.length < 80) return;
      const specific = index < 12;
      candidates.push({
        text,
        score: candidateScore(text, selector) + (specific ? 10000 : 0),
        source: specific ? 'seletor específico' : 'conteúdo principal',
      });
    });
  });

  candidates.push(...embeddedCandidates($));

  const body = $('body').clone();
  if (body.length) {
    const fragment = cheerio.load(`<div>${body.html() || ''}</div>`);
    stripNoise(fragment);
    const text = clean(fragment.root().text()).slice(0, 25000);
    if (text.length >= 120) {
      candidates.push({
        text,
        score: candidateScore(text, 'body') - 4000,
        source: 'conteúdo principal',
      });
    }
  }

  const best = candidates
    .filter((item) => item.text.length >= 80)
    .sort((a, b) => b.score - a.score)[0];

  return best
    ? { description: best.text, source: best.source }
    : { description: '', source: 'não identificado' };
}

function parseReader(readerText: string) {
  if (!readerText) return { title: '', description: '' };
  const lines = readerText.split(/\r?\n/);
  const title =
    clean(lines.find((line) => /^title:/i.test(line))?.replace(/^title:\s*/i, '') || '');
  const marker = lines.findIndex((line) => /^markdown content:/i.test(line));
  const body = (marker >= 0 ? lines.slice(marker + 1) : lines)
    .join('\n')
    .replace(/^URL Source:.*$/gim, '')
    .replace(/^Published Time:.*$/gim, '')
    .replace(/^Title:.*$/gim, '');
  const description = clean(body).slice(0, 25000);
  return { title, description };
}

export async function parseJobUrl(rawUrl: string) {
  const initialUrl = await safeUrl(rawUrl);
  const { response, url } = await fetchDirectPage(initialUrl);

  let html = '';
  if (response?.ok) {
    html = (await response.text()).slice(0, 2_000_000);
  }

  let posting: Record<string, unknown> | undefined;
  let $ = cheerio.load(html || '<html></html>');

  if (html) {
    $('script[type="application/ld+json"]').each((_, element) => {
      if (posting) return;
      try {
        posting = findJobPosting(JSON.parse($(element).text()));
      } catch {
        // JSON-LD inválido é comum em sites de carreira.
      }
    });
  }

  const org = posting?.hiringOrganization as { name?: string } | undefined;
  let title = clean(String(
    posting?.title
      || $('meta[property="og:title"]').attr('content')
      || $('meta[name="twitter:title"]').attr('content')
      || $('[data-automation-id="jobPostingHeader"] h1').first().text()
      || $('h1').first().text()
      || $('title').text(),
  ));
  const company = clean(String(
    org?.name
      || $('meta[property="og:site_name"]').attr('content')
      || $('[data-automation-id="company"]').first().text()
      || $('[class*="company"]').first().text()
      || url.hostname.replace(/^www\./, ''),
  ));
  const location = clean(String(
    addressFromPosting(posting)
      || $('[data-automation-id="locations"]').first().text()
      || $('[class*="location"]').first().text(),
  )).slice(0, 120);

  let picked = pickDescription($, posting);

  if (picked.description.length < 80) {
    const reader = parseReader(await fetchReaderFallback(url));
    if (reader.description.length >= 80) {
      if (!title && reader.title) title = reader.title;
      picked = { description: reader.description, source: 'leitor alternativo' };
    }
  }

  if (picked.description.length < 80) {
    const metaDescription = clean(String(
      $('meta[name="description"]').attr('content')
        || $('meta[property="og:description"]').attr('content')
        || '',
    ));
    if (metaDescription.length >= 20) {
      picked = {
        description: metaDescription,
        source: 'metadados da página',
      };
    }
  }

  if (!title) {
    title = clean(new URL(url).pathname.split('/').filter(Boolean).pop()?.replace(/[-_]+/g, ' ') || 'Vaga importada');
  }

  if (picked.description.length < 20) {
    throw new Error('Não consegui acessar o conteúdo dessa vaga automaticamente pelo link. O site bloqueou tanto a leitura direta quanto a leitura alternativa. Tente o mesmo link novamente mais tarde ou use o link oficial da página da vaga.');
  }

  const importQuality = qualityFor(picked.description, picked.source, title, company);

  return {
    url: url.toString(),
    title: title.slice(0, 180),
    company: company.slice(0, 120),
    location,
    description: picked.description,
    requirements: detectSkills(picked.description),
    importQuality,
  };
}
