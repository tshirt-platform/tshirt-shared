import { describe, expect, it } from "vitest"
import {
  DEFAULT_PRINT_CONFIG,
  derivePrintArea,
  mmToPx,
  toArtRect,
  toPlacement,
} from "../print-area"
import { DEFAULT_PRINT_CONFIG_META, toGarmentMeasurements } from "../print-config"
import type { ArtCalibration, GarmentMeasurements } from "../../types/print.types"

const tshirt = toGarmentMeasurements(DEFAULT_PRINT_CONFIG_META)

// Measured from tshirt-store/public/images/design-editor/*-unline.png
const FRONT_ART: ArtCalibration = { bodyWidthPx: 505, centerX: 451, hpsY: 15 }
const BACK_ART: ArtCalibration = { bodyWidthPx: 458, centerX: 408, hpsY: 12 }

describe("mmToPx", () => {
  it("converts at 300 DPI", () => {
    expect(mmToPx(25.4, 300)).toBe(300)
    expect(mmToPx(279.4, 300)).toBe(3300)
  })
})

describe("derivePrintArea", () => {
  it("sizes the print from the smallest chest (front)", () => {
    const area = derivePrintArea(tshirt, "front")
    expect(area.flatWidthMm).toBe(480)
    expect(area.widthMm).toBeCloseTo(264, 5)
    expect(area.heightMm).toBeCloseTo(336, 1)
    expect(area.widthPx).toBe(3118)
    expect(area.heightPx).toBe(3969)
    expect(area.topOffsetMm).toBe(130)
  })

  it("uses the shallower neck drop on the back", () => {
    const area = derivePrintArea(tshirt, "back")
    expect(area.topOffsetMm).toBe(75)
    expect(area.widthMm).toBeCloseTo(264, 5)
  })

  it("keeps the configured aspect ratio", () => {
    const area = derivePrintArea(tshirt, "front")
    const maxAspect =
      DEFAULT_PRINT_CONFIG.maxPrintWidthMm / DEFAULT_PRINT_CONFIG.maxPrintHeightMm
    expect(area.widthMm / area.heightMm).toBeCloseTo(maxAspect, 5)
  })

  it("ignores row order in the size chart", () => {
    const shuffled = { ...tshirt, sizeChart: [...tshirt.sizeChart].reverse() }
    expect(derivePrintArea(shuffled, "front")).toEqual(
      derivePrintArea(tshirt, "front")
    )
  })

  it("caps the print at the machine limit on a wide garment", () => {
    const wide: GarmentMeasurements = {
      ...tshirt,
      sizeChart: [{ size: "M", shoulder: 60, chest: 160, length: 90 }],
    }
    const area = derivePrintArea(wide, "front")
    expect(area.widthMm).toBe(DEFAULT_PRINT_CONFIG.maxPrintWidthMm)
    expect(area.heightMm).toBeCloseTo(DEFAULT_PRINT_CONFIG.maxPrintHeightMm, 5)
  })

  it("follows a custom config so a print shop limit can be swapped in", () => {
    const area = derivePrintArea(tshirt, "front", {
      ...DEFAULT_PRINT_CONFIG,
      maxPrintWidthMm: 200,
      maxPrintHeightMm: 300,
    })
    expect(area.widthMm).toBe(200)
    expect(area.heightMm).toBe(300)
  })

  it("throws when the print would run into the hem", () => {
    const short: GarmentMeasurements = {
      ...tshirt,
      sizeChart: [{ size: "S", shoulder: 42, chest: 96, length: 45 }],
    }
    expect(() => derivePrintArea(short, "front")).toThrow(RangeError)
  })

  it("throws on an empty or invalid size chart", () => {
    expect(() => derivePrintArea({ ...tshirt, sizeChart: [] }, "front")).toThrow(
      "empty"
    )
    expect(() =>
      derivePrintArea(
        { ...tshirt, sizeChart: [{ size: "S", shoulder: 42, chest: 0, length: 68 }] },
        "front"
      )
    ).toThrow("Invalid measurements")
    expect(() =>
      derivePrintArea(
        { ...tshirt, sizeChart: [{ size: "S", shoulder: 42, chest: NaN, length: 68 }] },
        "front"
      )
    ).toThrow("Invalid measurements")
  })

  it("throws on a negative neck drop", () => {
    expect(() =>
      derivePrintArea({ ...tshirt, neckDropFrontCm: -1 }, "front")
    ).toThrow("negative")
  })
})

describe("toArtRect", () => {
  it("places the front print on front-unline.png", () => {
    const rect = toArtRect(derivePrintArea(tshirt, "front"), FRONT_ART)
    expect(rect).toEqual({ x: 312, y: 152, width: 278, height: 354 })
  })

  it("places the back print on back-unline.png", () => {
    const rect = toArtRect(derivePrintArea(tshirt, "back"), BACK_ART)
    expect(rect).toEqual({ x: 282, y: 84, width: 252, height: 321 })
  })

  it("centres the print on the garment", () => {
    const rect = toArtRect(derivePrintArea(tshirt, "front"), FRONT_ART)
    expect(rect.x + rect.width / 2).toBeCloseTo(FRONT_ART.centerX, 0)
  })

  it("scales with the art resolution", () => {
    const area = derivePrintArea(tshirt, "front")
    const base = toArtRect(area, FRONT_ART)
    const double = toArtRect(area, {
      bodyWidthPx: FRONT_ART.bodyWidthPx * 2,
      centerX: FRONT_ART.centerX * 2,
      hpsY: FRONT_ART.hpsY * 2,
    })
    expect(double.width).toBeCloseTo(base.width * 2, -1)
    expect(double.height).toBeCloseTo(base.height * 2, -1)
  })
})

describe("toPlacement", () => {
  it("emits the print-shop placement record", () => {
    expect(toPlacement(derivePrintArea(tshirt, "front"))).toEqual({
      side: "front",
      print_size_mm: { width: 264, height: 336 },
      artwork_px: { width: 3118, height: 3969 },
      dpi: 300,
      reference: "HPS",
      top_offset_mm: 130,
      horizontal_offset_mm: 0,
    })
  })
})
