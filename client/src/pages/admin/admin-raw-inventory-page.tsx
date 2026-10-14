import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Package, Pencil } from 'lucide-react';
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
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { StatusBadge } from '@/components/shared/status-badge';
import { queryErrorMessage } from '@/context/query-provider';
import { formatCurrency, formatDate, formatWeight, prettifyEnum } from '@/lib/format';
import { inventoryService } from '@/services/inventory.service';
import {
  MATERIAL_CATEGORIES,
  PAGE_SIZE,
  RawInventoryStatus,
  type RawInventoryDTO,
} from '@/types';
import { toast } from 'sonner';

const ALL = 'all';

const updateSchema = z.object({
  status: z.string().min(1, 'Select a status'),
  storageLocation: z.string().trim().min(1, 'Enter a storage location').max(200, 'Too long'),
  currentWeight: z
    .string()
    .min(1, 'Enter the current weight')
    .refine((value) => Number(value) >= 0, 'Must be zero or more'),
});

type UpdateForm = z.infer<typeof updateSchema>;

function sourceName(source: RawInventoryDTO['sourceUser']): string {
  if (typeof source === 'string') return source;
  return source.name ?? '—';
}

function UpdateInventoryDialog({
  inventory,
  open,
  onOpenChange,
}: {
  inventory: RawInventoryDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      status: inventory.status,
      storageLocation: inventory.storageLocation,
      currentWeight: String(inventory.currentWeight),
    },
  });

  const mutation = useMutation({
    mutationFn: (values: UpdateForm) =>
      inventoryService.updateRaw(inventory.id, {
        status: values.status,
        storageLocation: values.storageLocation.trim(),
        currentWeight: Number(values.currentWeight),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'raw-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success('Raw inventory updated.');
      onOpenChange(false);
    },
    onError: (error) => toast.error(queryErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update raw inventory</DialogTitle>
          <DialogDescription>{inventory.materialName}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
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
                      {Object.values(RawInventoryStatus).map((status) => (
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
            <FormField
              control={form.control}
              name="storageLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Warehouse A - Bay 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current weight (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" inputMode="decimal" {...field} />
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

export default function AdminRawInventoryPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(ALL);
  const [material, setMaterial] = useState(ALL);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [editing, setEditing] = useState<RawInventoryDTO | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(q), 350);
    return () => window.clearTimeout(id);
  }, [q]);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      status: status === ALL ? undefined : status,
      material: material === ALL ? undefined : material,
      q: debouncedQ.trim() || undefined,
    }),
    [page, status, material, debouncedQ]
  );

  const inventoryQuery = useQuery({
    queryKey: ['admin', 'raw-inventory', params],
    queryFn: () => inventoryService.rawList(params),
  });

  const items = inventoryQuery.data?.items ?? [];
  const hasFilters = status !== ALL || material !== ALL || debouncedQ.trim() !== '';

  const resetFilters = () => {
    setStatus(ALL);
    setMaterial(ALL);
    setQ('');
    setDebouncedQ('');
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<Package className="h-5 w-5" />}
        title="Raw inventory"
        description="Materials purchased from sellers and awaiting processing."
      />

      <Card className="p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="admin-raw-search">Search</Label>
            <SearchInput
              value={q}
              onChange={(value) => {
                setQ(value);
                setPage(1);
              }}
              placeholder="Search by material or location"
              aria-label="Search raw inventory"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-raw-status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="admin-raw-status" aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {Object.values(RawInventoryStatus).map((option) => (
                  <SelectItem key={option} value={option}>
                    {prettifyEnum(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-raw-material">Material</Label>
            <Select
              value={material}
              onValueChange={(value) => {
                setMaterial(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="admin-raw-material" aria-label="Filter by material">
                <SelectValue placeholder="All materials" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All materials</SelectItem>
                {MATERIAL_CATEGORIES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {prettifyEnum(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {hasFilters ? (
          <div className="mt-4">
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
          </div>
        ) : null}
      </Card>

      {inventoryQuery.isError ? (
        <ErrorState
          message={queryErrorMessage(inventoryQuery.error)}
          onRetry={() => inventoryQuery.refetch()}
        />
      ) : inventoryQuery.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : items.length === 0 ? (
        <EmptyState
          title="No raw inventory"
          description="Purchased materials will appear here once requests are marked as purchased."
          action={
            hasFilters ? (
              <Button type="button" variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Current weight</TableHead>
                  <TableHead>Purchase price</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{item.materialName}</p>
                      <p className="text-xs text-muted-foreground">
                        {prettifyEnum(item.materialType)}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{sourceName(item.sourceUser)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatWeight(item.currentWeight)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCurrency(item.purchasePrice)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.storageLocation}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(item.receivedDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(item)}
                        aria-label={`Update ${item.materialName}`}
                      >
                        <Pencil className="h-4 w-4" />
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="space-y-4 md:hidden">
            {items.map((item) => (
              <Card key={item.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{item.materialName}</p>
                    <p className="text-xs text-muted-foreground">
                      {prettifyEnum(item.materialType)} · {sourceName(item.sourceUser)}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatWeight(item.currentWeight)} · {formatCurrency(item.purchasePrice)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.storageLocation} · {formatDate(item.receivedDate)}
                </p>
                <Button variant="outline" size="sm" onClick={() => setEditing(item)}>
                  <Pencil className="h-4 w-4" />
                  Update
                </Button>
              </Card>
            ))}
          </div>

          {inventoryQuery.data ? (
            <Pagination meta={inventoryQuery.data.meta} onPageChange={setPage} />
          ) : null}
        </div>
      )}

      {editing ? (
        <UpdateInventoryDialog
          inventory={editing}
          open={editing !== null}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}
