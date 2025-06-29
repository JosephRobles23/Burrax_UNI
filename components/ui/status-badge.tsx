import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: 'active' | 'upcoming' | 'completed' | 'full' | 'confirmed' | 'expired' | 'available';
  label: string;
  className?: string;
}

const statusStyles = {
  active: 'bg-green-500/20 text-green-400 border-green-500/50 animate-pulse',
  upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  completed: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
  full: 'bg-red-500/20 text-red-400 border-red-500/50',
  confirmed: 'bg-green-500/20 text-green-400 border-green-500/50',
  expired: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
  available: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
};

export default function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge className={cn(statusStyles[status], className)}>
      {label}
    </Badge>
  );
} 