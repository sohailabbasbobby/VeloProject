import React, { useState, useRef, useEffect } from 'react';
import './SwipeSlider.css';

const SwipeSlider = ({ text, onComplete, disabled = false, color = 'var(--color-success)', inactiveColor = '#333' }) => {
  const [dragProgress, setDragProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);
  const thumbRef = useRef(null);

  const maxDrag = useRef(0);

  useEffect(() => {
    if (trackRef.current && thumbRef.current) {
      maxDrag.current = trackRef.current.offsetWidth - thumbRef.current.offsetWidth - 8; // 4px padding each side
    }
  }, []);

  const handlePointerDown = (e) => {
    if (disabled) return;
    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || disabled) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    let newX = e.clientX - trackRect.left - (thumbRef.current.offsetWidth / 2);
    
    if (newX < 0) newX = 0;
    if (newX > maxDrag.current) newX = maxDrag.current;
    
    setDragProgress(newX);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (dragProgress >= maxDrag.current * 0.95) {
      setDragProgress(maxDrag.current);
      if (onComplete) onComplete();
    } else {
      setDragProgress(0); // Snap back
    }
    
    e.target.releasePointerCapture(e.pointerId);
  };

  return (
    <div 
      className={`swipe-slider-track ${disabled ? 'disabled' : ''}`} 
      ref={trackRef}
      style={{ backgroundColor: disabled ? inactiveColor : 'rgba(255, 255, 255, 0.05)' }}
    >
      <div 
        className="swipe-slider-text"
        style={{ opacity: 1 - (dragProgress / (maxDrag.current || 1)) }}
      >
        {text}
      </div>
      <div
        className="swipe-slider-thumb"
        ref={thumbRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translateX(${dragProgress}px)`,
          backgroundColor: disabled ? '#555' : color,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        <span className="chevron"></span>
        <span className="chevron"></span>
      </div>
    </div>
  );
};

export default SwipeSlider;
