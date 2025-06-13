import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const extractLocation = (text) => {
  const locationRegex = /\b(in|near|around|from|to) ([A-Z][a-z]+(?:,?\s?[A-Z]{2})?)\b/;
  const match = text.match(locationRegex);
  return match ? match[2] : null;
};

const generateSmartPrompt = (text) => {
  const triggers = [
    { keywords: ['mri', 'scan', 'imaging', 'x-ray', 'ultrasound'], prompt: 'Ask if this procedure requires pre-authorization from UnitedHealthcare or if there are preferred imaging centers.' },
    { keywords: ['blood test', 'lab', 'cbc', 'lipid'], prompt: 'Ask if you need to complete a fasting blood test before the procedure or visit a specific lab in-network.' },
    { keywords: ['specialist', 'referral', 'consult'], prompt: 'Check if you need a referral from your primary doctor before seeing the specialist.' },
    { keywords: ['medication', 'prescription', 'pharmacy'], prompt: 'Verify if this medication is covered by your UnitedHealthcare plan and whether prior authorization is needed.' },
    { keywords: ['urgent care', 'emergency', 'er'], prompt: 'Ask if your visit to urgent care or ER is covered, and whether you need follow-up paperwork.' }
  ];
  for (let { keywords, prompt } of triggers) {
    if (keywords.some(k => text.toLowerCase().includes(k))) {
      return {
        role: 'system',
        content: `The user mentioned a medical topic. Help them confirm important next steps like labs, referrals, or insurance clearance. Example: "${prompt}"`
      };
    }
  }
  return null;
};

const GPTChatBot = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('carechat');
    return saved ? JSON.parse(saved) : [{
      role: 'system',
      content: `You are CareCompanionAI, a warm and helpful AI assistant for seniors. You specialize in Medicare, Medicaid, UnitedHealthcare, and general healthcare guidance. Always provide clear, compassionate, step-by-step suggestions.`
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
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        if (transcript) {
          setInput(transcript);
          setTimeout(() => handleSend(), 300); // Auto-send
        }
        setListening(false);
      };

      recognitionRef.current.onend = () => setListening(false);
      recognitionRef.current.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setListening(false);
      };
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('carechat', JSON.stringify(messages));
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleMic = () => {
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.');
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const location = extractLocation(input);
    const locationMessage = location ? {
      role: 'system',
      content: `The user is located in ${location}. Tailor your guidance accordingly.`
    } : null;

    const smartPrompt = generateSmartPrompt(input);
    const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
    const preventRepetitionMessage = lastUserMessage && lastUserMessage.content === input.trim()
      ? {
        role: 'system',
        content: 'Avoid repeating previous content. Focus on progressing the conversation.'
      } : null;

    const newMessages = [
      ...messages,
      ...(locationMessage ? [locationMessage] : []),
      ...(preventRepetitionMessage ? [preventRepetitionMessage] : []),
      ...(smartPrompt ? [smartPrompt] : []),
      { role: 'user', content: input }
    ];

    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(
        'https://carecompanionai-website.onrender.com/api/chat-with-tools',
        { messages: newMessages }
      );
      const assistantReply = response.data.choices[0].message;
      setMessages([...newMessages, assistantReply]);
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    let y = 10;
    const date = new Date().toLocaleString();
    doc.setFontSize(10);
    doc.text(`CareCompanionAI Conversation – ${date}`, 10, y);
    y += 10;
    messages.filter(m => m.role !== 'system').forEach((msg) => {
      const label = msg.role === 'user' ? 'You: ' : 'Bot: ';
      const lines = doc.splitTextToSize(`${label}${msg.content}`, 180);
      lines.forEach(line => {
        if (y > 280) {
          doc.addPage();
          y = 10;
        }
        doc.text(line, 10, y);
        y += 7;
      });
      y += 3;
    });
    doc.save('carecompanionai-conversation.pdf');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '1rem auto', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>💬 Chat with CareCompanion AI</h2>
      <div ref={chatRef} style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem', backgroundColor: '#fff', padding: '1rem', borderRadius: '4px' }}>
        {messages.filter(m => m.role !== 'system').map((msg, i) => (
          <div key={i} style={{ marginBottom: '0.5rem' }}>
            <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type or use mic..." style={{ flexGrow: 1, padding: '0.5rem' }} />
        <button onClick={handleSend} disabled={loading} style={{ padding: '0.5rem 1rem' }}>
          {loading ? 'Sending...' : 'Send'}
        </button>
        <button onClick={toggleMic} style={{ padding: '0.5rem 1rem', backgroundColor: listening ? '#e57373' : '#90caf9' }}>
          {listening ? '🎤 Listening...' : '🎙️ Speak'}
        </button>
        <button onClick={handleDownload} style={{ padding: '0.5rem 1rem' }}>
          📄 Save Chat
        </button>
      </div>
    </div>
  );
};

export default GPTChatBot;
