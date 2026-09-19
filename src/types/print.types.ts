import type { DesignSide, ShirtType } from "./design.types"

export interface SizeChartRow {
  size: string
  /** Shoulder width, cm */
  shoulder: number
  /** Chest circumference, cm */
  chest: number
  /** Body length (HPS to hem), cm */
  length: number
  /** Recommended wearer, shown to customers (e.g. "58-65kg") */
  fit?: string
}

export interface GarmentColor {
  name: string
  /** Screen colour only; never used to order fabric */
  hex: string
  is_dark: boolean
  /** DTG needs a white underbase on every non-white garment */
  needs_underbase: boolean
  pantone_tcx?: string | null
  supplier_code?: string | null
}

/** Stored at product.metadata.print_config */
export interface PrintConfigMeta {
  shirt_type?: ShirtType
  size_chart: SizeChartRow[]
  neck_drop_front_cm: number
  neck_drop_back_cm: number
  colors: GarmentColor[]
  /** Render-service template id per side */
  mockups?: Partial<Record<DesignSide, string>>
}

export interface GarmentMeasurements {
  sizeChart: SizeChartRow[]
  /** Collar depth below HPS, cm */
  neckDropFrontCm: number
  neckDropBackCm: number
}

export interface PrintConfig {
  maxPrintWidthMm: number
  maxPrintHeightMm: number
  /** Share of the flat chest width that may be printed */
  chestUsage: number
  /** Empty space between the collar edge and the top of the print */
  gapBelowCollarMm: number
  /** Minimum clearance between the print bottom and the hem */
  hemMarginMm: number
  dpi: number
}

export interface PrintArea {
  side: DesignSide
  widthMm: number
  heightMm: number
  widthPx: number
  heightPx: number
  /** Distance from HPS down to the top edge of the print */
  topOffsetMm: number
  /** Flat garment width the print was sized against (smallest size) */
  flatWidthMm: number
}

/** Where the garment sits inside a line-art image, measured in image pixels */
export interface ArtCalibration {
  bodyWidthPx: number
  centerX: number
  hpsY: number
}

export interface ArtRect {
  x: number
  y: number
  width: number
  height: number
}

// A type alias, not an interface, so it can be stored in a JSON column (Record<string, unknown>)
export type PrintPlacement = {
  side: DesignSide
  print_size_mm: { width: number; height: number }
  artwork_px: { width: number; height: number }
  dpi: number
  reference: "HPS"
  top_offset_mm: number
  horizontal_offset_mm: number
}

export interface GarmentSnapshot {
  size: string
  color_name: string
  color_hex: string
  needs_underbase: boolean
  supplier_color_code: string | null
}

export interface DesignAsset {
  side: DesignSide
  png_url: string
  json_url: string
  preview_url?: string
  placement: PrintPlacement
}
