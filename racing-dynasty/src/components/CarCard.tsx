import type { ReactNode } from 'react';
import type { CarDef } from '../types';
import CarArt from './CarArt';
import RarityBadge from './RarityBadge';
import PRBadge from './PRBadge';
import Card from './Card';

interface CarCardProps {
  car: CarDef;
  pr: number;
  selected?: boolean;
  onClick?: () => void;
  footer?: ReactNode;
}

export default function CarCard({ car, pr, selected, onClick, footer }: CarCardProps) {
  return (
    <Card
      className={['car-card', selected ? 'selected' : '', onClick ? 'clickable' : ''].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      <div className="car-card-art">
        <CarArt silhouette={car.silhouette} colorPrimary={car.colorPrimary} colorSecondary={car.colorSecondary} size={120} />
      </div>
      <div className="car-card-info">
        <div className="car-card-name">{car.name}</div>
        <div className="car-card-brand">{car.brand}</div>
        <div className="car-card-badges">
          <RarityBadge rarity={car.rarity} />
          <PRBadge pr={pr} />
        </div>
      </div>
      {footer}
    </Card>
  );
}
