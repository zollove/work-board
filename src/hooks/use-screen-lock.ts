"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const PIN_KEY = "wb_pin_hash";
const AUTO_LOCK_KEY = "wb_auto_lock_min";
const DEFAULT_AUTO_LOCK_MIN = 5;

async function hashPin(pin: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getStoredHash(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PIN_KEY);
}

function getStoredAutoLockMin(): number {
  if (typeof window === "undefined") return DEFAULT_AUTO_LOCK_MIN;
  const v = localStorage.getItem(AUTO_LOCK_KEY);
  return v !== null ? Number(v) : DEFAULT_AUTO_LOCK_MIN;
}

export type LockScreenMode = "locked" | "setup" | "change" | "unlocked";

export function useScreenLock() {
  const [mode, setMode] = useState<LockScreenMode>("unlocked");
  const [hasPIN, setHasPIN] = useState(false);
  const [autoLockMin, setAutoLockMin] = useState<number>(DEFAULT_AUTO_LOCK_MIN);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = getStoredHash();
    const mins = getStoredAutoLockMin();
    setHasPIN(!!stored);
    setAutoLockMin(mins);
    if (stored) setMode("locked");
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (autoLockMin === 0) return;
    timerRef.current = setTimeout(() => {
      const hash = getStoredHash();
      if (hash) setMode("locked");
    }, autoLockMin * 60 * 1000);
  }, [autoLockMin]);

  useEffect(() => {
    if (mode !== "unlocked") return;
    const events = ["mousemove", "keydown", "touchstart", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mode, resetTimer]);

  const lock = useCallback(() => {
    const hash = getStoredHash();
    if (hash) setMode("locked");
    else setMode("setup");
  }, []);

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    const stored = getStoredHash();
    if (!stored) return true;
    const entered = await hashPin(pin);
    if (entered === stored) { setMode("unlocked"); resetTimer(); return true; }
    return false;
  }, [resetTimer]);

  const setupPIN = useCallback(async (pin: string): Promise<void> => {
    const hash = await hashPin(pin);
    localStorage.setItem(PIN_KEY, hash);
    setHasPIN(true);
    setMode("unlocked");
    resetTimer();
  }, [resetTimer]);

  const changePIN = useCallback(async (currentPin: string, newPin: string): Promise<boolean> => {
    const stored = getStoredHash();
    if (!stored) return false;
    const entered = await hashPin(currentPin);
    if (entered !== stored) return false;
    const newHash = await hashPin(newPin);
    localStorage.setItem(PIN_KEY, newHash);
    setMode("unlocked");
    resetTimer();
    return true;
  }, [resetTimer]);

  const resetPIN = useCallback(() => {
    localStorage.removeItem(PIN_KEY);
    setHasPIN(false);
    setMode("unlocked");
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const updateAutoLockMin = useCallback((min: number) => {
    localStorage.setItem(AUTO_LOCK_KEY, String(min));
    setAutoLockMin(min);
  }, []);

  const openSetup = useCallback(() => setMode("setup"), []);
  const openChange = useCallback(() => setMode("change"), []);
  const cancelModal = useCallback(() => setMode("unlocked"), []);

  return { mode, hasPIN, autoLockMin, isLocked: mode === "locked", lock, unlock, setupPIN, changePIN, resetPIN, updateAutoLockMin, openSetup, openChange, cancelModal };
}
