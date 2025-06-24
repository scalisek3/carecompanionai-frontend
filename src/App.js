import React from 'react';
import GPTChatBot from './components/GPTChatBot';
import CoverageCheckForm from './components/CoverageCheckForm';

function App() {
  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', color: '#3b3b3b', lineHeight: '1.6' }}>
      
      {/* Header */}
      <header style={{
        backgroundColor: '#8FB996', // soft sage green
        color: '#fff',
        padding: '1rem 2rem',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>CareCompanionAI</h1>
      </header>

     {/* Hero Section */}
<section
  style={{
    position: 'relative',
    height: '60vh',
    backgroundImage: `url("/images/hero1.png")`, // your uploaded higher-quality image
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'scroll',
    imageRendering: 'auto' // helps browser use default best rendering
  }}
>
  <div
    style={{
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      padding: '2rem',
      borderRadius: '12px',
      maxWidth: '700px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}
  >
    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Navigate Healthcare with Confidence</h2>
    <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
      Your AI-powered assistant for understanding your Healthcare options, avoiding surprise bills, and finding care options tailored to you.
    </p>
    <button
      style={{
        backgroundColor: '#4A775B',
        color: 'white',
        border: 'none',
        padding: '0.7rem 1.5rem',
        fontSize: '1rem',
        borderRadius: '6px',
        cursor: 'pointer'
      }}
    >
      Get Started
    </button>
  </div>
</section>

      {/* How It Works */}
      <section style={{ padding: '2rem 1rem', backgroundColor: '#FDFCF8', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>How It Works</h3>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          {[
            ['1. Ask a Question', 'Type or speak your healthcare question into the AI assistant.'],
            ['2. Get Clear Answers', 'Receive step-by-step guidance tailored to your situation.'],
            ['3. Take Action', 'Know what to do next — no confusion, no stress.']
          ].map(([title, desc], idx) => (
            <div key={idx} style={{
              maxWidth: '240px',
              background: '#fff',
              padding: '1rem',
              borderRadius: '10px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
            }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{title}</h4>
              <p style={{ fontSize: '0.95rem' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section style={{ backgroundColor: '#EEF2E1', padding: '2rem 1rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Why CareCompanionAI?</h3>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          maxWidth: '600px',
          margin: '0 auto',
          fontSize: '1.05rem'
        }}>
          <li>✅ Easy for seniors and caregivers to use</li>
          <li>✅ Prevent surprise medical bills</li>
          <li>✅ Understand your medical options</li>
          <li>✅ Get peace of mind from trusted and knowledgeable AI help</li>
        </ul>
      </section>

      {/* Chatbot */}
      <section style={{ backgroundColor: '#FAFAFA', padding: '2rem 1rem' }}>
        <h3 style={{ textAlign: 'center', fontSize: '1.4rem', marginBottom: '1rem' }}>
          💬 Chat with CareCompanionAI
        </h3>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <GPTChatBot />
        </div>
      </section>

      {/* Insurance Check Form */}
      <section style={{ backgroundColor: '#FDFCF8', padding: '2rem 1rem' }}>
        <h3 style={{ textAlign: 'center', fontSize: '1.4rem', marginBottom: '1rem' }}>
          🔍 Check Your Insurance Coverage
        </h3>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <CoverageCheckForm />
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '1rem',
        backgroundColor: '#DEDCC3',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: '#5a5a5a'
      }}>
        &copy; {new Date().getFullYear()} CareCompanion AI. All rights reserved.
      </footer>
    </div>
  );
}

export default App;

