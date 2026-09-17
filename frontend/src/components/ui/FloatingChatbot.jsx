import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import '../../styles/chatbot.css';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hi! 👋 Welcome to NEO GEN INTERNSHIP ENGINE. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const botResponses = {
    'hello': 'Hello! Welcome to NEO GEN INTERNSHIP ENGINE. How can I assist you?',
    'hi': 'Hey there! 👋 What would you like to know about NEO GEN INTERNSHIP ENGINE?',
    'help': 'I can help you with:\n• Finding internships\n• Understanding ATS scores\n• Application process\n• Profile setup\n• General questions',
    'internship': 'We connect talented students with internship opportunities across various government departments. You can explore opportunities based on your skills and interests!',
    'ats': 'ATS (Applicant Tracking System) optimization helps your resume get selected. Our tool analyzes your resume and provides improvement suggestions to increase your chances of selection.',
    'dashboard': 'Your dashboard shows your applications, ATS score, resume analysis, and personalized internship recommendations based on your profile.',
    'signup': 'You can sign up by clicking the "Find My Internship" button on the homepage. Choose whether you want to register as a student or login.',
    'applications': 'You can apply directly to internships from our platform. Track the status of your applications in your student dashboard.',
    'resume': 'Upload your resume in the ATS Resume section of your dashboard to get an instant ATS score, analysis, and improvement suggestions.',
    'skills': 'Add your skills to your profile. This helps us recommend internships that match your expertise.',
    'password': 'If you forgot your password, click the password reset option on the login page and follow the instructions.',
    'contact': 'Contact us via the contact form on our homepage or email us directly. We\'ll respond within 24 hours.',
    'default': 'I\'m here to help! You can ask me about:\n• Internship opportunities\n• ATS score optimization\n• Application process\n• Profile and resume\n• Account related questions\n\nOr you can contact us via the contact form. 😊'
  };

  const getBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase().trim();
    
    for (const [key, response] of Object.entries(botResponses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }
    
    return botResponses.default;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate bot response delay
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        text: getBotResponse(inputValue),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 500);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className="chatbot-fab"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open chat"
        title="Chat with us"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <>
            <MessageCircle size={24} />
            <span className="chat-badge">1</span>
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-container">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-content">
              <h3>NEO GEN INTERNSHIP ENGINE Assistant</h3>
              <p className="status-indicator">
                <span className="status-dot"></span>
                Online
              </p>
            </div>
            <button
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-content">
                  {message.text.split('\n').map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
            
            {isLoading && (
              <div className="message bot-message">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="chatbot-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chatbot-input"
              placeholder="Type your question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="chatbot-send-btn"
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>

          {/* Footer */}
          <div className="chatbot-footer">
            <p>We typically reply in minutes 🚀</p>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;
