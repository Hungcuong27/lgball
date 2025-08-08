import React, { useState, useEffect, useRef } from 'react';
import { CHESTS } from './chests';
import { RECEIVER_WALLET } from './config';
import { OpenChestResult } from './types';
import { useTonConnectUI, useTonWallet, TonConnectButton } from '@tonconnect/ui-react';
import TonWeb from 'tonweb';

import { checkTonTransactionConfirmed } from './utils';
import BallInfoModal from './components/BallInfoModal';
import { BALLS } from './balls';
import { registerUser, getUser, getReferrals, getReferralCommissions, getOpenHistory, getTransactions, deposit, withdraw, openChest, getCollection, getHistory } from './api';
import { useResponsive, getResponsiveStyles } from './hooks/useResponsive';
import TelegramWebApp from './telegram';

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
  'martinez.png': martinezImg,
  'kane.png': kaneImg,
  'osimhen.png': osimhenImg,
  'lewandowski.png': lewandowskiImg,
  'mbappe.png': mbappeImg,
  'haaland.png': haalandImg,
  'bruyne.png': bruyneImg,
  'rice.png': riceImg,
  'bruno.png': brunoImg,
  'rodri.png': rodriImg,
  'odegaard.png': odegaardImg,
  'bellingham.png': bellinghamImg,
  'davies.png': daviesImg,
  'maguire.png': maguireImg,
  'koundé.png': koundeImg,
  'arnold.png': arnoldImg,
  'hakimi.png': hakimiImg,
  'dias.png': diasImg,
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
    ton_to_deposit: 'TON to deposit',
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
    invited_people: 'Invited People',
    ton_commission: 'TON Commission',
    referral_list: 'Referral List:',
    no_referrals_yet: 'No one has used your invitation link yet',
    joined: 'Joined:',
    total_earned: 'Total Earned:',
    commission_history: 'Commission History:',
    ball_price: 'Ball Price:',
    bronze_ball: 'Bronze Ball',
    silver_ball: 'Silver Ball',
    gold_ball: 'Gold Ball',
    diamond_ball: 'Diamond Ball',
    commission_rate: 'Commission Rate: 10%',
    copy: 'Copy',
    copied: '✓ Copied!',
    processing_transaction: 'Processing transaction...',
    withdraw_request_sent: 'Withdraw success',
    wallet_connection: 'Wallet Connection',
    connected_wallet: 'Connected Wallet',
    no_wallet_connected: 'No wallet connected',
    app_title: 'Legendary Ball',
  },
  ko: {
    home: '홈',
    referral: '추천',
    history: '히스토리',
    wallet: 'TON 입출금',
    balance: '잔액',
    daily_reward: '일일 보상',
    total_withdrawn: '총 출금액',
    open_ball: '공 열기',
    see_player_cards: '선수 카드 정보 보기',
    not_enough_ton: '공을 열기 위한 TON이 부족합니다!',
    opening_ball: '공을 열고 있습니다...',
    you_got: '선수 카드를 받았습니다:',
    reward: '보상',
    per_day: 'TON/일',
    invite_friends: '추천 - 친구 초대',
    your_ref_link: '당신의 추천 링크:',
    connect_wallet_to_get_link: '지갑을 연결하여 추천 링크를 받으세요',
    open_history: '공 열기 히스토리',
    deposit_withdraw: 'TON 입출금',
    ton_to_deposit: '입금할 TON',
    deposit: '입금',
    ton_to_withdraw: '출금할 TON',
    withdraw: '출금',
    withdraw_success: '출금 성공! Tx 해시: ',
    withdraw_failed: '출금 실패: ',
    unknown_reason: '알 수 없는 이유',
    error: '오류: ',
    deposit_success: '입금 성공!',
    deposit_failed: '입금 실패',
    tx_hash_missing: '거래 해시(tx_hash)를 가져올 수 없습니다!',
    tx_failed: '거래 실패',
    open: '열기',
    disconnect_wallet: '지갑 연결 해제',
    deposit_withdraw_history: '입출금 히스토리',
    player_card: '선수 카드',
    amount: '금액',
    status: '상태',
    time: '시간',
    success: '성공',
    invited_people: '초대받은 사람',
    ton_commission: 'TON 커미션',
    referral_list: '초대받은 사람 목록:',
    no_referrals_yet: '아직 아무도 당신의 초대 링크를 사용하지 않았습니다',
    joined: '참여:',
    total_earned: '총 수익:',
    commission_history: '커미션 히스토리:',
    ball_price: '공 가격:',
    bronze_ball: '동공',
    silver_ball: '은공',
    gold_ball: '금공',
    diamond_ball: '다이아몬드공',
    commission_rate: '커미션 비율: 10%',
    copy: '복사',
    copied: '✓ 복사됨!',
    processing_transaction: '거래 처리 중...',
    withdraw_request_sent: '출금 성공',
    wallet_connection: '지갑 연결',
    connected_wallet: '연결된 지갑',
    no_wallet_connected: '연결된 지갑이 없습니다',
    app_title: '전설의 공',
    failed: '실패',
    pending: '대기 중',
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
  const [referralCommissions, setReferralCommissions] = useState<any[]>([]);
  const [openHistory, setOpenHistory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletMsg, setWalletMsg] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'ko'>('en');
  const [langDropdown, setLangDropdown] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  
  // Thêm state cho animation mở bóng
  const [openingBall, setOpeningBall] = useState<string | null>(null);
  const [ballAnimation, setBallAnimation] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  // Responsive design và Telegram Web App
  const responsive = useResponsive();
  const styles = getResponsiveStyles(responsive);
  const telegramWebApp = TelegramWebApp.getInstance();
  
  const t = LANGUAGES[lang];

  // Dummy data cho demo
  const tonDaily = 1.234; // tổng thưởng/ngày
  const tonWithdrawn = 2.5; // tổng đã rút
  // State để lưu referral link
  const [referralLink, setReferralLink] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [formattedAddress, setFormattedAddress] = useState<string>('');

  // Function để chuyển đổi địa chỉ ví sang dạng user-friendly (đầy đủ)
  const getFullUserFriendlyAddress = async (address: string) => {
    // Bỏ gọi API format-address, chỉ trả về address gốc
    return address;
  };

  // Function để hiển thị địa chỉ rút gọn (cho UI)
  const formatWalletAddress = (address: string) => {
    try {
      // Hiển thị 8 ký tự đầu + ... + 8 ký tự cuối
      if (address.length > 16) {
        return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
      }
      return address;
    } catch (error) {
      console.error('Error formatting wallet address:', error);
      return address;
    }
  };

  // Function copy referral link
  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset sau 2 giây
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback cho browser cũ
      const textArea = document.createElement('textarea');
      textArea.value = referralLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Function tạo UUID local (không dùng nữa, chỉ để backup)
  const generateReferralUUID = (address: string) => {
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      const char = address.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    let currentHash = Math.abs(hash);
    
    for (let i = 0; i < 8; i++) {
      result += chars[currentHash % chars.length];
      currentHash = Math.floor(currentHash / chars.length);
      // Nếu currentHash = 0, tạo hash mới từ index
      if (currentHash === 0) {
        currentHash = Math.abs(hash + i * 31);
      }
    }
    return result;
  };

  // Lấy referral link từ backend khi vào tab referral
  useEffect(() => {
    if (wallet && wallet.account && wallet.account.address && nav === 'referral') {
      const address = wallet.account.address;
      
      // Gọi API referrals để lấy cả danh sách và referral link
      getReferrals(address)
        .then(data => {
          if (data.referral_link) {
            setReferralLink(data.referral_link);
          } else {
            // Fallback nếu API không trả về link
            setReferralLink('https://t.me/LegendballBot/legendball?startapp=admin');
          }
          
          // Cập nhật danh sách referrals
          setReferrals(Array.isArray(data.referrals) ? data.referrals : []);
        })
        .catch(err => {
          console.error('Error fetching referrals:', err);
          // Fallback nếu API fail
          setReferralLink('https://t.me/LegendballBot/legendball?startapp=admin');
          setReferrals([]);
        });
    } else if (!wallet || !wallet.account || !wallet.account.address) {
      // Reset link khi không có wallet hoặc address
      setReferralLink('');
      setReferrals([]);
    }
  }, [wallet, nav]);

  // Format address để hiển thị
  useEffect(() => {
    if (wallet && wallet.account && wallet.account.address) {
      // Format để hiển thị (rút gọn)
      const displayAddress = formatWalletAddress(wallet.account.address);
      setFormattedAddress(displayAddress);
    } else {
      setFormattedAddress('');
    }
  }, [wallet]);

  // Thay vì dùng RECEIVER_WALLET, dùng biến receiver mới
  // const receiver = "0:75e23fc820f0a8b09044cc42de4358136041b69fbb9384058422f2461a0e2b92";

  // Hàm kiểm tra giao dịch trên blockchain (giả lập, cần thay bằng truy vấn thực tế)
  async function checkTxConfirmed(txHash: string, address: string, amount: number) {
    // Kiểm tra giao dịch thực tế trên blockchain TON
    return await checkTonTransactionConfirmed(address, RECEIVER_WALLET, amount);
  }

  async function handleOpenBall(ballKey: string) {
    if (!wallet) {
      setError('Vui lòng connect wallet trước khi mở bóng!');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    setShowResult(false);
    
    try {
      const ball = CHESTS[ballKey];
      if (!userInfo || userInfo.balance < ball.price) {
        setError('Không đủ TON để mở bóng!');
        setLoading(false);
        return;
      }
      
      // Bắt đầu animation mở bóng
      setOpeningBall(ballKey);
      setBallAnimation(true);
      
      // Delay 2 giây để hiển thị animation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Trừ balance tạm thời trên FE để UX mượt
      setUserInfo((prev: any) => ({ ...prev, balance: (prev.balance - ball.price) }));
      
      // Gọi API mở bóng (không gửi giao dịch blockchain)
      const res = await fetch(`/api/open-chest`, {
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
        // Nếu lỗi, hoàn lại balance
        setUserInfo((prev: any) => ({ ...prev, balance: (prev.balance + ball.price) }));
      } else {
        setResult(data);
        // Hiển thị kết quả sau khi animation hoàn thành
        setShowResult(true);
        // Cập nhật lại balance thực tế
        getUser(wallet?.account.address || '').then(setUserInfo);
      }
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra!');
    } finally {
      setLoading(false);
      setBallAnimation(false);
      setOpeningBall(null);
    }
  }

  // Đăng ký user/referral khi kết nối ví
  useEffect(() => {
    if (wallet) {
      const url = new URL(window.location.href);
      const tgParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
      const refParam =
        tgParam ||
        url.searchParams.get('tgWebAppStartParam') ||
        url.searchParams.get('startapp') ||
        url.searchParams.get('ref') ||
        undefined;
      if (wallet.account && wallet.account.address) {
        registerUser(wallet.account.address, refParam);
      }
    }
  }, [wallet]);

  // Lấy thông tin user khi vào trang chủ (backfill ref lần đầu nếu có)
  useEffect(() => {
    if (wallet && nav === 'home') {
      const url = new URL(window.location.href);
      const tgParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
      const refParam =
        tgParam ||
        url.searchParams.get('tgWebAppStartParam') ||
        url.searchParams.get('startapp') ||
        url.searchParams.get('ref') ||
        undefined;
      if (wallet.account && wallet.account.address) {
        getUser(wallet.account.address, refParam).then(data => {
          setUserInfo(data);
        });
      }
    }
  }, [wallet, nav]);

  // Lấy referral commissions khi vào màn referral
  useEffect(() => {
    if (wallet && wallet.account && wallet.account.address && nav === 'referral') {
      getReferralCommissions(wallet.account.address)
        .then(data => {
          setReferralCommissions(Array.isArray(data) ? data : []);
        })
        .catch(error => {
          console.error('Error fetching referral commissions:', error);
          setReferralCommissions([]);
        });
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

  // Nạp TON: mở ví, gọi API deposit
  async function handleDeposit() {
    setWalletMsg(null);
    if (!wallet || !depositAmount) return;
    
    // Set loading state
    setWalletMsg(t.processing_transaction);
    
    try {
      // 1. Mở ví xác nhận giao dịch
      const tx = await tonConnectUi.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: RECEIVER_WALLET,
          amount: (parseFloat(depositAmount) * 1e9).toString(),
        }],
      });
      
      // 2. Lấy tx_hash từ kết quả trả về
      let tx_hash = tx?.boc || tx?.hash || `tx_${Date.now()}`;
      
      
      // 3. Gọi API deposit để cộng balance (bỏ qua xác thực blockchain)
      await deposit(wallet.account.address, parseFloat(depositAmount), tx_hash);
      setWalletMsg(t.deposit_success);
      setDepositAmount(''); // Clear input
      getUser(wallet.account.address).then(setUserInfo);
      
      // 4. Refresh transactions list
      if (nav === 'wallet') {
        getTransactions(wallet.account.address).then(setTransactions);
      }
    } catch (e: any) {
      console.error('Deposit error:', e);
      setWalletMsg(t.deposit_failed);
    }
  }

  // Rút TON: tạo bản ghi pending vào DB
  async function handleWithdraw() {
    setWalletMsg(null);
    if (!wallet || !withdrawAmount) return;
    
    // Set loading state
    setWalletMsg(t.processing_transaction);
    
    try {
      // Kiểm tra số dư trước khi rút
      if (!userInfo || userInfo.balance < parseFloat(withdrawAmount)) {
        setWalletMsg('Không đủ TON để rút');
        return;
      }
      
      // Tạo bản ghi withdraw với status pending
      const res = await withdraw(wallet.account.address, parseFloat(withdrawAmount));
      
      if (res.status === 'success') {
        setWalletMsg(t.withdraw_request_sent);
        setWithdrawAmount(''); // Clear input
        getUser(wallet.account.address).then(setUserInfo);
        
        // Refresh transactions list
        if (nav === 'wallet') {
          getTransactions(wallet.account.address).then(setTransactions);
        }
      } else {
        setWalletMsg(t.withdraw_failed + ': ' + (res.error || t.unknown_reason));
      }
    } catch (e: any) {
      console.error('Withdraw error:', e);
      setWalletMsg(t.withdraw_failed);
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
      <style>
        {`
          @keyframes ballShake {
            0%, 100% { transform: rotate(0deg) scale(1); }
            25% { transform: rotate(-5deg) scale(1.05); }
            50% { transform: rotate(0deg) scale(1.1); }
            75% { transform: rotate(5deg) scale(1.05); }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes bounceIn {
            0% {
              opacity: 0;
              transform: scale(0.3);
            }
            50% {
              opacity: 1;
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 5px #ffb300; }
            50% { box-shadow: 0 0 20px #ffb300, 0 0 30px #ffb300; }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Hide scrollbar for ball cards container */
          .ball-cards-container::-webkit-scrollbar {
            display: none;
          }
          
          .ball-cards-container {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          /* Responsive design for ball cards */
          @media (max-width: 1200px) {
            .ball-cards-container {
              gap: 20px !important;
            }
            .ball-card {
              min-width: 200px !important;
              padding: 24px !important;
            }
          }
          
          @media (max-width: 768px) {
            .ball-cards-container {
              gap: 16px !important;
              padding: 0 8px !important;
            }
            .ball-card {
              min-width: 180px !important;
              padding: 20px !important;
            }
          }
        `}
      </style>
      {/* Navigation */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: 'linear-gradient(135deg, #23284a 0%, #181c2b 100%)', 
        padding: styles.nav.padding, 
        height: styles.nav.height,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        borderBottom: '1px solid #444',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        ...(responsive.isTelegramWebApp && {
          paddingTop: 'env(safe-area-inset-top)',
        })
      }}>
        <div style={{ flex: 1, display: 'flex', gap: styles.nav.gap, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {NAVS.map(n => (
            <button
              key={n.key}
              onClick={() => {
                setNav(n.key);
                telegramWebApp.hapticFeedback('light');
              }}
              style={{ 
                background: nav === n.key ? 'linear-gradient(135deg, #ffb300 0%, #ff8c00 100%)' : 'transparent', 
                color: nav === n.key ? '#23284a' : '#fff', 
                border: 'none', 
                fontWeight: 'bold', 
                fontSize: styles.nav.fontSize, 
                padding: styles.button.padding, 
                borderRadius: styles.button.borderRadius, 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: nav === n.key ? '0 4px 12px rgba(255,179,0,0.3)' : 'none',
                transform: nav === n.key ? 'translateY(-2px)' : 'translateY(0)',
                whiteSpace: 'nowrap',
                minWidth: responsive.isMobile ? 'auto' : 'auto'
              }}
              onMouseEnter={(e) => {
                if (nav !== n.key) {
                  e.currentTarget.style.background = 'rgba(255,179,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (nav !== n.key) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {n.label}
            </button>
          ))}
        </div>
        {!responsive.isMobile && <TonConnectButton />}

        {wallet && (
          <>
            {/* Language Switcher Dropdown */}
            <div ref={langRef} style={{ marginLeft: 12, position: 'relative', display: 'inline-block', userSelect: 'none' }}>
              <button
                onClick={() => setLangDropdown(v => !v)}
                style={{ 
                  background: 'linear-gradient(135deg, #ffb300 0%, #ff8c00 100%)', 
                  color: '#23284a', 
                  border: 'none', 
                  borderRadius: styles.button.borderRadius, 
                  padding: responsive.isMobile ? '6px 12px' : '8px 18px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer', 
                  minWidth: responsive.isMobile ? 60 : 100,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(255,179,0,0.3)',
                  fontSize: responsive.isMobile ? 12 : styles.button.fontSize
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,179,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,179,0,0.3)';
                }}
              >
                {lang === 'en' ? 'EN' : 'KO'} ▼
              </button>
              {langDropdown && (
                <div style={{ 
                  position: 'absolute', 
                  top: '120%', 
                  right: 0, 
                  background: 'linear-gradient(135deg, #23284a 0%, #181c2b 100%)', 
                  borderRadius: 12, 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)', 
                  minWidth: responsive.isMobile ? 80 : 130, 
                  overflow: 'hidden',
                  border: '1px solid #444',
                  animation: 'fadeInUp 0.3s ease-out'
                }}>
                  <div
                    onClick={() => { setLang('en'); setLangDropdown(false); }}
                    style={{ 
                      padding: responsive.isMobile ? '8px 12px' : '12px 18px', 
                      cursor: 'pointer', 
                      color: lang === 'en' ? '#ffb300' : '#fff', 
                      background: lang === 'en' ? 'rgba(255,179,0,0.1)' : 'transparent', 
                      fontWeight: lang === 'en' ? 'bold' : 'normal',
                      transition: 'all 0.2s ease',
                      fontSize: responsive.isMobile ? 12 : 14
                    }}
                    onMouseEnter={(e) => {
                      if (lang !== 'en') {
                        e.currentTarget.style.background = 'rgba(255,179,0,0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (lang !== 'en') {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    English
                  </div>
                  <div
                    onClick={() => { setLang('ko'); setLangDropdown(false); }}
                    style={{ 
                      padding: responsive.isMobile ? '8px 12px' : '12px 18px', 
                      cursor: 'pointer', 
                      color: lang === 'ko' ? '#ffb300' : '#fff', 
                      background: lang === 'ko' ? 'rgba(255,179,0,0.1)' : 'transparent', 
                      fontWeight: lang === 'ko' ? 'bold' : 'normal',
                      transition: 'all 0.2s ease',
                      fontSize: responsive.isMobile ? 12 : 14
                    }}
                    onMouseEnter={(e) => {
                      if (lang !== 'ko') {
                        e.currentTarget.style.background = 'rgba(255,179,0,0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (lang !== 'ko') {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    한국어
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Mobile Navigation Bar */}
      {responsive.isMobile && !responsive.isLandscape && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, #23284a 0%, #181c2b 100%)',
          borderTop: '1px solid #444',
          padding: '12px 16px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center'
        }}>
          {NAVS.map(n => (
            <button
              key={n.key}
              onClick={() => {
                setNav(n.key);
                telegramWebApp.hapticFeedback('light');
              }}
              style={{
                background: nav === n.key ? 'linear-gradient(135deg, #ffb300 0%, #ff8c00 100%)' : 'transparent',
                color: nav === n.key ? '#23284a' : '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: '60px',
                textAlign: 'center'
              }}
            >
              {n.label}
            </button>
          ))}
          {!wallet && (
            <div style={{
              background: 'linear-gradient(135deg, #ffb300 0%, #ff8c00 100%)',
              color: '#23284a',
              border: 'none',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '60px',
              textAlign: 'center'
            }}>
              <TonConnectButton />
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div style={{ 
        maxWidth: styles.container.maxWidth, 
        margin: styles.container.margin, 
        padding: styles.container.padding,
        ...(responsive.isTelegramWebApp && {
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
        }),
        ...(responsive.isMobile && !responsive.isLandscape && {
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
        })
      }}>
        {nav === 'home' && (
          <>
            <h1 className={responsive.isMobile ? 'force-horizontal-title' : ''} style={{ 
              textAlign: 'center', 
              fontSize: styles.title.fontSize, 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #ffb300 0%, #ff8c00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: styles.title.marginBottom,
              textShadow: '0 4px 8px rgba(0,0,0,0.3)'
            }}>
              {t.app_title}
            </h1>
            <div className={responsive.isMobile ? 'force-horizontal-stats' : ''} style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: styles.card.gap, 
              margin: `${styles.subtitle.marginBottom} 0 ${styles.title.marginBottom} 0`,
              flexWrap: responsive.isMobile ? 'nowrap' : 'wrap'
            }}>
              <div className={responsive.isMobile ? 'force-horizontal-stats-card' : ''} style={{ 
                background: 'linear-gradient(135deg, #23284a 0%, #181c2b 100%)', 
                borderRadius: 16, 
                padding: 24, 
                minWidth: 200, 
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                border: '1px solid #444',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
              }}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: 4, 
                  background: 'linear-gradient(90deg, #ffb300 0%, #ff8c00 100%)' 
                }}></div>
                <div style={{ fontSize: 16, color: '#aaa', marginBottom: 8 }}>{t.balance}</div>
                <div style={{ fontSize: 32, color: '#ffb300', fontWeight: 'bold' }}>{(userInfo?.balance || 0).toFixed(4)} TON</div>
              </div>
              <div className={responsive.isMobile ? 'force-horizontal-stats-card' : ''} style={{ 
                background: 'linear-gradient(135deg, #23284a 0%, #181c2b 100%)', 
                borderRadius: 16, 
                padding: 24, 
                minWidth: 200, 
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                border: '1px solid #444',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
              }}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: 4, 
                  background: 'linear-gradient(90deg, #4CAF50 0%, #45a049 100%)' 
                }}></div>
                <div style={{ fontSize: 16, color: '#aaa', marginBottom: 8 }}>{t.daily_reward}</div>
                <div style={{ fontSize: 32, color: '#4CAF50', fontWeight: 'bold' }}>{(userInfo?.ton_daily || 0).toFixed(4)} TON</div>
              </div>
              <div className={responsive.isMobile ? 'force-horizontal-stats-card' : ''} style={{ 
                background: 'linear-gradient(135deg, #23284a 0%, #181c2b 100%)', 
                borderRadius: 16, 
                padding: 24, 
                minWidth: 200, 
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                border: '1px solid #444',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
              }}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: 4, 
                  background: 'linear-gradient(90deg, #2196F3 0%, #1976D2 100%)' 
                }}></div>
                <div style={{ fontSize: 16, color: '#aaa', marginBottom: 8 }}>{t.total_withdrawn}</div>
                <div style={{ fontSize: 32, color: '#2196F3', fontWeight: 'bold' }}>{(userInfo?.ton_withdrawn || 0).toFixed(4)} TON</div>
              </div>
            </div>
            <div className={`ball-cards-container ${responsive.isMobile ? 'force-horizontal-balls' : ''}`} style={{ 
              display: 'flex', 
              gap: styles.ballCard.gap, 
              justifyContent: 'center', 
              margin: `${styles.title.marginBottom} 0`,
              flexWrap: responsive.isMobile ? 'nowrap' : 'wrap',
              overflowX: responsive.isMobile ? 'auto' : 'visible',
              padding: responsive.isMobile ? '0' : '0 16px'
            }}>
              {Object.entries(CHESTS).map(([key, ball]) => (
                <div key={key} className={`ball-card ${responsive.isMobile ? 'force-horizontal-ball-card' : ''}`} style={{ 
                  background: 'linear-gradient(135deg, #23284a 0%, #181c2b 100%)', 
                  borderRadius: styles.ballCard.padding, 
                  padding: styles.ballCard.padding, 
                  minWidth: styles.ballCard.minWidth, 
                  boxShadow: '0 12px 32px rgba(0,0,0,0.4)', 
                  textAlign: 'center', 
                  position: 'relative',
                  transform: openingBall === key && ballAnimation ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.3s ease-in-out',
                  filter: openingBall === key && ballAnimation ? 'brightness(1.2) drop-shadow(0 0 30px #ffb300)' : 'none',
                  border: '1px solid #444',
                  overflow: 'hidden',
                  width: responsive.isMobile ? 'auto' : 'auto',
                  maxWidth: responsive.isMobile ? 'none' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!openingBall || openingBall !== key) {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!openingBall || openingBall !== key) {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';
                  }
                }}
                >
                  {/* Glow effect for active ball */}
                  {openingBall === key && ballAnimation && (
                    <div style={{
                      position: 'absolute',
                      top: -20,
                      left: -20,
                      right: -20,
                      bottom: -20,
                      background: 'radial-gradient(circle, rgba(255,179,0,0.2) 0%, transparent 70%)',
                      animation: 'glow 1s ease-in-out infinite alternate',
                      pointerEvents: 'none'
                    }}></div>
                  )}
                  
                  <img 
                    src={BALL_IMAGES[key]} 
                    alt={ball.name} 
                    style={{ 
                      width: 120, 
                      height: 120, 
                      marginBottom: 16,
                      animation: openingBall === key && ballAnimation ? 'ballShake 0.5s infinite' : 'none',
                      transform: openingBall === key && ballAnimation ? 'rotate(360deg)' : 'rotate(0deg)',
                      transition: 'transform 2s ease-in-out',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                    }} 
                  />
                  <h2 className={responsive.isMobile ? 'ball-name' : ''} style={{ 
                    fontSize: responsive.isMobile ? 16 : 24, 
                    fontWeight: 'bold', 
                    color: key === 'bronzeBall' ? '#CD7F32' : 
                           key === 'silverBall' ? '#C0C0C0' : 
                           key === 'goldBall' ? '#FFD700' : 
                           key === 'diamondBall' ? '#B9F2FF' : '#ffb300',
                    marginBottom: responsive.isMobile ? 8 : 12,
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}>{ball.name}</h2>
                  <div className={responsive.isMobile ? 'ball-price' : ''} style={{ 
                    fontSize: responsive.isMobile ? 18 : 28, 
                    margin: responsive.isMobile ? '8px 0' : '16px 0', 
                    color: key === 'bronzeBall' ? '#CD7F32' : 
                           key === 'silverBall' ? '#C0C0C0' : 
                           key === 'goldBall' ? '#FFD700' : 
                           key === 'diamondBall' ? '#B9F2FF' : '#4CAF50',
                    fontWeight: 'bold'
                  }}>{ball.price} TON</div>
                  <button
                    style={{ 
                      padding: '14px 32px', 
                      borderRadius: 12, 
                      background: openingBall === key && ballAnimation 
                        ? 'linear-gradient(135deg, #ff6b35 0%, #ff8c00 100%)' 
                        : 'linear-gradient(135deg, #ffb300 0%, #ff8c00 100%)', 
                      color: '#23284a', 
                      fontWeight: 'bold', 
                      border: 'none', 
                      cursor: loading || !wallet ? 'not-allowed' : 'pointer', 
                      fontSize: 18,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 6px 16px rgba(255,179,0,0.3)',
                      opacity: loading || !wallet ? 0.6 : 1
                    }}
                    disabled={loading || !wallet}
                    onClick={() => handleOpenBall(key)}
                    onMouseEnter={(e) => {
                      if (!loading && wallet) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(255,179,0,0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && wallet) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,179,0,0.3)';
                      }
                    }}
                  >
                    {openingBall === key && ballAnimation ? t.opening_ball : t.open_ball}
                  </button>
                  <span
                    title={t.see_player_cards}
                    style={{ 
                      position: 'absolute', 
                      top: 16, 
                      right: 20, 
                      fontSize: 24, 
                      color: '#ffb300', 
                      cursor: 'pointer', 
                      fontWeight: 'bold', 
                      userSelect: 'none',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,179,0,0.2)';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onClick={() => setInfoOpen(key)}
                  >
                    !
                  </span>
                  <BallInfoModal open={infoOpen === key} onClose={() => setInfoOpen(null)} players={BALLS[key]?.players || []} lang={lang} />
                </div>
              ))}
            </div>
            {loading && (
              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <div style={{ 
                  display: 'inline-block',
                  width: 60,
                  height: 60,
                  border: '4px solid #23284a',
                  borderTop: '4px solid #ffb300',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: 16
                }}></div>
                <div style={{ fontSize: 20, color: '#ffb300' }}>{t.opening_ball}</div>
              </div>
            )}
            {error && <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>}
            {result && showResult && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: 48,
                animation: 'fadeInUp 0.8s ease-out',
                opacity: showResult ? 1 : 0,
                transform: showResult ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s ease-out',
                background: 'linear-gradient(135deg, #23284a 0%, #181c2b 100%)',
                borderRadius: 20,
                padding: 40,
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                border: '1px solid #444',
                maxWidth: 500,
                margin: '48px auto 0 auto'
              }}>
                <h2 style={{ 
                  fontSize: responsive.isMobile ? 20 : 28, 
                  color: '#ffb300', 
                  marginBottom: responsive.isMobile ? 16 : 24,
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}>{t.you_got}</h2>
                {result.player_card && (
                  <div style={{ 
                    fontSize: responsive.isMobile ? 24 : 32, 
                    color: '#ffb300', 
                    margin: responsive.isMobile ? '12px 0' : '16px 0',
                    fontWeight: 'bold',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    <b>{result.player_card}</b>
                  </div>
                )}
                {result.image && PLAYER_IMAGES[result.image] && (
                  <div style={{
                    position: 'relative',
                    display: 'inline-block',
                    margin: '20px 0'
                  }}>
                    <img 
                      src={PLAYER_IMAGES[result.image]} 
                      alt={result.player_card} 
                      style={{ 
                        width: 120, 
                        height: 120, 
                        animation: 'bounceIn 1s ease-out',
                        transform: 'scale(1)',
                        transition: 'transform 0.3s ease',
                        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))',
                        borderRadius: 12
                      }} 
                    />
                    {/* Glow effect */}
                    <div style={{
                      position: 'absolute',
                      top: -10,
                      left: -10,
                      right: -10,
                      bottom: -10,
                      background: 'radial-gradient(circle, rgba(255,179,0,0.3) 0%, transparent 70%)',
                      animation: 'glow 2s ease-in-out infinite alternate',
                      borderRadius: 12,
                      pointerEvents: 'none'
                    }}></div>
                  </div>
                )}
                <div style={{ 
                  fontSize: responsive.isMobile ? 28 : 36, 
                  fontWeight: 'bold', 
                  color: '#4CAF50', 
                  margin: responsive.isMobile ? '16px 0' : '20px 0',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}>{result.card_type}</div>
                <div style={{ 
                  fontSize: responsive.isMobile ? 16 : 20, 
                  color: '#fff',
                  background: 'rgba(255,179,0,0.1)',
                  padding: responsive.isMobile ? '10px 20px' : '12px 24px',
                  borderRadius: 12,
                  display: 'inline-block',
                  border: '1px solid rgba(255,179,0,0.3)'
                }}>
                  {t.reward}: <b style={{ color: '#4CAF50' }}>{result.reward.toFixed(4)} {t.per_day}</b>
                </div>
              </div>
            )}
          </>
        )}
        {nav === 'referral' && (
          <div style={{ maxWidth: 600, margin: '40px auto', background: '#23284a', borderRadius: 16, padding: 32 }}>
            <h2>{t.invite_friends}</h2>
            
            {/* Thống kê tổng quan */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <div style={{ flex: 1, background: '#181c2b', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ffb300' }}>{referrals.length}</div>
                <div style={{ fontSize: 14, color: '#aaa' }}>{t.invited_people}</div>
              </div>
              <div style={{ flex: 1, background: '#181c2b', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#4CAF50' }}>
                  {Array.isArray(referralCommissions) 
                    ? referralCommissions.reduce((sum, c) => sum + (c?.commission_amount || 0), 0).toFixed(4)
                    : '0.0000'
                  }
                </div>
                <div style={{ fontSize: 14, color: '#aaa' }}>{t.ton_commission}</div>
              </div>
            </div>
            
            <div style={{ margin: '18px 0', fontSize: 15 }}>
              <div style={{ marginBottom: 12, color: '#4CAF50', fontWeight: 'bold', fontSize: 16 }}>
                {t.commission_rate}
              </div>
              {t.your_ref_link}
              <div style={{ 
                background: '#181c2b', 
                padding: 10, 
                borderRadius: 8, 
                marginTop: 6, 
                wordBreak: 'break-all', 
                color: '#ffb300',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10
              }}>
                <span style={{ flex: 1 }}>{referralLink}</span>
                <button
                  onClick={copyReferralLink}
                  style={{
                    background: copySuccess ? '#4CAF50' : 'linear-gradient(135deg, #ffb300 0%, #ff8c00 100%)',
                    color: copySuccess ? '#fff' : '#23284a',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minWidth: 60,
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (!copySuccess) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(255,179,0,0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!copySuccess) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {copySuccess ? t.copied : t.copy}
                </button>
              </div>
            </div>
            
            <div style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 12, color: '#ffb300' }}>{t.referral_list}</h3>
              {!Array.isArray(referrals) || referrals.length === 0 ? (
                <div style={{ color: '#aaa', fontStyle: 'italic' }}>{t.no_referrals_yet}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {referrals.map((r, index) => (
                    <div key={r?.address || index} style={{ 
                      background: '#181c2b', 
                      padding: 12, 
                      borderRadius: 8, 
                      fontSize: 14,
                      wordBreak: 'break-all'
                    }}>
                      <div style={{ color: '#ffb300', fontWeight: 'bold' }}>
                        {r?.friendly_address || r?.address || `User ${index + 1}`}
                      </div>
                      {r?.joined_at && (
                        <div style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>
                          {t.joined} {new Date(r.joined_at * 1000).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US')}
                        </div>
                      )}
                      {r?.total_earned && (
                        <div style={{ color: '#4CAF50', fontSize: 12, marginTop: 2 }}>
                          {t.total_earned} {r.total_earned.toFixed(4)} TON
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Lịch sử commission */}
            {Array.isArray(referralCommissions) && referralCommissions.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ marginBottom: 12, color: '#ffb300' }}>{t.commission_history}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {referralCommissions.slice(0, 10).map((c, index) => (
                    <div key={index} style={{ 
                      background: '#181c2b', 
                      padding: 10, 
                      borderRadius: 6, 
                      fontSize: 13,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                                           <div>
                       <div style={{ color: '#fff' }}>From: {c?.referred_friendly_address || c?.referred_address?.slice(0, 8)}...{c?.referred_address?.slice(-6)}</div>
                       <div style={{ color: '#aaa', fontSize: 11 }}>
                         {c?.chest_type && (
                           <span style={{ color: '#ffb300' }}>
                             {c.chest_type === 'bronzeBall' ? t.bronze_ball : 
                              c.chest_type === 'silverBall' ? t.silver_ball : 
                              c.chest_type === 'goldBall' ? t.gold_ball : 
                              c.chest_type === 'diamondBall' ? t.diamond_ball : c.chest_type}
                           </span>
                         )} • {c?.timestamp ? new Date(c.timestamp * 1000).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US') : 'N/A'}
                       </div>
                     </div>
                     <div style={{ textAlign: 'right' }}>
                         <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                           +{c?.commission_amount?.toFixed(4) || '0.0000'} TON
                         </div>
                         {c?.price && (
                           <div style={{ color: '#aaa', fontSize: 10 }}>
                             {t.ball_price} {c.price} TON
                           </div>
                         )}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                      <div style={{ fontSize: 13, color: '#aaa' }}>{new Date(h.timestamp*1000).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US')}</div>
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
            
            {/* Wallet Connection Box */}
            <div style={{ 
              background: 'linear-gradient(135deg, #181c2b 0%, #23284a 100%)', 
              borderRadius: 12, 
              padding: 20, 
              marginBottom: 24,
              border: '1px solid #444'
            }}>
              <h3 style={{ marginBottom: 16, color: '#ffb300', fontSize: 18 }}>{t.wallet_connection}</h3>
              
              {wallet ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ 
                    background: '#23284a', 
                    padding: 12, 
                    borderRadius: 8, 
                    border: '1px solid #444'
                  }}>
                    <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>{t.connected_wallet}</div>
                    <div style={{ 
                      fontSize: 14, 
                      color: '#ffb300', 
                      fontWeight: 'bold',
                      wordBreak: 'break-all'
                    }}>
                      {userInfo?.display_address ? formatWalletAddress(userInfo.display_address) : formattedAddress || wallet.account.address}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ 
                        flex: 1,
                        padding: '10px 16px', 
                        borderRadius: 8, 
                        background: 'linear-gradient(135deg, #ff4d4f 0%, #ff6b6b 100%)', 
                        color: '#fff', 
                        fontWeight: 'bold', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontSize: 14
                      }}
                      onClick={() => {
                        tonConnectUi.disconnect();
                        setTimeout(() => window.location.reload(), 300);
                      }}
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ 
                    background: '#23284a', 
                    padding: 12, 
                    borderRadius: 8, 
                    border: '1px solid #444',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 14, color: '#aaa', marginBottom: 8 }}>
                      {t.no_wallet_connected}
                    </div>
                    <TonConnectButton />
                  </div>
                </div>
              )}
            </div>
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
                onClick={handleWithdraw}
              >
                {t.withdraw}
              </button>
            </div>
            {walletMsg && <div style={{ margin: '18px 0', color: '#ffb300' }}>{walletMsg}</div>}
            <h3 style={{ marginTop: 32, marginBottom: 16 }}>{t.deposit_withdraw_history}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {transactions.map(tn => (
                <div 
                  key={tn.timestamp}
                  style={{
                    background: tn.type === 'withdraw' ? '#2d1b1b' : '#1b2d1b',
                    border: tn.type === 'withdraw' ? '1px solid #ff4d4f' : '1px solid #4CAF50',
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ 
                      color: tn.type === 'withdraw' ? '#ff4d4f' : '#4CAF50',
                      fontWeight: 'bold',
                      fontSize: 14
                    }}>
                      {t[tn.type] || tn.type}
                    </div>
                    <div style={{ color: '#aaa', fontSize: 12 }}>
                      {new Date(tn.timestamp*1000).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div style={{ 
                      color: tn.type === 'withdraw' ? '#ff4d4f' : '#4CAF50',
                      fontWeight: 'bold',
                      fontSize: 16
                    }}>
                      {tn.type === 'withdraw' ? '-' : '+'}{tn.amount.toFixed(4)} TON
                    </div>
                    <div style={{ 
                      color: tn.status === 'success' ? '#4CAF50' : tn.status === 'pending' ? '#ffb300' : '#ff4d4f',
                      fontSize: 12,
                      fontWeight: 'bold'
                    }}>
                      {t[tn.status] || tn.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 