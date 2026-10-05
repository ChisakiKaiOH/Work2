import { useState } from 'react';
import { useGameDispatch } from '../game/hooks';
import Button from '../components/Button';

export default function NewGameScreen() {
  const dispatch = useGameDispatch();
  const [name, setName] = useState('');

  return (
    <div className="screen logo-screen">
      <div className="logo-mark">◆ RACING DYNASTY</div>
      <p className="logo-tagline">Colleziona. Potenzia. Domina il World Tour.</p>
      <div className="new-game-form">
        <label htmlFor="pilot-name">Come ti chiami, piloto?</label>
        <input
          id="pilot-name"
          className="text-input"
          value={name}
          maxLength={18}
          placeholder="Nome pilota"
          onChange={e => setName(e.target.value)}
        />
        <Button fullWidth onClick={() => dispatch({ type: 'NEW_GAME', name: name.trim() || 'Pilota' })}>
          Inizia la carriera
        </Button>
      </div>
    </div>
  );
}
