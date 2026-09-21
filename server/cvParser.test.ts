import { describe, expect, it } from 'vitest';
import { parseCvText } from './cvParser.js';

describe('CV parser', () => {
  it('extracts profile skills and experience blocks', () => {
    const preview = parseCvText(`
      Ana Silva
      Technical Artist
      São Paulo, Brasil
      ana@email.com

      Experiência Profissional
      Estúdio Aurora
      3D Artist
      Jan 2022 - Atual
      Criação de modelos hard surface com Blender, Substance Painter e Unreal Engine.

      Formação
      Design de Games
    `);
    expect(preview.name).toBe('Ana Silva');
    expect(preview.headline).toBe('Technical Artist');
    expect(preview.skills).toEqual(expect.arrayContaining(['Blender', 'Substance Painter', 'Unreal Engine', 'Hard Surface']));
    expect(preview.experiences[0]).toMatchObject({ company: 'Estúdio Aurora', role: '3D Artist' });
  });
});
