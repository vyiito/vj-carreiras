import { describe, expect, it } from 'vitest';
import { analyzeCareer, detectSkills } from './analysis.js';

describe('career analysis', () => {
  it('detects canonical skills from free text', () => {
    expect(detectSkills('Trabalhei com React, TypeScript, PostgreSQL e Docker')).toEqual(
      expect.arrayContaining(['React', 'TypeScript', 'SQL', 'Docker']),
    );
  });

  it('prioritizes repeated gaps and calculates match', () => {
    const analysis = analyzeCareer({
      profileSkills: ['React'],
      experiences: [],
      jobs: [
        { id: '1', title: 'Frontend', company: 'A', description: 'React TypeScript Docker', requirements: [] },
        { id: '2', title: 'Frontend', company: 'B', description: 'React TypeScript', requirements: [] },
      ],
    });
    expect(analysis.matchScore).toBeGreaterThan(0);
    expect(analysis.gaps[0].skill).toBe('TypeScript');
    expect(analysis.gaps[0].priority).toBe('crítica');
  });
});

