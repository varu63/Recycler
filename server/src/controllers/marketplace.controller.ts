import type { NextFunction, Request, Response } from 'express';
import {
  createListing,
  getPublicListing,
  listAdminListings,
  listPublicMarketplace,
  updateListing,
} from '../services/marketplace.service.js';
import { success } from '../utils/response.js';

export async function listPublicController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listPublicMarketplace(req.query as any);
    success(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getPublicListingController(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await getPublicListing(req.params.id!);
    success(res, { listing });
  } catch (error) {
    next(error);
  }
}

export async function getListingProvenanceController(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await getPublicListing(req.params.id!);
    success(res, { provenance: listing.provenance });
  } catch (error) {
    next(error);
  }
}

export async function listAdminController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listAdminListings(req.query as any);
    success(res, data);
  } catch (error) {
    next(error);
  }
}

export async function createListingController(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await createListing(req, req.body);
    success(res, { listing }, 'Listing created', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateListingController(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await updateListing(req, req.params.id!, req.body);
    success(res, { listing }, 'Listing updated');
  } catch (error) {
    next(error);
  }
}
