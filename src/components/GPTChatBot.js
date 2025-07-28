import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const GPTChatBot = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('carechat');
    return saved ? JSON.parse(saved) : [
      {
        role: 'system',
        content: `You are CareCompanionAI, an expert assistant for Medicare, Medicaid, UnitedHealthcare, and senior care. Provide real answers, not just suggestions. Always help the user by doing the work.`
      }
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const chatRef = useRef(null);

  // 🎙️ Voice input setup
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

  // Auto scroll & persist chat
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
    const userText = input.trim();
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Send messages to backend
      const res = await axios.post('https://carecompanionai-website.onrender.com/api/chat-with-tools', { messages: newMessages });

      // Check if backend returned a tool result
      if (res.data.tool) {
        let content = '';

        switch (res.data.tool) {
          case 'getMedicareProviders':
            const providers = res.data.result;
            content = providers.length
              ? `Here are providers matching your request:\n\n` +
                providers.map(p => `• ${p.name} - ${p.specialty}\n  ${p.address}\n  📞 ${p.phone}`).join('\n\n')
              : 'No providers found for that location.';
            break;

          case 'getMedlineSummary':
            content = `📖 Health Topic Summary:\n\n${res.data.result}`;
            break;

          case 'getOpenFDA':
            content = res.data.result.length
              ? res.data.result.map(drug => `• ${drug.openfda.brand_name?.[0] || 'Unknown'}: ${drug.indications_and_usage?.[0] || 'No usage info'}`).join('\n\n')
              : 'No drug information found.';
            break;

          case 'getClinicalTrials':
            content = res.data.result.length
              ? `🔬 Clinical Trials:\n\n` +
                res.data.result.map(t => `• ${t.title}\n  🔗 ${t.url}`).join('\n\n')
              : 'No clinical trials found.';
            break;

          default:
            content = '⚠️ Unknown tool response.';
        }

        setMessages(msgs => [...msgs, { role: 'assistant', content }]);
      } else {
        // Normal GPT text reply
        const reply = res.data.choices?.[0]?.message || {
          role: 'assistant',
          content: '⚠️ No reply received.'
        };
        setMessages(msgs => [...msgs, reply]);
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(msgs => [
        ...msgs,
        { role: 'assistant', content: '⚠️ Error fetching real-time healthcare data.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(10);
    doc.text(`CareCompanionAI Chat – ${new Date().toLocaleString()}`, 10, y);
    y += 10;
    messages.filter(m => m.role !== 'system').forEach(m => {
      doc.text(`${m.role === 'user' ? 'You' : 'Bot'}: ${m.content}`, 10, y);
      y += 10;
      if (y > 270) { doc.addPage(); y = 10; }
    });
    doc.save('carecompanion-chat.pdf');
  };

  const handleNewChat = () => {
    const systemMessage = {
      role: 'system',
      content: `You are CareCompanionAI, an expert assistant for Medicare, Medicaid, UnitedHealthcare, and senior care. Provide direct help and answers.`
    };
    localStorage.setItem('carechat', JSON.stringify([systemMessage]));
    setMessages([systemMessage]);
    setInput('');
  };

  return (
    <div style={{
      maxWidth: '700px',
      margin: '2rem auto',
      padding: '1.5rem',
      backgroundColor: '#fefefe',
      borderRadius: '10px',
      boxShadow: '0 0 12px rgba(0,0,0,0.08)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h3 style={{ textAlign: 'center', fontSize: '1.4rem', marginBottom: '1rem' }}>💬 Chat with CareCompanionAI</h3>
      <div ref={chatRef} style={{
        maxHeight: '300px',
        overflowY: 'auto',
        marginBottom: '1rem',
        padding: '1rem',
        borderRadius: '6px',
        background: '#f9f9f9',
        border: '1px solid #ddd'
      }}>
        {messages.filter(m => m.role !== 'system').map((msg, i) => (
          <div key={i} style={{ marginBottom: '0.75rem' }}>
            <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ flex: 1, padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }}
          placeholder="Type your healthcare question..."
        />
        <button onClick={handleSend} disabled={loading} style={{ padding: '0.6rem 1rem', backgroundColor: '#4f8a6f', color: '#fff', border: 'none', borderRadius: '4px' }}>
          {loading ? 'Sending...' : 'Send'}
        </button>
        <button onClick={toggleMic} style={{ padding: '0.6rem 1rem', backgroundColor: listening ? '#dc8a75' : '#d6e4cc', color: '#333', border: 'none', borderRadius: '4px' }}>
          {listening ? '🎤 Stop' : '🎙️ Speak'}
        </button>
        <button onClick={handleDownload} style={{ padding: '0.6rem 1rem', backgroundColor: '#dcdcdc', border: 'none', borderRadius: '4px' }}>
          📄 Save
        </button>
        <button onClick={handleNewChat} style={{ padding: '0.6rem 1rem', backgroundColor: '#f3dfb2', border: 'none', borderRadius: '4px' }}>
          🆕 New Chat
        </button>
      </div>
    </div>
  );
};

export default GPTChatBot;
