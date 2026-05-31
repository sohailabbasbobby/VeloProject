import React, { useState } from 'react';
import './Messaging.css';

const Messaging = ({ onBack }) => {
    const [messages, setMessages] = useState([
        { id: 1, sender: 'DISPATCH', text: 'Please proceed to Terminal 5. Client is ready.', translatedText: null }
    ]);
    const [input, setInput] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const newMsg = { id: Date.now(), sender: 'ME', text: input, translatedText: null };
        setMessages(prev => [...prev, newMsg]);
        setInput('');

        // Simulate incoming message with translation
        setTimeout(async () => {
            const incomingText = "D'accord, je vous attends à la sortie.";
            setIsTranslating(true);
            
            try {
                const res = await fetch('http://localhost:8000/api/ai/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: incomingText, targetLanguage: 'en' })
                });
                const data = await res.json();
                
                const receivedMsg = { 
                    id: Date.now(), 
                    sender: 'PASSENGER', 
                    text: incomingText, 
                    translatedText: data.translated 
                };
                setMessages(prev => [...prev, receivedMsg]);
            } catch (error) {
                console.error("Translation Engine Failed.");
            } finally {
                setIsTranslating(false);
            }
        }, 1500);
    };

    return (
        <div className="messaging-view">
            <header className="messaging-header">
                <button className="btn-close" onClick={onBack}>✖</button>
                <h2 className="text-gold">Live Communications</h2>
            </header>

            <div className="chat-window">
                {messages.map(m => (
                    <div key={m.id} className={`chat-bubble-container ${m.sender === 'ME' ? 'align-right' : 'align-left'}`}>
                        <div className="chat-sender">{m.sender}</div>
                        <div className={`chat-bubble ${m.sender === 'ME' ? 'bubble-me' : 'bubble-them'}`}>
                            <div className="msg-original">{m.text}</div>
                            {m.translatedText && (
                                <div className="msg-translated text-gold mt-xs">
                                    <small>✨ {m.translatedText}</small>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isTranslating && <div className="text-muted text-sm mt-m italic">✨ Gemini Engine is translating incoming message...</div>}
            </div>

            <div className="chat-input-bar">
                <input 
                    type="text" 
                    placeholder="Type a secure message..." 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                />
                <button onClick={handleSend}>SEND</button>
            </div>
        </div>
    );
};

export default Messaging;
