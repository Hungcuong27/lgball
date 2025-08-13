import React from 'react';
import WhitepaperButton from './WhitepaperButton';

const WhitepaperDemo: React.FC = () => {
  return (
    <div style={{ 
      padding: '40px', 
      background: '#f5f5f5', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px', color: '#333' }}>
        Legendary Ball - Whitepaper Button Demo
      </h1>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px', 
        alignItems: 'center',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h3>Primary Button (Default)</h3>
          <WhitepaperButton />
        </div>
        
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h3>Secondary Button</h3>
          <WhitepaperButton variant="secondary" />
        </div>
        
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h3>Outline Button</h3>
          <WhitepaperButton variant="outline" />
        </div>
        
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h3>Small Button</h3>
          <WhitepaperButton size="small" />
        </div>
        
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h3>Large Button</h3>
          <WhitepaperButton size="large" />
        </div>
        
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h3>Custom Text</h3>
          <WhitepaperButton>📖 Read Our Whitepaper</WhitepaperButton>
        </div>
        
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h3>Combined Variants</h3>
          <WhitepaperButton variant="secondary" size="large">
            🚀 Launch Whitepaper
          </WhitepaperButton>
        </div>
        
        <div style={{ 
          background: 'white', 
          padding: '30px', 
          borderRadius: '15px', 
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          marginTop: '40px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#ffb300', marginBottom: '15px' }}>
            About Legendary Ball
          </h3>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            Legendary Ball is a revolutionary blockchain-based gacha game built on the TON network. 
            Click any of the buttons above to read our comprehensive whitepaper and learn about our 
            innovative gaming mechanics, economic model, and future roadmap.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhitepaperDemo;
