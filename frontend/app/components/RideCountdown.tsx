'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface RideCountdownProps {
  departureTime: string;
  onExpire?: () => void;
  className?: string;
  compact?: boolean;
}

const RideCountdown: React.FC<RideCountdownProps> = ({ 
  departureTime, 
  onExpire, 
  className = '',
  compact = false 
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    isUrgent: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    isUrgent: false,
  });

  const calculateTimeLeft = useCallback(() => {
    const target = new Date(departureTime).getTime();
    const now = new Date().getTime();
    const difference = target - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
        isUrgent: false,
      };
    }

    // Is urgent if less than 1 hour remaining
    const isUrgent = difference < 3600000;

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isExpired: false,
      isUrgent,
    };
  }, [departureTime]);

  useEffect(() => {
    const timerData = calculateTimeLeft();
    setTimeLeft(timerData);

    if (timerData.isExpired) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      const updatedData = calculateTimeLeft();
      setTimeLeft(updatedData);

      if (updatedData.isExpired) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeLeft, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full bg-gray-100/80 backdrop-blur-sm text-gray-500 text-[10px] sm:text-xs font-bold border border-gray-200 shadow-sm ${className}`}>
        <FaClock className="mr-1.5 opacity-70" />
        Departed
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all duration-300 border shadow-sm backdrop-blur-md
        ${timeLeft.isUrgent 
          ? 'bg-red-50/90 text-red-600 border-red-200' 
          : 'bg-indigo-50/90 text-indigo-700 border-indigo-200'} 
        ${className}`}
    >
      <AnimatePresence mode="wait">
        {timeLeft.isUrgent ? (
          <motion.div
            key="urgent"
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <FaExclamationTriangle className="mr-1.5 text-red-500" />
          </motion.div>
        ) : (
          <FaClock className="mr-1.5 text-indigo-500 opacity-80" />
        )}
      </AnimatePresence>

      {!compact && (
        <span className="opacity-70 mr-1.5 uppercase tracking-tighter sm:tracking-wider hidden sm:inline">Departs in:</span>
      )}
      
      <div className="flex items-center gap-0.5 font-mono">
        {timeLeft.days > 0 && (
          <>
            <span className="text-[#00204a]">{timeLeft.days}d</span>
            <span className="mx-0.5 opacity-30">:</span>
          </>
        )}
        <span className="text-[#00204a]">{timeLeft.hours.toString().padStart(2, '0')}h</span>
        <span className="mx-0.5 opacity-30">:</span>
        <span className="text-[#00204a]">{timeLeft.minutes.toString().padStart(2, '0')}m</span>
        <span className="mx-0.5 opacity-30">:</span>
        <span className="text-[#00204a]">{timeLeft.seconds.toString().padStart(2, '0')}s</span>
      </div>
    </motion.div>
  );
};

export default RideCountdown;
