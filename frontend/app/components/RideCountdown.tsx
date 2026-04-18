'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaClock, FaExclamationTriangle } from 'react-icons/fa';

interface RideCountdownProps {
  departureTime: string;
  onExpire?: () => void;
  className?: string;
}

const RideCountdown: React.FC<RideCountdownProps> = ({ departureTime, onExpire, className = '' }) => {
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
    // Initial calculation
    const timerData = calculateTimeLeft();
    setTimeLeft(timerData);

    if (timerData.isExpired) {
      onExpire?.();
      return;
    }

    // Set interval to update every second
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
      <div className={`inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold border border-gray-200 ${className}`}>
        <FaClock className="mr-1.5" />
        Departed
      </div>
    );
  }

  return (
    <div 
      className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 border shadow-sm
        ${timeLeft.isUrgent 
          ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' 
          : 'bg-blue-50 text-blue-700 border-blue-100'} 
        ${className}`}
    >
      {timeLeft.isUrgent ? (
        <FaExclamationTriangle className="mr-1.5 text-red-500" />
      ) : (
        <FaClock className="mr-1.5 text-blue-500" />
      )}
      <span className="opacity-80 mr-1 text-[10px] uppercase tracking-wider">Departs in:</span>
      <div className="flex items-center gap-0.5 font-mono">
        {timeLeft.days > 0 && (
          <>
            <span>{timeLeft.days}d</span>
            <span className="mx-0.5 opacity-50">:</span>
          </>
        )}
        <span>{timeLeft.hours.toString().padStart(2, '0')}h</span>
        <span className="mx-0.5 opacity-50">:</span>
        <span>{timeLeft.minutes.toString().padStart(2, '0')}m</span>
        <span className="mx-0.5 opacity-50">:</span>
        <span>{timeLeft.seconds.toString().padStart(2, '0')}s</span>
      </div>
    </div>
  );
};

export default RideCountdown;
