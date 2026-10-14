import mongoose, { Schema } from 'mongoose';
import {
  MaterialCategory,
  MaterialGrade,
  OrderStatus,
  PaymentStatus,
} from '../../../shared/src/enums.js';
import { baseOptions, defineModel } from './base.js';

export interface IOrderItem {
  id?: mongoose.Types.ObjectId;
  listing: mongoose.Types.ObjectId;
  productName: string;
  materialType: MaterialCategory;
  grade: MaterialGrade;
  quantity: number;
  pricePerKg: number;
  total: number;
}

export interface IShippingAddress {
  fullName: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface IOrder extends mongoose.Document<mongoose.Types.ObjectId> {
  id: string;
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: mongoose.Types.DocumentArray<IOrderItem> | IOrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: IShippingAddress;
  customerNote: string | null;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    listing: { type: Schema.Types.ObjectId, ref: 'MarketplaceListing', required: true },
    productName: { type: String, required: true, maxlength: 150 },
    materialType: { type: String, enum: Object.values(MaterialCategory), required: true },
    grade: { type: String, enum: Object.values(MaterialGrade), required: true },
    quantity: { type: Number, required: true, min: 0.01 },
    pricePerKg: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    line1: { type: String, required: true, trim: true, maxlength: 300 },
    city: { type: String, required: true, trim: true, maxlength: 120 },
    state: { type: String, required: true, trim: true, maxlength: 120 },
    postalCode: { type: String, required: true, trim: true, maxlength: 20 },
    country: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING, index: true },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.UNPAID },
    shippingAddress: { type: shippingAddressSchema, required: true },
    customerNote: { type: String, default: null, maxlength: 2000 },
    cancelReason: { type: String, default: null, maxlength: 2000 },
  },
  baseOptions
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const Order = defineModel<IOrder>('Order', orderSchema);
