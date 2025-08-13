import React from 'react';

interface MaintenanceScreenProps {
  message: string;
}

const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ message }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '400px',
        padding: '40px 20px',
        backgroundColor: '#2a2a2a',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        border: '1px solid #333'
      }}>
        {/* Icon bảo trì */}
        <div style={{
          fontSize: '64px',
          marginBottom: '24px',
          color: '#ffd700'
        }}>
          🔧
        </div>
        
        {/* Tiêu đề */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: '#ffd700'
        }}>
          Hệ thống đang bảo trì
        </h1>
        
        {/* Thông báo */}
        <p style={{
          fontSize: '16px',
          lineHeight: '1.5',
          color: '#cccccc',
          marginBottom: '24px'
        }}>
          {message}
        </p>
        
        {/* Thông tin thêm */}
        <div style={{
          fontSize: '14px',
          color: '#888888',
          padding: '16px',
          backgroundColor: '#333',
          borderRadius: '8px',
          border: '1px solid #444'
        }}>
          <p style={{ margin: '0 0 8px 0' }}>
            ⏰ Vui lòng thử lại sau
          </p>
          <p style={{ margin: '0' }}>
            📱 Cảm ơn bạn đã kiên nhẫn chờ đợi!
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceScreen;
