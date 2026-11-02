/**
 * @jest-environment jsdom
 */
import { readFileSync } from "fs";
import { join } from "path";

const html = readFileSync(join(__dirname, "index.ejs"), "utf8");
const pagina = new DOMParser().parseFromString(html, "text/html");
const script = pagina.querySelector("script#tema-inicial");

// sistema: true/false = prefiere oscuro/claro; Error = matchMedia lanza; undefined = matchMedia no existe
function ejecutar(guardado: string | null | Error, sistema: boolean | Error | undefined) {
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    if (guardado instanceof Error) throw guardado;
    return guardado;
  });
  if (sistema === undefined) {
    delete (window as { matchMedia?: unknown }).matchMedia;
  } else {
    window.matchMedia = jest.fn().mockImplementation(() => {
      if (sistema instanceof Error) throw sistema;
      return { matches: sistema };
    });
  }
  new Function(script?.textContent ?? "")();
  return document.documentElement.getAttribute("data-theme");
}

afterEach(() => {
  jest.restoreAllMocks();
  document.documentElement.removeAttribute("data-theme");
});

describe("script tema-inicial", () => {
  // Si se mueve al body o después del CSS, vuelve el destello del tema equivocado
  it("está en <head> antes del primer <style>", () => {
    expect(script?.parentElement?.tagName).toBe("HEAD");
    const estilo = pagina.head.querySelector("style");
    expect(estilo).not.toBeNull();
    expect(
      script!.compareDocumentPosition(estilo!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it.each([
    ["tema guardado oscuro gana al sistema claro", "dark", false, "dark"],
    ["tema guardado claro gana al sistema oscuro", "light", true, "light"],
    ["sin tema guardado sigue al sistema oscuro", null, true, "dark"],
    ["valor guardado inválido sigue al sistema claro", "azul", false, "light"],
    ["almacenamiento bloqueado sigue al sistema oscuro", new Error("bloqueado"), true, "dark"],
    ["matchMedia lanza error y no hay tema guardado: claro", null, new Error("falla"), "light"],
    ["matchMedia no existe y no hay tema guardado: claro", null, undefined, "light"],
  ])("%s", (_, guardado, sistema, esperado) => {
    expect(ejecutar(guardado, sistema)).toBe(esperado);
  });
});
