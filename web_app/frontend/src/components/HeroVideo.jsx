import React, { useEffect, useRef, useState } from 'react';

const HeroVideo = ({ onScrollDown }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Must start muted for autoplay to work

  // Highly performant IntersectionObserver to handle mute/unmute on scroll
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      // Trigger when the video is 50% out of view
      threshold: 0.5 
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (videoRef.current) {
          if (entry.isIntersecting) {
            // Video is in view (scroll back up) -> Play sound (if user has interacted)
            if (userInteracted) {
              videoRef.current.muted = false;
              setIsMuted(false);
            }
          } else {
            // Video is scrolling out of view -> Mute sound
            videoRef.current.muted = true;
            setIsMuted(true);
          }
        }
      });
    }, options);

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [userInteracted]);

  // Browsers block autoplaying audio. We need one click to enable sound forever.
  const handleEnableSound = () => {
    setUserInteracted(true);
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  return (
    <div ref={containerRef} onClick={handleEnableSound} className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center cursor-pointer">
      {/* Background Cinematic Video */}
      <video 
        ref={videoRef}
        src="/ufc_cinematic.mp4" 
        autoPlay 
        loop 
        muted={isMuted}
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      />

      {/* Minimal Scroll Down Indicator */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          handleEnableSound();
          onScrollDown();
        }}
        className="absolute bottom-12 z-20 flex flex-col items-center cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
      >
        <span className="font-heading text-[11px] uppercase tracking-[0.3em] text-white animate-pulse">
          Scroll Down
        </span>
        <div className="w-8 h-[2px] bg-ufcRed my-2"></div>
        <span className="font-heading text-[10px] uppercase tracking-[0.4em] text-ufcRed mt-2">
          Enter The Octagon
        </span>
      </div>

    </div>
  );
};

export default HeroVideo;
