import { describe, expect, test } from "bun:test";
import {
  getPrimaryLanguage,
  normalizeLanguageTag,
} from "../src/utils/language";

describe("language helpers", () => {
  test("canonicalizes regional and underscore-separated tags", () => {
    expect(normalizeLanguageTag("EN_us")).toBe("en-us");
  });

  test("preserves three-letter primary languages", () => {
    expect(getPrimaryLanguage("yue-HK")).toBe("yue");
  });

  test("handles non-standard tags without throwing", () => {
    expect(getPrimaryLanguage("custom_language")).toBe("custom");
  });
});
