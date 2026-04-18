import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Stars } from '@react-three/drei';
import { Brain, ShieldAlert, Activity, ArrowRight, FileText, UploadCloud, CheckCircle2 } from 'lucide-react';
import './LandingPage.css';

// A cinematic animated blob for the background
function AnimatedBlob() {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 100, 200]} scale={2.5}>
      <MeshDistortMaterial 
        color="#3b82f6" 
        attach="material" 
        distort={0.4} 
        speed={1.5} 
        roughness={0.2}
        metalness={0.8}
        emissive="#1d4ed8"
        emissiveIntensity={0.5}
      />
    </Sphere>
  );
}

function LandingPage({ onRegister }) {
  const [step, setStep] = useState(0);
  const [protocolText, setProtocolText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const nextStep = () => setStep((prev) => prev + 1);

  const handleUpload = async () => {
    setIsProcessing(true);
    
    // Attempt to register, waiting for backend response
    const success = await onRegister(protocolText);
    
    if (!success) {
      // If it fails (e.g. backend isn't running or error), reset so they aren't stuck
      setIsProcessing(false);
      alert("Failed to connect to the backend server. Please make sure the Python API is running!");
    }
  };

  const steps = [
    // Step 0: Hero Intro
    <motion.div 
      key="step-0"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6 }}
      className="onboarding-step"
    >
      <div className="icon-wrapper glass-icon">
        <Activity size={48} color="#60a5fa" />
      </div>
      <h1 className="cinematic-title">Welcome to BioTrace</h1>
      <p className="cinematic-subtitle">Your interpretability-first companion for navigating clinical trials safely.</p>
      
      <div className="features-grid">
        <div className="feature-item">
          <Brain size={24} color="#93c5fd" />
          <span>Predictive Digital Twin</span>
        </div>
        <div className="feature-item">
          <ShieldAlert size={24} color="#93c5fd" />
          <span>Real-time Risk Conflict</span>
        </div>
      </div>

      <button className="cinematic-btn" onClick={nextStep}>
        Get Started <ArrowRight size={20} />
      </button>
    </motion.div>,

    // Step 1: Protocol Upload
    <motion.div 
      key="step-1"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6 }}
      className="onboarding-step"
    >
      <div className="icon-wrapper glass-icon">
        <FileText size={48} color="#60a5fa" />
      </div>
      <h2 className="cinematic-title">Upload Protocol</h2>
      <p className="cinematic-subtitle">Paste your clinical trial document to let K2 analyze your roadmap.</p>
      
      <div className="upload-container">
        <textarea 
          value={protocolText}
          onChange={(e) => setProtocolText(e.target.value)}
          placeholder="Paste protocol document text here..."
          className="cinematic-textarea"
        />
      </div>

      <div className="btn-group">
        <button className="cinematic-btn-ghost" onClick={() => setStep(0)}>Back</button>
        <button 
          className="cinematic-btn" 
          onClick={handleUpload} 
          disabled={!protocolText || isProcessing}
        >
          {isProcessing ? (
            <span className="loading-state">
              <UploadCloud className="spinner" size={20} /> Analyzing...
            </span>
          ) : (
            <span>Generate Digital Twin <ArrowRight size={20} /></span>
          )}
        </button>
      </div>
    </motion.div>
  ];

  return (
    <div className="landing-wrapper">
      {/* Three.js Background */}
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <AnimatedBlob />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        </Canvas>
      </div>
      
      {/* Floating Glass UI */}
      <div className="landing-ui">
        <AnimatePresence mode="wait">
          {isProcessing ? (
             <motion.div 
               key="processing"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="onboarding-step processing-step"
             >
               <div className="pulse-ring">
                 <CheckCircle2 size={64} color="#4ade80" />
               </div>
               <h2 className="cinematic-title">Creating your Digital Twin</h2>
               <p className="cinematic-subtitle glow-text">Matching with artificial control group...</p>
             </motion.div>
          ) : (
            steps[step]
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default LandingPage;
