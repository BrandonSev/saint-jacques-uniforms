import { describe, it, expect } from "vitest";
import {
  currentSchoolYear,
  nextLevel,
  sectionForLevel,
  isClasseConfirmedForCurrentYear,
  classesBySection,
  LEVELS,
} from "@/lib/schoolYear";

describe("schoolYear / currentSchoolYear", () => {
  it("bascule le 1er juillet", () => {
    expect(currentSchoolYear(new Date("2026-06-30T12:00:00"))).toBe("2025/2026");
    expect(currentSchoolYear(new Date("2026-07-01T00:00:00"))).toBe("2026/2027");
  });

  it("reste sur l'année de la rentrée pendant toute la période scolaire", () => {
    expect(currentSchoolYear(new Date("2026-09-02T08:00:00"))).toBe("2026/2027");
    expect(currentSchoolYear(new Date("2027-01-15T08:00:00"))).toBe("2026/2027");
    expect(currentSchoolYear(new Date("2027-06-15T08:00:00"))).toBe("2026/2027");
  });
});

describe("schoolYear / nextLevel", () => {
  it("progresse d'un cran dans la chaîne des niveaux", () => {
    expect(nextLevel("PS")).toEqual({ classe: "MS", section: "Maternelle" });
    expect(nextLevel("GS")).toEqual({ classe: "CP", section: "Élémentaire" });
    expect(nextLevel("CM1")).toEqual({ classe: "CM2", section: "Collège" });
    expect(nextLevel("4e")).toEqual({ classe: "3e", section: "Lycée" });
  });

  it("renvoie null pour Terminale (sortie du lycée)", () => {
    expect(nextLevel("Terminale")).toBeNull();
  });

  it("renvoie null pour un niveau inconnu", () => {
    expect(nextLevel("")).toBeNull();
    expect(nextLevel("CPGE")).toBeNull();
  });

  it("couvre toute la chaîne sans trou jusqu'à Terminale", () => {
    let cur: string | null = "PS";
    const seen: string[] = [];
    while (cur) {
      seen.push(cur);
      cur = nextLevel(cur)?.classe ?? null;
    }
    expect(seen).toEqual(LEVELS.map((l) => l.classe));
  });
});

describe("schoolYear / sectionForLevel", () => {
  it("rattache CM2 à Collège (mapping historique)", () => {
    expect(sectionForLevel("CM2")).toBe("Collège");
    expect(sectionForLevel("CM1")).toBe("Élémentaire");
  });

  it("renvoie null pour un niveau inconnu", () => {
    expect(sectionForLevel("xyz")).toBeNull();
  });
});

describe("schoolYear / classesBySection", () => {
  it("dérive les classes de LEVELS", () => {
    expect(classesBySection.Maternelle).toEqual(["PS", "MS", "GS"]);
    expect(classesBySection["Élémentaire"]).toEqual(["CP", "CE1", "CE2", "CM1"]);
    expect(classesBySection["Collège"]).toEqual(["CM2", "6e", "5e", "4e"]);
    expect(classesBySection["Lycée"]).toEqual(["3e", "2nde", "1re", "Terminale"]);
  });
});

describe("schoolYear / isClasseConfirmedForCurrentYear", () => {
  const now = new Date("2026-09-01T08:00:00");
  it("true seulement si l'année confirmée correspond à l'année courante", () => {
    expect(isClasseConfirmedForCurrentYear("2026/2027", now)).toBe(true);
    expect(isClasseConfirmedForCurrentYear("2025/2026", now)).toBe(false);
    expect(isClasseConfirmedForCurrentYear(null, now)).toBe(false);
    expect(isClasseConfirmedForCurrentYear(undefined, now)).toBe(false);
    expect(isClasseConfirmedForCurrentYear("", now)).toBe(false);
  });
});
