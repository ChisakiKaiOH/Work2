import type { TireType, Weather } from '../types';

/** Grip multiplier for each tyre compound under each weather condition. */
export const TIRE_GRIP_BY_WEATHER: Record<TireType, Record<Weather, number>> = {
  Street:    { Dry: 0.90, Rain: 0.80, HeavyRain: 0.55, Night: 0.88, Heat: 0.85, Cold: 0.82 },
  Sport:     { Dry: 1.08, Rain: 0.62, HeavyRain: 0.35, Night: 1.02, Heat: 1.05, Cold: 0.90 },
  Racing:    { Dry: 1.22, Rain: 0.45, HeavyRain: 0.22, Night: 1.10, Heat: 1.15, Cold: 0.85 },
  Rain:      { Dry: 0.68, Rain: 1.15, HeavyRain: 1.05, Night: 0.95, Heat: 0.60, Cold: 0.95 },
  WetRacing: { Dry: 0.55, Rain: 1.20, HeavyRain: 1.28, Night: 0.90, Heat: 0.50, Cold: 0.92 },
};

/** Braking multiplier — rain tyres also help stop the car on a wet track. */
export const TIRE_BRAKING_BY_WEATHER: Record<TireType, Record<Weather, number>> = {
  Street:    { Dry: 0.92, Rain: 0.82, HeavyRain: 0.60, Night: 0.90, Heat: 0.88, Cold: 0.85 },
  Sport:     { Dry: 1.05, Rain: 0.65, HeavyRain: 0.40, Night: 1.00, Heat: 1.02, Cold: 0.88 },
  Racing:    { Dry: 1.15, Rain: 0.50, HeavyRain: 0.28, Night: 1.05, Heat: 1.10, Cold: 0.85 },
  Rain:      { Dry: 0.72, Rain: 1.10, HeavyRain: 1.02, Night: 0.95, Heat: 0.65, Cold: 0.93 },
  WetRacing: { Dry: 0.60, Rain: 1.15, HeavyRain: 1.22, Night: 0.92, Heat: 0.55, Cold: 0.90 },
};

/** How each weather condition scales raw acceleration & reliability, independent of tyre choice. */
export const WEATHER_ACCEL_MULT: Record<Weather, number> = {
  Dry: 1.0, Rain: 0.86, HeavyRain: 0.72, Night: 0.97, Heat: 0.95, Cold: 0.93,
};
export const WEATHER_RELIABILITY_MULT: Record<Weather, number> = {
  Dry: 1.0, Rain: 0.95, HeavyRain: 0.85, Night: 1.0, Heat: 0.88, Cold: 0.92,
};

export const TIRE_LABEL_IT: Record<TireType, string> = {
  Street: 'Street', Sport: 'Sport', Racing: 'Racing', Rain: 'Rain', WetRacing: 'Wet Racing',
};
export const WEATHER_LABEL_IT: Record<Weather, string> = {
  Dry: 'Asciutto', Rain: 'Pioggia', HeavyRain: 'Pioggia intensa',
  Night: 'Notte', Heat: 'Caldo estremo', Cold: 'Freddo',
};
