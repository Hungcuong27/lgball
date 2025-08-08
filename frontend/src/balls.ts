import onanaImg from './assets/onana.png';
import maignanImg from './assets/maignan.png';
import stegenImg from './assets/stegen.png';
import degeaImg from './assets/degea.png';
import donnarummaImg from './assets/donnarumma.png';
import neuerImg from './assets/neuer.png';
import martinezImg from './assets/martinez.png';
import kaneImg from './assets/kane.png';
import osimhenImg from './assets/osimhen.png';
import lewandowskiImg from './assets/lewandowski.png';
import mbappeImg from './assets/mbappe.png';
import haalandImg from './assets/haaland.png';
import bruyneImg from './assets/bruyne.png';
import riceImg from './assets/rice.png';
import brunoImg from './assets/bruno.png';
import rodriImg from './assets/rodri.png';
import odegaardImg from './assets/odegaard.png';
import bellinghamImg from './assets/bellingham.png';
import daviesImg from './assets/davies.png';
import maguireImg from './assets/maguire.png';
import koundeImg from './assets/kounde.png';
import arnoldImg from './assets/arnold.png';
import hakimiImg from './assets/hakimi.png';
import diasImg from './assets/dias.png';

export const BALLS = {
  bronzeBall: {
    name: 'Bronze Ball',
    price: 0.5,
    players: [
      {
        name: 'Onana',
        image: onanaImg,
        reward: 0.005,
        rate: 29,
        rarity: 'Common',
      },
      {
        name: 'Maignan',
        image: maignanImg,
        reward: 0.01,
        rate: 35,
        rarity: 'Common',
      },
      {
        name: 'Stegen',
        image: stegenImg,
        reward: 0.025,
        rate: 20,
        rarity: 'Rare',
      },
      {
        name: 'Degea',
        image: degeaImg,
        reward: 0.05,
        rate: 10,
        rarity: 'Rare',
      },
      {
        name: 'Donnarumma',
        image: donnarummaImg,
        reward: 0.1,
        rate: 5,
        rarity: 'Epic',
      },
      {
        name: 'Neuer',
        image: neuerImg,
        reward: 0.5,
        rate: 1,
        rarity: 'Epic',
      },
    ],
  },
  diamondBall: {
    name: 'Diamond Ball',
    price: 5,
    players: [
      { name: 'Martínez', image: martinezImg, reward: 0.05, rate: 20, rarity: 'Common' },
      { name: 'Kane', image: kaneImg, reward: 0.1, rate: 35, rarity: 'Common' },
      { name: 'Osimhen', image: osimhenImg, reward: 0.25, rate: 24, rarity: 'Rare' },
      { name: 'Lewandowski', image: lewandowskiImg, reward: 0.5, rate: 13, rarity: 'Rare' },
      { name: 'Mbappé', image: mbappeImg, reward: 2, rate: 7, rarity: 'Epic' },
      { name: 'Haaland', image: haalandImg, reward: 5, rate: 1, rarity: 'Epic' },
    ],
  },
  goldBall: {
    name: 'Gold Ball',
    price: 2,
    players: [
      { name: 'Bruyne', image: bruyneImg, reward: 0.02, rate: 25, rarity: 'Common' },
      { name: 'Rice', image: riceImg, reward: 0.05, rate: 37, rarity: 'Common' },
      { name: 'Bruno', image: brunoImg, reward: 0.1, rate: 20, rarity: 'Rare' },
      { name: 'Rodri', image: rodriImg, reward: 0.25, rate: 12, rarity: 'Rare' },
      { name: 'Ødegaard', image: odegaardImg, reward: 0.5, rate: 5, rarity: 'Epic' },
      { name: 'Bellingham', image: bellinghamImg, reward: 2, rate: 1, rarity: 'Epic' },
    ],
  },
  silverBall: {
    name: 'Silver Ball',
    price: 1,
    players: [
      { name: 'Davies', image: daviesImg, reward: 0.01, rate: 27, rarity: 'Common' },
      { name: 'Maguire', image: maguireImg, reward: 0.025, rate: 35, rarity: 'Common' },
      { name: 'Koundé', image: koundeImg, reward: 0.05, rate: 22, rarity: 'Rare' },
      { name: 'Arnold', image: arnoldImg, reward: 0.1, rate: 10, rarity: 'Rare' },
      { name: 'Hakimi', image: hakimiImg, reward: 0.2, rate: 5, rarity: 'Epic' },
      { name: 'Dias', image: diasImg, reward: 1, rate: 1, rarity: 'Epic' },
    ],
  },
  // Các ball khác sẽ bổ sung sau
}; 