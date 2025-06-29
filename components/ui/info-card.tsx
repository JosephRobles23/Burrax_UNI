import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface InfoCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'outlined';
}

const variants = {
  default: '',
  glass: 'glass-card',
  outlined: 'border border-gray-700'
};

export default function InfoCard({ 
  title, 
  description, 
  icon: Icon, 
  iconColor = 'text-yellow-500',
  children, 
  className,
  variant = 'glass'
}: InfoCardProps) {
  return (
    <Card className={cn(variants[variant], 'p-4 sm:p-6', className)}>
      {(title || Icon) && (
        <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
          {Icon && <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', iconColor)} />}
          {title && (
            <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
          )}
        </div>
      )}
      
      {description && (
        <p className="text-gray-400 text-sm sm:text-base mb-4">{description}</p>
      )}
      
      {children}
    </Card>
  );
} 