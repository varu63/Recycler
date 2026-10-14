import type { NextFunction, Request, Response } from 'express';
import {
  acceptOffer,
  completeRequest,
  createInspection,
  createMaterialRequest,
  createOffer,
  getMaterialRequest,
  listMaterialRequests,
  purchaseRequest,
  rejectOffer,
  rejectRequest,
  reviewMaterialRequest,
  scheduleInspection,
} from '../services/material-request.service.js';
import { listOffers, listInspections } from '../services/inspection-offer.service.js';
import { success } from '../utils/response.js';

export async function listRequestsController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listMaterialRequests(req.user!, req.query as any);
    success(res, data);
  } catch (error) {
    next(error);
  }
}

export async function createRequestController(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await createMaterialRequest(req.user!, req.body);
    success(res, { request }, 'Material request submitted', 201);
  } catch (error) {
    next(error);
  }
}

export async function getRequestController(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await getMaterialRequest(req.user!, req.params.id!);
    success(res, { request });
  } catch (error) {
    next(error);
  }
}

export async function reviewRequestController(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await reviewMaterialRequest(req, req.params.id!);
    success(res, { request }, 'Request moved to review');
  } catch (error) {
    next(error);
  }
}

export async function scheduleInspectionController(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await scheduleInspection(req, req.params.id!, req.body.scheduledAt);
    success(res, { request }, 'Inspection scheduled');
  } catch (error) {
    next(error);
  }
}

export async function createInspectionController(req: Request, res: Response, next: NextFunction) {
  try {
    const inspection = await createInspection(req, req.params.id!, req.body);
    success(res, { inspection }, 'Inspection recorded', 201);
  } catch (error) {
    next(error);
  }
}

export async function createOfferController(req: Request, res: Response, next: NextFunction) {
  try {
    const offer = await createOffer(req, req.params.id!, req.body);
    success(res, { offer }, 'Offer created', 201);
  } catch (error) {
    next(error);
  }
}

export async function acceptOfferController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await acceptOffer(req, req.params.id!);
    success(res, data, 'Offer accepted');
  } catch (error) {
    next(error);
  }
}

export async function rejectOfferController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await rejectOffer(req, req.params.id!);
    success(res, data, 'Offer rejected');
  } catch (error) {
    next(error);
  }
}

export async function purchaseRequestController(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await purchaseRequest(req, req.params.id!);
    success(res, { request }, 'Material purchased');
  } catch (error) {
    next(error);
  }
}

export async function completeRequestController(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await completeRequest(req, req.params.id!);
    success(res, { request }, 'Request completed');
  } catch (error) {
    next(error);
  }
}

export async function rejectRequestController(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await rejectRequest(req, req.params.id!, req.body.reason);
    success(res, { request }, 'Request rejected');
  } catch (error) {
    next(error);
  }
}

export async function listOffersController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listOffers(req.user!, req.query as any);
    success(res, data);
  } catch (error) {
    next(error);
  }
}

export async function listInspectionsController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listInspections(req.query as any);
    success(res, data);
  } catch (error) {
    next(error);
  }
}
