import { CircleCheck, CircleEllipsis, CircleOff } from "lucide-react";
import type { DataQuality } from "../../domain/telemetry";
import { Badge, type BadgeTone } from "./Badge";

const qualityPresentation: Record<DataQuality, { label: string; tone: BadgeTone; icon: typeof CircleCheck }> = {
  ok: { label: "Datos completos", tone: "success", icon: CircleCheck },
  partial: { label: "Datos parciales", tone: "warning", icon: CircleEllipsis },
  outage: { label: "Sin telemetría", tone: "neutral", icon: CircleOff },
};

interface DataQualityBadgeProps {
  quality: DataQuality;
}

export function DataQualityBadge({ quality }: DataQualityBadgeProps) {
  const presentation = qualityPresentation[quality];
  const Icon = presentation.icon;
  return (
    <Badge tone={presentation.tone}>
      <Icon aria-hidden="true" size={14} />
      {presentation.label}
    </Badge>
  );
}
