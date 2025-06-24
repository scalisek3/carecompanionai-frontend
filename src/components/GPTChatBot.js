import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const GPTChatBot = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('carechat');
    return saved ? JSON.parse(saved) : [{
      role: 'system',
      content: `You are CareCompanionAI, a helpful assistant for seniors navigating Medicare, Medicaid, UnitedHealthcare, and elder care. Provide real-time info including provider names, phone numbers, and links. Never tell the user to look it up — you do it.`
    }];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const chatRef = useRef(null);

  const callRealtimeAPIs = async (query) => {
    const results = [];

    try {
      const [medline, fda, trials] = await Promise.all([
        axios.get(`/api/medline?q=${query}`),
        axios.get(`/api/openfda?q=${query}`),
        axios.get(`/api/clinicaltrials?q=${query}`)
      ]);

      if (medline.data.summary) {
        results.push({
          role: 'assistant',
          content: `📚 **Definition from MedlinePlus**:\n${medline.data.summary}`
        });
      }

      if (fda.data.results && fda.data.results.length > 0) {
        results.push({
          role: 'assistant',
          content: `💊 **Drug Info from OpenFDA**:\n${fda.data.results.slice(0, 2).map(d =>
            `• ${d.openfda.brand_name?.[0] || 'Unnamed'} (${d.openfda.generic_name?.[0] || 'Unknown'}) - ${d.purpose?.[0] || 'No description'}`
          ).join('\n')}`
        });
      }

      if (trials.data && trials.data.length > 0) {
        results.push({
          role: 'assistant',
          content: `🧪 **Related Clinical Trials**:\n` + trials.data.slice(0, 2).map(t =>
            `• ${t.title} – [Details](${t.url})`
          ).join('\n')
        });
      }
    } catch (err) {
      results.push({ role: 'assistant', content: '⚠️ Error fetching real-time healthcare data.' });
    }

    return results;
  };

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

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const assistantMessage = [];

    // Real-time API lookups (definition, drug, trial)
    const realTimeResults = await callRealtimeAPIs(input);
    if (realTimeResults.length > 0) {
      setMessages([...newMessages, ...realTimeResults]);
    }

    try {
      const res = await axios.post('/api/chat-with-tools', { messages: [...newMessages, ...realTimeResults] });
      assistantMessage.push(res.data.choices[0].message);
    } catch (err) {
      assistantMessage.push({ role: 'assistant', content: '⚠️ Error processing request.' });
    }

    setMessages([...newMessages, ...realTimeResults, ...assistantMessage]);
    setLoading(false);
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
    doc.save('carecompanionai-conversation.pdf');
  };

  const handleNewChat = () => {
    const newStart = [{
      role: 'system',
      content: `You are CareCompanionAI, an expert assistant for Medicare, Medicaid, UnitedHealthcare, and elder care. Provide accurate local results and fetch real-time healthcare data automatically.`
    }];
    localStorage.setItem('carechat', JSON.stringify(newStart));
    setMessages(newStart);
    setInput('');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '1rem auto', padding: '1rem', backgroundColor: '#fefefe', borderRadius: '8px' }}>
      <h3 style={{ textAlign: 'center' }}>💬 Chat with CareCompanionAI</h3>
      <div ref={chatRef} style={{ maxHeight: '300px', overflowY: 'auto', background: '#fff', padding: '1rem', borderRadius: '4px' }}>
        {messages.filter(m => m.role !== 'system').map((msg, i) => (
          <div key={i} style={{ marginBottom: '0.5rem' }}>
            <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> <span dangerouslySetInnerHTML={{ __html: msg.content }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask a health question..." style={{ flex: 1 }} />
        <button onClick={handleSend} disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
        <button onClick={toggleMic} style={{ background: listening ? '#e57373' : '#a5d6a7' }}>{listening ? '🎤 Stop' : '🎙️ Speak'}</button>
        <button onClick={handleDownload}>📄 Save</button>
        <button onClick={handleNewChat} style={{ background: '#ffe082' }}>🆕 New Chat</button>
      </div>
    </div>
  );
};

export default GPTChatBot;



