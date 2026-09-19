export const SHIRT_TYPES = ["tshirt", "polo", "hoodie"] as const

export const SHIRT_SIZES = ["S", "M", "L", "XL", "XXL"] as const

export const DESIGN_SIDES = ["front", "back"] as const

export const PRINT_JOB_STATUSES = [
  "pending",
  "proof_approved",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const

// Print dimensions are derived per product from its size chart (see print/print-area)
export const DESIGN_EXPORT = {
  DPI: 300,
  MAX_UPLOAD_SIZE_MB: 10,
} as const
