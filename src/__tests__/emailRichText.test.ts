import { describe, expect, it } from "vitest";
import { parseInline, parseRichText, toggleWrap } from "@/lib/email-templates/richText";

const seg = (text: string, f: Partial<{ bold: boolean; italic: boolean; underline: boolean }> = {}) => ({
  text,
  bold: !!f.bold,
  italic: !!f.italic,
  underline: !!f.underline,
});

describe("parseInline", () => {
  it("texte brut", () => {
    expect(parseInline("Bonjour")).toEqual([seg("Bonjour")]);
  });
  it("gras, italique, souligné", () => {
    expect(parseInline("a **b** *c* __d__")).toEqual([
      seg("a "),
      seg("b", { bold: true }),
      seg(" "),
      seg("c", { italic: true }),
      seg(" "),
      seg("d", { underline: true }),
    ]);
  });
  it("styles combinés", () => {
    expect(parseInline("***x***")).toEqual([seg("x", { bold: true, italic: true })]);
    expect(parseInline("**__x__**")).toEqual([seg("x", { bold: true, underline: true })]);
  });
  it("marqueur non fermé reste littéral", () => {
    expect(parseInline("taille 4* dispo")).toEqual([seg("taille 4* dispo")]);
    expect(parseInline("**ouvert")).toEqual([seg("**ouvert")]);
  });
  it("le HTML reste du texte", () => {
    expect(parseInline("<b>x</b>")).toEqual([seg("<b>x</b>")]);
  });
});

describe("parseRichText", () => {
  it("paragraphes et retours à la ligne", () => {
    expect(parseRichText("l1\nl2\n\n\np2")).toEqual([[[seg("l1")], [seg("l2")]], [[seg("p2")]]]);
  });
});

describe("toggleWrap", () => {
  it("entoure la sélection", () => {
    expect(toggleWrap("un mot ici", 3, 6, "**")).toEqual({ value: "un **mot** ici", start: 5, end: 8 });
  });
  it("retire les marqueurs autour de la sélection", () => {
    expect(toggleWrap("un **mot** ici", 5, 8, "**")).toEqual({ value: "un mot ici", start: 3, end: 6 });
  });
  it("retire les marqueurs inclus dans la sélection", () => {
    expect(toggleWrap("un __mot__ ici", 3, 10, "__")).toEqual({ value: "un mot ici", start: 3, end: 6 });
  });
  it("sélection vide : insère la paire et place le curseur au milieu", () => {
    expect(toggleWrap("ab", 1, 1, "*")).toEqual({ value: "a**b", start: 2, end: 2 });
  });
});
