import React from 'react';
import { StatusTag } from '@/components/ui';
import type { VehicleStatus } from '@/types';

interface Props {
  status: VehicleStatus;
  small?: boolean;
}

export function VehicleStatusBadge({ status, small }: Props) {
  return <StatusTag status={status} variant="vehicle" small={small} />;
}
