import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Label } from "./label";
import React from "react";

describe("Label", () => {
    it("renders correctly", () => {
        render(<Label htmlFor="email">Email</Label>);
        expect(screen.getByText("Email")).toBeInTheDocument();
    });
});
