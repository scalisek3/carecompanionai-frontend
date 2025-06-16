import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Detect location
const extractLocation = (text) => {
  const locationRegex = /\b(in|near|around|from|to) ([A-Z][a-z]+(?:,?\s?[A-Z]{2})?)\b/;
  const match = text.match(locationRegex);
  return match ? match[2] : null;
};

// Smart prompt logic
const generateSmartPrompt = (text) => {
  const triggers = [
    {
      keywords: ['palliative', 'hospice', 'end-of-life'],
      prompt: 'Ask if they would like help finding palliative care providers in their city and confirm if those providers accept Medicare or UnitedHealthcare.'
    },
    {
      keywords: ['mri', 'imaging', 'scan', 'x-ray', 'ultrasound'],
      prompt: 'Ask if this procedure needs pre-authorization or must be performed at an in-network imaging center.'
    },
    {
      keywords: ['blood test', 'lab', 'cbc', 'lipid'],
      prompt: 'Ask if a fasting blood test is required or if they should use a preferred in-network lab.'
    },
    {
      keywords: ['specialist', 'referral', 'consult'],
      prompt: 'Ask if they need a referral from their primary doctor for the specialist visit.'
    },
    {
      keywords: ['medication', 'prescription', 'pharmacy'],
      prompt: 'Ask if their medication is covered by UnitedHealthcare or Medicare and whether prior authorization is needed.'
    },
    {
      keywords: ['urgent care', 'emergency', 'er'],
      prompt: 'Remind them to verify coverage and whether follow-up paperwork is required.'
    }
  ];

  for (let { keywords, prompt } of triggers) {
    if (keywords.some(k => text.toLowerCase().includes(k))) {
      return {
        role: 'system',
        content: `Smart follow-up: ${prompt}`
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
      content: `You are CareCompanionAI, a warm and helpful AI assistant for seniors. You specialize in Medicare, Medicaid, UnitedHealthcare, and healthcare access. 

Always:
- Answer clearly with step-by-step advice.
- Include phone numbers or links when relevant.
- Suggest questions the user should ask their provider (e.g. prior authorization, network coverage, required labs).
- Avoid repeating unless asked. Assume the user expects *you* to do the work.`
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
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        if (transcript) {
          setInput(transcript);
          setTimeout(() => handleSend(), 300);
        }
        setListening(false);
      };

      recognitionRef.current.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setListening(false);
      };
      recognitionRef.current.onend = () => setListening(false);
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
      alert('Your browser does not support voice input.');
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
    const locationMessage = location
      ? { role: 'system', content: `User is located in ${location}. Tailor recommendations.` }
      : null;

    const smartPrompt = generateSmartPrompt(input);
    const lastUser = messages.slice().reverse().find(m => m.role === 'user');
    const repeatBlock = lastUser?.content === input.trim()
      ? { role: 'system', content: 'Avoid repeating the last message. Continue the conversation.' }
      : null;

    const newMessages = [
      ...messages,
      ...(locationMessage ? [locationMessage] : []),
      ...(repeatBlock ? [repeatBlock] : []),
      ...(smartPrompt ? [smartPrompt] : []),
      { role: 'user', content: input.trim() }
    ];

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
      console.error('❌ Assistant error:', err);
      alert('The assistant encountered an issue. Please try again shortly.');
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
    messages.filter(m => m.role !== 'system').forEach(msg => {
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
      <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>💬 Chat with CareCompanionAI</h2>

      <div
        ref={chatRef}
        style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#fff', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}
      >
        {messages.filter(m => m.role !== 'system').map((msg, i) => (
          <div key={i} style={{ marginBottom: '0.5rem' }}>
            <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type or speak your question..."
          style={{ flexGrow: 1, padding: '0.5rem' }}
        />
        <button onClick={handleSend} disabled={loading} style={{ padding: '0.5rem 1rem' }}>
          {loading ? 'Sending...' : 'Send'}
        </button>
        <button onClick={toggleMic} style={{ padding: '0.5rem 1rem', backgroundColor: listening ? '#e57373' : '#90caf9' }}>
          {listening ? '🎤 Listening...' : '🎙️ Speak'}
        </button>
        <button onClick={handleDownload} style={{ padding: '0.5rem 1rem' }}>
          📄 Save
        </button>
      </div>
    </div>
  );
};

export default GPTChatBot;


