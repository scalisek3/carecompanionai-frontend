import React, { useState } from 'react';
import axios from 'axios';

const extractLocation = (text) => {
  const locationRegex = /\b(in|near|around|from|to) ([A-Z][a-z]+(?:,?\s?[A-Z]{2})?)\b/;
  const match = text.match(locationRegex);
  return match ? match[2] : null;
};

const GPTChatBot = () => {
  const [messages, setMessages] = useState([
  {
  role: 'system',
  content:
    `You are CareCompanionAI, a warm and helpful AI assistant for seniors in California. You specialize in Medicare, Medicaid, UnitedHealthcare, and general Senior Healthcare.

When the user asks a question, answer it clearly, directly, and only ask follow-up questions if absolutely necessary. NEVER say “How can I help you today?” if a question has already been asked. Do not repeat yourself. 

Use step-by-step guidance, and tailor your response to the user’s location if provided. Keep your responses clear, compassionate, and useful.`
}
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const location = extractLocation(input);
    const locationMessage = location
      ? {
          role: 'system',
          content: `User is located in ${location}. Tailor your guidance accordingly.`
        }
      : null;

    const newMessages = [
      ...messages,
      ...(locationMessage ? [locationMessage] : []),
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
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    let y = 10;
    messages.filter(m => m.role !== 'system').forEach((msg, index) => {
      const label = msg.role === 'user' ? 'You: ' : 'Bot: ';
      const lines = doc.splitTextToSize(`${label}${msg.content}`, 180);
      lines.forEach(line => {
        doc.text(line, 10, y);
        y += 7;
      });
      y += 3;
    });
    doc.save('carecompanion-conversation.pdf');
  };
  
  return (
    <div>
      <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#f8f8f8', padding: '1rem', borderRadius: '10px' }}>
        {messages
          .filter((msg) => msg.role !== 'system')
          .map((msg, i) => (
            <div key={i} style={{ marginBottom: '0.5rem' }}>
              <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
            </div>
          ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        style={{ padding: '0.5rem', width: '80%' }}
      />
      <button onClick={handleSend} disabled={loading} style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}>
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
};

export default GPTChatBot;
