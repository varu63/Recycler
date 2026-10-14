import { Badge } from '@/components/ui/badge';
import type { MaterialCategory, MaterialGrade, MaterialQuality } from '@shared/enums';
import { prettifyEnum } from '@/lib/format';

const materialLabels: Record<string, string> = {
  metal: 'Metal',
  plastic: 'Plastic',
  paper: 'Paper',
  glass: 'Glass',
  electronics: 'Electronics',
  textile: 'Textile',
  rubber: 'Rubber',
  wood: 'Wood',
  organic: 'Organic',
  construction: 'Construction',
  other: 'Other',
};

const gradeLabels: Record<string, string> = {
  a: 'Grade A',
  b: 'Grade B',
  c: 'Grade C',
  mixed: 'Mixed',
};



export function MaterialBadge({ material }: { material: MaterialCategory | string }) {
  return <Badge variant="outline">{materialLabels[material] || material}</Badge>;
}

export function GradeBadge({ grade }: { grade: MaterialGrade | string }) {
  return <Badge variant="secondary">{gradeLabels[grade] || grade}</Badge>;
}

export function QualityBadge({ quality, verified = false }: { quality: MaterialQuality | string; verified?: boolean }) {
  return (
    <Badge variant="outline" className="gap-1 text-xs">
      {prettifyEnum(String(quality))}
      {verified ? ' ✓ Verified' : ''}
    </Badge>
  );
}


