import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  BadgeDollarSign,
  Ban,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MoreHorizontal,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { queryErrorMessage } from '@/context/query-provider';
import { prettifyEnum } from '@/lib/format';
import { requestsService } from '@/services/requests.service';
import {
  MATERIAL_CATEGORIES,
  MATERIAL_GRADES,
  MATERIAL_QUALITIES,
  MaterialRequestStatus,
  PAYMENT_METHODS,
  type MaterialCategory,
  type MaterialGrade,
  type MaterialQuality,
  type MaterialRequestDTO,
  type PaymentMethod,
} from '@/types';
import { toast } from 'sonner';

type WorkflowAction =
  | 'review'
  | 'schedule'
  | 'inspection'
  | 'offer'
  | 'reject'
  | 'purchase'
  | 'complete';

type ConfirmAction = 'review' | 'purchase' | 'complete';
type FormAction = 'schedule' | 'inspection' | 'offer' | 'reject';

function invalidateRequestQueries(queryClient: QueryClient, requestId: string) {
  queryClient.invalidateQueries({ queryKey: ['admin', 'requests'] });
  queryClient.invalidateQueries({ queryKey: ['admin', 'request', requestId] });
  queryClient.invalidateQueries({ queryKey: ['admin', 'inspections'] });
  queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
  queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['requests'] });
}

const scheduleSchema = z.object({
  scheduledAt: z.string().min(1, 'Select a date and time'),
});

type ScheduleForm = z.infer<typeof scheduleSchema>;

const inspectionSchema = z.object({
  actualWeight: z
    .string()
    .min(1, 'Enter the actual weight')
    .refine((value) => Number(value) > 0, 'Must be greater than 0'),
  materialType: z.string().min(1, 'Select a material type'),
  grade: z.string().min(1, 'Select a grade'),
  quality: z.string().min(1, 'Select a quality'),
  notes: z.string().max(2000, 'Notes are too long').optional(),
});

type InspectionForm = z.infer<typeof inspectionSchema>;

const offerSchema = z.object({
  verifiedWeight: z
    .string()
    .min(1, 'Enter the verified weight')
    .refine((value) => Number(value) > 0, 'Must be greater than 0'),
  pricePerKg: z
    .string()
    .min(1, 'Enter the price per kg')
    .refine((value) => Number(value) >= 0, 'Must be zero or more'),
  pickupDate: z.string().min(1, 'Select a pickup date'),
  paymentMethod: z.string().min(1, 'Select a payment method'),
  notes: z.string().max(2000, 'Notes are too long').optional(),
});

type OfferForm = z.infer<typeof offerSchema>;

const rejectSchema = z.object({
  reason: z.string().trim().min(3, 'Provide a reason').max(2000, 'Reason is too long'),
});

type RejectForm = z.infer<typeof rejectSchema>;

