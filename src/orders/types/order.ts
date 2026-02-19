export type OrderStatus = 
  | 'created'
  | 'clp_receipt_uploaded'
  | 'clp_verified'
  | 'processing'
  | 'paid_out'
  | 'completed'
  | 'rejected'
  | 'cancelled'

export interface VenezuelanBankDetails {
  beneficiaryName: string
  beneficiaryId: string // Cédula o RIF
  bank: string
  accountType: 'corriente' | 'ahorro'
  accountNumber: string
  phone: string
  email?: string
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  amountClp: number
  rateSnapshot: number
  amountVesExpected: number
  status: OrderStatus
  clpReceiptUrl?: string
  vesReceiptUrl?: string
  // Venezuelan bank details for transfer
  vesBankDetails: VenezuelanBankDetails
  // Transfer reference (filled by admin when transferring)
  vesTransferReference?: string
  vesTransferredAt?: Date
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface CreateOrderData {
  amountClp: number
  vesBankDetails: VenezuelanBankDetails
  clpReceiptUrl?: string
}

export interface OrderEvent {
  id: string
  orderId: string
  fromStatus: OrderStatus | null
  toStatus: OrderStatus
  changedBy: string
  changedByName: string
  note?: string
  createdAt: Date
}

export interface CreateOrderEventData {
  fromStatus: OrderStatus | null
  toStatus: OrderStatus
  changedBy: string
  changedByName: string
  note?: string
}
