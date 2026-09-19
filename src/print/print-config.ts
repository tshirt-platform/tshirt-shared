import type { DesignSide, ShirtType } from "../types/design.types"
import type {
  GarmentColor,
  GarmentMeasurements,
  GarmentSnapshot,
  PrintConfigMeta,
  SizeChartRow,
} from "../types/print.types"

// Screen colours, tuned toward real cotton (fabric always reads duller than pure digital)
export const DEFAULT_GARMENT_COLORS: GarmentColor[] = [
  { name: "Trắng", hex: "#F4F4F0", is_dark: false, needs_underbase: false },
  { name: "Kem", hex: "#E6DCC6", is_dark: false, needs_underbase: true },
  { name: "Xám nhạt", hex: "#C8C8C4", is_dark: false, needs_underbase: true },
  { name: "Vàng", hex: "#F2C83C", is_dark: false, needs_underbase: true },
  { name: "Đỏ", hex: "#C8102E", is_dark: true, needs_underbase: true },
  { name: "Xanh lá", hex: "#2E7D4F", is_dark: true, needs_underbase: true },
  { name: "Xanh dương", hex: "#1D4F91", is_dark: true, needs_underbase: true },
  { name: "Xám đậm", hex: "#4A4A4A", is_dark: true, needs_underbase: true },
  { name: "Navy", hex: "#1F2A44", is_dark: true, needs_underbase: true },
  { name: "Đen", hex: "#1A1A1A", is_dark: true, needs_underbase: true },
]

export const DEFAULT_SIZE_CHART: SizeChartRow[] = [
  { size: "S", shoulder: 42, chest: 96, length: 68, fit: "50-58kg" },
  { size: "M", shoulder: 44, chest: 100, length: 70, fit: "58-65kg" },
  { size: "L", shoulder: 46, chest: 104, length: 72, fit: "65-75kg" },
  { size: "XL", shoulder: 48, chest: 108, length: 74, fit: "75-85kg" },
  { size: "XXL", shoulder: 50, chest: 112, length: 76, fit: "85kg+" },
]

export const DEFAULT_PRINT_CONFIG_META: PrintConfigMeta = {
  shirt_type: "tshirt",
  size_chart: DEFAULT_SIZE_CHART,
  neck_drop_front_cm: 8,
  neck_drop_back_cm: 2.5,
  colors: DEFAULT_GARMENT_COLORS,
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/
const SHIRT_TYPES: readonly string[] = ["tshirt", "polo", "hoodie"]
const SIDES: readonly string[] = ["front", "back"]

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function parseSizeRow(raw: unknown): SizeChartRow | null {
  if (!isRecord(raw)) return null
  const { size, shoulder, chest, length, fit } = raw
  if (typeof size !== "string" || size.trim() === "") return null
  if (
    typeof shoulder !== "number" ||
    typeof chest !== "number" ||
    typeof length !== "number"
  ) {
    return null
  }
  if (!(shoulder > 0) || !(chest > 0) || !(length > 0)) return null
  return typeof fit === "string" ? { size, shoulder, chest, length, fit } : { size, shoulder, chest, length }
}

function parseColor(raw: unknown): GarmentColor | null {
  if (!isRecord(raw)) return null
  const { name, hex, is_dark, needs_underbase, pantone_tcx, supplier_code } = raw
  if (typeof name !== "string" || name === "") return null
  if (typeof hex !== "string" || !HEX_RE.test(hex)) return null
  if (typeof is_dark !== "boolean" || typeof needs_underbase !== "boolean") {
    return null
  }
  return {
    name,
    hex,
    is_dark,
    needs_underbase,
    pantone_tcx: typeof pantone_tcx === "string" ? pantone_tcx : null,
    supplier_code: typeof supplier_code === "string" ? supplier_code : null,
  }
}

function allOrNull<T>(items: unknown[], parse: (v: unknown) => T | null): T[] | null {
  const out: T[] = []
  for (const item of items) {
    const parsed = parse(item)
    if (!parsed) return null
    out.push(parsed)
  }
  return out
}

/** One id (the original format) or a list; blanks and repeats are dropped, order is kept */
function parseMockupIds(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : [raw]
  const ids = list.filter((v): v is string => typeof v === "string" && v !== "")
  return [...new Set(ids)]
}

/** Validates untrusted product.metadata.print_config; returns null when unusable */
export function parsePrintConfig(raw: unknown): PrintConfigMeta | null {
  if (!isRecord(raw)) return null

  const { size_chart, neck_drop_front_cm, neck_drop_back_cm, colors, shirt_type, mockups } = raw
  if (!Array.isArray(size_chart) || size_chart.length === 0) return null
  if (typeof neck_drop_front_cm !== "number" || neck_drop_front_cm < 0) return null
  if (typeof neck_drop_back_cm !== "number" || neck_drop_back_cm < 0) return null

  const rows = allOrNull(size_chart, parseSizeRow)
  if (!rows) return null

  let parsedColors = DEFAULT_GARMENT_COLORS
  if (Array.isArray(colors) && colors.length > 0) {
    const c = allOrNull(colors, parseColor)
    if (!c) return null
    parsedColors = c
  }

  const parsedMockups: Partial<Record<DesignSide, string[]>> = {}
  if (isRecord(mockups)) {
    for (const side of SIDES) {
      const ids = parseMockupIds(mockups[side])
      if (ids.length > 0) parsedMockups[side as DesignSide] = ids
    }
  }

  return {
    shirt_type:
      typeof shirt_type === "string" && SHIRT_TYPES.includes(shirt_type)
        ? (shirt_type as ShirtType)
        : undefined,
    size_chart: rows,
    neck_drop_front_cm,
    neck_drop_back_cm,
    colors: parsedColors,
    mockups: parsedMockups,
  }
}

export function toGarmentMeasurements(meta: PrintConfigMeta): GarmentMeasurements {
  return {
    sizeChart: meta.size_chart,
    neckDropFrontCm: meta.neck_drop_front_cm,
    neckDropBackCm: meta.neck_drop_back_cm,
  }
}

export function findGarmentColor(
  name: string | null | undefined,
  colors: GarmentColor[] = DEFAULT_GARMENT_COLORS
): GarmentColor | null {
  if (!name) return null
  const key = name.trim().toLowerCase()
  return colors.find((c) => c.name.toLowerCase() === key) ?? null
}

export function toGarmentSnapshot(size: string, color: GarmentColor): GarmentSnapshot {
  return {
    size,
    color_name: color.name,
    color_hex: color.hex,
    needs_underbase: color.needs_underbase,
    supplier_color_code: color.supplier_code ?? null,
  }
}
