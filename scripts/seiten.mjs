// Liest die Seiten aus inhalte/seiten/*.md und erzeugt daraus HTML im Stil des WordPress-Themes.
//
// Neben normalem Markdown (Absätze, **fett**, *kursiv*, Listen, [Links](…)) gibt es diese Bausteine.
// Jeder Baustein steht als eigener Absatz (Leerzeile davor und danach):
//
//   ![Beschreibung](/wp-content/uploads/…/bild.jpg)              Bild
//   ![Beschreibung](/wp-content/uploads/…/bild.jpg "rechts 200")  Bild rechts, 200 Pixel breit
//   ![Beschreibung](/wp-content/uploads/…/foto.jpg "daneben")     Bild links, der folgende Text daneben
//   Knopf: [Text](https://…)                                       Knopf (mehrere Zeilen = mehrere Knöpfe)
//   > Text                                                         farbiger Hinweiskasten
//   ---                                                            Trennlinie
//   [[Newsletter-Anmeldung]]                                       Anmeldeformular für den Newsletter
//   ::: kasten  …  :::                                             farbiger Kasten um mehrere Absätze
import markdownIt from "markdown-it";

const NEWSLETTER = `<iframe width="640" height="645" src="https://dd61c51f.sibforms.com/serve/MUIFAJ0ElralhFAb8IrgNpgncgUcI6W68VlabTN6H4y-yA6bPUXgl9Y9YqnuAtb9BHbx61OifbSL2KdCo4CWvIKEX00BR36tPLkMR_FC8JFBtA0dvMNxVYAtlJdR5E0_XvBXAqS2QFgb_6C9LDdneWSpzN_MkTKraUJAJHOz3CXdPxm9q_Cn3bpn3V57_JAtFhuI0_N6Vg-5rGFy" frameborder="0" scrolling="auto" allowfullscreen style="display: block;margin-left: auto;margin-right: auto;max-width: 100%;"></iframe>`;

const BILD = /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/;
const KNOPF = /^Knopf:\s*\[(.+)\]\((\S+)\)$/;

const md = markdownIt({ html: true, breaks: true, linkify: false, typographer: false });
const regel = (name, html) => { md.renderer.rules[name] = () => html; };
md.renderer.rules.paragraph_open = (tokens, idx) => (tokens[idx].hidden ? "" : '<p class="wp-block-paragraph">');
regel("bullet_list_open", '<ul class="wp-block-list">\n');
md.renderer.rules.ordered_list_open = (tokens, idx) => {
  const start = tokens[idx].attrGet("start");
  return `<ol class="wp-block-list"${start && start !== "1" ? ` start="${start}"` : ""}>\n`;
};
md.renderer.rules.heading_open = (tokens, idx) => `<${tokens[idx].tag} class="wp-block-heading">`;
const linkStandard = md.renderer.rules.link_open || ((t, i, o, e, s) => s.renderToken(t, i, o));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  if (/^https?:/.test(tokens[idx].attrGet("href") || "")) {
    tokens[idx].attrSet("target", "_blank");
    tokens[idx].attrSet("rel", "noreferrer noopener");
  }
  return linkStandard(tokens, idx, options, env, self);
};

/** Gender-Sternchen („Trainer*innen“) sollen nicht als Kursiv-Zeichen gelten. */
export function sternchenSchuetzen(text) {
  return text.replace(/(?<=[\p{L}\d])\*(?=\p{L})/gu, (m, pos, s) => (s[pos - 1] === "*" || s[pos + 1] === "*" ? m : "\\*"));
}
export const mdInline = (text) => (text ? md.renderInline(sternchenSchuetzen(String(text))) : "");
const mdBlock = (text) => md.render(sternchenSchuetzen(text));

function bildHtml(alt, src, optionen = "") {
  const o = optionen.split(/\s+/).filter(Boolean);
  const breite = o.find((x) => /^\d+$/.test(x));
  const klassen = ["wp-block-image", "size-full"];
  if (o.includes("rechts")) klassen.push("alignright");
  if (o.includes("links")) klassen.push("alignleft");
  if (o.includes("mitte")) klassen.push("aligncenter");
  if (o.includes("breit")) klassen.push("alignwide");
  if (o.includes("voll")) klassen.push("alignfull");
  if (breite) klassen.push("is-resized");
  if (o.includes("rund")) klassen.push("is-style-rounded", "ki-abgerundet");
  const stile = [];
  if (breite) stile.push(`width:${breite}px`);
  if (o.includes("quer")) stile.push("aspect-ratio:16/9;object-fit:cover");
  const stil = stile.length ? ` style="${stile.join(";")}"` : "";
  return `<figure class="${klassen.join(" ")}"><img src="${src}" alt="${alt.replace(/"/g, "&quot;")}"${stil} /></figure>`;
}

