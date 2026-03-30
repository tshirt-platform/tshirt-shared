export const SHIRT_TYPES = ["tshirt", "polo", "hoodie"] as const

export const SHIRT_SIZES = ["S", "M", "L", "XL", "XXL"] as const

export const DESIGN_SIDES = ["front", "back"] as const

export const PRINT_JOB_STATUSES = [
  "pending",
  "printing",
  "shipped",
  "delivered",
  "failed",
] as const

export const DESIGN_EXPORT = {
  WIDTH: 3000,
  HEIGHT: 3000,
  DPI: 300,
  MAX_UPLOAD_SIZE_MB: 10,
} as const
