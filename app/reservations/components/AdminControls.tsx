import { Crown, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InfoCard from '@/components/ui/info-card';

interface AdminControlsProps {
  onShowConfig: () => void;
  onShowRedistribution: () => void;
}

export default function AdminControls({ onShowConfig, onShowRedistribution }: AdminControlsProps) {
  return (
    <InfoCard
      title="Panel de Administración"
      icon={Crown}
      iconColor="text-yellow-500"
    >
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
        <Button
          onClick={onShowConfig}
          variant="outline"
          size="sm"
          className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 text-xs sm:text-sm"
        >
          <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Configurar Horarios
        </Button>
        <Button
          onClick={onShowRedistribution}
          variant="outline"
          size="sm"
          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 text-xs sm:text-sm"
        >
          <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Redistribución
        </Button>
      </div>
    </InfoCard>
  );
} 