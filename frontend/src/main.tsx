import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

createRoot(document.getElementById('root')!).render(
  <TonConnectUIProvider manifestUrl="https://ton-connect.github.io/demo-dapp-with-wallet/tonconnect-manifest.json">
    <App />
  </TonConnectUIProvider>
); 