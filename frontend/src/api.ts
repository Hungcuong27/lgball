// API base: ưu tiên cấu hình build-time, fallback '/api' (dùng khi có proxy)
const API_BASE = (import.meta as any)?.env?.VITE_BACKEND_API || '/api';

export async function registerUser(address: string, referrer?: string) {
  const res = await fetch(`${API_BASE}/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, referrer }),
  });
  return await res.json();
}

export async function getUser(address: string, ref?: string) {
  const qs = ref ? `?address=${encodeURIComponent(address)}&ref=${encodeURIComponent(ref)}` : `?address=${encodeURIComponent(address)}`;
  const res = await fetch(`${API_BASE}/user${qs}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return json;
  } catch (e) {
    throw e;
  }
}

export async function getReferrals(address: string) {
  try {
    const res = await fetch(`${API_BASE}/referrals?address=${address}`);
    if (!res.ok) {
      console.error('Referrals API error:', res.status, res.statusText);
      return { referrals: [], referral_link: null };
    }
    const data = await res.json();
    // Backend trả về {referrals: [...], referral_link: "..."}
    return data;
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return { referrals: [], referral_link: null };
  }
}

export async function getReferralCommissions(address: string) {
  try {
    const res = await fetch(`${API_BASE}/referral-commissions?address=${address}`);
    if (!res.ok) {
      console.error('Referral commissions API error:', res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching referral commissions:', error);
    return [];
  }
}

export async function getOpenHistory(address: string) {
  const res = await fetch(`${API_BASE}/open-history?address=${address}`);
  return await res.json();
}

export async function getTransactions(address: string) {
  const res = await fetch(`${API_BASE}/transactions?address=${address}`);
  return await res.json();
}

export async function deposit(address: string, amount: number, tx_hash: string) {
  const res = await fetch(`${API_BASE}/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, amount, tx_hash }),
  });
  const result = await res.json();
  return result;
}

export async function withdraw(address: string, amount: number) {
  const res = await fetch(`${API_BASE}/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, amount }),
  });
  return await res.json();
}

export async function openChest(address: string, chestType: string) {
  const res = await fetch(`${API_BASE}/open-chest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, chest_type: chestType }),
  });
  return await res.json();
}

export async function getCollection(address: string) {
  const res = await fetch(`${API_BASE}/collection?address=${address}`);
  return await res.json();
}

export async function getHistory(address: string) {
  const res = await fetch(`${API_BASE}/history?address=${address}`);
  return await res.json();
} 

export async function checkin(address: string) {
  const res = await fetch(`${API_BASE}/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address })
  });
  return await res.json();
}

export async function claimDailyTon(address: string) {
  const res = await fetch(`${API_BASE}/claim-daily-ton`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address })
  });
  return await res.json();
}

export async function getCheckinHistory(address: string) {
  const res = await fetch(`${API_BASE}/checkin-history?address=${encodeURIComponent(address)}`);
  return await res.json();
}

export async function getDailyTonHistory(address: string) {
  const res = await fetch(`${API_BASE}/daily-ton-history?address=${encodeURIComponent(address)}`);
  return await res.json();
}