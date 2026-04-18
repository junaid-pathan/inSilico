import { useState, useEffect, useRef } from 'react';
import LandingPage from './LandingPage';
import './App.css';

function App() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [protocolText, setProtocolText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [twinProfile, setTwinProfile] = useState(null);
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'system',
      text: 'BioTrace Multi-Agent System Initialized. Monitoring Trial Protocol vs Lifestyle.',
    },
  ]);
  const BIODIGITAL_KEY = import.meta.env.VITE_BIODIGITAL_KEY || 'MISSING_KEY';
  const BASE_BIO_URL = `https://human.biodigital.com/viewer/?id=7A5J&ui-anatomy-descriptions=true&ui-anatomy-pronunciations=true&ui-anatomy-labels=true&ui-audio=true&ui-chapter-list=false&ui-fullscreen=true&ui-help=true&ui-info=true&ui-label-list=true&ui-layers=true&ui-skin-layers=true&ui-loader=circle&ui-media-controls=full&ui-menu=true&ui-nav=true&ui-search=true&ui-tools=true&ui-tutorial=false&ui-undo=true&ui-whiteboard=true&initial.none=true&disable-scroll=false&uaid=MbW5B&paid=o_3afa5356`;
  
  const [bioUrl, setBioUrl] = useState(BASE_BIO_URL);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (textToRegister) => {
    setIsRegistering(true);
    let success = false;
    try {
      const response = await fetch('http://127.0.0.1:8000/api/register-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocol_text: textToRegister })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setVideoUrl(data.video_url);
        setIsRegistered(true);
        if (data.twin_profile) setTwinProfile(data.twin_profile);
        // Add calendar sync message
        setMessages(prev => [...prev, {
           id: Date.now(), 
           sender: 'system', 
           text: '✅ Trial Protocol Parsed. Google Calendar Synced successfully.' 
        }]);
        success = true;
      }
    } catch (error) {
      console.error("Registration Error:", error);
    }
    setIsRegistering(false);
    return success;
  };

  const triggerEdemaView = async () => {
    setIsLoading(true);
    
    // 1. Add user input to chat
    const userIntent = "I am going to do heavy squats and a 5k run at the gym tomorrow.";
    setMessages(prev => [...prev, { id: Date.now(), sender: 'system', text: `Patient Calendar Update: ${userIntent}` }]);

    try {
      // 2. Fetch from our Python FastAPI backend
      const response = await fetch('http://127.0.0.1:8000/api/analyze-lifestyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity: userIntent, date: "2026-04-19" })
      });
      const data = await response.json();
      
      if (data.twin_profile) setTwinProfile(data.twin_profile);

      if (data.conflict_detected) {
        // 3. Add K2's reasoning and attribution to the chat
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'k2',
            text: data.patient_message,
            highlight: "edema" // In production, we'd extract this dynamically from data
          },
          {
            id: Date.now() + 2,
            sender: 'system',
            text: `ACTION SIGNAL: ${data.action_signals[1]} ➜ Forwarded to Privacy Agent (Google Calendar Update)`
          },
          {
            id: Date.now() + 3,
            sender: 'system',
            text: `ACTION SIGNAL: ${data.action_signals[0]} ➜ Firing BioDigital API...`
          }
        ]);

        // 4. Update the iframe source to dynamically search and highlight the exact muscle!
        if (data.target_anatomy) {
          setBioUrl(BASE_BIO_URL + `&q=${encodeURIComponent(data.target_anatomy)}`);
        }
      }
    } catch (error) {
      console.error("API Error:", error);
    }
    
    setIsLoading(false);
  };

  if (!isRegistered) {
    return <LandingPage onRegister={handleRegister} />;
  }

  return (
    <div className="app-container">
      <header className="glass-header">
        <h1>BioTrace Dashboard</h1>
        <p>Interpretability-First Patient Companion</p>
      </header>

      <main className="dashboard" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '1rem', padding: '1rem', height: 'calc(100vh - 80px)' }}>

        {/* Top Left: K2 Think V2 Orchestrator Chat */}
        <section className="chat-panel glass-panel">
          <h2>K2 Think V2 Orchestrator</h2>

          <div className="chat-history">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                {msg.sender === 'system' && <span className="icon">⚙️</span>}
                {msg.sender === 'k2' && <span className="icon">🧠</span>}
                <div className="msg-content">
                  {msg.text.split(msg.highlight || '---NO_MATCH---').map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="highlight-token">{msg.highlight}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="chat-actions">
            <button className="primary-btn" onClick={triggerEdemaView} disabled={isLoading}>
              {isLoading ? 'Running K2 Analysis...' : 'Simulate Calendar Sync (Gym)'}
            </button>
          </div>
        </section>

        {/* Bottom Left: Predictive Digital Twin Profile */}
        <section className="twin-panel glass-panel" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <h2>Predictive Digital Twin</h2>
          {twinProfile ? (
            <div className="twin-stats" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div className="stat-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                <strong>Synthetic Cohort Matches:</strong> {twinProfile.synthetic_cohort_size} patients
              </div>
              <div className="stat-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                <strong>Predicted Success Probability:</strong> <span style={{ color: '#4ade80' }}>{twinProfile.overall_trial_success_probability}%</span>
              </div>
              <div className="stat-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f87171' }}>
                <strong>Predicted Adverse Events:</strong>
                <ul style={{ margin: '0.5rem 0 0 1.5rem' }}>
                  {twinProfile.predicted_adverse_events.map((event, idx) => (
                    <li key={idx}>
                      <span style={{ color: '#f87171' }}>{event.probability}% risk</span> of {event.condition} ({event.timeline_trigger})
                    </li>
                  ))}
                </ul>
              </div>
              <div className="stat-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', color: '#9ca3af' }}>
                Data Fidelity Score: {twinProfile.fidelity_score} (Cramer's V)
              </div>
            </div>
          ) : (
            <p style={{ padding: '1rem' }}>Loading Twin Profile...</p>
          )}
        </section>

        {/* Top Right: Timeline Flowchart Video */}
        <section className="visual-panel glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2>Your Trial Journey Flowchart</h2>
          <div className="video-wrapper" style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
            {videoUrl ? (
              <video 
                src={`${videoUrl}?t=${Date.now()}`} 
                controls 
                autoPlay 
                loop 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <p>Loading animation...</p>
            )}
          </div>
        </section>

        {/* Bottom Right: The BioDigital Map */}
        <section className="visual-panel glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2>"Where does this drug go?"</h2>
          <div className="iframe-wrapper" style={{ flexGrow: 1, borderRadius: '12px', overflow: 'hidden' }}>
            <iframe
              title="BioDigital Human"
              src={bioUrl}
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none' }}
            ></iframe>
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;
