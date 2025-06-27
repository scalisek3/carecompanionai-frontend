import React from 'react';
import GPTChatBot from './components/GPTChatBot';

function App() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#333', backgroundColor: '#fff' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#99c19e', color: 'white', padding: '1rem 2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>CareCompanionAI</h1>
      </header>

      {/* Hero Section with overlay text */}
      <section style={{
        position: 'relative',
        height: '400px',
        backgroundImage: 'url("/images/hero1.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          padding: '2rem',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '600px'
        }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Navigate Healthcare with Confidence</h2>
          <p>Your AI-powered assistant for understanding your Healthcare options, avoiding surprise bills, and finding care options tailored to you.</p>
          <button style={{
            backgroundColor: '#4f8a6f',
            color: 'white',
            border: 'none',
            padding: '0.6rem 1.2rem',
            fontSize: '1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '1rem'
          }}>
            Get Started
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '3rem 1rem', textAlign: 'center', backgroundColor: '#fefef7' }}>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>How It Works</h3>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '2rem',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          <div style={{ maxWidth: '240px' }}>
            <h4>1. Ask a Question</h4>
            <p>Type or speak your healthcare question into the AI assistant.</p>
          </div>
          <div style={{ maxWidth: '240px' }}>
            <h4>2. Get Clear Answers</h4>
            <p>Receive step-by-step guidance tailored to your situation.</p>
          </div>
          <div style={{ maxWidth: '240px' }}>
            <h4>3. Take Action</h4>
            <p>Know what to do next — no confusion, no stress.</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{ backgroundColor: '#eaf6e9', padding: '3rem 1rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Why CareCompanionAI?</h3>
        <ul style={{ listStyle: 'none', padding: 0, maxWidth: '600px', margin: '0 auto', lineHeight: '1.8rem', textAlign: 'left' }}>
          <li>✅ Easy for seniors and caregivers to use</li>
          <li>✅ Prevent surprise medical bills</li>
          <li>✅ Understand your Medicare options</li>
          <li>✅ Get peace of mind from trusted AI help</li>
        </ul>
      </section>

      {/* Chatbot Section */}
      <section style={{ backgroundColor: '#f9f9f9', padding: '3rem 1rem' }}>
        <GPTChatBot />
      </section>

      {/* Footer */}
      <footer style={{
        padding: '1rem',
        backgroundColor: '#f0f0f0',
        textAlign: 'center',
        fontSize: '0.85rem'
      }}>
        &copy; {new Date().getFullYear()} CareCompanionAI. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
