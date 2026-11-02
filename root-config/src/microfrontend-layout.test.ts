/**
 * @jest-environment jsdom
 */
import { readFileSync } from "fs";
import { join } from "path";

const html = readFileSync(join(__dirname, "microfrontend-layout.html"), "utf8");
const layout = new DOMParser().parseFromString(html, "text/html");

describe("microfrontend-layout", () => {
  const rutas = Array.from(layout.querySelectorAll("route"));

  it("tiene rutas", () => {
    expect(rutas.length).toBeGreaterThan(0);
  });

  it.each(rutas.map((r) => [r.getAttribute("path") ?? "default", r]))(
    "la ruta %s tiene exactamente un h1 con la clase page-title",
    (_, ruta) => {
      const titulos = (ruta as Element).querySelectorAll("h1");
      expect(titulos).toHaveLength(1);
      expect(titulos[0].classList.contains("page-title")).toBe(true);
    }
  );
});
