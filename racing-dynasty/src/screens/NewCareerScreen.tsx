import { useState } from 'react';
import { useGameDispatch } from '../game/hooks';
import Button from '../components/Button';

export default function NewCareerScreen() {
  const dispatch = useGameDispatch();
  const [teamName, setTeamName] = useState('');
  const [ownerName, setOwnerName] = useState('');

  return (
    <div className="screen logo-screen">
      <div className="logo-mark">◆ RACING DYNASTY</div>
      <p className="logo-tagline">Dal 1970 al 2026: costruisci la tua dinastia del motorsport.</p>
      <div className="new-game-form">
        <label htmlFor="team-name">Nome della scuderia</label>
        <input id="team-name" className="text-input" value={teamName} maxLength={28} placeholder="La mia scuderia" onChange={e => setTeamName(e.target.value)} />
        <label htmlFor="owner-name">Il tuo nome</label>
        <input id="owner-name" className="text-input" value={ownerName} maxLength={24} placeholder="Team Owner" onChange={e => setOwnerName(e.target.value)} />
        <Button fullWidth onClick={() => dispatch({ type: 'NEW_CAREER', teamName: teamName.trim(), ownerName: ownerName.trim() })}>
          Inizia la carriera — 1970
        </Button>
      </div>
    </div>
  );
}
