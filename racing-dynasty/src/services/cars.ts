import type { CarInstance, GameDate } from '../types';

let instanceCounter = 0;

export function createCarInstance(defId: string, date: GameDate, ownership: CarInstance['ownership'], rentalReturnsAtEntryId?: string): CarInstance {
  instanceCounter += 1;
  return {
    instanceId: `inst_${defId}_${date.year}${date.month}${date.day}_${instanceCounter}`,
    defId,
    ownership,
    condition: 100,
    acquiredDate: date,
    rentalReturnsAtEntryId,
  };
}

export function isRentalDue(instance: CarInstance, currentEntryId: string): boolean {
  return instance.ownership === 'rented' && instance.rentalReturnsAtEntryId === currentEntryId;
}
