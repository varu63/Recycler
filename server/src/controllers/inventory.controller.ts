import type { NextFunction, Request, Response } from 'express';
import { listRawInventory, updateRawInventory } from '../services/inventory.service.js';
import { success } from '../utils/response.js';

export async function listRawInventoryController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listRawInventory(req.query as any);
    success(res, data);
  } catch (error) {
    next(error);
  }
}

export async function updateRawInventoryController(req: Request, res: Response, next: NextFunction) {
  try {
    const inventory = await updateRawInventory(req, req.params.id!, req.body);
    success(res, { inventory }, 'Inventory updated');
  } catch (error) {
    next(error);
  }
}
