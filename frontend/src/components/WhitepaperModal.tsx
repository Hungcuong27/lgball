import React from 'react';

interface WhitepaperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WhitepaperModal: React.FC<WhitepaperModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '20px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          width: '1200px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#ffb300',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '50px',
            fontSize: '16px',
            cursor: 'pointer',
            zIndex: 1001,
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ff8f00';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffb300';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ✕ Close
        </button>

        {/* Whitepaper content - embedded directly */}
        <div style={{ padding: '40px' }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #ffb300 0%, #ff8f00 100%)',
            color: 'white',
            padding: '40px',
            textAlign: 'center',
            borderRadius: '20px',
            marginBottom: '40px'
          }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '10px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
              Legendary Ball
            </h1>
            <div style={{ fontSize: '1.2rem', opacity: 0.9 }}>
              Revolutionary Blockchain Gaming on TON Network
            </div>
            <div style={{ fontSize: '1.1rem', opacity: 0.8, marginTop: '10px' }}>
              Version 1.0 - July 2025
            </div>
          </div>

          {/* Content */}
          <div style={{ color: '#333', lineHeight: 1.6 }}>
            {/* Executive Summary */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#ffb300', fontSize: '2rem', marginBottom: '20px', borderBottom: '3px solid #ffb300', paddingBottom: '10px' }}>
                Executive Summary
              </h2>
              <p style={{ marginBottom: '15px', textAlign: 'justify' }}>
                Legendary Ball is a groundbreaking blockchain-based gacha game built on the TON (The Open Network) blockchain. 
                The game combines the excitement of collecting rare football player cards with the transparency and security of 
                blockchain technology, creating a unique gaming experience that rewards players with real cryptocurrency value.
              </p>
              <div style={{
                background: 'linear-gradient(135deg, #ffb300 0%, #ff8f00 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '15px',
                margin: '20px 0',
                boxShadow: '0 10px 20px rgba(255, 179, 0, 0.3)'
              }}>
                <strong>Key Innovation:</strong> Legendary Ball introduces a novel economic model where players can earn TON 
                cryptocurrency through gameplay, creating a sustainable play-to-earn ecosystem that bridges traditional gaming 
                with decentralized finance.
              </div>
            </div>

            {/* Game Mechanics */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#ffb300', fontSize: '2rem', marginBottom: '20px', borderBottom: '3px solid #ffb300', paddingBottom: '10px' }}>
                Game Mechanics
              </h2>
              <h3 style={{ color: '#764ba2', fontSize: '1.5rem', margin: '25px 0 15px 0' }}>Ball Types and Economics</h3>
              <div style={{ overflowX: 'auto', margin: '20px 0' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  background: 'white',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee', background: '#ffb300', color: 'white', fontWeight: '600' }}>Ball Type</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee', background: '#ffb300', color: 'white', fontWeight: '600' }}>Price (TON)</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee', background: '#ffb300', color: 'white', fontWeight: '600' }}>Common Rate</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee', background: '#ffb300', color: 'white', fontWeight: '600' }}>Rare Rate</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee', background: '#ffb300', color: 'white', fontWeight: '600' }}>Epic Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: '#f8f9fa' }}>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Bronze Ball</td>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>0.5</td>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>64%</td>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>30%</td>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>6%</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Silver Ball</td>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>1.0</td>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>62%</td>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>32%</td>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>6%</td>
                    </tr>
                    <tr style={{ background: '#f8f9fa' }}>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Gold Ball</td>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>2.0</td>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>62%</td>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>32%</td>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>6%</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Diamond Ball</td>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>5.0</td>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>55%</td>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>37%</td>
                      <td style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>8%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Economic Model */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#ffb300', fontSize: '2rem', marginBottom: '20px', borderBottom: '3px solid #ffb300', paddingBottom: '10px' }}>
                Economic Model
              </h2>
              <h3 style={{ color: '#764ba2', fontSize: '1.5rem', margin: '25px 0 15px 0' }}>Tokenomics Overview</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                margin: '20px 0'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #ffb300 0%, #ff8f00 100%)',
                  color: 'white',
                  padding: '25px',
                  borderRadius: '15px',
                  textAlign: 'center',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>House Edge</h4>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px' }}>15%</div>
                  <p>Sustainable platform revenue</p>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '25px',
                  borderRadius: '15px',
                  textAlign: 'center',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>Player Rewards</h4>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px' }}>75%</div>
                  <p>Returned to players</p>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '25px',
                  borderRadius: '15px',
                  textAlign: 'center',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>Referral System</h4>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px' }}>10%</div>
                  <p>Community incentives</p>
                </div>
              </div>
            </div>

            {/* Referral System */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#ffb300', fontSize: '2rem', marginBottom: '20px', borderBottom: '3px solid #ffb300', paddingBottom: '10px' }}>
                Referral System
              </h2>
              <p style={{ marginBottom: '15px', textAlign: 'justify' }}>
                The referral system incentivizes community growth through a sophisticated commission structure:
              </p>
              <ul style={{ margin: '15px 0', paddingLeft: '30px' }}>
                <li style={{ marginBottom: '8px' }}><strong>Referral Code:</strong> Unique 8-character identifier for each user</li>
                <li style={{ marginBottom: '8px' }}><strong>Commission Rate:</strong> 10% of referred user's ball purchases</li>
                <li style={{ marginBottom: '8px' }}><strong>Multi-level Tracking:</strong> Comprehensive referral chain management</li>
                <li style={{ marginBottom: '8px' }}><strong>Instant Payouts:</strong> Real-time commission distribution</li>
              </ul>
            </div>

            {/* Roadmap */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#ffb300', fontSize: '2rem', marginBottom: '20px', borderBottom: '3px solid #ffb300', paddingBottom: '10px' }}>
                Roadmap and Development
              </h2>
              <h3 style={{ color: '#764ba2', fontSize: '1.5rem', margin: '25px 0 15px 0' }}>Phase 1 (Q3 2025)</h3>
              <ul style={{ margin: '15px 0', paddingLeft: '30px' }}>
                <li style={{ marginBottom: '8px' }}>Platform launch and initial user acquisition</li>
                <li style={{ marginBottom: '8px' }}>Community building and feedback collection</li>
                <li style={{ marginBottom: '8px' }}>Performance optimization and bug fixes</li>
                <li style={{ marginBottom: '8px' }}>Security audit completion</li>
              </ul>
              <h3 style={{ color: '#764ba2', fontSize: '1.5rem', margin: '25px 0 15px 0' }}>Phase 2 (Q4 2025)</h3>
              <ul style={{ margin: '15px 0', paddingLeft: '30px' }}>
                <li style={{ marginBottom: '8px' }}>Advanced ball types and special events</li>
                <li style={{ marginBottom: '8px' }}>Tournament system implementation</li>
                <li style={{ marginBottom: '8px' }}>Mobile app development</li>
                <li style={{ marginBottom: '8px' }}>Partnership expansion</li>
              </ul>
            </div>

            {/* Conclusion */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#ffb300', fontSize: '2rem', marginBottom: '20px', borderBottom: '3px solid #ffb300', paddingBottom: '10px' }}>
                Conclusion
              </h2>
              <p style={{ marginBottom: '15px', textAlign: 'justify' }}>
                Legendary Ball represents a significant advancement in blockchain gaming, combining innovative game mechanics 
                with robust economic models and cutting-edge technology. The project's focus on sustainability, security, 
                and user experience positions it for long-term success in the rapidly evolving blockchain gaming landscape.
              </p>
              <div style={{
                background: 'linear-gradient(135deg, #ffb300 0%, #ff8f00 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '15px',
                margin: '20px 0',
                boxShadow: '0 10px 20px rgba(255, 179, 0, 0.3)'
              }}>
                <strong>Future Vision:</strong> As blockchain technology continues to mature, Legendary Ball aims to become 
                the foundation for a broader ecosystem of blockchain-based entertainment and financial services, creating 
                value for players, developers, and the broader TON community.
              </div>
            </div>

            {/* Contact and Resources */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#ffb300', fontSize: '2rem', marginBottom: '20px', borderBottom: '3px solid #ffb300', paddingBottom: '10px' }}>
                Contact and Resources
              </h2>
              <h3 style={{ color: '#764ba2', fontSize: '1.5rem', margin: '25px 0 15px 0' }}>Official Channels</h3>
              <ul style={{ margin: '15px 0', paddingLeft: '30px' }}>
                <li style={{ marginBottom: '8px' }}><strong>Website:</strong> [Legendary Ball Official Site]</li>
                <li style={{ marginBottom: '8px' }}><strong>Telegram:</strong> <a href="https://t.me/+y_UbYXByP05kZjBl" target="_blank" style={{ color: '#0088cc', textDecoration: 'none' }}>@Legendary Ball Official Group</a></li>
                <li style={{ marginBottom: '8px' }}><strong>Discord:</strong> [Community Server]</li>
                <li style={{ marginBottom: '8px' }}><strong>Twitter:</strong> [Official Handle]</li>
              </ul>
            </div>

            {/* Join Our Community */}
            <div style={{
              textAlign: 'center',
              background: 'linear-gradient(135deg, #ffb300 0%, #ff8f00 100%)',
              color: 'white',
              padding: '30px',
              borderRadius: '20px',
              marginTop: '40px',
              marginBottom: '40px',
              boxShadow: '0 15px 30px rgba(255, 179, 0, 0.4)'
            }}>
              <h2 style={{ color: 'white', borderBottom: 'none', marginBottom: '20px' }}>🚀 Join Our Community! 🚀</h2>
              <p style={{ fontSize: '1.2rem', marginBottom: '25px' }}>Connect with fellow players, get the latest updates, and share your experiences!</p>
              <a href="https://t.me/+y_UbYXByP05kZjBl" target="_blank" style={{
                display: 'inline-block',
                background: 'white',
                color: '#ff8f00',
                padding: '15px 30px',
                borderRadius: '50px',
                textDecoration: 'none',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease'
              }}>
                📱 Join Telegram Group
              </a>
              <p style={{ marginTop: '20px', opacity: 0.9, fontSize: '0.9rem' }}>Click the button above to join our official Telegram group and become part of the Legendary Ball community!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhitepaperModal;
