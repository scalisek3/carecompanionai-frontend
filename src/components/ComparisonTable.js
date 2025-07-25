import React from 'react';

const ComparisonTable = () => {
  const headerStyle = {
    backgroundColor: '#eaf6e9',
    padding: '0.5rem',
    fontWeight: 'bold',
    border: '1px solid #ccc',
  };

  const cellStyle = {
    padding: '0.5rem',
    border: '1px solid #ccc',
    textAlign: 'center',
  };

  return (
    <section style={{ padding: '2rem 1rem', backgroundColor: '#fefef7' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>How We Compare</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr>
              <th style={headerStyle}>Feature</th>
              <th style={headerStyle}>CareCompanionAI</th>
              <th style={headerStyle}>ChatGPT</th>
              <th style={headerStyle}>Medicare.gov</th>
              <th style={headerStyle}>WebMD</th>
              <th style={headerStyle}>Zocdoc</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Personalized Medicare Answers', '✅', '⚠️', '✅', '❌', '❌'],
              ['Real-time Provider Lookup', '✅', '❌', '✅', '❌', '✅'],
              ['Prescription Cost Help', '✅', '⚠️', '❌', '✅', '❌'],
              ['AI Chat Support', '✅', '✅', '❌', '❌', '❌'],
              ['Human-like Conversation', '✅', '✅', '❌', '❌', '❌'],
              ['Billing/Authorization Help', '✅', '❌', '❌', '❌', '❌'],
              ['Coverage Verification', '✅', '❌', '❌', '❌', '❌'],
              ['Easy for Seniors', '✅', '⚠️', '❌', '❌', '❌'],
            ].map(([feature, cca, gpt, medicare, webmd, zocdoc], i) => (
              <tr key={i}>
                <td style={cellStyle}>{feature}</td>
                <td style={cellStyle}>{cca}</td>
                <td style={cellStyle}>{gpt}</td>
                <td style={cellStyle}>{medicare}</td>
                <td style={cellStyle}>{webmd}</td>
                <td style={cellStyle}>{zocdoc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ComparisonTable;
