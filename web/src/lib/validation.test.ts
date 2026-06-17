import { describe, it, expect } from "vitest";
import { isValidMatchId } from "./validation";

describe("isValidMatchId", () => {
  describe("valid IDs", () => {
    it("accepts standard slug format (team-vs-team-date)", () => {
      expect(isValidMatchId("slo-vs-usa-2026-06-14")).toBe(true);
    });

    it("accepts numeric IDs", () => {
      expect(isValidMatchId("123")).toBe(true);
    });

    it("accepts short slugs", () => {
      expect(isValidMatchId("bra-vs-arg")).toBe(true);
    });

    it("accepts slugs with only letters", () => {
      expect(isValidMatchId("final")).toBe(true);
    });

    it("accepts slugs starting with numbers", () => {
      expect(isValidMatchId("1-vs-2")).toBe(true);
    });

    it("accepts complex match slugs", () => {
      expect(isValidMatchId("bra-vs-arg-final-2026-07-19")).toBe(true);
    });
  });

  describe("invalid IDs", () => {
    it("rejects empty string", () => {
      expect(isValidMatchId("")).toBe(false);
    });

    it("rejects whitespace-only string", () => {
      expect(isValidMatchId("   ")).toBe(false);
    });

    it("rejects null", () => {
      expect(isValidMatchId(null)).toBe(false);
    });

    it("rejects undefined", () => {
      expect(isValidMatchId(undefined)).toBe(false);
    });

    it("rejects IDs with slashes (path traversal)", () => {
      expect(isValidMatchId("../../etc/passwd")).toBe(false);
    });

    it("rejects IDs with spaces", () => {
      expect(isValidMatchId("match 123")).toBe(false);
    });

    it("rejects IDs with special characters", () => {
      expect(isValidMatchId("match@123")).toBe(false);
    });

    it("rejects IDs with uppercase letters", () => {
      expect(isValidMatchId("USA-VS-BRA")).toBe(false);
    });

    it("rejects IDs with dots", () => {
      expect(isValidMatchId("match.123")).toBe(false);
    });

    it("rejects IDs with query params", () => {
      expect(isValidMatchId("match?id=1")).toBe(false);
    });

    it("rejects IDs with protocol prefix", () => {
      expect(isValidMatchId("javascript:alert(1)")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("trims leading whitespace before validating", () => {
      expect(isValidMatchId("  slug")).toBe(true);
    });

    it("trims trailing whitespace before validating", () => {
      expect(isValidMatchId("slug  ")).toBe(true);
    });
  });
});
