import { randomBytes } from 'crypto';
import type { Request } from 'express';
import {
  AuditAction,
  MaterialGrade,
  MaterialQuality,
  ProcessedInventoryStatus,
  ProcessingStatus,
  RawInventoryStatus,
} from '../../../shared/src/enums.js';
import type { ListQuery } from '../../../shared/src/types.js';
import { auditFromRequest } from '../middleware/audit.middleware.js';
import { ProcessingBatch, ProcessedMaterial, RawInventory } from '../models/index.js';
import {
  badRequest,
  conflict,
  insufficientInventory,
  invalidState,
  notFound,
} from '../utils/errors.js';
import { buildPaginated, getPagination, parseSort } from '../utils/pagination.js';
import { toBatchDTO, toProcessedImageDTO } from '../utils/dto.js';
import { calcLoss, calcRecovery, round2 } from '../utils/math.js';

const SORTABLE: Record<string, string> = {
  createdAt: 'createdAt',
  completedAt: 'completedAt',
  inputWeight: 'inputWeight',
  batchId: 'batchId',
};

const QUALITY_BY_GRADE: Record<string, MaterialQuality> = {
  [MaterialGrade.A]: MaterialQuality.EXCELLENT,
  [MaterialGrade.B]: MaterialQuality.GOOD,
  [MaterialGrade.C]: MaterialQuality.FAIR,
};

