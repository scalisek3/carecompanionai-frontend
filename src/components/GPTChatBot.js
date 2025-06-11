import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const extractLocation = (text) => {
  const locationRegex = /\b(in|near|around|from|to) ([A-Z][a-z]+(?:,?\s?[A-Z]{2})?)\b/;
  const match = text.match(locationRegex);
  return match ? match[2] : null;
};

const GPTChatBot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'system',
      content: `You are CareCompanionAI, a warm and helpful AI Assistant for seniors in California. You specialize in Medicare, Medicaid, UnitedHealthcare, and General Health Care knowledge.

When the user asks a question, answer it clearly, directly, and only ask follow-up questions if absolutely necessary. NEVER say “How can I help you today?” if a question has already been asked. Do not repeat yourself.

Use step-by-step guidance, and tailor your response to the user’s location if provided. Keep your responses clear, compassionate, and useful. Suggest questions for the user to ask their provider if applicable.`

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
      ? {
          role: 'system',
          content: `User is located in ${location}. Tailor your guidance accordingly.`
        }
      : null;

    const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
    const preventRepetitionMessage = lastUserMessage && lastUserMessage.content === input.trim()
      ? {
          role: 'system',
          content: 'The user has already asked this question. Avoid repeating generic introductions or restating the same information.'
        }
      : null;

    const newMessages = [
      ...messages,
      ...(locationMessage ? [locationMessage] : []),
      ...(preventRepetitionMessage ? [preventRepetitionMessage] : []),
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
      <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>💬 Chat with the CareCompanionAI Specialist</h2>
      <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem', backgroundColor: '#fff', padding: '1rem', borderRadius: '4px' }}>
        {messages
          .filter((msg) => msg.role !== 'system')
          .map((msg, i) => (
            <div key={i} style={{ marginBottom: '0.5rem' }}>
              <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
            </div>
          ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
  <input
    value={input}
    onChange={e => setInput(e.target.value)}
    placeholder="Type or use mic..."
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
