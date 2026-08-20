"use client";

import React, { createContext, useContext } from "react";
import { useScreenLock, LockScreenMode } from "@/hooks/use-screen-lock";
import { LockScreen } from "./lock-screen";

interface ScreenLockContextValue {
  mode: LockScreenMode;
  hasPIN: boolean;
  autoLockMin: number;
  isLocked: boolean;
  lock: () => void;
  openSetup: () => void;
  openChange: () => void;
  resetPIN: () => void;
  updateAutoLockMin: (min: number) => void;
}

const ScreenLockContext = createContext<ScreenLockContextValue | null>(null);

export function useScreenLockContext() {
  const ctx = useContext(ScreenLockContext);
  if (!ctx) throw new Error("useScreenLockContext must be used within LockProvider");
  return ctx;
}

export function LockProvider({ children }: { children: React.ReactNode }) {
  const {
    mode,
    hasPIN,
    autoLockMin,
    isLocked,
    lock,
    unlock,
    setupPIN,
    changePIN,
    resetPIN,
    updateAutoLockMin,
    openSetup,
    openChange,
    cancelModal,
  } = useScreenLock();

  return (
    <ScreenLockContext.Provider
      value={{ mode, hasPIN, autoLockMin, isLocked, lock, openSetup, openChange, resetPIN, updateAutoLockMin }}
    >
      {children}
      {(mode === "locked" || mode === "setup" || mode === "change") && (
        <LockScreen
          mode={mode}
          hasPIN={hasPIN}
          onUnlock={unlock}
          onSetupPIN={setupPIN}
          onChangePIN={changePIN}
          onCancel={cancelModal}
        />
      )}
    </ScreenLockContext.Provider>
  );
}
