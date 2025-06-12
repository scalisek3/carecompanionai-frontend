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
    {
      keywords: ['mri', 'scan', 'imaging'],
      prompt: 'Ask if this procedure requires pre-authorization from UnitedHealthcare or if there are preferred imaging centers.'
    },
    {
      keywords: ['blood test', 'lab', 'cbc', 'lipid'],
      prompt: 'Ask if you need a fasting blood test beforehand or must use a specific in-network lab.'
    },
    {
      keywords: ['specialist', 'referral', 'consult'],
      prompt: 'Check if a referral is needed from your primary care provider to see this specialist.'
    },
    {
      keywords: ['medication', 'prescription', 'pharmacy'],
      prompt: 'Confirm if the medication is covered by UnitedHealthcare and if prior authorization is required.'
    }
  ];

  for (const { keywords, prompt } of triggers) {
    if (keywords.some(k => text.toLowerCase().includes(k))) {
      return {
        role: 'system',
        content: `The user has mentioned a medical topic that may involve extra steps. Remind them to consider: ${prompt}`
      };
    }
  }

  return null;
};

const GPTChatBot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'system',
      content: `You are CareCompanionAI, a warm and helpful AI assistant for seniors in California. You specialize in Medicare, Medicaid, UnitedHealthcare, and General Health Care.

Answer questions clearly and compassionately. Offer step-by-step advice. Prompt users to ask about lab tests, prior authorizations, referrals, out-of-pocket costs, and timing when relevant.`
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setListening(false);
      };

      recognitionRef.current.onend = () => setListening(false);
      recognitionRef.current.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setListening(false);
      };
    }
  }, []);

  const toggleMic = () => {
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.');
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setListening(!listening);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const location = extractLocation(input);
    const locationMessage = location ? {
      role: 'system',
      content: `The user is located in ${location}. Tailor your response accordingly.`
    } : null;

    const smartPrompt = generateSmartPrompt(input);

    const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
    const preventRepetitionMessage = lastUserMessage && lastUserMessage.content === input.trim()
      ? {
          role: 'system',
          content: 'The user repeated their last question. Please avoid restating the same information.'
        }
      : null;

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
      <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem', backgroundColor: '#fff', padding: '1rem', borderRadius: '4px' }}>
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
          placeholder="Type or speak..."
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


