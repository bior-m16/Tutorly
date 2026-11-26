// Unit tables for the converter. Each unit converts to and from the category's base unit.

export interface Unit {
  id: string;
  label: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

export interface Category {
  id: string;
  label: string;
  units: Unit[];
  defaults: [string, string];
}

const linear = (id: string, label: string, factor: number): Unit => ({
  id,
  label,
  toBase: (v) => v * factor,
  fromBase: (v) => v / factor,
});

export const CATEGORIES: Category[] = [
  {
    id: 'length', label: 'Length', defaults: ['cm', 'in'],
    units: [
      linear('mm', 'mm', 0.001), linear('cm', 'cm', 0.01), linear('m', 'm', 1), linear('km', 'km', 1000),
      linear('in', 'in', 0.0254), linear('ft', 'ft', 0.3048), linear('yd', 'yd', 0.9144), linear('mi', 'mi', 1609.344),
    ],
  },
  {
    id: 'mass', label: 'Mass', defaults: ['kg', 'lb'],
    units: [
      linear('mg', 'mg', 1e-6), linear('g', 'g', 0.001), linear('kg', 'kg', 1), linear('t', 't', 1000),
      linear('oz', 'oz', 0.028349523125), linear('lb', 'lb', 0.45359237),
    ],
  },
  {
    id: 'temp', label: 'Temperature', defaults: ['C', 'F'],
    units: [
      { id: 'C', label: '°C', toBase: (v) => v, fromBase: (v) => v },
      { id: 'F', label: '°F', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
      { id: 'K', label: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  {
    id: 'area', label: 'Area', defaults: ['m2', 'ft2'],
    units: [
      linear('cm2', 'cm²', 1e-4), linear('m2', 'm²', 1), linear('km2', 'km²', 1e6), linear('ha', 'ha', 1e4),
      linear('in2', 'in²', 0.00064516), linear('ft2', 'ft²', 0.09290304), linear('ac', 'acre', 4046.8564224),
    ],
  },
  {
    id: 'volume', label: 'Volume', defaults: ['L', 'gal'],
    units: [
      linear('mL', 'mL', 0.001), linear('L', 'L', 1), linear('m3', 'm³', 1000),
      linear('cup', 'cup (US)', 0.2365882365), linear('gal', 'gal (US)', 3.785411784),
    ],
  },
  {
    id: 'speed', label: 'Speed', defaults: ['kmh', 'mph'],
    units: [
      linear('ms', 'm/s', 1), linear('kmh', 'km/h', 1 / 3.6), linear('mph', 'mph', 0.44704), linear('kn', 'knot', 0.514444),
    ],
  },
  {
    id: 'time', label: 'Time', defaults: ['min', 's'],
    units: [
      linear('s', 's', 1), linear('min', 'min', 60), linear('h', 'h', 3600), linear('d', 'day', 86400),
      linear('wk', 'week', 604800), linear('yr', 'year', 31557600),
    ],
  },
];

export function convert(value: number, from: Unit, to: Unit): number {
  return to.fromBase(from.toBase(value));
}
