import React, { useState, useEffect, useRef } from 'react';
import { CHESTS } from './chests';
import { RECEIVER_WALLET, BACKEND_API } from './config';
import { OpenChestResult } from './types';
import { useTonConnectUI, useTonWallet, TonConnectButton } from '@tonconnect/ui-react';
import { checkTonTransactionConfirmed } from './utils';
import BallInfoModal from './components/BallInfoModal';
import { BALLS } from './balls';
import { registerUser, getUser, getReferrals, getOpenHistory, getTransactions, deposit, withdraw } from './api';

// Import ảnh ball
import bronzeBallImg from './assets/bronze.png';
import silverBallImg from './assets/silver.png';
import goldBallImg from './assets/gold.png';
import diamondBallImg from './assets/diamond.png'; 
// Import ảnh cầu thủ
import onanaImg from './assets/onana.png';
import maignanImg from './assets/maignan.png';
import stegenImg from './assets/stegen.png';
import degeaImg from './assets/degea.png';
import donnarummaImg from './assets/donnarumma.png';
import neuerImg from './assets/neuer.png';

const BALL_IMAGES: Record<string, string> = {
  bronzeBall: bronzeBallImg,
  silverBall: silverBallImg,
  goldBall: goldBallImg,
  diamondBall: diamondBallImg,
};

// Map tên file ảnh sang import
const PLAYER_IMAGES: Record<string, string> = {
  'onana.png': onanaImg,
  'maignan.png': maignanImg,
  'stegen.png': stegenImg,
  'degea.png': degeaImg,
  'donnarumma.png': donnarummaImg,
  'neuer.png': neuerImg,
};

const LANGUAGES = {
  en: {
    home: 'Home',
    referral: 'Referral',
    history: 'History',
    wallet: 'Deposit/Withdraw TON',
    balance: 'Balance',
    daily_reward: 'Daily Reward',
    total_withdrawn: 'Total Withdrawn',
    open_ball: 'Open Ball',
    see_player_cards: 'See player cards info',
    not_enough_ton: 'Not enough TON to open ball!',
    opening_ball: 'Opening ball...',
    you_got: 'You got player card:',
    reward: 'Reward',
    per_day: 'TON/day',
    invite_friends: 'Referral - Invite friends',
    your_ref_link: 'Your referral link:',
    connect_wallet_to_get_link: 'Connect wallet to get referral link',
    open_history: 'Open Ball History',
    deposit_withdraw: 'Deposit / Withdraw TON',
    ton_to_deposit: 'TON to deposit (on-chain transfer)',
    deposit: 'Deposit',
    ton_to_withdraw: 'TON to withdraw',
    withdraw: 'Withdraw',
    withdraw_success: 'Withdraw successful! Tx hash: ',
    withdraw_failed: 'Withdraw failed: ',
    unknown_reason: 'Unknown reason',
    error: 'Error: ',
    deposit_success: 'Deposit successful!',
    deposit_failed: 'Deposit failed',
    tx_hash_missing: 'Cannot get transaction hash (tx_hash)!',
    tx_failed: 'Transaction failed',
    open: 'Open',
    disconnect_wallet: 'Disconnect wallet',
    deposit_withdraw_history: 'Deposit/Withdraw History',
    player_card: 'Player Card',
    amount: 'Amount',
    status: 'Status',
    time: 'Time',
    success: 'Success',
    failed: 'Failed',
    pending: 'Pending',
  },
  vi: {
    home: 'Trang chủ',
    referral: 'Referral',
    history: 'Lịch sử',
    wallet: 'Nạp/Rút TON',
    balance: 'Số dư (Balance)',
    daily_reward: 'Thưởng/ngày',
    total_withdrawn: 'Tổng đã rút',
    open_ball: 'Mở bóng',
    see_player_cards: 'Xem thông tin các thẻ cầu thủ',
    not_enough_ton: 'Không đủ TON để mở bóng!',
    opening_ball: 'Đang mở bóng...',
    you_got: 'Bạn nhận được thẻ cầu thủ:',
    reward: 'Thưởng',
    per_day: 'TON/ngày',
    invite_friends: 'Referral - Mời bạn bè',
    your_ref_link: 'Link mời của bạn:',
    connect_wallet_to_get_link: 'Kết nối ví để lấy link mời',
    open_history: 'Lịch sử mở bóng',
    deposit_withdraw: 'Nạp / Rút TON',
    ton_to_deposit: 'Số TON muốn nạp (chuyển on-chain)',
    deposit: 'Nạp',
    ton_to_withdraw: 'Số TON muốn rút',
    withdraw: 'Rút',
    withdraw_success: 'Rút thành công! Tx hash: ',
    withdraw_failed: 'Rút thất bại: ',
    unknown_reason: 'Không rõ lý do',
    error: 'Lỗi: ',
    deposit_success: 'Nạp thành công!',
    deposit_failed: 'Nạp thất bại',
    tx_hash_missing: 'Không lấy được mã giao dịch (tx_hash)!',
    tx_failed: 'Giao dịch thất bại',
    open: 'Mở',
    disconnect_wallet: 'Ngắt kết nối ví',
    deposit_withdraw_history: 'Lịch sử nạp/rút',
    player_card: 'Thẻ cầu thủ',
    amount: 'Số lượng',
    status: 'Trạng thái',
    time: 'Thời gian',
    success: 'Thành công',
    failed: 'Thất bại',
    pending: 'Đang xử lý',
  }
};

