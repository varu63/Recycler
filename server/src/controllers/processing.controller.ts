import type { NextFunction, Request, Response } from 'express';
import {
  completeProcessing,
  createProcessing,
  listProcessedInventory,
  listProcessing,
  updateProcessing,
} from '../services/processing.service.js';
import { success } from '../utils/response.js';

export async function listProcessingController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listProcessing(req.query as any);
    success(res, data);
  } catch (error) {
    next(error);
  }
}

export async function createProcessingController(req: Request, res: Response, next: NextFunction) {
  try {
    const batch = await createProcessing(req, req.body);
    success(res, { batch }, 'Processing batch created', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateProcessingController(req: Request, res: Response, next: NextFunction) {
  try {
    const batch = await updateProcessing(req, req.params.id!, req.body);
    success(res, { batch }, 'Processing batch updated');
  } catch (error) {
    next(error);
  }
}

export async function completeProcessingController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await completeProcessing(req, req.params.id!, req.body);
    success(res, data, 'Processing batch completed');
  } catch (error) {
    next(error);
  }
}

export async function listProcessedInventoryController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await listProcessedInventory(req.query as any);
    success(res, data);
  } catch (error) {
    next(error);
  }
}