function knoepfeHtml(knoepfe, klasse = "") {
  const k = knoepfe.map(({ text, url }) => {
    const extern = /^https?:/.test(url) ? ' target="_blank" rel="noreferrer noopener"' : "";
    return `<div class="wp-block-button"><a class="wp-block-button__link ${klasse ? klasse + " " : ""}wp-element-button" href="${url}"${extern}>${mdInline(text)}</a></div>`;
  });
  return `<div class="wp-block-buttons is-layout-flex wp-block-buttons-is-layout-flex">\n${k.join("\n")}\n</div>`;
}

/**
 * Zerlegt Markdown in Blöcke (getrennt durch Leerzeilen; Überschriften immer einzeln).
 * Liefert [{ art, nr, … }], art = titel | ueberschrift | bild | knoepfe | linie | newsletter | hinweis | text
 */
export function bloeckeLesen(text) {
  text = text.replace(/<!--[\s\S]*?-->/g, (k) => k.replace(/[^\n]/g, ""));
  const zeilen = text.split(/\r?\n/);
  let i = 0;
  if (zeilen[0]?.trim() === "---") {
    const ende = zeilen.findIndex((z, n) => n > 0 && z.trim() === "---");
    if (ende > 0) i = ende + 1;
  }
  const roh = [];
  for (; i < zeilen.length; i++) {
    const z = zeilen[i];
    if (!z.trim()) { roh.push(null); continue; }
    if (/^#{1,6}\s/.test(z) || /^:::/.test(z.trim())) { roh.push({ zeilen: [z.trim()], nr: i + 1, kopf: true }, null); continue; }
    const letzter = roh.at(-1);
    if (letzter && !letzter.kopf) letzter.zeilen.push(z);
    else roh.push({ zeilen: [z], nr: i + 1 });
  }
  const bloecke = [];
  for (const b of roh.filter(Boolean)) {
    const erste = b.zeilen[0].trim();
    const alle = b.zeilen.map((z) => z.trim());
    let m;
    if (/^:::\s*kasten$/i.test(erste)) bloecke.push({ art: "kasten_auf", nr: b.nr });
    else if (erste === ":::") bloecke.push({ art: "kasten_zu", nr: b.nr });
    else if ((m = erste.match(/^(#{1,6})\s+(.*)$/))) {
      bloecke.push(m[1].length === 1 ? { art: "titel", text: m[2], nr: b.nr } : { art: "ueberschrift", ebene: m[1].length, text: m[2], nr: b.nr });
    } else if (alle.length === 1 && erste === "---") bloecke.push({ art: "linie", nr: b.nr });
    else if (alle.length === 1 && erste === "[[Newsletter-Anmeldung]]") bloecke.push({ art: "newsletter", nr: b.nr });
    else if (alle.length === 1 && (m = erste.match(BILD))) bloecke.push({ art: "bild", alt: m[1], src: m[2], optionen: m[3] || "", nr: b.nr });
    else if (alle.every((z) => KNOPF.test(z))) bloecke.push({ art: "knoepfe", knoepfe: alle.map((z) => { const [, text, url] = z.match(KNOPF); return { text, url }; }), nr: b.nr });
    else if (alle.every((z) => z.startsWith(">"))) bloecke.push({ art: "hinweis", text: alle.map((z) => z.replace(/^>\s?/, "")).join("\n"), nr: b.nr });
    else bloecke.push({ art: "text", text: b.zeilen.join("\n"), nr: b.nr });
  }
  return bloecke;
}

/** Erzeugt HTML für eine Folge von Blöcken (Bild „daneben“ fasst den folgenden Text zusammen). */
const KASTEN_KNOPF = "has-accent-3-background-color has-background";

export function bloeckeRendern(bloecke, { knopfKlasse = "" } = {}) {
  let imKasten = false;
  const teile = [];
  let daneben = null;
  const schliessen = () => {
    if (!daneben) return;
    const { bild, inhalt } = daneben;
    const o = bild.optionen.split(/\s+/);
    const rechts = o.includes("rechts");
    const alt = bild.alt.replace(/"/g, "&quot;");
    if (rechts) {
      const spalte = "wp-block-column is-vertically-aligned-center is-layout-flow wp-block-column-is-layout-flow";
      const rund = o.includes("rund") ? " is-style-rounded ki-abgerundet" : "";
      teile.push(`<div class="wp-block-columns alignwide are-vertically-aligned-center is-layout-flex wp-block-columns-is-layout-flex">
<div class="${spalte}" style="flex-basis:50%">
${inhalt.join("\n")}
</div>
<div class="${spalte}" style="flex-basis:50%"><figure class="wp-block-image size-full${rund}"><img src="${bild.src}" alt="${alt}" /></figure></div>
</div>`);
    } else {
      const breite = (o.find((x) => /^\d+$/.test(x)) || "30") + "%";
      const klassen = "wp-block-media-text alignwide is-stacked-on-mobile is-vertically-aligned-top" + (o.includes("klein") ? "" : " is-image-fill-element");
      teile.push(`<div class="${klassen}" style="grid-template-columns:${breite} auto"><figure class="wp-block-media-text__media"><img src="${bild.src}" alt="${alt}" /></figure><div class="wp-block-media-text__content">
${inhalt.join("\n")}
</div></div>`);
    }
    daneben = null;
  };
  bloecke.forEach((b, i) => {
    const naechster = bloecke[i + 1];
    b.breit = b.art === "ueberschrift" && naechster?.art === "bild" && /daneben/.test(naechster.optionen) && !/rechts/.test(naechster.optionen);
  });
  for (const b of bloecke) {
    if (b.art === "kasten_auf" || b.art === "kasten_zu") {
      schliessen();
      imKasten = b.art === "kasten_auf";
      teile.push(imKasten
        ? '<div class="wp-block-group has-accent-4-background-color has-background has-global-padding is-layout-constrained wp-block-group-is-layout-constrained ki-kasten">'
        : "</div>");
      continue;
    }
    if (b.art === "ueberschrift" || b.art === "titel" || b.art === "linie" || (b.art === "bild" && /daneben/.test(b.optionen))) schliessen();
    let html = "";
    if (b.art === "titel") html = `<h1 class="wp-block-heading">${mdInline(b.text)}</h1>`;
    else if (b.art === "ueberschrift") html = `<h${b.ebene} class="wp-block-heading${b.breit ? " alignwide ki-person" : ""}">${mdInline(b.text)}</h${b.ebene}>`;
    else if (b.art === "linie") html = '<hr class="wp-block-separator has-alpha-channel-opacity"/>';
    else if (b.art === "newsletter") html = NEWSLETTER;
    else if (b.art === "knoepfe") html = knoepfeHtml(b.knoepfe, imKasten ? KASTEN_KNOPF : knopfKlasse);
    else if (b.art === "hinweis") html = mdBlock(b.text)
      .replaceAll('<p class="wp-block-paragraph">', '<p class="has-background wp-block-paragraph ki-hinweis">')
      .replace(/<h([2-6]) class="wp-block-heading">/g, '<h$1 class="wp-block-heading alignwide has-accent-4-background-color has-background">');
    else if (b.art === "text") html = mdBlock(b.text).trim();
    else if (b.art === "bild" && /daneben/.test(b.optionen)) {
      // Bild rechts: eine Überschrift direkt davor wandert mit in die Textspalte
      const vorher = /rechts/.test(b.optionen) && bloecke[bloecke.indexOf(b) - 1]?.art === "ueberschrift" ? [teile.pop()] : [];
      daneben = { bild: b, inhalt: vorher };
      continue;
    }
    else if (b.art === "bild") html = bildHtml(b.alt, b.src, b.optionen);
    if (daneben) daneben.inhalt.push(html);
    else teile.push(html);
  }
  schliessen();
  return teile.join("\n\n");
}

/** Liest eine ganze Textseite: Titel (# …) und Inhalt. */
export function seiteLesen(text, optionen = {}) {
  const bloecke = bloeckeLesen(text);
  const titel = bloecke.find((b) => b.art === "titel");
  return {
    titel: titel?.text || "",
    bloecke,
    html: bloeckeRendern(bloecke.filter((b) => b !== titel), optionen),
  };
}

/**
 * Für Seiten mit festem Layout (Startseite, Workshops): Inhalt nach „## Abschnitten“ und „### Teilen“.
 * Jeder Abschnitt/Teil: { titel, html (Text ohne Bilder/Knöpfe), bilder, knoepfe, newsletter, teile }
 */
export function abschnitteLesen(text, optionen = {}) {
  const bloecke = bloeckeLesen(text);
  const abschnitte = [];
  let aktuell = null, teil = null;
  const neu = (titel, nr) => ({ titel, nr, bloecke: [], bilder: [], knoepfe: [], newsletter: false, teile: [] });
  for (const b of bloecke) {
    if (b.art === "titel") continue;
    if (b.art === "ueberschrift" && b.ebene === 2) { aktuell = neu(b.text, b.nr); abschnitte.push(aktuell); teil = null; continue; }
    if (!aktuell) continue;
    if (b.art === "ueberschrift" && b.ebene === 3) { teil = neu(b.text, b.nr); aktuell.teile.push(teil); continue; }
    const ziel = teil || aktuell;
    if (b.art === "bild") ziel.bilder.push(b);
    else if (b.art === "knoepfe") ziel.knoepfe.push(...b.knoepfe);
    else if (b.art === "newsletter") ziel.newsletter = true;
    else ziel.bloecke.push(b);
  }
  const fertig = (a) => ({
    ...a,
    titelHtml: mdInline(a.titel),
    html: bloeckeRendern(a.bloecke, optionen),
    absaetze: a.bloecke.map((b) => bloeckeRendern([b], optionen)),
    knoepfeHtml: a.knoepfe.length ? knoepfeHtml(a.knoepfe, optionen.knopfKlasse) : "",
    newsletterHtml: a.newsletter ? NEWSLETTER : "",
    teile: a.teile.map(fertig),
  });
  return abschnitte.map(fertig);
}

/** Prüft eine Seite auf typische Fehler. Liefert eine Liste von Meldungen mit Zeilennummer. */
export function seitePruefen(text) {
  const fehler = [];
  const zeilen = text.replace(/<!--[\s\S]*?-->/g, (k) => k.replace(/[^\n]/g, "")).split(/\r?\n/);
  zeilen.forEach((z, i) => {
    const wo = `Zeile ${i + 1}`;
    if (/\]\s+\(/.test(z) && /\[[^\]]+\]\s+\(\S+\)/.test(z)) fehler.push(`${wo}: Ein Link ist falsch geschrieben. Richtig: [Linktext](https://…) – ohne Leerzeichen zwischen ] und (.`);
    if (/^Knopf:/.test(z.trim()) && !KNOPF.test(z.trim())) fehler.push(`${wo}: Knopf falsch geschrieben. Richtig: Knopf: [Text](https://…)`);
    if (/^!\[/.test(z.trim()) && !BILD.test(z.trim())) fehler.push(`${wo}: Bild falsch geschrieben. Richtig: ![Beschreibung](/wp-content/uploads/…)`);
    for (const m of z.matchAll(/\]\(([^)\s]+)/g))
      if (!/^(https?:\/\/|\/|mailto:|#)/.test(m[1])) fehler.push(`${wo}: Der Link „${m[1]}“ ist ungültig. Er muss mit https:// oder / beginnen.`);
  });
  const kaesten = zeilen.filter((z) => /^:::\s*kasten$/i.test(z.trim())).length;
  const enden = zeilen.filter((z) => z.trim() === ":::").length;
  if (kaesten !== enden) fehler.push(`Ein Kasten ist nicht richtig geschlossen: ${kaesten}× „::: kasten“, aber ${enden}× „:::“.`);
  // Eingefügtes HTML muss vollständig sein, sonst verrutscht das Layout
  const offen = {};
  for (const m of text.matchAll(/<(\/?)(div|p|a|strong|em|u|span|figure|ul|ol|li|table|iframe)\b[^>]*?(\/?)>/gi)) {
    if (m[3]) continue;
    const tag = m[2].toLowerCase();
    offen[tag] = (offen[tag] || 0) + (m[1] ? -1 : 1);
  }
  for (const [tag, n] of Object.entries(offen))
    if (n !== 0) fehler.push(`Eingefügtes HTML ist unvollständig: <${tag}> wird ${n > 0 ? "geöffnet, aber nicht geschlossen" : "geschlossen, aber nie geöffnet"}.`);
  return fehler;
}

/** Alle Bilder einer Seite (für die Prüfung, ob die Dateien existieren). */
export const bilderIn = (text) => [...text.replace(/<!--[\s\S]*?-->/g, "").matchAll(/!\[[^\]]*\]\((\S+?)(?:\s+"[^"]*")?\)/g)].map((m) => m[1]);
