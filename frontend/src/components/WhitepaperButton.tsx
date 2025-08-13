import React, { useState } from 'react';
import WhitepaperModal from './WhitepaperModal';

interface WhitepaperButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

const WhitepaperButton: React.FC<WhitepaperButtonProps> = ({ 
  className = '', 
  children = '📄 Whitepaper',
  variant = 'primary',
  size = 'medium'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const getButtonStyles = () => {
    const baseStyles = {
      border: 'none',
      borderRadius: '25px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: 'inherit',
      textDecoration: 'none'
    };

    const sizeStyles = {
      small: { padding: '8px 16px', fontSize: '12px' },
      medium: { padding: '12px 24px', fontSize: '14px' },
      large: { padding: '16px 32px', fontSize: '16px' }
    };

    const variantStyles = {
      primary: {
        background: 'linear-gradient(135deg, #ffb300 0%, #ff8f00 100%)',
        color: 'white',
        boxShadow: '0 4px 15px rgba(255, 179, 0, 0.3)'
      },
      secondary: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
      },
      outline: {
        background: 'transparent',
        color: '#ffb300',
        border: '2px solid #ffb300',
        boxShadow: 'none'
      }
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant]
    };
  };

  return (
    <>
      <button
        onClick={openModal}
        className={`whitepaper-btn ${className}`}
        style={getButtonStyles()}
        onMouseEnter={(e) => {
          const btn = e.currentTarget;
          if (variant === 'outline') {
            btn.style.background = '#ffb300';
            btn.style.color = 'white';
          } else {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = variant === 'primary' 
              ? '0 8px 25px rgba(255, 179, 0, 0.4)'
              : '0 8px 25px rgba(102, 126, 234, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget;
          if (variant === 'outline') {
            btn.style.background = 'transparent';
            btn.style.color = '#ffb300';
          } else {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = variant === 'primary'
              ? '0 4px 15px rgba(255, 179, 0, 0.3)'
              : '0 4px 15px rgba(102, 126, 234, 0.3)';
          }
        }}
      >
        {children}
      </button>

      <WhitepaperModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
};

export default WhitepaperButton;
