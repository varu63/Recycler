import { useQuery } from '@tanstack/react-query';
import { Clock, ImageIcon, Mail, Settings, ShieldCheck, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { queryErrorMessage } from '@/context/query-provider';
import { prettifyEnum } from '@/lib/format';
import { adminService } from '@/services/admin.service';

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  return minutes >= 60 ? `${(minutes / 60).toFixed(1)} hours` : `${minutes} minutes`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function AdminSettingsPage() {
  const settingsQuery = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminService.settings(),
  });

  if (settingsQuery.isError) {
    return (
      <ErrorState
        message={queryErrorMessage(settingsQuery.error)}
        onRetry={() => settingsQuery.refetch()}
      />
    );
  }

  if (settingsQuery.isLoading || !settingsQuery.data) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-52 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const settings = settingsQuery.data;

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<Settings className="h-5 w-5" />}
        title="Settings"
        description="Read-only environment and platform configuration."
        actions={<Badge variant="outline">v{settings.version}</Badge>}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Environment
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <InfoRow label="Node environment" value={prettifyEnum(settings.nodeEnv)} />
            <InfoRow label="Image storage" value={prettifyEnum(settings.imageStorage)} />
            <InfoRow label="Email provider" value={prettifyEnum(settings.emailProvider)} />
            <InfoRow label="Application version" value={settings.version} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Rate limiting
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <InfoRow label="Window" value={formatDuration(settings.rateLimit.windowMs)} />
            <InfoRow label="Max requests" value={String(settings.rateLimit.max)} />
            <InfoRow label="Max login attempts" value={String(settings.rateLimit.loginMax)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4 text-primary" />
              Uploads
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <InfoRow label="Max files per upload" value={String(settings.uploads.maxFiles)} />
            <InfoRow label="Max file size" value={formatBytes(settings.uploads.maxSizeBytes)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4 text-primary" />
              Allowed image types
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {settings.uploads.allowedTypes.map((type) => (
                <Badge key={type} variant="secondary">
                  {type.replace('image/', '').toUpperCase()}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-primary" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              These values are configured through server environment variables and cannot be edited
              from the dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
