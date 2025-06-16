import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const extractLocation = (text) => {
  const match = text.match(/\b(?:in|near|around|from|to)\s([A-Z][a-z]+(?:,\s?[A-Z]{2})?)/i);
  return match ? match[1] : null;
};

const smartPrompt = (text) => {
  const prompts = [
    { keywords: ['bipap', 'ventilator'], message: 'Check if the SNF provides respiratory or BiPAP support.' },
    { keywords: ['palliative', 'hospice'], message: 'See if the provider offers palliative or end-of-life care.' },
    { keywords: ['mri', 'scan'], message: 'Ask about pre-authorization and in-network imaging centers.' },
    { keywords: ['blood', 'lab'], message: 'Does this test require fasting? Check in-network labs.' },
    { keywords: ['urgent', 'er'], message: 'Is this covered as an emergency or urgent care visit?' }
  ];
  const found = prompts.find(({ keywords }) => keywords.some(k => text.toLowerCase().includes(k)));
  return found ? {
    role: 'system',
    content: `User may need follow-up guidance. Example: ${found.message}`
  } : null;
};

const GPTChatBot = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('carechat');
    return saved ? JSON.parse(saved) : [{
      role: 'system',
      content: `You are CareCompanionAI, an expert assistant for Medicare, Medicaid, UnitedHealthcare, and senior care. Provide direct, local results. Always do the research for the user.`
    }];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInput(transcript);
        setTimeout(handleSend, 300);
      };
      recognitionRef.current.onend = () => setListening(false);
      recognitionRef.current.onerror = () => setListening(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('carechat', JSON.stringify(messages));
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const toggleMic = () => {
    if (!SpeechRecognition) return alert('Voice input not supported.');
    listening ? recognitionRef.current.stop() : recognitionRef.current.start();
    setListening(!listening);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const location = extractLocation(input);
    const newMessages = [
      ...messages,
      location ? { role: 'system', content: `User is located in ${location}` } : null,
      smartPrompt(input),
      { role: 'user', content: input.trim() }
    ].filter(Boolean);

    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('https://carecompanionai-website.onrender.com/api/chat-with-tools', {
  messages: newMessages
});

      const reply = res.data.choices[0].message;
      setMessages([...newMessages, reply]);
    } catch (err) {
      console.error(err);
      alert('Error from assistant.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(10);
    doc.text(`CareCompanionAI Conversation – ${new Date().toLocaleString()}`, 10, y);
    y += 10;
    messages.filter(m => m.role !== 'system').forEach(m => {
      doc.text(`${m.role === 'user' ? 'You' : 'Bot'}: ${m.content}`, 10, y);
      y += 10;
      if (y > 270) { doc.addPage(); y = 10; }
    });
    doc.save('carecompanion-conversation.pdf');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '1rem auto', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>💬 CareCompanion AI</h2>
      <div ref={chatRef} style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem', background: '#fff', padding: '1rem', borderRadius: '4px' }}>
        {messages.filter(m => m.role !== 'system').map((msg, i) => (
          <div key={i}><strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input value={input} onChange={e => setInput(e.target.value)} style={{ flex: 1 }} placeholder="Type or use mic..." />
        <button onClick={handleSend} disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
        <button onClick={toggleMic} style={{ background: listening ? '#e57373' : '#90caf9' }}>{listening ? '🎤 Stop' : '🎙️ Speak'}</button>
        <button onClick={handleDownload}>📄 Save</button>
      </div>
    </div>
  );
};

export default GPTChatBot;



