"use client";

import { useState, useCallback, useEffect } from "react";

interface PinPadProps {
  title: string;
  subtitle?: string;
  errorMessage?: string;
  onComplete: (pin: string) => void;
  onCancel?: () => void;
  error?: boolean;
}

function PinPad({ title, subtitle, errorMessage, onComplete, onCancel, error }: PinPadProps) {
  const [pin, setPin] = useState("");

  // Clear entered PIN immediately on error
  useEffect(() => {
    if (error) {
      setPin("");
    }
  }, [error]);

  const handleKey = useCallback((val: string) => {
    setPin((prev) => {
      if (val === "del") return prev.slice(0, -1);
      if (prev.length >= 4) return prev;
      const next = prev + val;
      if (next.length === 4) {
        setTimeout(() => onComplete(next), 80);
        return next;
      }
      return next;
    });
  }, [onComplete]);

  // Physical keyboard support (Top numbers, Numpad, Backspace, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKey(e.key);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleKey("del");
      } else if (e.key === "Escape" && onCancel) {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKey, onCancel]);

  const keys = ["1","2","3","4","5","6","7","8","9","","0","del"];

  return (
    <div className="flex flex-col items-center gap-5 max-w-xs w-full px-4">
      <div className="text-center space-y-1.5 min-h-[48px] flex flex-col items-center justify-center">
        <h2 className="text-xl font-black text-foreground">{title}</h2>
        {errorMessage ? (
          <p className="text-xs sm:text-sm font-bold text-red-500 animate-pulse">
            {errorMessage}
          </p>
        ) : subtitle ? (
          <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {/* Dots Indicator */}
      <div className={`flex gap-4 py-2 transition-all ${error ? "scale-110" : ""}`}>
        {[0,1,2,3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              error
                ? "bg-red-500 border-red-500 animate-bounce"
                : i < pin.length
                ? "bg-primary border-primary scale-110"
                : "bg-transparent border-muted-foreground/40"
            }`}
          />
        ))}
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-3 w-64">
        {keys.map((k, i) => {
          if (k === "") return <div key={i} />;
          return (
            <button
              key={k}
              type="button"
              onClick={() => handleKey(k)}
              className={`h-16 rounded-2xl text-xl font-bold transition-all active:scale-95 select-none ${
                k === "del"
                  ? "text-muted-foreground hover:bg-muted/60 text-base flex items-center justify-center"
                  : "bg-muted/40 hover:bg-muted/80 text-foreground shadow-xs flex items-center justify-center"
              }`}
            >
              {k === "del" ? "⌫" : k}
            </button>
          );
        })}
      </div>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors pt-2"
        >
          취소
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
interface LockScreenProps {
  mode: "locked" | "setup" | "change";
  hasPIN: boolean;
  onUnlock: (pin: string) => Promise<boolean>;
  onSetupPIN: (pin: string) => Promise<void>;
  onChangePIN: (current: string, next: string) => Promise<boolean>;
  onCancel: () => void;
}

export function LockScreen({ mode, hasPIN, onUnlock, onSetupPIN, onChangePIN, onCancel }: LockScreenProps) {
  const [step, setStep] = useState<"enter" | "confirm" | "change_current" | "change_new" | "change_confirm">("enter");
  const [firstPin, setFirstPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [attemptCount, setAttemptCount] = useState(0);

  const triggerError = (msg = "⚠️ 비밀번호가 일치하지 않습니다.") => {
    setError(true);
    setErrorMessage(msg);
    setAttemptCount((prev) => prev + 1);
    setTimeout(() => {
      setError(false);
    }, 700);
  };

  // LOCKED mode
  if (mode === "locked") {
    return (
      <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex items-center justify-center">
        <PinPad
          key={`locked-${attemptCount}`}
          title="🔐 화면 잠금"
          subtitle="PIN 4자리를 입력하세요"
          errorMessage={errorMessage}
          error={error}
          onComplete={async (pin) => {
            const ok = await onUnlock(pin);
            if (!ok) {
              triggerError("⚠️ 비밀번호가 틀렸습니다. 다시 입력하세요.");
            } else {
              setErrorMessage(undefined);
            }
          }}
        />
      </div>
    );
  }

  // SETUP mode
  if (mode === "setup") {
    if (step === "enter") {
      return (
        <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex items-center justify-center">
          <PinPad
            key={`setup-enter-${attemptCount}`}
            title="🔐 PIN 설정"
            subtitle="사용할 PIN 4자리를 입력하세요"
            errorMessage={errorMessage}
            error={error}
            onComplete={(pin) => {
              setErrorMessage(undefined);
              setFirstPin(pin);
              setStep("confirm");
            }}
            onCancel={onCancel}
          />
        </div>
      );
    }
    return (
      <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex items-center justify-center">
        <PinPad
          key={`setup-confirm-${attemptCount}`}
          title="🔐 PIN 확인"
          subtitle="PIN을 한 번 더 입력하세요"
          errorMessage={errorMessage}
          error={error}
          onComplete={async (pin) => {
            if (pin !== firstPin) {
              triggerError("⚠️ 입력한 PIN이 일치하지 않습니다. 처음부터 다시 입력하세요.");
              setStep("enter");
              setFirstPin("");
              return;
            }
            await onSetupPIN(pin);
          }}
          onCancel={() => {
            setErrorMessage(undefined);
            setStep("enter");
            setFirstPin("");
          }}
        />
      </div>
    );
  }

  // CHANGE mode
  if (mode === "change") {
    if (step === "enter" || step === "change_current") {
      return (
        <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex items-center justify-center">
          <PinPad
            key={`change-current-${attemptCount}`}
            title="🔄 PIN 변경"
            subtitle="현재 PIN을 입력하세요"
            errorMessage={errorMessage}
            error={error}
            onComplete={async (pin) => {
              setErrorMessage(undefined);
              setCurrentPin(pin);
              setStep("change_new");
            }}
            onCancel={onCancel}
          />
        </div>
      );
    }
    if (step === "change_new") {
      return (
        <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex items-center justify-center">
          <PinPad
            key={`change-new-${attemptCount}`}
            title="🔄 새 PIN 입력"
            subtitle="새로운 PIN 4자리를 입력하세요"
            errorMessage={errorMessage}
            error={error}
            onComplete={(pin) => {
              setErrorMessage(undefined);
              setNewPin(pin);
              setStep("change_confirm");
            }}
            onCancel={onCancel}
          />
        </div>
      );
    }
    return (
      <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex items-center justify-center">
        <PinPad
          key={`change-confirm-${attemptCount}`}
          title="🔄 새 PIN 확인"
          subtitle="새 PIN을 한 번 더 입력하세요"
          errorMessage={errorMessage}
          error={error}
          onComplete={async (pin) => {
            if (pin !== newPin) {
              triggerError("⚠️ 새 PIN이 일치하지 않습니다.");
              setStep("change_new");
              setNewPin("");
              return;
            }
            const ok = await onChangePIN(currentPin, pin);
            if (!ok) {
              triggerError("⚠️ 현재 PIN이 올바르지 않습니다.");
              setStep("enter");
              setCurrentPin("");
              setNewPin("");
            }
          }}
          onCancel={onCancel}
        />
      </div>
    );
  }

  return null;
}
