"use client";

import { useEffect } from "react";

export function PwaRegistrar() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("ServiceWorker registered successfully:", reg.scope))
        .catch((err) => console.warn("ServiceWorker registration failed:", err));
    }
  }, []);

  return null;
}
