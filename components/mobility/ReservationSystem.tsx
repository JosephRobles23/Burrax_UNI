'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useUserRole } from '@/hooks/use-user-role';
import { useReservationLogic } from '@/app/reservations/hooks/useReservationLogic';
import TimelineSchedule from './TimelineSchedule';
import ScheduleConfigModal from '@/components/admin/ScheduleConfigModal';
import SeatRedistribution from '@/app/admin/components/SeatRedistribution';
import {
  ReservationHeader,
  AdminControls,
  UserReservations,
  LocationValidationStep,
  SelfieStep,
  ConfirmationStep
} from '@/app/reservations/components';

interface ReservationSystemProps {
  user: User;
}

export default function ReservationSystem({ user }: ReservationSystemProps) {
  const { isAdmin } = useUserRole(user);
  const {
    currentStep,
    selectedSlot,
    selectedPassType,
    locationValidated,
    selfieData,
    reservationCounts,
    userReservations,
    isLoading,
    currentPeruTime,
    timeSlots,
    isLoadingConfig,
    getSlotAvailability,
    handleSlotSelection,
    handleLocationValidation,
    handleSelfieCapture,
    confirmReservation,
    resetReservation,
    fetchScheduleConfig,
    fetchReservationCounts,
  } = useReservationLogic(user);

  // Admin state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRedistribution, setShowRedistribution] = useState(false);

  const handleConfigUpdated = () => {
    fetchScheduleConfig();
    setShowConfigModal(false);
  };

  const handleRedistributionComplete = () => {
    fetchReservationCounts();
    setShowRedistribution(false);
  };

  // Render different steps
  if (currentStep === 'location' && selectedSlot) {
    return (
      <LocationValidationStep
        selectedSlot={selectedSlot}
        selectedPassType={selectedPassType}
        onValidation={handleLocationValidation}
        onCancel={resetReservation}
      />
    );
  }

  if (currentStep === 'selfie' && selectedSlot) {
    return (
      <SelfieStep
        selectedSlot={selectedSlot}
        selectedPassType={selectedPassType}
        onCapture={handleSelfieCapture}
      />
    );
  }

  if (currentStep === 'confirmation' && selectedSlot) {
    return (
      <ConfirmationStep
        selectedSlot={selectedSlot}
        selectedPassType={selectedPassType}
        isLoading={isLoading}
        onConfirm={confirmReservation}
        onCancel={resetReservation}
      />
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 xl:space-y-8">
      {/* Header with current time */}
      <ReservationHeader currentTime={currentPeruTime} />

      {/* Admin Controls */}
      {isAdmin && (
        <AdminControls
          onShowConfig={() => setShowConfigModal(true)}
          onShowRedistribution={() => setShowRedistribution(true)}
        />
      )}

      {/* My Reservations */}
      <UserReservations reservations={userReservations} />

      {/* Timeline Schedule */}
      <TimelineSchedule 
        timeSlots={timeSlots}
        reservationCounts={reservationCounts}
        onSlotSelection={handleSlotSelection}
        getSlotAvailability={getSlotAvailability}
        isLoading={isLoadingConfig}
      />

      {/* Modals */}
      {showConfigModal && (
        <ScheduleConfigModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          onConfigUpdated={handleConfigUpdated}
        />
      )}

      {showRedistribution && (
        <SeatRedistribution
          timeSlots={timeSlots}
          reservationCounts={reservationCounts}
          onRedistributionComplete={handleRedistributionComplete}
          isOpen={showRedistribution}
          onClose={() => setShowRedistribution(false)}
        />
      )}
    </div>
  );
}