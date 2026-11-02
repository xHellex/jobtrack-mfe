import React from "react";
import { render } from "@testing-library/react";
import Root from "./root.component";

// Mock del import map dinámico
jest.mock("@Felo/shared", () => ({
  emit: jest.fn(),
  on: jest.fn(),
  filtrarPostulaciones: jest.fn((res: unknown) => res),
}), { virtual: true });

// Simula fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([]),
  })
) as jest.Mock;

describe("Root component", () => {
  it("muestra el estado de carga al montar", () => {
    // Renderiza el árbol que incluye el Provider de Redux y lanza fetch de API
    const { getByText } = render(<Root />);
    expect(getByText(/Cargando postulaciones/i)).toBeInTheDocument();
  });

  // Sin esta clase las utilidades con important: '.jt-postulaciones' no aplican
  it("envuelve el MFE en la clase de alcance de Tailwind", () => {
    const { container } = render(<Root />);
    expect(container.firstElementChild).toHaveClass("jt-postulaciones");
  });
});
