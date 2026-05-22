/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OrderStatus = 'pending' | 'processing' | 'printing' | 'shipping' | 'completed' | 'cancelled';
export type PaymentMethod = 'cod' | 'bank_transfer' | 'momo' | 'vnpay';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type JerseyType = 'home' | 'away' | 'third';
export type JerseySize = 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  teamCountry: string;
  jerseyType: JerseyType;
  glbUrl: string | null;
  imageUrl: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId?: string | null;
  orderCode: string;
  customerName: string;
  phone: string;
  address: string;
  notes?: string | null;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  payment?: Payment;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  nickname?: string | null;
  jerseyNumber?: number | null;
  size: JerseySize;
  colorHex: string;
  quantity: number;
  unitPrice: number;
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string | null;
  amount: number;
  metadata?: any;
  paidAt?: string | null;
  createdAt: string;
}

export interface OrderStats {
  totalOrders: number;
  revenue: number;
  pendingOrders: number;
  completedToday: number;
  ordersByStatus: { status: OrderStatus; count: number }[];
  topTeams: { team: string; count: number }[];
  ordersLast7Days: { date: string; count: number; amount: number }[];
}

export interface CustomerSummary {
  phone: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  firstOrderDate: string;
  lastOrderDate: string;
}

export interface TeamPlayer {
  id: string;
  name: string;
  number: number;
  size: JerseySize;
}

