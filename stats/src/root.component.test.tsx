import React from "react";
import { render } from "@testing-library/react";
import Root from "./root.component";

jest.mock("@Felo/shared", () => ({
  on: jest.fn(() => jest.fn()),
  filtrarPostulaciones: jest.fn((res: unknown) => res),
}), { virtual: true });

global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;

describe("Root component", () => {
  // Sin esta clase las utilidades con important: '.jt-stats' no aplican
  it("envuelve el MFE en la clase de alcance de Tailwind", () => {
    const { container } = render(<Root />);
    expect(container.firstElementChild).toHaveClass("jt-stats");
  });
});
