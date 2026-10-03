import markdownIt from "markdown-it";
import { HtmlBasePlugin } from "@11ty/eleventy";
import { aktuelleTermine, nachMonat, heuteInBerlin } from "./scripts/termine.mjs";

const md = markdownIt({ html: false, linkify: false, typographer: false });
// Externe Links in Markdown-Texten öffnen wie bisher in einem neuen Tab
const standardLink = md.renderer.rules.link_open || ((t, i, o, e, s) => s.renderToken(t, i, o));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet("href") || "";
  if (/^https?:/.test(href)) {
    tokens[idx].attrSet("target", "_blank");
    tokens[idx].attrSet("rel", "noreferrer noopener");
  }
  return standardLink(tokens, idx, options, env, self);
};

export default function (eleventyConfig) {
  eleventyConfig.addWatchTarget("inhalte/");
  eleventyConfig.addPassthroughCopy({ "src/wp-content": "wp-content", "src/assets": "assets" });
  eleventyConfig.addPlugin(HtmlBasePlugin);
  // Hintergrundbilder in style="…url(/…)" kennt das Base-Plugin nicht – Pfad-Präfix hier ergänzen.
  const praefix = (process.env.PATH_PREFIX || "/").replace(/\/?$/, "/");
  if (praefix !== "/") {
    eleventyConfig.addTransform("praefix-in-css-url", (inhalt, pfad) =>
      pfad?.endsWith(".html") ? inhalt.replaceAll("url(/", "url(" + praefix) : inhalt);
  }

  eleventyConfig.addGlobalData("heute", heuteInBerlin);
  eleventyConfig.addFilter("aktuelleTermine", (termine) => aktuelleTermine(termine, heuteInBerlin()));
  eleventyConfig.addFilter("nachMonat", (termine) => nachMonat(termine, heuteInBerlin()));
  eleventyConfig.addFilter("mdinline", (text) => (text ? md.renderInline(String(text)) : ""));
  eleventyConfig.addFilter("extern", (url) => /^https?:/.test(url || ""));
  eleventyConfig.addFilter("spalten", (liste, anzahl) => {
    const proSpalte = Math.ceil(liste.length / anzahl);
    return Array.from({ length: anzahl }, (_, i) => liste.slice(i * proSpalte, (i + 1) * proSpalte));
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", layouts: "_includes/layouts", data: "_data" },
    templateFormats: ["html", "njk", "md"],
    // Übernommene HTML-Seiten werden nicht als Vorlage interpretiert, sondern 1:1 ausgegeben.
    htmlTemplateEngine: false,
    markdownTemplateEngine: false,
    pathPrefix: process.env.PATH_PREFIX || "/",
  };
}
