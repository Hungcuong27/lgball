import { ChestConfig } from './types';

export const CHESTS: Record<string, ChestConfig> = {
  bronzeBall: {
    name: 'Bronze Ball',
    price: 0.5,
    rates: [1, 4, 15, 80],
  },
  silverBall: {
    name: 'Silver Ball',
    price: 1,
    rates: [3, 7, 20, 70],
  },
  goldBall: {
    name: 'Gold Ball',
    price: 2,
    rates: [7, 13, 30, 50],
  },
  diamondBall: {
    name: 'Diamond Ball',
    price: 5,
    rates: [15, 25, 30, 30],
  },
}; 