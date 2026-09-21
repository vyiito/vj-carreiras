import * as cheerio from 'cheerio';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { detectSkills } from './analysis.js';

const clean = (value: string) => value.replace(/\s+/g, ' ').trim();

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

export async function parseJobUrl(rawUrl: string) {
  let url = await safeUrl(rawUrl);
  let response: Response | undefined;
  for (let redirect = 0; redirect < 5; redirect += 1) {
    response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; VJCarreiras/1.0)' },
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
    try {
      const parsed = JSON.parse($(element).text());
      const entries = Array.isArray(parsed) ? parsed : parsed['@graph'] ? parsed['@graph'] : [parsed];
      posting = entries.find((entry: Record<string, unknown>) => entry['@type'] === 'JobPosting') ?? posting;
    } catch { /* páginas frequentemente têm JSON-LD inválido */ }
  });

  const org = posting?.hiringOrganization as { name?: string } | undefined;
  const title = clean(String(posting?.title || $('meta[property="og:title"]').attr('content') || $('h1').first().text() || $('title').text()));
  const company = clean(String(org?.name || $('[class*="company"]').first().text() || url.hostname.replace(/^www\./, '')));
  const rawDescription = String(posting?.description || $('main').text() || $('article').text() || $('body').text());
  const description = clean(cheerio.load(`<div>${rawDescription}</div>`).text()).slice(0, 20000);
  if (!title || description.length < 80) throw new Error('Não consegui ler conteúdo suficiente. Cole a descrição da vaga para continuar.');

  return {
    url: url.toString(),
    title: title.slice(0, 180),
    company: company.slice(0, 120),
    location: '',
    description,
    requirements: detectSkills(description),
  };
}
