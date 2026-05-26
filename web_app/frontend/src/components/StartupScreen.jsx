import React, { useEffect, useState } from 'react';

const StartupScreen = ({ onComplete }) => {
  const [letters, setLetters] = useState({ u: false, f: false, c: false });
  const [bgDark, setBgDark] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 1. Reveal U
    const t1 = setTimeout(() => setLetters(prev => ({ ...prev, u: true })), 400);
    // 2. Reveal F
    const t2 = setTimeout(() => setLetters(prev => ({ ...prev, f: true })), 800);
    // 3. Reveal C
    const t3 = setTimeout(() => setLetters(prev => ({ ...prev, c: true })), 1200);
    
    // 4. Flip background to black for cinematic effect
    const t4 = setTimeout(() => setBgDark(true), 1800);
    
    // 5. Fade the entire screen out
    const t5 = setTimeout(() => setIsFadingOut(true), 2600);
    
    // 6. Unmount and show main app
    const t6 = setTimeout(() => onComplete(), 3200);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); 
      clearTimeout(t4); clearTimeout(t5); clearTimeout(t6);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-700 ease-in-out
        ${bgDark ? 'bg-ufcBlack' : 'bg-[#f4f4f4]'}
      `}
      style={{
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.6s ease-in-out, background-color 0.7s ease-in-out'
      }}
    >
      {/* UFC Text Container */}
      <div className="flex -space-x-2 md:-space-x-4 overflow-hidden py-4">
        <span 
          className="text-[8rem] md:text-[12rem] font-heading font-black italic text-ufcRed"
          style={{
            transform: letters.u ? 'translateY(0)' : 'translateY(100%)',
            opacity: letters.u ? 1 : 0,
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          U
        </span>
        <span 
          className="text-[8rem] md:text-[12rem] font-heading font-black italic text-ufcRed"
          style={{
            transform: letters.f ? 'translateY(0)' : 'translateY(100%)',
            opacity: letters.f ? 1 : 0,
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          F
        </span>
        <span 
          className="text-[8rem] md:text-[12rem] font-heading font-black italic text-ufcRed pr-4"
          style={{
            transform: letters.c ? 'translateY(0)' : 'translateY(100%)',
            opacity: letters.c ? 1 : 0,
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          C
        </span>
      </div>
    </div>
  );
};

export default StartupScreen;