function generateBatchId(): string {
  return `BAT-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export async function listProcessing(query: ListQuery & { status?: ProcessingStatus }) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  const { page, limit, skip } = getPagination(query);
  const sort = parseSort(query.sort, SORTABLE, { createdAt: -1 });

  const [items, total] = await Promise.all([
    ProcessingBatch.find(filter).sort(sort).skip(skip).limit(limit),
    ProcessingBatch.countDocuments(filter),
  ]);
  return buildPaginated(items.map(toBatchDTO), total, page, limit);
}

export async function createProcessing(
  req: Request,
  input: { rawInventory: string; processingType: string; inputWeight: number; notes?: string }
) {
  const raw = await RawInventory.findById(input.rawInventory);
  if (!raw) throw notFound('Raw inventory not found');

  const processable = [
    RawInventoryStatus.PURCHASED,
    RawInventoryStatus.RECEIVED,
    RawInventoryStatus.WAITING_FOR_PROCESSING,
    RawInventoryStatus.PROCESSING,
  ];
  if (!processable.includes(raw.status)) {
    throw invalidState(
      `Inventory in status ${raw.status} cannot be processed`,
      'INVALID_STATE_TRANSITION'
    );
  }

  const active = await ProcessingBatch.findOne({
    rawInventory: raw._id,
    status: { $in: [ProcessingStatus.PENDING, ProcessingStatus.IN_PROGRESS] },
  });
  if (active) throw conflict('An active processing batch already exists for this inventory');

  if (input.inputWeight > raw.currentWeight) {
    throw insufficientInventory(
      'Input weight exceeds the available raw inventory weight',
      'INSUFFICIENT_INVENTORY'
    );
  }

  const batch = await ProcessingBatch.create({
    batchId: generateBatchId(),
    rawInventory: raw._id,
    materialType: raw.materialType,
    materialName: raw.materialName,
    processingType: input.processingType,
    inputWeight: input.inputWeight,
    notes: input.notes ?? null,
    status: ProcessingStatus.PENDING,
  });

  raw.status = RawInventoryStatus.PROCESSING;
  await raw.save();

  await auditFromRequest(req, AuditAction.PROCESSING_STARTED, 'ProcessingBatch', String(batch._id), {
    rawInventory: String(raw._id),
    inputWeight: input.inputWeight,
  });
  return toBatchDTO(batch);
}

const STATUS_TRANSITIONS: Record<ProcessingStatus, ProcessingStatus[]> = {
  [ProcessingStatus.PENDING]: [ProcessingStatus.IN_PROGRESS, ProcessingStatus.FAILED],
  [ProcessingStatus.IN_PROGRESS]: [ProcessingStatus.FAILED],
  [ProcessingStatus.COMPLETED]: [],
  [ProcessingStatus.FAILED]: [],
};

export async function updateProcessing(
  req: Request,
  id: string,
  patch: { stage?: any; status?: ProcessingStatus; notes?: string }
) {
  const batch = await ProcessingBatch.findById(id);
  if (!batch) throw notFound('Processing batch not found');

  if (
    batch.status === ProcessingStatus.COMPLETED ||
    batch.status === ProcessingStatus.FAILED
  ) {
    throw invalidState('A finished batch cannot be modified', 'INVALID_STATE_TRANSITION');
  }

  if (patch.status !== undefined && patch.status !== batch.status) {
    const allowed = STATUS_TRANSITIONS[batch.status];
    if (!allowed.includes(patch.status)) {
      throw invalidState(
        `Cannot move a batch from ${batch.status} to ${patch.status}`,
        'INVALID_STATE_TRANSITION'
      );
    }
    batch.status = patch.status;
    if (patch.status === ProcessingStatus.IN_PROGRESS && !batch.startedAt) {
      batch.startedAt = new Date();
      await auditFromRequest(req, AuditAction.PROCESSING_STARTED, 'ProcessingBatch', id, {
        stage: batch.stage,
      });
    }
  }
  if (patch.stage !== undefined) batch.stage = patch.stage;
  if (patch.notes !== undefined) batch.notes = patch.notes;

  await batch.save();
  return toBatchDTO(batch);
}

export async function completeProcessing(
  req: Request,
  id: string,
  input: { outputWeight: number; stage?: any; qualityGrade?: MaterialGrade; notes?: string }
) {
  const batch = await ProcessingBatch.findById(id);
  if (!batch) throw notFound('Processing batch not found');

  if (
    batch.status === ProcessingStatus.COMPLETED ||
    batch.status === ProcessingStatus.FAILED
  ) {
    throw invalidState('This batch is already finished', 'INVALID_STATE_TRANSITION');
  }

  if (input.outputWeight > batch.inputWeight) {
    throw badRequest('Output weight cannot exceed input weight', 'VALIDATION_ERROR', {
      errors: { outputWeight: ['Output weight cannot exceed input weight'] },
    });
  }

  const raw = await RawInventory.findById(batch.rawInventory);
  if (!raw) throw notFound('Raw inventory not found');

  const grade = input.qualityGrade ?? MaterialGrade.B;
  const lossWeight = calcLoss(batch.inputWeight, input.outputWeight);
  const recoveryPercentage = calcRecovery(input.outputWeight, batch.inputWeight);

  batch.outputWeight = round2(input.outputWeight);
  batch.lossWeight = lossWeight;
  batch.recoveryPercentage = recoveryPercentage;
  batch.qualityGrade = grade;
  batch.status = ProcessingStatus.COMPLETED;
  batch.completedAt = new Date();
  if (input.stage) batch.stage = input.stage;
  if (input.notes !== undefined) batch.notes = input.notes;
  if (!batch.startedAt) batch.startedAt = batch.completedAt;
  await batch.save();

  const processed = await ProcessedMaterial.create({
    name: raw.materialName,
    materialType: batch.materialType,
    grade,
    quality: QUALITY_BY_GRADE[grade] ?? MaterialQuality.GOOD,
    weight: round2(input.outputWeight),
    availableQuantity: round2(input.outputWeight),
    unit: 'kg',
    batch: batch._id,
    description: `${batch.processingType} processed material`,
    images: [],
    status: ProcessedInventoryStatus.AVAILABLE,
  });

  raw.currentWeight = round2(Math.max(0, raw.currentWeight - batch.inputWeight));
  raw.status = RawInventoryStatus.PROCESSED;
  await raw.save();

  await auditFromRequest(req, AuditAction.PROCESSING_COMPLETED, 'ProcessingBatch', id, {
    outputWeight: input.outputWeight,
    lossWeight,
    recoveryPercentage,
  });
  await auditFromRequest(
    req,
    AuditAction.PROCESSED_INVENTORY_CREATED,
    'ProcessedMaterial',
    String(processed._id),
    { batchId: batch.batchId }
  );

  return { batch: toBatchDTO(batch), processed: toProcessedImageDTO(processed) };
}

export async function listProcessedInventory(
  query: ListQuery & { status?: ProcessedInventoryStatus }
) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  const { page, limit, skip } = getPagination(query);
  const sort = parseSort(query.sort, { createdAt: 'createdAt', weight: 'weight' }, { createdAt: -1 });

  const [items, total] = await Promise.all([
    ProcessedMaterial.find(filter).sort(sort).skip(skip).limit(limit),
    ProcessedMaterial.countDocuments(filter),
  ]);
  return buildPaginated(items.map(toProcessedImageDTO), total, page, limit);
}
