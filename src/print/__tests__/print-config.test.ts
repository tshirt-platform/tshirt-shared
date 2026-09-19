import { describe, expect, it } from "vitest"
import {
  DEFAULT_GARMENT_COLORS,
  DEFAULT_PRINT_CONFIG_META,
  findGarmentColor,
  parsePrintConfig,
  toGarmentSnapshot,
} from "../print-config"

const valid = {
  shirt_type: "tshirt",
  size_chart: [{ size: "S", shoulder: 42, chest: 96, length: 68 }],
  neck_drop_front_cm: 8,
  neck_drop_back_cm: 2.5,
  colors: [
    { name: "Đen", hex: "#1A1A1A", is_dark: true, needs_underbase: true },
  ],
  mockups: { front: "tpl_1", back: "" },
}

describe("parsePrintConfig", () => {
  it("accepts a valid config and normalises optional fields", () => {
    const parsed = parsePrintConfig(valid)
    expect(parsed?.size_chart).toHaveLength(1)
    expect(parsed?.colors[0].supplier_code).toBeNull()
    expect(parsed?.mockups).toEqual({ front: ["tpl_1"] })
    expect(parsed?.shirt_type).toBe("tshirt")
  })

  it("reads a list of mockups per side, dropping blanks and repeats", () => {
    const parsed = parsePrintConfig({
      ...valid,
      mockups: { front: ["flat", "", "model", "flat", 7], back: ["flat-back"] },
    })
    expect(parsed?.mockups).toEqual({ front: ["flat", "model"], back: ["flat-back"] })
  })

  it("omits a side whose mockups are all unusable", () => {
    const parsed = parsePrintConfig({ ...valid, mockups: { front: [null, ""], back: 3 } })
    expect(parsed?.mockups).toEqual({})
  })

  it("falls back to default colours when none are given", () => {
    const parsed = parsePrintConfig({ ...valid, colors: undefined })
    expect(parsed?.colors).toEqual(DEFAULT_GARMENT_COLORS)
  })

  it("keeps the optional fit text on a size row", () => {
    const parsed = parsePrintConfig({
      ...valid,
      size_chart: [{ size: "S", shoulder: 42, chest: 96, length: 68, fit: "50-58kg" }],
    })
    expect(parsed?.size_chart[0].fit).toBe("50-58kg")
    expect(parsePrintConfig(valid)?.size_chart[0]).not.toHaveProperty("fit")
  })

  it("rejects non-objects", () => {
    expect(parsePrintConfig(null)).toBeNull()
    expect(parsePrintConfig("x")).toBeNull()
    expect(parsePrintConfig([])).toBeNull()
  })

  it("rejects an empty or malformed size chart", () => {
    expect(parsePrintConfig({ ...valid, size_chart: [] })).toBeNull()
    expect(
      parsePrintConfig({ ...valid, size_chart: [{ size: "S", chest: 96 }] })
    ).toBeNull()
    expect(
      parsePrintConfig({
        ...valid,
        size_chart: [{ size: "S", shoulder: 42, chest: -1, length: 68 }],
      })
    ).toBeNull()
  })

  it("rejects bad neck drops and bad colours", () => {
    expect(parsePrintConfig({ ...valid, neck_drop_front_cm: -2 })).toBeNull()
    expect(parsePrintConfig({ ...valid, neck_drop_back_cm: "2" })).toBeNull()
    expect(
      parsePrintConfig({
        ...valid,
        colors: [{ name: "X", hex: "red", is_dark: false, needs_underbase: false }],
      })
    ).toBeNull()
  })

  it("ignores an unknown shirt type", () => {
    expect(parsePrintConfig({ ...valid, shirt_type: "cape" })?.shirt_type).toBeUndefined()
  })

  it("round-trips the built-in default", () => {
    expect(parsePrintConfig(DEFAULT_PRINT_CONFIG_META)).not.toBeNull()
  })
})

describe("findGarmentColor", () => {
  it("matches names case-insensitively", () => {
    expect(findGarmentColor("đen")?.hex).toBe("#1A1A1A")
    expect(findGarmentColor(" Navy ")?.name).toBe("Navy")
  })

  it("returns null for unknown or empty names", () => {
    expect(findGarmentColor("Tím")).toBeNull()
    expect(findGarmentColor(null)).toBeNull()
  })

  it("covers every colour seeded in the database", () => {
    const seeded = ["Trắng", "Đen", "Xám nhạt", "Xám đậm", "Đỏ", "Xanh dương", "Xanh lá", "Vàng", "Navy", "Kem"]
    for (const name of seeded) expect(findGarmentColor(name)).not.toBeNull()
  })
})

describe("default colour registry", () => {
  it("only marks white as not needing an underbase", () => {
    const noUnderbase = DEFAULT_GARMENT_COLORS.filter((c) => !c.needs_underbase)
    expect(noUnderbase.map((c) => c.name)).toEqual(["Trắng"])
  })

  it("flags exactly the dark fabrics", () => {
    const dark = DEFAULT_GARMENT_COLORS.filter((c) => c.is_dark).map((c) => c.name)
    expect(dark.sort()).toEqual(
      ["Navy", "Xanh dương", "Xanh lá", "Xám đậm", "Đen", "Đỏ"].sort()
    )
  })
})

describe("toGarmentSnapshot", () => {
  it("copies the colour into a print-shop snapshot", () => {
    const snap = toGarmentSnapshot("L", DEFAULT_GARMENT_COLORS[9])
    expect(snap).toEqual({
      size: "L",
      color_name: "Đen",
      color_hex: "#1A1A1A",
      needs_underbase: true,
      supplier_color_code: null,
    })
  })
})