interface DialogProps {
  requestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

function ScheduleInspectionDialog({ requestId, open, onOpenChange, onComplete }: DialogProps) {
  const queryClient = useQueryClient();
  const form = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { scheduledAt: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: ScheduleForm) =>
      requestsService.scheduleInspection(requestId, new Date(values.scheduledAt).toISOString()),
    onSuccess: () => {
      invalidateRequestQueries(queryClient, requestId);
      toast.success('Inspection scheduled.');
      form.reset();
      onOpenChange(false);
      onComplete?.();
    },
    onError: (error) => toast.error(queryErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule inspection</DialogTitle>
          <DialogDescription>
            Pick a date and time for the on-site inspection of this material.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspection date &amp; time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
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
                Schedule
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CreateInspectionDialog({
  request,
  open,
  onOpenChange,
  onComplete,
}: DialogProps & { request: MaterialRequestDTO }) {
  const queryClient = useQueryClient();
  const form = useForm<InspectionForm>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      actualWeight: String(request.approximateWeight ?? ''),
      materialType: request.materialType,
      grade: 'B',
      quality: 'GOOD',
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: InspectionForm) =>
      requestsService.createInspection(request.id, {
        actualWeight: Number(values.actualWeight),
        materialType: values.materialType as MaterialCategory,
        grade: values.grade as MaterialGrade,
        quality: values.quality as MaterialQuality,
        notes: values.notes?.trim() || undefined,
      }),
    onSuccess: () => {
      invalidateRequestQueries(queryClient, request.id);
      toast.success('Inspection recorded.');
      onOpenChange(false);
      onComplete?.();
    },
    onError: (error) => toast.error(queryErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record inspection</DialogTitle>
          <DialogDescription>
            Capture the verified weight, grade and quality of the material.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="actualWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actual weight (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" inputMode="decimal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="materialType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MATERIAL_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {prettifyEnum(category)}
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
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
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
              name="quality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quality</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MATERIAL_QUALITIES.map((quality) => (
                        <SelectItem key={quality} value={quality}>
                          {prettifyEnum(quality)}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Optional inspection notes" {...field} />
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
                Save inspection
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CreateOfferDialog({
  request,
  open,
  onOpenChange,
  onComplete,
}: DialogProps & { request: MaterialRequestDTO }) {
  const queryClient = useQueryClient();
  const form = useForm<OfferForm>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      verifiedWeight: String(request.approximateWeight ?? ''),
      pricePerKg: '',
      pickupDate: '',
      paymentMethod: 'BANK_TRANSFER',
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: OfferForm) =>
      requestsService.createOffer(request.id, {
        verifiedWeight: Number(values.verifiedWeight),
        pricePerKg: Number(values.pricePerKg),
        pickupDate: new Date(values.pickupDate).toISOString(),
        paymentMethod: values.paymentMethod as PaymentMethod,
        notes: values.notes?.trim() || undefined,
      }),
    onSuccess: () => {
      invalidateRequestQueries(queryClient, request.id);
      toast.success('Purchase offer created.');
      onOpenChange(false);
      onComplete?.();
    },
    onError: (error) => toast.error(queryErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create purchase offer</DialogTitle>
          <DialogDescription>
            Send the seller a purchase offer based on the verified inspection.
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
                name="verifiedWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verified weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" inputMode="decimal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pricePerKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per kg</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        placeholder="$ / kg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="pickupDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment method</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            {prettifyEnum(method)}
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
                    <Textarea rows={3} placeholder="Optional notes for the seller" {...field} />
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
                Send offer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function RejectRequestDialog({ requestId, open, onOpenChange, onComplete }: DialogProps) {
  const queryClient = useQueryClient();
  const form = useForm<RejectForm>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: RejectForm) => requestsService.reject(requestId, values.reason),
    onSuccess: () => {
      invalidateRequestQueries(queryClient, requestId);
      toast.success('Request rejected.');
      form.reset();
      onOpenChange(false);
      onComplete?.();
    },
    onError: (error) => toast.error(queryErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject request</DialogTitle>
          <DialogDescription>
            The seller will be notified with the reason below. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rejection reason</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Explain why this request is rejected" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" loading={mutation.isPending}>
                Reject request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function actionsFor(status: MaterialRequestStatus): WorkflowAction[] {
  const actions: WorkflowAction[] = [];
  if (status === MaterialRequestStatus.SUBMITTED) actions.push('review');
  if (status === MaterialRequestStatus.SUBMITTED || status === MaterialRequestStatus.UNDER_REVIEW) {
    actions.push('schedule');
  }
  if (status === MaterialRequestStatus.UNDER_REVIEW || status === MaterialRequestStatus.INSPECTION) {
    actions.push('inspection', 'offer');
  }
  if (
    status === MaterialRequestStatus.SUBMITTED ||
    status === MaterialRequestStatus.UNDER_REVIEW ||
    status === MaterialRequestStatus.INSPECTION ||
    status === MaterialRequestStatus.OFFER_MADE
  ) {
    actions.push('reject');
  }
  if (status === MaterialRequestStatus.ACCEPTED) actions.push('purchase');
  if (status === MaterialRequestStatus.PURCHASED) actions.push('complete');
  return actions;
}

const ACTION_META: Record<WorkflowAction, { label: string; icon: typeof ClipboardCheck }> = {
  review: { label: 'Move to review', icon: ClipboardCheck },
  schedule: { label: 'Schedule inspection', icon: CalendarClock },
  inspection: { label: 'Record inspection', icon: FileText },
  offer: { label: 'Create offer', icon: BadgeDollarSign },
  reject: { label: 'Reject request', icon: Ban },
  purchase: { label: 'Mark purchased', icon: ShoppingCart },
  complete: { label: 'Complete request', icon: CheckCircle2 },
};

const CONFIRM_COPY: Record<ConfirmAction, { title: string; description: string; confirmLabel: string }> = {
  review: {
    title: 'Move request to review?',
    description: 'This will start the review workflow for the submitted request.',
    confirmLabel: 'Move to review',
  },
  purchase: {
    title: 'Mark material as purchased?',
    description: 'This will create a raw inventory record from the accepted offer.',
    confirmLabel: 'Mark purchased',
  },
  complete: {
    title: 'Complete this request?',
    description: 'This will close the request and notify the seller.',
    confirmLabel: 'Complete request',
  },
};

export interface RequestWorkflowActionsProps {
  request: MaterialRequestDTO;
  onActionComplete?: () => void;
}

export function RequestWorkflowActions({
  request,
  onActionComplete,
}: RequestWorkflowActionsProps) {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState<FormAction | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const actions = actionsFor(request.status);

  const simpleMutation = useMutation({
    mutationFn: (action: ConfirmAction) => {
      if (action === 'review') return requestsService.review(request.id);
      if (action === 'purchase') return requestsService.purchase(request.id);
      return requestsService.complete(request.id);
    },
    onSuccess: (_data, action) => {
      invalidateRequestQueries(queryClient, request.id);
      toast.success(`Request ${action === 'review' ? 'moved to review' : action === 'purchase' ? 'marked as purchased' : 'completed'}.`);
      setConfirmAction(null);
      onActionComplete?.();
    },
    onError: (error) => toast.error(queryErrorMessage(error)),
  });

  const dispatch = (action: WorkflowAction) => {
    if (action === 'review' || action === 'purchase' || action === 'complete') {
      setConfirmAction(action);
    } else {
      setOpenDialog(action);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Workflow</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {actions.length === 0 ? (
            <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
          ) : (
            actions.map((action) => {
              const Icon = ACTION_META[action].icon;
              return (
                <DropdownMenuItem
                  key={action}
                  onSelect={() => dispatch(action)}
                  className={action === 'reject' ? 'text-destructive focus:text-destructive' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {ACTION_META[action].label}
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ScheduleInspectionDialog
        requestId={request.id}
        open={openDialog === 'schedule'}
        onOpenChange={(open) => setOpenDialog(open ? 'schedule' : null)}
        onComplete={onActionComplete}
      />
      <CreateInspectionDialog
        request={request}
        requestId={request.id}
        open={openDialog === 'inspection'}
        onOpenChange={(open) => setOpenDialog(open ? 'inspection' : null)}
        onComplete={onActionComplete}
      />
      <CreateOfferDialog
        request={request}
        requestId={request.id}
        open={openDialog === 'offer'}
        onOpenChange={(open) => setOpenDialog(open ? 'offer' : null)}
        onComplete={onActionComplete}
      />
      <RejectRequestDialog
        requestId={request.id}
        open={openDialog === 'reject'}
        onOpenChange={(open) => setOpenDialog(open ? 'reject' : null)}
        onComplete={onActionComplete}
      />

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        onConfirm={() => {
          if (confirmAction) simpleMutation.mutate(confirmAction);
        }}
        loading={simpleMutation.isPending}
        title={confirmAction ? CONFIRM_COPY[confirmAction].title : ''}
        description={confirmAction ? CONFIRM_COPY[confirmAction].description : undefined}
        confirmLabel={confirmAction ? CONFIRM_COPY[confirmAction].confirmLabel : undefined}
      />
    </>
  );
}
