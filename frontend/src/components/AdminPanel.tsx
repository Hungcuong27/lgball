import React, { useState, useEffect } from 'react';
import { updateMaintenanceMode, banUser, unbanUser, getBannedUsers } from '../api';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [banAddress, setBanAddress] = useState('');
  const [banReason, setBanReason] = useState('');
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBannedUsers();
  }, []);

  const loadBannedUsers = async () => {
    try {
      const users = await getBannedUsers();
      setBannedUsers(users);
    } catch (error) {
      console.error('Error loading banned users:', error);
    }
  };

  const handleMaintenanceToggle = async () => {
    setLoading(true);
    try {
      const success = await updateMaintenanceMode(!maintenanceEnabled, maintenanceMessage);
      if (success) {
        setMaintenanceEnabled(!maintenanceEnabled);
        alert('Cập nhật chế độ bảo trì thành công!');
      } else {
        alert('Có lỗi xảy ra khi cập nhật!');
      }
    } catch (error) {
      console.error('Error updating maintenance mode:', error);
      alert('Có lỗi xảy ra!');
    }
    setLoading(false);
  };

  const handleBanUser = async () => {
    if (!banAddress.trim()) {
      alert('Vui lòng nhập địa chỉ ví!');
      return;
    }

    setLoading(true);
    try {
      const success = await banUser(banAddress, banReason);
      if (success) {
        alert('Ban user thành công!');
        setBanAddress('');
        setBanReason('');
        loadBannedUsers();
      } else {
        alert('Có lỗi xảy ra khi ban user!');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Có lỗi xảy ra!');
    }
    setLoading(false);
  };

  const handleUnbanUser = async (address: string) => {
    setLoading(true);
    try {
      const success = await unbanUser(address);
      if (success) {
        alert('Unban user thành công!');
        loadBannedUsers();
      } else {
        alert('Có lỗi xảy ra khi unban user!');
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Có lỗi xảy ra!');
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '20px'
    }}>
      <div style={{
        background: '#23284a',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflowY: 'auto',
        color: '#fff',
        position: 'relative'
      }}>
        {/* Close button */}
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: 12, 
            right: 16, 
            background: 'rgba(255,255,255,0.1)', 
            border: 'none', 
            color: '#fff', 
            fontSize: 20, 
            cursor: 'pointer',
            borderRadius: '50%',
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>

        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '24px', 
          color: '#ffb300',
          fontSize: '24px'
        }}>
          🔧 Admin Panel
        </h2>

        {/* Maintenance Section */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: '#ffb300', marginBottom: '16px' }}>🛠️ Chế Độ Bảo Trì</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Thông báo bảo trì:
            </label>
            <textarea
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="Nhập thông báo bảo trì..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #444',
                background: '#181c2b',
                color: '#fff',
                minHeight: '80px',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            onClick={handleMaintenanceToggle}
            disabled={loading}
            style={{
              background: maintenanceEnabled ? '#ff4444' : '#4CAF50',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Đang xử lý...' : (maintenanceEnabled ? 'Tắt Bảo Trì' : 'Bật Bảo Trì')}
          </button>
        </div>

        {/* Ban User Section */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: '#ffb300', marginBottom: '16px' }}>🚫 Ban User</h3>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Địa chỉ ví:
            </label>
            <input
              type="text"
              value={banAddress}
              onChange={(e) => setBanAddress(e.target.value)}
              placeholder="Nhập địa chỉ ví cần ban..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #444',
                background: '#181c2b',
                color: '#fff'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Lý do ban:
            </label>
            <input
              type="text"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Nhập lý do ban..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #444',
                background: '#181c2b',
                color: '#fff'
              }}
            />
          </div>

          <button
            onClick={handleBanUser}
            disabled={loading}
            style={{
              background: '#ff4444',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Đang xử lý...' : 'Ban User'}
          </button>
        </div>

        {/* Banned Users List */}
        <div>
          <h3 style={{ color: '#ffb300', marginBottom: '16px' }}>📋 Danh Sách User Bị Ban</h3>
          
          {bannedUsers.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center' }}>Không có user nào bị ban</p>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {bannedUsers.map((user, index) => (
                <div key={index} style={{
                  background: '#181c2b',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  border: '1px solid #333'
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#ffb300' }}>Địa chỉ:</strong>
                    <span style={{ color: '#fff', marginLeft: '8px' }}>
                      {user.address}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#ffb300' }}>Lý do:</strong>
                    <span style={{ color: '#fff', marginLeft: '8px' }}>
                      {user.reason}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#ffb300' }}>Ngày ban:</strong>
                    <span style={{ color: '#fff', marginLeft: '8px' }}>
                      {new Date(user.banned_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <button
                    onClick={() => handleUnbanUser(user.address)}
                    disabled={loading}
                    style={{
                      background: '#4CAF50',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    Unban
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
