import type { NextFunction, Request, Response } from 'express';
import {
  cancelOrder,
  createOrder,
  getOrder,
  listOrders,
  updateOrderStatus,
} from '../services/order.service.js';
import { success } from '../utils/response.js';

export async function createOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await createOrder(req, String(req.user!._id), req.body);
    success(res, { order }, 'Order placed', 201);
  } catch (error) {
    next(error);
  }
}

export async function listOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listOrders(req.user!, req.query as any);
    success(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await getOrder(req.user!, req.params.id!);
    success(res, { order });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await updateOrderStatus(req, req.params.id!, req.body);
    success(res, { order }, 'Order status updated');
  } catch (error) {
    next(error);
  }
}

export async function cancelOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await cancelOrder(
      req,
      req.user!,
      req.params.id!,
      req.body?.cancelReason
    );
    success(res, { order }, 'Order cancelled');
  } catch (error) {
    next(error);
  }
}
