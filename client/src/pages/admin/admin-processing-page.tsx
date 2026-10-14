import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { CheckCircle2, Factory, MoreHorizontal, Plus, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { queryErrorMessage } from '@/context/query-provider';
import { formatDate, formatWeight, prettifyEnum } from '@/lib/format';
import { inventoryService } from '@/services/inventory.service';
import {
  MATERIAL_GRADES,
  PAGE_SIZE,
  ProcessingStage,
  ProcessingStatus,
  RawInventoryStatus,
  type MaterialGrade,
  type ProcessingBatchDTO,
  type RawInventoryDTO,
} from '@/types';
import { toast } from 'sonner';

const ALL = 'all';

const createSchema = z.object({
  rawInventory: z.string().min(1, 'Select a raw inventory item'),
  processingType: z.string().trim().min(1, 'Enter a processing type').max(120, 'Too long'),
  inputWeight: z
    .string()
    .min(1, 'Enter the input weight')
    .refine((value) => Number(value) > 0, 'Must be greater than 0'),
  notes: z.string().max(2000, 'Notes are too long').optional(),
});

type CreateForm = z.infer<typeof createSchema>;

const updateSchema = z.object({
  stage: z.string().min(1, 'Select a stage'),
  status: z.string().min(1, 'Select a status'),
  notes: z.string().max(2000, 'Notes are too long').optional(),
});

type UpdateForm = z.infer<typeof updateSchema>;

const completeSchema = z.object({
  outputWeight: z
    .string()
    .min(1, 'Enter the output weight')
    .refine((value) => Number(value) > 0, 'Must be greater than 0'),
  qualityGrade: z.string().optional(),
  notes: z.string().max(2000, 'Notes are too long').optional(),
});

type CompleteForm = z.infer<typeof completeSchema>;

function rawInventoryLabel(item: RawInventoryDTO): string {
  return `${item.materialName} · ${formatWeight(item.currentWeight)} · ${item.storageLocation}`;
}

function CreateBatchDialog({
  rawItems,
  open,
  onOpenChange,
}: {
  rawItems: RawInventoryDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { rawInventory: '', processingType: '', inputWeight: '', notes: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: CreateForm) =>
      inventoryService.createProcessing({
        rawInventory: values.rawInventory,
        processingType: values.processingType.trim(),
        inputWeight: Number(values.inputWeight),
        notes: values.notes?.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'processing'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'raw-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success('Processing batch created.');
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => toast.error(queryErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New processing batch</DialogTitle>
          <DialogDescription>
            Select a raw inventory item and define the processing details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="rawInventory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raw inventory</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select raw material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rawItems.length === 0 ? (
                        <SelectItem value="__none__" disabled>
                          No raw inventory available
                        </SelectItem>
                      ) : (
                        rawItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {rawInventoryLabel(item)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="processingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Processing type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Shredding" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inputWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Input weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" inputMode="decimal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Optional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={mutation.isPending}>
                Create batch
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function UpdateBatchDialog({
  batch,
  open,
  onOpenChange,
}: {
  batch: ProcessingBatchDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: { stage: batch.stage, status: batch.status, notes: batch.notes ?? '' },
  });

  const mutation = useMutation({
    mutationFn: (values: UpdateForm) =>
      inventoryService.updateProcessing(batch.id, {
        stage: values.stage,
        status: values.status,
        notes: values.notes?.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'processing'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'raw-inventory'] });
      toast.success('Batch updated.');
      onOpenChange(false);
    },
    onError: (error) => toast.error(queryErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update batch</DialogTitle>
          <DialogDescription>{batch.batchId}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ProcessingStage).map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {prettifyEnum(stage)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ProcessingStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {prettifyEnum(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Optional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={mutation.isPending}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CompleteBatchDialog({
  batch,
  open,
  onOpenChange,
}: {
  batch: ProcessingBatchDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<CompleteForm>({
    resolver: zodResolver(completeSchema),
    defaultValues: { outputWeight: '', qualityGrade: '', notes: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: CompleteForm) =>
      inventoryService.completeProcessing(batch.id, {
        outputWeight: Number(values.outputWeight),
        qualityGrade: (values.qualityGrade || undefined) as MaterialGrade | undefined,
        notes: values.notes?.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'processing'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'processed-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'raw-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success('Batch completed.');
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => toast.error(queryErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete batch</DialogTitle>
          <DialogDescription>
            Record the output weight and quality for {batch.batchId}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="outputWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Output weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" inputMode="decimal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qualityGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quality grade</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MATERIAL_GRADES.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            Grade {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Optional completion notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={mutation.isPending}>
                Complete batch
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function BatchActions({
  batch,
  onUpdate,
  onComplete,
}: {
  batch: ProcessingBatchDTO;
  onUpdate: (batch: ProcessingBatchDTO) => void;
  onComplete: (batch: ProcessingBatchDTO) => void;
}) {
  const isCompleted = batch.status === ProcessingStatus.COMPLETED;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreHorizontal className="h-4 w-4" />
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Processing</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onUpdate(batch)} disabled={isCompleted}>
          <SlidersHorizontal className="h-4 w-4" />
          Update batch
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onComplete(batch)} disabled={isCompleted}>
          <CheckCircle2 className="h-4 w-4" />
          Complete batch
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AdminProcessingPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [updateBatch, setUpdateBatch] = useState<ProcessingBatchDTO | null>(null);
  const [completeBatch, setCompleteBatch] = useState<ProcessingBatchDTO | null>(null);

  const params = useMemo(
    () => ({ page, limit: PAGE_SIZE, status: status === ALL ? undefined : status }),
    [page, status]
  );

  const batchesQuery = useQuery({
    queryKey: ['admin', 'processing', params],
    queryFn: () => inventoryService.processingList(params),
  });

  const rawQuery = useQuery({
    queryKey: ['admin', 'raw-inventory', 'for-processing'],
    queryFn: () => inventoryService.rawList({ page: 1, limit: 100 }),
    enabled: createOpen,
  });

  const availableRaw = (rawQuery.data?.items ?? []).filter(
    (item) =>
      item.status !== RawInventoryStatus.PROCESSED && item.status !== RawInventoryStatus.PROCESSING
  );

  const batches = batchesQuery.data?.items ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<Factory className="h-5 w-5" />}
        title="Processing"
        description="Track raw material batches through each processing stage."
        actions={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New batch
          </Button>
        }
      />

      <Card className="p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="admin-processing-status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="admin-processing-status" aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {Object.values(ProcessingStatus).map((option) => (
                  <SelectItem key={option} value={option}>
                    {prettifyEnum(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {status !== ALL ? (
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatus(ALL);
                  setPage(1);
                }}
              >
                Clear filter
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      {batchesQuery.isError ? (
        <ErrorState
          message={queryErrorMessage(batchesQuery.error)}
          onRetry={() => batchesQuery.refetch()}
        />
      ) : batchesQuery.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : batches.length === 0 ? (
        <EmptyState
          title="No processing batches"
          description="Create a processing batch from raw inventory to get started."
          action={
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New batch
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Input</TableHead>
                  <TableHead>Output</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{batch.batchId}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(batch.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-foreground">{batch.materialName}</p>
                      <p className="text-xs text-muted-foreground">
                        {prettifyEnum(batch.materialType)}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{batch.processingType}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {prettifyEnum(batch.stage)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatWeight(batch.inputWeight)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {batch.outputWeight != null ? formatWeight(batch.outputWeight) : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={batch.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <BatchActions
                        batch={batch}
                        onUpdate={setUpdateBatch}
                        onComplete={setCompleteBatch}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="space-y-4 md:hidden">
            {batches.map((batch) => (
              <Card key={batch.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{batch.batchId}</p>
                    <p className="text-xs text-muted-foreground">
                      {batch.materialName} · {prettifyEnum(batch.materialType)}
                    </p>
                  </div>
                  <StatusBadge status={batch.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {batch.processingType} · {prettifyEnum(batch.stage)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Input {formatWeight(batch.inputWeight)}
                  {batch.outputWeight != null ? ` · Output ${formatWeight(batch.outputWeight)}` : ''}
                </p>
                <BatchActions
                  batch={batch}
                  onUpdate={setUpdateBatch}
                  onComplete={setCompleteBatch}
                />
              </Card>
            ))}
          </div>

          {batchesQuery.data ? (
            <Pagination meta={batchesQuery.data.meta} onPageChange={setPage} />
          ) : null}
        </div>
      )}

      <CreateBatchDialog rawItems={availableRaw} open={createOpen} onOpenChange={setCreateOpen} />

      {updateBatch ? (
        <UpdateBatchDialog
          batch={updateBatch}
          open={updateBatch !== null}
          onOpenChange={(open) => {
            if (!open) setUpdateBatch(null);
          }}
        />
      ) : null}

      {completeBatch ? (
        <CompleteBatchDialog
          batch={completeBatch}
          open={completeBatch !== null}
          onOpenChange={(open) => {
            if (!open) setCompleteBatch(null);
          }}
        />
      ) : null}
    </div>
  );
}
