import { BACKEND_API } from './config';

export async function registerUser(address: string, referrer?: string) {
  const res = await fetch(`${BACKEND_API}/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, referrer }),
  });
  return await res.json();
}

export async function getUser(address: string) {
  const res = await fetch(`${BACKEND_API}/user?address=${address}`);
  return await res.json();
}

export async function getReferrals(address: string) {
  const res = await fetch(`${BACKEND_API}/referrals?address=${address}`);
  return await res.json();
}

export async function getOpenHistory(address: string) {
  const res = await fetch(`${BACKEND_API}/open-history?address=${address}`);
  return await res.json();
}

export async function getTransactions(address: string) {
  const res = await fetch(`${BACKEND_API}/transactions?address=${address}`);
  return await res.json();
}

export async function deposit(address: string, amount: number, tx_hash: string) {
  console.log('==DEBUG CALL API DEPOSIT==', { address, amount, tx_hash });
  const res = await fetch(`${BACKEND_API}/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, amount, tx_hash }),
  });
  const result = await res.json();
  console.log('==DEBUG API DEPOSIT RESPONSE==', result);
  return result;
}

export async function withdraw(address: string, amount: number) {
  const res = await fetch(`${BACKEND_API}/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, amount }),
  });
  return await res.json();
} 