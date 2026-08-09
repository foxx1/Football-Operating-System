import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import React from "react";

describe("Card", () => {
    it("renders correctly with title and content", () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Card Content</p>
                </CardContent>
            </Card>
        );
        expect(screen.getByText("Card Title")).toBeInTheDocument();
        expect(screen.getByText("Card Content")).toBeInTheDocument();
    });
});
