import React, { useState } from 'react';
import axios from 'axios';

const CoverageCheckForm = () => {
  const [memberId, setMemberId] = useState('');
  const [payerId, setPayerId] = useState(''); // e.g. '87726' for UHC
  const [dateOfService, setDateOfService] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResponse(null);

    const payload = {
      tradingPartnerServiceId: payerId,
      member: {
        id: memberId
      },
      serviceDate: dateOfService
    };

    try {
      const res = await axios.post('https://carecompanionai-website.onrender.com/api/coverage-check', payload);
      setResponse(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error occurred while checking coverage.');
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: '1rem', backgroundColor: '#f3f3f3', borderRadius: '8px' }}>
      <h3>🩺 Coverage Check (Availity)</h3>
      <form onSubmit={handleSubmit}>
        <label>Member ID:</label>
        <input value={memberId} onChange={e => setMemberId(e.target.value)} required style={{ width: '100%', marginBottom: '1rem' }} />
        
        <label>Payer ID:</label>
        <input value={payerId} onChange={e => setPayerId(e.target.value)} required placeholder="e.g. 87726 for UHC" style={{ width: '100%', marginBottom: '1rem' }} />
        
        <label>Date of Service:</label>
        <input type="date" value={dateOfService} onChange={e => setDateOfService(e.target.value)} required style={{ width: '100%', marginBottom: '1rem' }} />
        
        <button type="submit">Check Coverage</button>
      </form>

      {response && (
        <div style={{ marginTop: '1rem', backgroundColor: '#e0ffe0', padding: '1rem' }}>
          <strong>✅ Coverage Response:</strong>
          <pre style={{ fontSize: '12px' }}>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '1rem', backgroundColor: '#ffe0e0', padding: '1rem', color: 'red' }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
};

export default CoverageCheckForm;
