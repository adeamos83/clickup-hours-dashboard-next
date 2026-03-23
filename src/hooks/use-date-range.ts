'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import React from 'react';

function getDefaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

interface DateRangeContextType {
  start: string;
  end: string;
  loaded: boolean;
  updateDates: (start: string, end: string) => void;
}

const DateRangeContext = createContext<DateRangeContextType | null>(null);

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [dates, setDates] = useState(getDefaultDates);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedStart = localStorage.getItem('dateStart');
    const savedEnd = localStorage.getItem('dateEnd');
    if (savedStart && savedEnd) {
      setDates({ start: savedStart, end: savedEnd });
    }
    setLoaded(true);
  }, []);

  const updateDates = useCallback((start: string, end: string) => {
    setDates({ start, end });
    localStorage.setItem('dateStart', start);
    localStorage.setItem('dateEnd', end);
  }, []);

  return React.createElement(
    DateRangeContext.Provider,
    { value: { ...dates, updateDates, loaded } },
    children
  );
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error('useDateRange must be used within DateRangeProvider');
  return ctx;
}
