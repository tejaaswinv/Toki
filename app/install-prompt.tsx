"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneMode()) return;

    const dismissed = window.localStorage.getItem("toki-install-dismissed") === "true";
    if (dismissed) return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    const showIosHint = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    if (showIosHint) {
      const timer = window.setTimeout(() => setVisible(true), 1200);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
      setInstallEvent(null);
    }
  }

  function dismiss() {
    window.localStorage.setItem("toki-install-dismissed", "true");
    setVisible(false);
  }

  if (!visible) return null;

  const isIos = typeof window !== "undefined" && /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  return (
    <div className="install-prompt" role="status" aria-live="polite">
      <div>
        <strong>Install Toki</strong>
        <p>
          {isIos
            ? "On iPhone/iPad: tap Share, then Add to Home Screen."
            : "Add it to your device for quick deadline checks."}
        </p>
      </div>
      <div className="install-actions">
        {!isIos && installEvent ? (
          <button className="btn btn-sm btn-primary" onClick={install}>
            Install
          </button>
        ) : null}
        <button className="btn btn-sm btn-ghost" onClick={dismiss}>
          Later
        </button>
      </div>
    </div>
  );
}
