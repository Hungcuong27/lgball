import React from 'react';

interface BannedScreenProps {
  reason?: string;
  bannedAt?: string;
}

const BannedScreen: React.FC<BannedScreenProps> = ({ 
  reason = 'Vi phạm quy tắc cộng đồng',
  bannedAt 
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#1a0000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '20px',
      textAlign: 'center'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 25% 25%, rgba(255, 0, 0, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(255, 0, 0, 0.1) 0%, transparent 50%)
        `,
        opacity: 0.3
      }} />
      
      {/* Main Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '500px',
        width: '100%'
      }}>
        {/* Icon */}
        <div style={{
          width: '120px',
          height: '120px',
          margin: '0 auto 30px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff0000, #cc0000)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(255, 0, 0, 0.3)',
          animation: 'shake 0.5s infinite'
        }}>
          <svg 
            width="60" 
            height="60" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="white" 
            strokeWidth="2"
          >
            <path d="M18.364 18.364A9 9 0 1 1 5.636 5.636a9 9 0 0 1 12.728 12.728zM12 8v4m0 4h.01"/>
          </svg>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#ff0000',
          marginBottom: '20px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          🚫 Tài Khoản Bị Khóa
        </h1>

        {/* Message */}
        <p style={{
          fontSize: '18px',
          color: '#ffffff',
          lineHeight: '1.6',
          marginBottom: '30px',
          opacity: 0.9
        }}>
          Tài khoản của bạn đã bị khóa do vi phạm quy tắc cộng đồng.
        </p>

        {/* Reason */}
        <div style={{
          background: 'rgba(255, 0, 0, 0.1)',
          border: '1px solid rgba(255, 0, 0, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h3 style={{
            color: '#ff0000',
            fontSize: '18px',
            marginBottom: '10px',
            fontWeight: 'bold'
          }}>
            Lý Do:
          </h3>
          <p style={{
            color: '#ffffff',
            fontSize: '16px',
            margin: 0,
            lineHeight: '1.5'
          }}>
            {reason}
          </p>
        </div>

        {/* Ban Date */}
        {bannedAt && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '30px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <p style={{
              color: '#cccccc',
              fontSize: '14px',
              margin: 0
            }}>
              📅 Ngày khóa: {new Date(bannedAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        )}

        {/* Appeal Info */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{
            color: '#ffb300',
            fontSize: '16px',
            marginBottom: '10px',
            fontWeight: 'bold'
          }}>
            Kháng Cáo
          </h3>
          <p style={{
            color: '#999999',
            fontSize: '14px',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Nếu bạn cho rằng đây là sự nhầm lẫn, vui lòng liên hệ:
          </p>
          <p style={{
            color: '#ffb300',
            fontSize: '14px',
            margin: '10px 0 0 0',
            fontWeight: 'bold'
          }}>
            📧 support@legendball.com
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
        `}
      </style>
    </div>
  );
};

export default BannedScreen;
