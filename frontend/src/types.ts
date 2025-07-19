export type CardType = 'Legend' | 'Epic' | 'Rare' | 'Common';

export interface PlayerCard {
  name: string;
  image: string;
  reward: number;
  rate: number;
  rarity: CardType;
}

export interface ChestConfig {
  name: string;
  price: number;
  rates: number[]; // [Legend, Epic, Rare, Common]
}

export interface OpenChestResult {
  card_type: CardType;
  reward: number;
  timestamp: number;
} 