import onanaImg from './assets/onana.png';
import maignanImg from './assets/maignan.png';
import stegenImg from './assets/stegen.png';
import degeaImg from './assets/degea.png';
import donnarummaImg from './assets/donnarumma.png';
import neuerImg from './assets/neuer.png';

export const BALLS = {
  bronzeBall: {
    name: 'Bronze Ball',
    price: 0.5,
    players: [
      {
        name: 'Onana',
        image: onanaImg,
        reward: 0.001,
        rate: 16.7,
        rarity: 'Common',
      },
      {
        name: 'Maignan',
        image: maignanImg,
        reward: 0.005,
        rate: 16.7,
        rarity: 'Common',
      },
      {
        name: 'Stegen',
        image: stegenImg,
        reward: 0.01,
        rate: 16.7,
        rarity: 'Common',
      },
      {
        name: 'Degea',
        image: degeaImg,
        reward: 0.025,
        rate: 16.7,
        rarity: 'Common',
      },
      {
        name: 'Donnarumma',
        image: donnarummaImg,
        reward: 0.1,
        rate: 16.7,
        rarity: 'Common',
      },
      {
        name: 'Neuer',
        image: neuerImg,
        reward: 0.5,
        rate: 16.7,
        rarity: 'Common',
      },
    ],
  },
  // Các ball khác sẽ bổ sung sau
}; 