import { describe, expect, it } from 'vitest';
import { hireDriver, rentDriverForOneEvent, releaseDriver, tickDriverContract, renegotiateSalary } from './contracts';
import { DRIVERS } from '../data';

const date = { year: 1970, month: 1, day: 1 };
const baseDriver = DRIVERS[0];

describe('contracts', () => {
  it('hireDriver sets status, team and a full contract record', () => {
    const hired = hireDriver(baseDriver, 'team_player', date, 5, 15000);
    expect(hired.status).toBe('contracted');
    expect(hired.teamId).toBe('team_player');
    expect(hired.contract).toEqual({ teamId: 'team_player', startDate: date, durationEvents: 5, eventsServed: 0, salaryPerEvent: 15000 });
  });

  it('rentDriverForOneEvent is just a 1-event contract at the rental rate', () => {
    const rented = rentDriverForOneEvent(baseDriver, 'team_player', date);
    expect(rented.contract?.durationEvents).toBe(1);
    expect(rented.contract?.salaryPerEvent).toBe(baseDriver.rentPricePerEvent);
  });

  it('releaseDriver returns the driver to a clean free-agent state', () => {
    const hired = hireDriver(baseDriver, 'team_player', date, 5, 15000);
    const released = releaseDriver(hired);
    expect(released.status).toBe('free_agent');
    expect(released.teamId).toBeUndefined();
    expect(released.contract).toBeUndefined();
  });

  it('tickDriverContract advances eventsServed and auto-releases once the term is served — edge case', () => {
    let driver = hireDriver(baseDriver, 'team_player', date, 2, 15000);
    driver = tickDriverContract(driver);
    expect(driver.status).toBe('contracted');
    expect(driver.contract?.eventsServed).toBe(1);
    driver = tickDriverContract(driver);
    expect(driver.status).toBe('free_agent');
    expect(driver.contract).toBeUndefined();
  });

  it('tickDriverContract on a driver with no contract is a no-op — edge case', () => {
    const result = tickDriverContract(baseDriver);
    expect(result).toBe(baseDriver);
  });

  it('renegotiateSalary updates only the salary field of an existing contract', () => {
    const hired = hireDriver(baseDriver, 'team_player', date, 5, 15000);
    const renegotiated = renegotiateSalary(hired, 20000);
    expect(renegotiated.contract?.salaryPerEvent).toBe(20000);
    expect(renegotiated.contract?.durationEvents).toBe(5);
  });

  it('renegotiateSalary on a free agent (no contract) is a no-op — edge case', () => {
    expect(renegotiateSalary(baseDriver, 99999)).toBe(baseDriver);
  });
});
