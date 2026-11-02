/**
 * @jest-environment jsdom
 */
import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import { basename, join } from "path";

// Mismo motor que usa html-webpack-plugin para index.ejs; resuelto desde él para no sumar dependencias
const { template } = require(require.resolve("lodash", {
  paths: [require.resolve("html-webpack-plugin")],
})) as { template: (s: string) => (datos: object) => string };

const ejs = readFileSync(join(__dirname, "index.ejs"), "utf8");
const sha256 = (texto: string) =>
  `'sha256-${createHash("sha256").update(texto, "utf8").digest("base64")}'`;

type ImportMap = { imports?: Record<string, string>; scopes?: Record<string, unknown> };

// Igual que @single-spa/import-map-injector 2.0.1: une los injector-importmap en orden y
// los inserta como <script type="importmap"> en línea, que también pasa por script-src
function importMapInyectado(pagina: Document) {
  const final: Required<ImportMap> = { imports: {}, scopes: {} };
  pagina.querySelectorAll("script[type=injector-importmap]").forEach((s) => {
    const mapa = JSON.parse(s.textContent ?? "") as ImportMap;
    Object.assign(final.imports, mapa.imports);
    Object.assign(final.scopes, mapa.scopes);
  });
  return JSON.stringify(final);
}

// Los defaults de single-spa traen un plugin ESM que Jest 27 no carga; aquí solo importa HtmlWebpackPlugin
jest.mock("webpack-config-single-spa-ts", () => () => ({}));
type OpcionesHtml = { minify?: unknown; favicon?: string };
const opcionesHtml = () =>
  (
    require("../webpack.config.js")({}, { mode: "production" }) as {
      plugins: { constructor: { name: string }; userOptions?: OpcionesHtml }[];
    }
  ).plugins.find((p) => p.constructor.name === "HtmlWebpackPlugin")?.userOptions;

// El minificador de producción recorta los espacios de los scripts en línea y cambia su hash
it("el build de producción no minifica index.html", () => {
  expect(opcionesHtml()?.minify).toBe(false);
});

// Sin <link rel="icon"> el navegador pide /favicon.ico y da 404
it("enlaza un favicon que el build emite en la raíz y la CSP permite", () => {
  const pagina = new DOMParser().parseFromString(template(ejs)({ isLocal: false }), "text/html");
  const icono = pagina.querySelector('link[rel="icon"]');
  const favicon = opcionesHtml()?.favicon ?? "";
  expect(favicon).toMatch(/\.svg$/);
  expect(existsSync(join(__dirname, "..", favicon))).toBe(true);
  expect(icono?.getAttribute("href")).toBe(`/${basename(favicon)}`);
  // Mismo origen: lo cubre default-src 'self' mientras no haya un img-src que lo restrinja
  const csp = pagina.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute("content") ?? "";
  expect(csp).toMatch(/default-src [^;]*'self'/);
  expect(csp).not.toMatch(/img-src/);
});

describe.each([true, false])("CSP con isLocal=%s", (isLocal) => {
  // DOMParser normaliza CRLF a LF como el navegador: el hash no depende del checkout
  const pagina = new DOMParser().parseFromString(
    template(ejs)({ isLocal, orgName: "Felo" }),
    "text/html"
  );
  const csp =
    pagina
      .querySelector('meta[http-equiv="Content-Security-Policy"]')
      ?.getAttribute("content") ?? "";
  const scriptSrc =
    csp
      .split(";")
      .map((d) => d.trim().split(/\s+/))
      .find(([nombre]) => nombre === "script-src")
      ?.slice(1) ?? [];
  // Los type que no son JavaScript (injector-importmap) son datos: el navegador no los ejecuta
  const enLinea = Array.from(pagina.querySelectorAll("script:not([src])")).filter(
    (s) => ["", "text/javascript", "module"].includes(s.getAttribute("type") ?? "")
  );

  it("no permite 'unsafe-inline' ni 'unsafe-eval' en script-src", () => {
    expect(scriptSrc.length).toBeGreaterThan(0);
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it("tiene en script-src el hash de cada script en línea", () => {
    expect(enLinea.length).toBeGreaterThanOrEqual(2);
    for (const s of enLinea) expect(scriptSrc).toContain(sha256(s.textContent ?? ""));
  });

  it("tiene en script-src el hash del import map que inserta import-map-injector", () => {
    expect(scriptSrc).toContain(sha256(importMapInyectado(pagina)));
  });
});
