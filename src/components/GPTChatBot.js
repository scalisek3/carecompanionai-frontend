import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const GPTChatBot = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('carechat');
    return saved ? JSON.parse(saved) : [{
      role: 'system',
      content: `You are CareCompanionAI, a helpful AI that provides real-time healthcare answers using trusted U.S. government and clinical sources.`
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

  const checkKeyword = async (text) => {
    const lower = text.toLowerCase();

    if (lower.includes('drug') || lower.includes('side effects') || lower.includes('fda')) {
      const keyword = text.split(' ').pop();
      const res = await axios.get(`https://api.fda.gov/drug/label.json?search=${keyword}&limit=1`);
      const result = res.data.results?.[0];
      return result ? `According to the FDA, here is information on ${keyword}:\n\n${result.description || result.indications_and_usage?.[0] || 'No summary found.'}` : null;
    }

    if (lower.includes('define') || lower.includes('what is')) {
      const term = text.split(' ').slice(-1)[0];
      const res = await axios.get(`https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=${term}&retmax=1`);
      return res?.data?.includes('<content>') ? `According to MedlinePlus, here is information on ${term}.` : null;
    }

    if (lower.includes('nursing home') || lower.includes('hospice')) {
      const type = lower.includes('hospice') ? 'hospice' : 'nursing_home';
      const location = text.match(/in ([A-Za-z\s]+,?\s?[A-Z]{2})/)?.[1];
      const url = `/api/cms-data?type=${type}&location=${location || ''}`;
      const res = await axios.get(url);
      return res.data.length > 0 ? `Here are ${type.replace('_', ' ')} options:\n\n${res.data.map(p => `• ${p.name} (${p.city}, ${p.state})\n📞 ${p.phone}`).join('\n\n')}` : null;
    }

    if (lower.includes('clinical trial') || lower.includes('study')) {
      const term = text.split(' ').pop();
      const res = await axios.get(`https://clinicaltrials.gov/api/query/study_fields?expr=${term}&fields=BriefTitle,LocationCity,OverallStatus&min_rnk=1&max_rnk=3&fmt=json`);
      const trials = res.data.StudyFieldsResponse.StudyFields;
      return trials.length ? `Here are current clinical trials for "${term}":\n\n` +
        trials.map(t => `• ${t.BriefTitle[0]} — Status: ${t.OverallStatus[0]}, City: ${t.LocationCity[0] || 'N/A'}`).join('\n\n') : null;
    }

    return null;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input.trim() };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const extra = await checkKeyword(input);
      if (extra) {
        setMessages(prev => [...prev, { role: 'assistant', content: extra }]);
        setLoading(false);
        return;
      }

      const res = await axios.post('https://carecompanionai-website.onrender.com/api/chat-with-tools', {
        messages: [...messages, userMessage]
      });

      const reply = res.data.choices?.[0]?.message;
      setMessages(prev => [...prev, reply]);
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

  const handleNewChat = () => {
    const reset = [{
      role: 'system',
      content: `You are CareCompanionAI, a helpful AI that provides real-time healthcare answers using trusted U.S. government and clinical sources.`
    }];
    setMessages(reset);
    localStorage.setItem('carechat', JSON.stringify(reset));
    setInput('');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '1rem auto', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>💬 CareCompanion AI</h2>
      <div ref={chatRef} style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem', background: '#fff', padding: '1rem', borderRadius: '4px' }}>
        {messages.filter(m => m.role !== 'system').map((msg, i) => (
          <div key={i}><strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input value={input} onChange={e => setInput(e.target.value)} style={{ flex: 1 }} placeholder="Ask about hospice, FDA drugs, trials..." />
        <button onClick={handleSend} disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
        <button onClick={toggleMic} style={{ background: listening ? '#e57373' : '#90caf9' }}>{listening ? '🎤 Stop' : '🎙️ Speak'}</button>
        <button onClick={handleDownload}>📄 Save</button>
        <button onClick={handleNewChat} style={{ backgroundColor: '#ffc107' }}>🆕 New Chat</button>
      </div>
    </div>
  );
};

export default GPTChatBot;


