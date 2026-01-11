import React from 'react';

interface MascotProps {
  emotion?: 'happy' | 'thinking' | 'excited' | 'neutral';
  className?: string;
}

const Mascot: React.FC<MascotProps> = ({ emotion = 'happy', className = '' }) => {
  const getColor = () => {
    switch(emotion) {
      case 'thinking': return 'text-yellow-400';
      case 'excited': return 'text-pink-400';
      default: return 'text-blue-500';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 200 200" className={`w-32 h-32 md:w-48 md:h-48 drop-shadow-xl ${getColor()} transition-colors duration-500`} fill="currentColor">
        {/* Head */}
        <circle cx="100" cy="100" r="90" fill="currentColor" />
        {/* Face Background */}
        <circle cx="100" cy="100" r="75" fill="#FFF" />
        
        {/* Eyes */}
        {emotion === 'thinking' ? (
          <>
            <circle cx="70" cy="85" r="10" fill="#333" />
            <circle cx="130" cy="85" r="10" fill="#333" />
            <path d="M110 50 Q130 40 150 50" stroke="#333" strokeWidth="3" fill="none" />
          </>
        ) : emotion === 'excited' ? (
           <>
            <path d="M60 90 L80 80 L60 70" stroke="#333" strokeWidth="4" fill="none" />
            <path d="M140 90 L120 80 L140 70" stroke="#333" strokeWidth="4" fill="none" />
           </>
        ) : (
          <>
            <circle cx="70" cy="90" r="8" fill="#333" />
            <circle cx="130" cy="90" r="8" fill="#333" />
          </>
        )}

        {/* Mouth */}
        {emotion === 'happy' && <path d="M70 120 Q100 150 130 120" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" />}
        {emotion === 'excited' && <path d="M70 120 Q100 160 130 120 Z" fill="#FF6B6B" stroke="#333" strokeWidth="2" />}
        {emotion === 'thinking' && <line x1="80" y1="130" x2="120" y2="130" stroke="#333" strokeWidth="4" strokeLinecap="round" />}
        {emotion === 'neutral' && <path d="M80 130 Q100 140 120 130" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" />}

        {/* Cheeks */}
        <circle cx="50" cy="110" r="10" fill="#FFB6C1" opacity="0.6" />
        <circle cx="150" cy="110" r="10" fill="#FFB6C1" opacity="0.6" />
      </svg>
    </div>
  );
};

export default Mascot;
