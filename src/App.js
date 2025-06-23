import React from 'react';
import GPTChatBot from './components/GPTChatBot';
import CoverageCheckForm from './components/CoverageCheckForm';

function App() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#2E86AB', color: 'white', padding: '1rem 2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>CareCompanion AI</h1>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '2rem 1rem', backgroundColor: '#F1F7FB', textAlign: 'center' }}>
        <img
          src="/images/hero.png"
          alt="CareCompanionAI - robot and human hand"
          style={{ maxWidth: '250px', height: 'auto', marginBottom: '1rem' }}
        />
        <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Navigate Healthcare with Confidence</h2>
        <p style={{ maxWidth: '600px', margin: '0 auto 1rem', fontSize: '1rem' }}>
          Your AI-powered assistant for navigating your healthcare options, avoiding surprise bills, and getting your healthcare questions answered.
        </p>
        <button style={{
          backgroundColor: '#2E86AB',
          color: 'white',
          border: 'none',
          padding: '0.6rem 1.2rem',
          fontSize: '1rem',
          borderRadius: '6px',
          cursor: 'pointer'
        }}>
          Get Started
        </button>
      </section>

      {/* How It Works */}
      <section style={{ padding: '2rem 1rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>How It Works</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '200px' }}>
            <h4>1. Ask a Question</h4>
            <p>Type or speak your healthcare question into the AI assistant.</p>
          </div>
          <div style={{ maxWidth: '200px' }}>
            <h4>2. Get Clear Answers</h4>
            <p>Receive step-by-step guidance tailored to your situation.</p>
          </div>
          <div style={{ maxWidth: '200px' }}>
            <h4>3. Take Action</h4>
            <p>Know what to do next — no confusion, no stress.</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{ backgroundColor: '#E8F5E9', padding: '2rem 1rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Why CareCompanionAI?</h3>
        <ul style={{ listStyle: 'none', padding: 0, maxWidth: '600px', margin: '0 auto', lineHeight: '1.8rem' }}>
          <li>✅ Easy for seniors and caregivers to use</li>
          <li>✅ Prevent surprise medical bills</li>
          <li>✅ Understand your medical options</li>
          <li>✅ Get peace of mind from trusted and knowledgeable AI help</li>
        </ul>
      </section>

      {/* Chatbot Section */}
      <section style={{ backgroundColor: '#FAFAFA', padding: '2rem 1rem' }}>
        <h3 style={{ textAlign: 'center', fontSize: '1.4rem', marginBottom: '1rem' }}>💬 Chat with CareCompanionAI</h3>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <GPTChatBot />
        </div>
      </section>

      {/* Coverage Check Section */}
      <section style={{ backgroundColor: '#fff', padding: '2rem 1rem' }}>
        <h3 style={{ textAlign: 'center', fontSize: '1.4rem', marginBottom: '1rem' }}>🔍 Check Insurance Coverage</h3>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <CoverageCheckForm />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '1rem', backgroundColor: '#f0f0f0', textAlign: 'center', fontSize: '0.85rem' }}>
        &copy; {new Date().getFullYear()} CareCompanion AI. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
