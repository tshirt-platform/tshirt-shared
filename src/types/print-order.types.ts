import type { DesignSide, ShirtType } from "./design.types"

export interface PrintShopCustomer {
  name: string
  phone: string
  address: string
}

export interface PrintShopItem {
  shirt_type: ShirtType
  shirt_color: string
  shirt_size: string
  quantity: number
  design_png_url: string
  design_json_url: string
  design_side: DesignSide
}

export interface PrintShopWebhookPayload {
  order_id: string
  customer: PrintShopCustomer
  items: PrintShopItem[]
  created_at: string
}

export type PrintJobStatus =
  | "pending"
  | "printing"
  | "shipped"
  | "delivered"
  | "failed"
