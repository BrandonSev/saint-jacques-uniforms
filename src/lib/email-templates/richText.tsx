import * as React from "react";

/**
 * Mise en forme minimale des emails composés dans l'admin :
 *   **gras**   *italique*   __souligné__
 * Les paragraphes sont séparés par une ligne vide, un simple retour à la
 * ligne devient un <br />. Aucun HTML n'est interprété : le texte saisi est
 * toujours rendu comme du texte (pas d'injection possible).
 */

export type RichSegment = { text: string; bold: boolean; italic: boolean; underline: boolean };

type Marker = "**" | "*" | "__";
type Token = { kind: "text"; text: string } | { kind: "marker"; marker: Marker; matched?: boolean };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let buf = "";
  for (let i = 0; i < input.length; ) {
    const two = input.slice(i, i + 2);
    const marker: Marker | null = two === "**" ? "**" : two === "__" ? "__" : input[i] === "*" ? "*" : null;
    if (marker) {
      if (buf) tokens.push({ kind: "text", text: buf });
      buf = "";
      tokens.push({ kind: "marker", marker });
      i += marker.length;
    } else {
      buf += input[i];
      i++;
    }
  }
  if (buf) tokens.push({ kind: "text", text: buf });
  return tokens;
}

/** Découpe une ligne en segments stylés. Un marqueur sans fermeture reste du texte. */
export function parseInline(input: string): RichSegment[] {
  const tokens = tokenize(input);
  // Appariement : chaque marqueur ouvrant est fermé par le prochain marqueur de même type.
  const open: Partial<Record<Marker, number>> = {};
  tokens.forEach((t, idx) => {
    if (t.kind !== "marker") return;
    const o = open[t.marker];
    if (o === undefined) {
      open[t.marker] = idx;
    } else {
      (tokens[o] as Extract<Token, { kind: "marker" }>).matched = true;
      t.matched = true;
      delete open[t.marker];
    }
  });

  const segments: RichSegment[] = [];
  const state = { bold: false, italic: false, underline: false };
  const push = (text: string) => {
    if (!text) return;
    const last = segments[segments.length - 1];
    if (last && last.bold === state.bold && last.italic === state.italic && last.underline === state.underline) {
      last.text += text;
    } else {
      segments.push({ text, ...state });
    }
  };
  for (const t of tokens) {
    if (t.kind === "text") push(t.text);
    else if (!t.matched) push(t.marker);
    else if (t.marker === "**") state.bold = !state.bold;
    else if (t.marker === "*") state.italic = !state.italic;
    else state.underline = !state.underline;
  }
  return segments;
}

/** Paragraphes (séparés par une ligne vide) -> lignes -> segments. */
export function parseRichText(body: string): RichSegment[][][] {
  return (body || "")
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0)
    .map((p) => p.replace(/^\n+|\n+$/g, "").split("\n").map(parseInline));
}

function renderSegment(s: RichSegment, key: number): React.ReactNode {
  let node: React.ReactNode = s.text;
  if (s.underline) node = <u>{node}</u>;
  if (s.italic) node = <em>{node}</em>;
  if (s.bold) node = <strong>{node}</strong>;
  return <React.Fragment key={key}>{node}</React.Fragment>;
}

/** Contenu d'un paragraphe (à placer dans un <Text> / <p>). */
export function renderRichParagraph(lines: RichSegment[][]): React.ReactNode {
  return lines.map((segs, i) => (
    <React.Fragment key={i}>
      {i > 0 ? <br /> : null}
      {segs.map(renderSegment)}
    </React.Fragment>
  ));
}

/**
 * Applique / retire un marqueur autour de la sélection d'un textarea.
 * Retourne la nouvelle valeur et la nouvelle sélection.
 */
export function toggleWrap(
  value: string,
  start: number,
  end: number,
  marker: Marker,
): { value: string; start: number; end: number } {
  const m = marker.length;
  const selected = value.slice(start, end);
  // Sélection incluant déjà les marqueurs : on les retire.
  if (selected.length >= 2 * m && selected.startsWith(marker) && selected.endsWith(marker)) {
    const inner = selected.slice(m, selected.length - m);
    return { value: value.slice(0, start) + inner + value.slice(end), start, end: start + inner.length };
  }
  // Marqueurs juste autour de la sélection : on les retire.
  if (value.slice(start - m, start) === marker && value.slice(end, end + m) === marker) {
    return {
      value: value.slice(0, start - m) + selected + value.slice(end + m),
      start: start - m,
      end: end - m,
    };
  }
  return {
    value: value.slice(0, start) + marker + selected + marker + value.slice(end),
    start: start + m,
    end: end + m,
  };
}
