import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiError, parseBody, parseIdParam, parseOptionalIntQuery, parseRequiredString } from "./api-contracts";

describe("api contracts", () => {
  it("accepts positive integer route ids", () => {
    expect(parseIdParam("42")).toBe(42);
  });

  it("rejects missing, zero, negative, and decimal ids", () => {
    for (const value of [undefined, "", "0", "-1", "1.5", "abc"]) {
      expect(() => parseIdParam(value)).toThrow(ApiError);
    }
  });

  it("parses optional integer query values", () => {
    expect(parseOptionalIntQuery(undefined, "playerId")).toBeUndefined();
    expect(parseOptionalIntQuery("", "playerId")).toBeUndefined();
    expect(parseOptionalIntQuery("7", "playerId")).toBe(7);
    expect(() => parseOptionalIntQuery(["7", "8"], "playerId")).toThrow(ApiError);
  });

  it("trims required strings", () => {
    expect(parseRequiredString(" heart_rate ", "dataType")).toBe("heart_rate");
    expect(() => parseRequiredString("", "dataType")).toThrow(ApiError);
  });

  it("validates request bodies through zod schemas", () => {
    const schema = z.object({ name: z.string().min(1), count: z.coerce.number().int() });
    expect(parseBody(schema, { name: "Session", count: "3" })).toEqual({ name: "Session", count: 3 });
    expect(() => parseBody(schema, { name: "", count: "3" })).toThrow();
  });
});
