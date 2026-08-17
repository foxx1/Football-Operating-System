import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { verifyTerraSignature } from "./terra-webhook";

const SECRET = "test-signing-secret";

function signPayload(secret: string, timestamp: number, body: string) {
  const signedPayload = `${timestamp}.${body}`;
  const signature = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

describe("verifyTerraSignature", () => {
  it("accepts a correctly signed, fresh request", () => {
    const body = JSON.stringify({ type: "activity", user: { user_id: "abc" } });
    const header = signPayload(SECRET, Math.floor(Date.now() / 1000), body);

    expect(verifyTerraSignature(header, Buffer.from(body), SECRET)).toEqual({ ok: true });
  });

  it("rejects a missing header", () => {
    const body = JSON.stringify({ type: "activity" });
    expect(verifyTerraSignature(undefined, Buffer.from(body), SECRET)).toEqual({
      ok: false,
      reason: "missing_header",
    });
  });

  it("rejects a malformed header", () => {
    const body = JSON.stringify({ type: "activity" });
    expect(verifyTerraSignature("not-a-valid-header", Buffer.from(body), SECRET)).toEqual({
      ok: false,
      reason: "malformed_header",
    });
  });

  it("rejects a stale timestamp (replay protection)", () => {
    const body = JSON.stringify({ type: "activity" });
    const staleTimestamp = Math.floor(Date.now() / 1000) - 60 * 60; // 1 hour old
    const header = signPayload(SECRET, staleTimestamp, body);

    expect(verifyTerraSignature(header, Buffer.from(body), SECRET)).toEqual({
      ok: false,
      reason: "stale_timestamp",
    });
  });

  it("rejects a signature computed with the wrong secret", () => {
    const body = JSON.stringify({ type: "activity" });
    const header = signPayload("wrong-secret", Math.floor(Date.now() / 1000), body);

    expect(verifyTerraSignature(header, Buffer.from(body), SECRET)).toEqual({
      ok: false,
      reason: "signature_mismatch",
    });
  });

  it("rejects when the body has been tampered with after signing", () => {
    const originalBody = JSON.stringify({ type: "activity", user: { user_id: "abc" } });
    const header = signPayload(SECRET, Math.floor(Date.now() / 1000), originalBody);
    const tamperedBody = JSON.stringify({ type: "activity", user: { user_id: "attacker-controlled" } });

    expect(verifyTerraSignature(header, Buffer.from(tamperedBody), SECRET)).toEqual({
      ok: false,
      reason: "signature_mismatch",
    });
  });

  it("rejects when the raw body is missing entirely", () => {
    const header = signPayload(SECRET, Math.floor(Date.now() / 1000), "{}");
    expect(verifyTerraSignature(header, undefined, SECRET)).toEqual({
      ok: false,
      reason: "missing_header",
    });
  });
});
