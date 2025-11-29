import { toast } from 'sonner';
import { Gift, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
type NotificationType = 'success' | 'error' | 'info' | 'warning';
const icons: Record<NotificationType, React.ElementType> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
};
const iconColors: Record<NotificationType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
};
export function showNotification(
  type: NotificationType,
  title: string,
  description?: string
) {
  const Icon = icons[type];
  toast[type](
    <div className="flex items-start gap-3">
      <Icon className={cn('h-5 w-5 mt-0.5', iconColors[type])} />
      <div className="flex flex-col">
        <span className="font-semibold text-foreground">{title}</span>
        {description && (
          <span className="text-sm text-muted-foreground">{description}</span>
        )}
      </div>
    </div>,
    {
      duration: 5000,
    }
  );
}