import type { DesignSide } from "../types/design.types"
import type {
  ArtCalibration,
  ArtRect,
  GarmentMeasurements,
  PrintArea,
  PrintConfig,
  PrintPlacement,
} from "../types/print.types"

// Limits sized to fit A3 DTF (297x420mm) and every common DTG platen
export const DEFAULT_PRINT_CONFIG: PrintConfig = {
  maxPrintWidthMm: 279.4,
  maxPrintHeightMm: 355.6,
  chestUsage: 0.55,
  gapBelowCollarMm: 50,
  hemMarginMm: 60,
  dpi: 300,
}

const MM_PER_INCH = 25.4

export function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / MM_PER_INCH) * dpi)
}

function assertValid(garment: GarmentMeasurements): void {
  if (garment.sizeChart.length === 0) {
    throw new RangeError("Size chart is empty")
  }
  for (const row of garment.sizeChart) {
    if (!(row.chest > 0) || !(row.length > 0)) {
      throw new RangeError(`Invalid measurements for size ${row.size}`)
    }
  }
  if (garment.neckDropFrontCm < 0 || garment.neckDropBackCm < 0) {
    throw new RangeError("Neck drop cannot be negative")
  }
}

/**
 * One print size is shared by every size of a product, so it is derived from
 * the smallest chest and the shortest body in the chart.
 */
export function derivePrintArea(
  garment: GarmentMeasurements,
  side: DesignSide,
  config: PrintConfig = DEFAULT_PRINT_CONFIG
): PrintArea {
  assertValid(garment)

  const minChestCm = Math.min(...garment.sizeChart.map((r) => r.chest))
  const minLengthCm = Math.min(...garment.sizeChart.map((r) => r.length))

  const flatWidthMm = (minChestCm * 10) / 2
  const aspect = config.maxPrintWidthMm / config.maxPrintHeightMm

  const widthMm = Math.min(
    config.maxPrintWidthMm,
    flatWidthMm * config.chestUsage
  )
  const heightMm = Math.min(config.maxPrintHeightMm, widthMm / aspect)

  const neckDropCm =
    side === "front" ? garment.neckDropFrontCm : garment.neckDropBackCm
  const topOffsetMm = neckDropCm * 10 + config.gapBelowCollarMm

  const maxBottomMm = minLengthCm * 10 - config.hemMarginMm
  if (topOffsetMm + heightMm > maxBottomMm) {
    throw new RangeError(
      `Print does not fit on the ${side}: needs ${Math.round(topOffsetMm + heightMm)}mm ` +
        `from HPS but only ${Math.round(maxBottomMm)}mm is available`
    )
  }

  return {
    side,
    widthMm,
    heightMm,
    widthPx: mmToPx(widthMm, config.dpi),
    heightPx: mmToPx(heightMm, config.dpi),
    topOffsetMm,
    flatWidthMm,
  }
}

/** Project the print area onto a line-art image so the editor can draw its frame */
export function toArtRect(area: PrintArea, art: ArtCalibration): ArtRect {
  const mmPerPx = area.flatWidthMm / art.bodyWidthPx
  const width = area.widthMm / mmPerPx
  const height = area.heightMm / mmPerPx

  return {
    x: Math.round(art.centerX - width / 2),
    y: Math.round(art.hpsY + area.topOffsetMm / mmPerPx),
    width: Math.round(width),
    height: Math.round(height),
  }
}

export function toPlacement(
  area: PrintArea,
  dpi: number = DEFAULT_PRINT_CONFIG.dpi
): PrintPlacement {
  return {
    side: area.side,
    print_size_mm: {
      width: Math.round(area.widthMm * 10) / 10,
      height: Math.round(area.heightMm * 10) / 10,
    },
    artwork_px: { width: area.widthPx, height: area.heightPx },
    dpi,
    reference: "HPS",
    top_offset_mm: Math.round(area.topOffsetMm * 10) / 10,
    horizontal_offset_mm: 0,
  }
}
