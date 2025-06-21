import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const extractLocation = (text) => {
  const match = text.match(/\b(?:in|near|around|from|to)\s([A-Z][a-z]+)(?:,\s?([A-Z]{2}))?/i);
  return match ? { city: match[1], state: match[2] || 'CA' } : null;
};

const extractKeyword = (text) => {
  const keywords = ['hospice', 'palliative', 'snf', 'skilled nursing', 'geriatrics'];
  return keywords.find(k => text.toLowerCase().includes(k)) || null;
};

const GPTChatBot = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('carechat');
    return saved ? JSON.parse(saved) : [{
      role: 'system',
      content: `You are CareCompanionAI, a highly capable healthcare assistant for seniors. You specialize in Medicare, Medicaid, UnitedHealthcare, and elder care services. When the user asks for provider options, always provide actual names, specialties, and phone numbers — never redirect them to a website or call center unless absolutely necessary.`
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
    const keyword = extractKeyword(input);
    const newMessages = [...messages];

    // Add user message
    newMessages.push({ role: 'user', content: input.trim() });

    // If we can detect location & keyword, do a live lookup first
    if (location && keyword) {
      try {
        const res = await axios.get(`https://carecompanionai-website.onrender.com/api/medicare-providers?city=${location.city}&state=${location.state}&keyword=${keyword}`);
        const providers = res.data.providers || [];

        if (providers.length > 0) {
          const resultsText = providers.map(p =>
            `• **${p.name || 'Unnamed Provider'}** (${p.specialty || 'Specialty unknown'})\n  ${p.address || 'No address listed'}\n  📞 ${p.phone || 'N/A'}`
          ).join('\n\n');

          newMessages.push({
            role: 'assistant',
            content: `Here are some ${keyword} providers in ${location.city}, ${location.state}:\n\n${resultsText}`
          });
        } else {
          newMessages.push({
            role: 'assistant',
            content: `Sorry, I couldn't find any ${keyword} providers in ${location.city}, ${location.state}.`
          });
        }
      } catch (e) {
        console.error(e);
        newMessages.push({ role: 'assistant', content: `⚠️ I encountered an error while looking up providers.` });
      }
    }

    setInput('');
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await axios.post('https://carecompanionai-website.onrender.com/api/chat-with-tools', { messages: newMessages });
      const reply = res.data.choices[0].message;
      setMessages([...newMessages, reply]);
    } catch (err) {
      console.error(err);
      alert('Bot error.');
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
      const lines = doc.splitTextToSize(`${m.role === 'user' ? 'You' : 'Bot'}: ${m.content}`, 180);
      lines.forEach(line => {
        doc.text(line, 10, y);
        y += 7;
        if (y > 270) { doc.addPage(); y = 10; }
      });
      y += 3;
    });
    doc.save('carecompanion-conversation.pdf');
  };

  const handleNewChat = () => {
    const initialMessages = [{
      role: 'system',
      content: `You are CareCompanionAI, an expert assistant for Medicare, Medicaid, UnitedHealthcare, and senior care. Provide direct, local results. Always do the research for the user.`
    }];
    localStorage.setItem('carechat', JSON.stringify(initialMessages));
    setMessages(initialMessages);
    setInput('');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '1rem auto', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}> CareCompanionAI</h2>
      <div ref={chatRef} style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem', background: '#fff', padding: '1rem', borderRadius: '4px' }}>
        {messages.filter(m => m.role !== 'system').map((msg, i) => (
          <div key={i} style={{ marginBottom: '0.5rem' }}>
            <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input value={input} onChange={e => setInput(e.target.value)} style={{ flex: 1 }} placeholder="Type or use mic..." />
        <button onClick={handleSend} disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
        <button onClick={toggleMic} style={{ background: listening ? '#e57373' : '#90caf9' }}>{listening ? '🎤 Stop' : '🎙️ Speak'}</button>
        <button onClick={handleDownload}>📄 Save PDF</button>
        <button onClick={handleNewChat} style={{ backgroundColor: '#ffc107' }}>🆕 New Chat</button>
      </div>
    </div>
  );
};

export default GPTChatBot;