function App() {
  const [tonConnectUi] = useTonConnectUI();
  const wallet = useTonWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OpenChestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState<string | null>(null);
  const [nav, setNav] = useState('home');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [openHistory, setOpenHistory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletMsg, setWalletMsg] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'vi'>('en');
  const [langDropdown, setLangDropdown] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const t = LANGUAGES[lang];

  // Dummy data cho demo
  const tonDaily = 1.234; // tổng thưởng/ngày
  const tonWithdrawn = 2.5; // tổng đã rút
  const referralLink = wallet ? `${window.location.origin}/?ref=${wallet.account.address}` : '';

  // Thay vì dùng RECEIVER_WALLET, dùng biến receiver mới
  const receiver = "0:75e23fc820f0a8b09044cc42de4358136041b69fbb9384058422f2461a0e2b92";

  // Hàm kiểm tra giao dịch trên blockchain (giả lập, cần thay bằng truy vấn thực tế)
  async function checkTxConfirmed(txHash: string, address: string, amount: number) {
    // Kiểm tra giao dịch thực tế trên blockchain TON
    return await checkTonTransactionConfirmed(address, RECEIVER_WALLET, amount);
  }

  async function handleOpenBall(ballKey: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const ball = CHESTS[ballKey];
      if (!userInfo || userInfo.balance < ball.price) {
        setError('Không đủ TON để mở bóng!');
        setLoading(false)
        ;
        return;
      }
      // Gọi API mở bóng (không gửi giao dịch blockchain)
      const res = await fetch(`${BACKEND_API}/open-chest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: wallet?.account.address,
          chest_type: ballKey, // truyền trực tiếp ballKey
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        // Cập nhật lại balance
        getUser(wallet?.account.address || '').then(setUserInfo);
      }
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  }

  // Đăng ký user/referral khi kết nối ví
  useEffect(() => {
    if (wallet) {
      const url = new URL(window.location.href);
      const ref = url.searchParams.get('ref');
      registerUser(wallet.account.address, ref || undefined);
    }
  }, [wallet]);

  // Lấy thông tin user khi vào trang chủ
  useEffect(() => {
    if (wallet && nav === 'home') {
      getUser(wallet.account.address).then(setUserInfo);
    }
  }, [wallet, nav]);

  // Lấy referral khi vào màn referral
  useEffect(() => {
    if (wallet && nav === 'referral') {
      getReferrals(wallet.account.address).then(setReferrals);
    }
  }, [wallet, nav]);

  // Lấy lịch sử mở bóng khi vào màn history
  useEffect(() => {
    if (wallet && nav === 'history') {
      getOpenHistory(wallet.account.address).then(setOpenHistory);
    }
  }, [wallet, nav]);

  // Lấy lịch sử nạp/rút khi vào màn wallet
  useEffect(() => {
    if (wallet && nav === 'wallet') {
      getTransactions(wallet.account.address).then(setTransactions);
    }
  }, [wallet, nav]);

  // Nạp TON: mở ví, xác thực on-chain, gọi API deposit
  async function handleDeposit() {
    setWalletMsg(null);
    if (!wallet || !depositAmount) return;
    try {
      // 1. Mở ví xác nhận giao dịch
      const tx = await tonConnectUi.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: RECEIVER_WALLET,
          amount: (parseFloat(depositAmount) * 1e9).toString(),
        }],
      });
      // Lấy tx_hash từ kết quả trả về (dùng tx.boc)
      let tx_hash = tx?.boc || null;
      if (!tx_hash) {
        setWalletMsg(t.tx_hash_missing);
        return;
      }
      // 2. Xác thực giao dịch on-chain
      const confirmed = await checkTonTransactionConfirmed(wallet.account.address, receiver, parseFloat(depositAmount));
      if (!confirmed) {
        return;
      }
      // 3. Gọi API deposit để cộng balance
      await deposit(wallet.account.address, parseFloat(depositAmount), tx_hash);
      setWalletMsg(t.deposit_success);
      getUser(wallet.account.address).then(setUserInfo);
    } catch (e: any) {
      setWalletMsg(t.deposit_failed);
    }
  }

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangDropdown(false);
      }
    }
    if (langDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [langDropdown]);

  // NAVS phải nằm trong App và lấy label động
  const NAVS = [
    { key: 'home', label: t.home },
    { key: 'referral', label: t.referral },
    { key: 'history', label: t.history },
    { key: 'wallet', label: t.wallet },
  ];

  return (
    <div style={{ padding: 0, fontFamily: 'sans-serif', background: '#181c2b', minHeight: '100vh', color: '#fff' }}>
      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#23284a', padding: '0 32px', height: 60 }}>
        <div style={{ flex: 1, display: 'flex', gap: 24 }}>
          {NAVS.map(n => (
            <button
              key={n.key}
              onClick={() => setNav(n.key)}
              style={{ background: nav === n.key ? '#ffb300' : 'transparent', color: nav === n.key ? '#23284a' : '#fff', border: 'none', fontWeight: 'bold', fontSize: 16, padding: '8px 18px', borderRadius: 8, cursor: 'pointer' }}
            >
              {n.label}
            </button>
          ))}
        </div>
        <TonConnectButton />
        {wallet && (
          <>
            <button
              style={{ marginLeft: 16, background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer' }}
              onClick={() => {
                tonConnectUi.disconnect();
                setTimeout(() => window.location.reload(), 300);
              }}
            >
              {t.disconnect_wallet}
            </button>
            {/* Language Switcher Dropdown - moved here */}
            <div ref={langRef} style={{ marginLeft: 12, position: 'relative', display: 'inline-block', userSelect: 'none' }}>
              <button
                onClick={() => setLangDropdown(v => !v)}
                style={{ background: '#ffb300', color: '#23284a', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 'bold', cursor: 'pointer', minWidth: 90 }}
              >
                {lang === 'en' ? 'English' : 'Tiếng Việt'} ▼
              </button>
              {langDropdown && (
                <div style={{ position: 'absolute', top: '110%', right: 0, background: '#23284a', borderRadius: 8, boxShadow: '0 2px 8px #0006', minWidth: 120, overflow: 'hidden' }}>
                  <div
                    onClick={() => { setLang('en'); setLangDropdown(false); }}
                    style={{ padding: '10px 16px', cursor: 'pointer', color: lang === 'en' ? '#ffb300' : '#fff', background: lang === 'en' ? '#181c2b' : 'transparent', fontWeight: lang === 'en' ? 'bold' : 'normal' }}
                  >
                    English
                  </div>
                  <div
                    onClick={() => { setLang('vi'); setLangDropdown(false); }}
                    style={{ padding: '10px 16px', cursor: 'pointer', color: lang === 'vi' ? '#ffb300' : '#fff', background: lang === 'vi' ? '#181c2b' : 'transparent', fontWeight: lang === 'vi' ? 'bold' : 'normal' }}
                  >
                    Tiếng Việt
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32 }}>
        {nav === 'home' && (
          <>
            <h1 style={{ textAlign: 'center' }}>Football Card Gacha</h1>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, margin: '24px 0' }}>
              <div style={{ background: '#23284a', borderRadius: 12, padding: 18, minWidth: 180, textAlign: 'center' }}>
                <div style={{ fontSize: 15, color: '#aaa' }}>{t.balance}</div>
                <div style={{ fontSize: 28, color: '#ffb300', fontWeight: 'bold' }}>{(userInfo?.balance || 0).toFixed(4)} TON</div>
              </div>
              <div style={{ background: '#23284a', borderRadius: 12, padding: 18, minWidth: 180, textAlign: 'center' }}>
                <div style={{ fontSize: 15, color: '#aaa' }}>{t.daily_reward}</div>
                <div style={{ fontSize: 28, color: '#ffb300', fontWeight: 'bold' }}>{(userInfo?.ton_daily || 0).toFixed(4)} TON</div>
              </div>
              <div style={{ background: '#23284a', borderRadius: 12, padding: 18, minWidth: 180, textAlign: 'center' }}>
                <div style={{ fontSize: 15, color: '#aaa' }}>{t.total_withdrawn}</div>
                <div style={{ fontSize: 28, color: '#ffb300', fontWeight: 'bold' }}>{(userInfo?.ton_withdrawn || 0).toFixed(4)} TON</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', margin: '32px 0' }}>
              {Object.entries(CHESTS).map(([key, ball]) => (
                <div key={key} style={{ background: '#23284a', borderRadius: 16, padding: 24, minWidth: 180, boxShadow: '0 4px 16px #0006', textAlign: 'center', position: 'relative' }}>
                  <img src={BALL_IMAGES[key]} alt={ball.name} style={{ width: 96, height: 96, marginBottom: 12 }} />
                  <h2>{ball.name}</h2>
                  <div style={{ fontSize: 24, margin: '12px 0' }}>{ball.price} TON</div>
                  <button
                    style={{ padding: '10px 24px', borderRadius: 8, background: '#ffb300', color: '#23284a', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: 18 }}
                    disabled={loading || !wallet}
                    onClick={() => handleOpenBall(key)}
                  >
                    {t.open_ball}
                  </button>
                  <span
                    title={t.see_player_cards}
                    style={{ position: 'absolute', top: 12, right: 16, fontSize: 22, color: '#ffb300', cursor: 'pointer', fontWeight: 'bold', userSelect: 'none' }}
                    onClick={() => setInfoOpen(key)}
                  >
                    !
                  </span>
                  <BallInfoModal open={infoOpen === key} onClose={() => setInfoOpen(null)} players={BALLS[key]?.players || []} lang={lang} />
                </div>
              ))}
            </div>
            {loading && <div style={{ textAlign: 'center', fontSize: 20 }}>{t.opening_ball}</div>}
            {error && <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>}
            {result && (
              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <h2>{t.you_got}</h2>
                {result.player_card && (
                  <div style={{ fontSize: 28, color: '#ffb300', margin: 8 }}>
                    <b>{result.player_card}</b>
                  </div>
                )}
                {result.image && PLAYER_IMAGES[result.image] && (
                  <img src={PLAYER_IMAGES[result.image]} alt={result.player_card} style={{ width: 100, height: 100, margin: '12px 0' }} />
                )}
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#ffb300', margin: 16 }}>{result.card_type}</div>
                <div>{t.reward}: <b>{result.reward.toFixed(4)} {t.per_day}</b></div>
              </div>
            )}
          </>
        )}
        {nav === 'referral' && (
          <div style={{ maxWidth: 500, margin: '40px auto', background: '#23284a', borderRadius: 16, padding: 32 }}>
            <h2>{t.invite_friends}</h2>
            <div style={{ margin: '18px 0', fontSize: 15 }}>
              {t.your_ref_link}
              <div style={{ background: '#181c2b', padding: 10, borderRadius: 8, marginTop: 6, wordBreak: 'break-all', color: '#ffb300' }}>{referralLink || t.connect_wallet_to_get_link}</div>
            </div>
            {referrals.map(r => <div key={r.address}>{r.address}</div>)}
          </div>
        )}
        {nav === 'history' && (
          <div style={{ maxWidth: 600, margin: '40px auto', background: '#23284a', borderRadius: 16, padding: 32 }}>
            <h2>{t.open_history}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {openHistory.slice(0, 20).map(h => {
                // Tìm hình ảnh cầu thủ từ BALLS
                let playerImg = null;
                for (const ballKey in BALLS) {
                  const found = BALLS[ballKey]?.players?.find(p => p.name === h.player_card);
                  if (found) {
                    playerImg = found.image;
                    break;
                  }
                }
                return (
                  <div key={h.timestamp} style={{ display: 'flex', alignItems: 'center', background: '#181c2b', borderRadius: 12, padding: 16, gap: 18, boxShadow: '0 2px 8px #0003' }}>
                    {playerImg ? (
                      <img src={playerImg} alt={h.player_card} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '2px solid #444' }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: 10, background: '#23284a', color: '#ffb300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 }}>
                        {h.card_type || '?'}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: 18, color: '#ffb300' }}>{h.player_card}</div>
                      <div style={{ fontSize: 14, color: '#aaa' }}>{h.card_type} | {t.reward}: {h.reward?.toFixed(4)} TON</div>
                      <div style={{ fontSize: 13, color: '#aaa' }}>{new Date(h.timestamp*1000).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {nav === 'wallet' && (
          <div style={{ maxWidth: 500, margin: '40px auto', background: '#23284a', borderRadius: 16, padding: 32 }}>
            <h2>{t.deposit_withdraw}</h2>
            <div style={{ marginBottom: 18 }}>
              <input
                type="number"
                min="0"
                step="0.001"
                placeholder={t.ton_to_deposit}
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                style={{ padding: 8, borderRadius: 6, border: '1px solid #444', width: 180, marginRight: 8 }}
              />
              <button
                style={{ padding: '8px 18px', borderRadius: 8, background: '#ffb300', color: '#23284a', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                disabled={!wallet || !depositAmount}
                onClick={handleDeposit}
              >
                {t.deposit}
              </button>
            </div>
            <div style={{ marginBottom: 18 }}>
              <input
                type="number"
                min="0"
                step="0.001"
                placeholder={t.ton_to_withdraw}
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                style={{ padding: 8, borderRadius: 6, border: '1px solid #444', width: 180, marginRight: 8 }}
              />
              <button
                style={{ padding: '8px 18px', borderRadius: 8, background: '#ffb300', color: '#23284a', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                disabled={!wallet || !withdrawAmount}
                onClick={async () => {
                  setWalletMsg(null);
                  try {
                    const res = await withdraw(wallet?.account.address || '', parseFloat(withdrawAmount));
                    if (res.status === 'success') {
                      setWalletMsg(t.withdraw_success + res.tx_hash);
                    } else {
                      setWalletMsg(t.withdraw_failed + (res.error || t.unknown_reason));
                    }
                  } catch (e: any) {
                    setWalletMsg(t.error + (e.message || e.toString()));
                  }
                }}
              >
                {t.withdraw}
              </button>
            </div>
            {walletMsg && <div style={{ margin: '18px 0', color: '#ffb300' }}>{walletMsg}</div>}
            <h3 style={{ marginTop: 32 }}>{t.deposit_withdraw_history}</h3>
            {transactions.map(tn => (
              <div key={tn.timestamp}>
                {t[tn.type] || tn.type} - {tn.amount.toFixed(4)} TON - {t[tn.status] || tn.status} - {new Date(tn.timestamp*1000).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 