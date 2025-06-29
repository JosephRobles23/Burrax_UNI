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
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-3 w-full">
        <Button
          onClick={onShowConfig}
          variant="outline"
          size="sm"
          className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 text-xs h-8 sm:h-9 px-3 sm:px-4"
        >
          <Settings className="h-3 w-3 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Configurar Horarios</span>
          <span className="sm:hidden">Configurar</span>
        </Button>
        <Button
          onClick={onShowRedistribution}
          variant="outline"
          size="sm"
          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 text-xs h-8 sm:h-9 px-3 sm:px-4"
        >
          <Users className="h-3 w-3 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Redistribución</span>
          <span className="sm:hidden">Redistrib.</span>
        </Button>
      </div>
    </InfoCard>
  );
} 