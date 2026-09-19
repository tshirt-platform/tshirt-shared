import type { DesignAsset, GarmentSnapshot } from "./print.types"

export type DesignSide = "front" | "back"

export type ShirtType = "tshirt" | "polo" | "hoodie"

export type ActiveTool = "select" | "text" | "image" | "shape"

export interface DesignState {
  productId: string | null
  variantId: string | null
  side: DesignSide
  history: string[]
  historyIndex: number
  activeTool: ActiveTool
  pngUrl: string | null
  jsonUrl: string | null
}

export interface CartLineItemMetadata {
  /** One entry per printed side */
  designs: DesignAsset[]
  garment: GarmentSnapshot
  /** First design mirrored here for consumers that predate multi-side designs */
  design_png_url: string
  design_json_url: string
  design_side: DesignSide
}
