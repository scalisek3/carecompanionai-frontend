import React, { useState } from 'react';
import axios from 'axios';

const GPTChatBot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'system',
      content:
        'You are CareCompanionAI, a friendly and helpful assistant designed to support seniors in their Healthcare Journey. You specialize in Medicare, Medicaid, and all relative Healthcare options. Respond clearly, with empathy, and give concise and informative answers with suggestions on next steps.'
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(
        'https://carecompanionai-website.onrender.com/api/chat',
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

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>💬 Ask CareCompanion AI</h2>
      <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem', backgroundColor: '#fff', padding: '1rem', borderRadius: '4px' }}>
        {messages
          .filter((msg) => msg.role !== 'system')
          .map((msg, i) => (
            <div key={i} style={{ marginBottom: '0.5rem' }}>
              <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
            </div>
          ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          style={{ flexGrow: 1, padding: '0.5rem' }}
        />
        <button onClick={handleSend} disabled={loading} style={{ padding: '0.5rem 1rem' }}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default GPTChatBot;
