# VJ Carreiras

Planejador de carreira orientado por vagas reais. O produto reúne oportunidades-alvo, compara os padrões do mercado com o histórico profissional do usuário e transforma as lacunas em um plano semanal.

## O que já funciona

- Cadastro, login e sessão segura por cookie HTTP-only
- Perfil com direção profissional, competências e empresas-alvo
- Importação de currículo em PDF, DOCX ou TXT, com revisão antes de preencher o perfil
- Histórico de experiências usado como evidência
- Importação de vagas por URL com leitura de `JobPosting` (JSON-LD) e fallback por conteúdo
- Cadastro manual para páginas que bloqueiam leitura automatizada
- Extração e normalização de competências
- Score de aderência, forças, lacunas e evidências por vaga
- Plano de ação semanal com acompanhamento de progresso
- Interface responsiva em português

## Desenvolvimento local

Requisitos: Node.js 20+ e PostgreSQL.

```bash
cp .env.example .env
npm install
npm run dev
```

Em outro terminal, execute o Vite:

```bash
npm run dev:client
```

O servidor cria as tabelas necessárias ao iniciar.

## Validação

```bash
npm run check
npm test
npm run build
```

## Render

O arquivo `render.yaml` provisiona o serviço web e o PostgreSQL. A configuração gratuita é adequada para avaliação; para operação realmente contínua, altere os planos após confirmar os custos atuais no Render.

A evolução planejada do Career OS está documentada em [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md).

Use o Blueprint em:

```text
https://dashboard.render.com/blueprint/new
```
