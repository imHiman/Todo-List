import React from 'react';
import { motion } from 'framer-motion';

export default function ProgressBar({ completed, total }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const getMotivationalMessage = (percentage) => {
    if (percentage === 0) return "Let's get started! 🚀";
    if (percentage < 25) return "Great start! Keep going! 💪";
    if (percentage < 50) return "You're making progress! 🌟";
    if (percentage < 75) return "More than halfway there! 🔥";
    if (percentage < 100) return "Almost there! You're crushing it! ⭐";
    return "All done! Amazing work! 🎉";
  };

  return (
    <div className="progress-container">
      <div className="progress-info">
        <span className="progress-percentage">{percentage}% Complete</span>
        <span className="progress-numbers">
          {completed} of {total} tasks completed
        </span>
      </div>
      <div className="progress-bar-container">
        <motion.div 
          className="progress-bar"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="progress-message">
        {getMotivationalMessage(percentage)}
      </div>
    </div>
  );
}