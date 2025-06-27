import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const GPTChatBot = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('carechat');
    return saved ? JSON.parse(saved) : [{
      role: 'system',
      content: `You are CareCompanionAI, a trusted healthcare assistant for Medicare, Medicaid, UnitedHealthcare and other Health Providers. Provide accurate, user-friendly answers and fetch real data when needed.`
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
        setInput(e.results[0][0].transcript);
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
    const newMessages = [...messages, { role: 'user', content: input.trim() }];
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
      console.error('❌ Chatbot error:', err.message);
      setMessages([...newMessages, { role: 'assistant', content: ⚠️ Error processing request.' }]);
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

  const handleNewChat = () => {
    const systemMessage = {
      role: 'system',
      content: `You are CareCompanionAI, a trusted healthcare assistant for Medicare, Medicaid, and UnitedHealthcare. Provide accurate, user-friendly answers and fetch real data when needed.`
    };
    localStorage.setItem('carechat', JSON.stringify([systemMessage]));
    setMessages([systemMessage]);
    setInput('');
  };

  return (
    <div style={{
      maxWidth: '680px',
      margin: '2rem auto',
      padding: '1.5rem',
      backgroundColor: '#fdfdfb',
      borderRadius: '10px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
    }}>
      <h3 style={{ textAlign: 'center', color: '#2d3a2d' }}>💬 Chat with CareCompanionAI</h3>
      <div ref={chatRef} style={{
        maxHeight: '320px',
        overflowY: 'auto',
        background: '#fff',
        padding: '1rem',
        marginBottom: '1rem',
        borderRadius: '6px',
        border: '1px solid #ccc'
      }}>
        {messages.filter(m => m.role !== 'system').
