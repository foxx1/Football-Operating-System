import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "./input";
import React from "react";

describe("Input", () => {
    it("renders correctly", () => {
        render(<Input placeholder="Enter text" />);
        expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("accepts user input", () => {
        render(<Input placeholder="Enter text" />);
        const input = screen.getByPlaceholderText("Enter text") as HTMLInputElement;
        fireEvent.change(input, { target: { value: "Hello" } });
        expect(input.value).toBe("Hello");
    });
});
