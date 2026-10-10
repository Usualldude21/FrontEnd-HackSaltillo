import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
}

export function EmptyState({ action, description, icon: Icon = Inbox, title }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Icon aria-hidden="true" className="state-icon" size={24} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action === undefined ? null : <div className="state-action">{action}</div>}
    </div>
  );
}
