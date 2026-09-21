import { describe, expect, it } from "vitest";
import { analyzeCareer, detectSkills } from "./analysis.js";

describe("career analysis", () => {
  it("detects canonical skills from free text", () => {
    expect(
      detectSkills("Trabalhei com React, TypeScript, PostgreSQL e Docker"),
    ).toEqual(expect.arrayContaining(["React", "TypeScript", "SQL", "Docker"]));
  });


  it("does not detect short aliases inside unrelated words", () => {
    expect(detectSkills("aprender mais")).not.toContain("Machine Learning");
    expect(detectSkills("HTML")).not.toContain("Machine Learning");
    expect(detectSkills("Benefits")).not.toContain("TypeScript");
    expect(detectSkills("javascript and APIs")).toEqual(
      expect.arrayContaining(["JavaScript", "APIs REST"]),
    );
  });

  it("prioritizes repeated gaps and calculates match", () => {
    const analysis = analyzeCareer({
      profileSkills: ["React"],
      experiences: [],
      jobs: [
        {
          id: "1",
          title: "Frontend",
          company: "A",
          description: "React TypeScript Docker",
          requirements: [],
        },
        {
          id: "2",
          title: "Frontend",
          company: "B",
          description: "React TypeScript",
          requirements: [],
        },
      ],
    });
    expect(analysis.matchScore).toBeGreaterThan(0);
    expect(analysis.gaps[0].skill).toBe("TypeScript");
    expect(analysis.gaps[0].priority).toBe("crítica");
  });

  it("classifies required skills and keeps the source excerpt", () => {
    const analysis = analyzeCareer({
      profileSkills: [],
      experiences: [],
      jobs: [
        {
          id: "1",
          title: "3D Artist",
          company: "Studio",
          description:
            "É obrigatório ter domínio de Blender. Unreal Engine será um diferencial.",
          requirements: [],
        },
      ],
    });
    const blender = analysis.signals.find(
      (signal) => signal.skill === "Blender",
    );
    const unreal = analysis.signals.find(
      (signal) => signal.skill === "Unreal Engine",
    );
    expect(blender).toMatchObject({
      requirementType: "obrigatório",
      category: "Ferramenta",
      weight: 5,
    });
    expect(blender?.evidenceDetails[0].excerpt).toContain("Blender");
    expect(unreal?.requirementType).toBe("diferencial");
  });
});
