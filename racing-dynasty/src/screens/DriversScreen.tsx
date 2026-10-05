import { useGameState, useGameDispatch } from '../game/hooks';
import Card from '../components/Card';
import Button from '../components/Button';

const HIRE_DURATION = 5; // events

export default function DriversScreen() {
  const player = useGameState();
  const dispatch = useGameDispatch();
  if (!player) return null;

  const team = player.teams[player.playerTeamId];
  const allDrivers = Object.values(player.drivers);
  const contracted = team.driverIds.map(id => player.drivers[id]).filter(Boolean);
  const freeAgents = allDrivers.filter(d => d.status === 'free_agent');

  return (
    <div className="screen drivers-screen">
      <h1>Piloti</h1>

      <h2>La tua squadra</h2>
      {contracted.length === 0 && <p className="muted">Non hai ancora ingaggiato nessun pilota.</p>}
      {contracted.map(driver => (
        <Card key={driver.id} className="driver-card">
          <div className="driver-card-info">
            <strong>{driver.displayName}</strong>
            <p className="muted">{driver.nationality} · Rating {driver.rating} · Esperienza {driver.experience}</p>
            {driver.contract && <p className="muted">Contratto: {driver.contract.eventsServed}/{driver.contract.durationEvents} eventi · {driver.contract.salaryPerEvent.toLocaleString('it-IT')} ◈/evento</p>}
          </div>
          <div className="driver-card-actions">
            <Button
              variant={player.selectedDriverId === driver.id ? 'secondary' : 'primary'}
              disabled={player.selectedDriverId === driver.id}
              onClick={() => dispatch({ type: 'SELECT_RACE_DRIVER', driverId: driver.id })}
            >
              {player.selectedDriverId === driver.id ? 'In pista' : 'Schiera'}
            </Button>
            <Button variant="danger" onClick={() => dispatch({ type: 'RELEASE_DRIVER', driverId: driver.id })}>Rilascia</Button>
          </div>
        </Card>
      ))}

      <h2>Mercato piloti</h2>
      <div className="driver-list">
        {freeAgents.map(driver => (
          <Card key={driver.id} className="driver-card">
            <div className="driver-card-info">
              <strong>{driver.displayName}</strong>
              <p className="muted">{driver.nationality} · {1970 - driver.birthYear} anni · Rating {driver.rating} (pot. {driver.potential})</p>
              <p className="muted">Ingaggio: {driver.salaryPerEvent.toLocaleString('it-IT')} ◈/evento · Noleggio 1 gara: {driver.rentPricePerEvent.toLocaleString('it-IT')} ◈</p>
            </div>
            <div className="driver-card-actions">
              <Button
                variant="secondary"
                onClick={() => dispatch({ type: 'HIRE_DRIVER', driverId: driver.id, durationEvents: HIRE_DURATION, salaryPerEvent: driver.salaryPerEvent })}
              >
                Ingaggia ({HIRE_DURATION} gare)
              </Button>
              <Button
                variant="ghost"
                disabled={team.budget < driver.rentPricePerEvent}
                onClick={() => dispatch({ type: 'RENT_DRIVER', driverId: driver.id })}
              >
                Noleggia (1 gara)
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
