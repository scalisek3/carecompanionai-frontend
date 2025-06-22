import React, { useState } from 'react';
import axios from 'axios';

const CoverageCheckForm = () => {
  const [memberId, setMemberId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [payerId, setPayerId] = useState('87726'); // UHC
  const [npi, setNpi] = useState('1234567890'); // Test NPI
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResponse(null);

    const payload = {
      provider: { npi },
      subscriber: {
        memberId,
        firstName,
        lastName,
        dob
      },
      payer: {
        id: payerId,
        name: "UnitedHealthcare"
      },
      serviceTypeCodes: ["30"], // General health benefits
      traceNumber: `CCAI-${Date.now()}`
    };

    try {
      const res = await axios.post('https://carecompanionai-website.onrender.com/api/coverage-check', payload);
      setResponse(res.data);
    } catch (err) {
      console.error(err.response?.data || err.message);
      setError(err.response?.data?.error || 'Something went wrong during the coverage check.');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <h3>🩺 Insurance Coverage Check (Availity)</h3>
      <form onSubmit={handleSubmit}>
        <label>First Name:</label>
        <input value={firstName} onChange={e => setFirstName(e.target.value)} required style={{ width: '100%' }} />

        <label>Last Name:</label>
        <input value={lastName} onChange={e => setLastName(e.target.value)} required style={{ width: '100%' }} />

        <label>Date of Birth:</label>
        <input type="date" value={dob} onChange={e => setDob(e.target.value)} required style={{ width: '100%' }} />

        <label>Member ID:</label>
        <input value={memberId} onChange={e => setMemberId(e.target.value)} required style={{ width: '100%' }} />

        <label>Payer ID:</label>
        <input value={payerId} onChange={e => setPayerId(e.target.value)} required style={{ width: '100%' }} />

        <label>Provider NPI:</label>
        <input value={npi} onChange={e => setNpi(e.target.value)} required style={{ width: '100%' }} />

        <button type="submit" style={{ marginTop: '1rem' }}>Check Coverage</button>
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
