// src/components/TrendingTips.js
import React, { useState, useEffect } from 'react';
import './TrendingTips.css';

const tips = [
  "Did you know? Drinking enough water helps reduce headaches.",
  "Today's Tip: 15 minutes of walking can boost your mood.",
  "Health Fact: Laughing 100 times is equivalent to 10 minutes of exercise.",
  "Tip: Stretch your neck every hour to avoid tension headaches.",
  "Did you know? Deep breathing reduces anxiety and stress."
];

export default function TrendingTips() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % tips.length);
    }, 90000); // 90 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="trending-tips">
      <div className="flip-card">
        <div className="flip-card-inner">
          <div className="flip-card-front">
            What's Trending Today?
          </div>
          <div className="flip-card-back">
            {tips[index]}
          </div>
        </div>
      </div>
    </div>
  );
}
