import { describe, expect, it } from "vitest";
import { agesLabel, itemMeta } from "./categories";

describe("agesLabel", () => {
  it("shows one age group as its years", () => {
    expect(agesLabel("nl", ["u12"])).toBe("11-12 jaar");
    expect(agesLabel("en", ["u12"])).toBe("Ages 11–12");
    expect(agesLabel("nl", ["u18"])).toBe("17-19 jaar");
  });

  it("shows a run of groups from the youngest year of the first to the oldest of the last", () => {
    expect(agesLabel("nl", ["u12", "u14", "u16"])).toBe("11 t/m 16 jaar");
    expect(agesLabel("en", ["u12", "u14", "u16"])).toBe("Ages 11–16");
    expect(agesLabel("nl", ["u8", "u10"])).toBe("7 t/m 10 jaar");
    expect(agesLabel("nl", ["u16", "u18"])).toBe("15 t/m 19 jaar");
  });

  it("shows a run up to the seniors as its youngest year and up", () => {
    expect(agesLabel("nl", ["u14", "u16", "u18", "senior"])).toBe("13 jaar en ouder");
    expect(agesLabel("en", ["u14", "u16", "u18", "senior"])).toBe("Ages 13 and up");
    expect(agesLabel("nl", ["u18", "senior"])).toBe("17 jaar en ouder");
  });

  it("names the seniors when an item is for them alone", () => {
    expect(agesLabel("nl", ["senior"])).toBe("Senioren");
    expect(agesLabel("en", ["senior"])).toBe("Senior");
  });
});

describe("itemMeta", () => {
  it("joins the category, the ages and the level", () => {
    expect(itemMeta("nl", { category: "attack", ages: ["u12", "u14", "u16"], level: "basic" })).toBe("Aanval · 11 t/m 16 jaar · Basis");
    expect(itemMeta("en", { category: "defense", ages: ["u14", "u16", "u18", "senior"], level: "basic" })).toBe("Defense · Ages 13 and up · Basic");
  });
});
