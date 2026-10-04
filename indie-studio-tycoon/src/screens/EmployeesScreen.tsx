import type { Employee } from "../types";
import { useGameDispatch, useGameState } from "../hooks/useGame";
import Card from "../components/Card";
import Button from "../components/Button";
import ProgressBar from "../components/ProgressBar";
import { roleLabel, fireCost, promotionCost, TRAINING_COST } from "../systems/employees";
import { formatMoney } from "../utils/format";

function EmployeeRow({ employee, money }: { employee: Employee; money: number }) {
  const dispatch = useGameDispatch();
  const canPromote = employee.level < 5 && money >= promotionCost(employee);
  const canTrain = money >= TRAINING_COST;
  const canFire = money >= fireCost(employee);

  return (
    <Card>
      <div className="employee-row-header">
        <div>
          <div className="employee-name">{employee.name}</div>
          <div className="employee-role">
            {roleLabel(employee.role)} · Livello {employee.level}
          </div>
        </div>
        <div className="employee-salary">{formatMoney(employee.salary)}/mese</div>
      </div>
      <ProgressBar value={employee.morale} label="Morale" tone={employee.morale < 40 ? "danger" : "success"} />
      <ProgressBar value={employee.productivity} label="Produttività" tone="accent" />
      <div className="employee-actions">
        <Button variant="secondary" disabled={!canPromote} onClick={() => dispatch({ type: "PROMOTE_EMPLOYEE", employeeId: employee.id })}>
          Promuovi ({formatMoney(promotionCost(employee))})
        </Button>
        <Button variant="secondary" disabled={!canTrain} onClick={() => dispatch({ type: "TRAIN_EMPLOYEE", employeeId: employee.id })}>
          Forma ({formatMoney(TRAINING_COST)})
        </Button>
        <Button variant="danger" disabled={!canFire} onClick={() => dispatch({ type: "FIRE_EMPLOYEE", employeeId: employee.id })}>
          Licenzia ({formatMoney(fireCost(employee))})
        </Button>
      </div>
    </Card>
  );
}

export default function EmployeesScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();

  return (
    <div className="screen employees-screen">
      <h1>Team</h1>
      <p className="screen-subtitle">{state.employees.length} dipendenti nello studio</p>
      {state.employees.map((e) => (
        <EmployeeRow key={e.id} employee={e} money={state.money} />
      ))}

      <h2 className="section-title">Candidati disponibili</h2>
      <Button variant="ghost" onClick={() => dispatch({ type: "REFRESH_CANDIDATES" })}>
        Cerca nuovi candidati
      </Button>
      {state.candidatePool.map((c) => (
        <Card key={c.id}>
          <div className="employee-row-header">
            <div>
              <div className="employee-name">{c.name}</div>
              <div className="employee-role">
                {roleLabel(c.role)} · Livello {c.level}
              </div>
            </div>
            <div className="employee-salary">{formatMoney(c.salary)}/mese</div>
          </div>
          <Button variant="primary" fullWidth onClick={() => dispatch({ type: "HIRE_EMPLOYEE", candidateId: c.id })}>
            Assumi
          </Button>
        </Card>
      ))}
    </div>
  );
}
