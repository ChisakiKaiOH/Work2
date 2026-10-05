import type { DriverDef, GameDate } from '../types';

/** A real multi-event contract: the driver joins the roster for a fixed number of races. */
export function hireDriver(driver: DriverDef, teamId: string, startDate: GameDate, durationEvents: number, salaryPerEvent: number): DriverDef {
  return {
    ...driver,
    status: 'contracted',
    teamId,
    contract: { teamId, startDate, durationEvents, eventsServed: 0, salaryPerEvent },
  };
}

/** A rental is just a 1-event contract at the (higher) rental rate — same machinery, shorter term. */
export function rentDriverForOneEvent(driver: DriverDef, teamId: string, startDate: GameDate): DriverDef {
  return hireDriver(driver, teamId, startDate, 1, driver.rentPricePerEvent);
}

export function releaseDriver(driver: DriverDef): DriverDef {
  return { ...driver, status: 'free_agent', teamId: undefined, contract: undefined };
}

/** Call once per completed race for every contracted driver; auto-releases once the term is served. */
export function tickDriverContract(driver: DriverDef): DriverDef {
  if (!driver.contract) return driver;
  const eventsServed = driver.contract.eventsServed + 1;
  if (eventsServed >= driver.contract.durationEvents) {
    return releaseDriver(driver);
  }
  return { ...driver, contract: { ...driver.contract, eventsServed } };
}

export function renegotiateSalary(driver: DriverDef, newSalaryPerEvent: number): DriverDef {
  if (!driver.contract) return driver;
  return { ...driver, contract: { ...driver.contract, salaryPerEvent: newSalaryPerEvent } };
}
