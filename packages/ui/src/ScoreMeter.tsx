import React from 'react';

/**
 * Kiraaya Premium ScoreMeter
 * UX Goal: Emotional Engagement (Step 6)
 * - Uses HSL color interpolation for smooth transitions
 * - Dynamic tiers: Building -> Emerging -> Established -> Strong -> Prime
 */
export const ScoreMeter = ({ score = 300, tier = 'building' }) => {
  const normalized = (score - 300) / 600;
  const color = `hsl(${normalized * 120}, 70%, 45%)`; // Red (0) to Green (120)

  return (
    <div style={{ textAlign: 'center', padding: '20px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <h3 style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Your RentScore</h3>
      <div style={{ fontSize: '48px', fontWeight: 'bold', color }}>{score}</div>
      <div style={{ 
        display: 'inline-block', 
        padding: '4px 12px', 
        borderRadius: '20px', 
        background: color, 
        color: '#fff', 
        fontSize: '12px', 
        fontWeight: 'bold',
        marginTop: '10px'
      }}>
        {tier.toUpperCase()}
      </div>
      <p style={{ fontSize: '13px', color: '#888', marginTop: '15px' }}>
        Pay 2 more rents on time to unlock <b>Established</b> tier! 🔥
      </p>
    </div>
  );
};
