import { crest } from "./icons";
// "Install the app" support: the browser's install prompt where it exists
// (Android, Chrome, Edge), and step-by-step help where it doesn't (iPhone/iPad Safari).

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface InstallState {
  /** Already running as an installed app. */
  installed: boolean;
  /** Installing isn't possible here (e.g. inside an embedded preview). */
  unavailable: boolean;
  /** The browser offered its own install prompt. */
  canPrompt: boolean;
  ios: boolean;
  showHelp: boolean;
}

export function createInstall(onChange: () => void) {
  let deferred: InstallPromptEvent | null = null;
  const ua = navigator.userAgent;
  const state: InstallState = {
    installed: window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
    unavailable: window.top !== window.self,
    canPrompt: false,
    ios: /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1),
    showHelp: false,
  };
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    state.canPrompt = true;
    onChange();
  });
  window.addEventListener("appinstalled", () => {
    state.installed = true;
    state.canPrompt = false;
    deferred = null;
    onChange();
  });
  return {
    state,
    async install() {
      if (deferred) {
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome === "accepted") state.installed = true;
        deferred = null;
        state.canPrompt = false;
      } else {
        state.showHelp = true;
      }
      onChange();
    },
    closeHelp() {
      state.showHelp = false;
      onChange();
    },
  };
}

export function registerServiceWorker(): void {
  const inFrame = window.top !== window.self;
  const secure = location.protocol === "https:" || location.hostname === "localhost";
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD || inFrame || !secure) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

export function installCard(s: InstallState): string {
  if (s.installed || s.unavailable) return "";
  return `<div class="install-card">
    ${crest(56)}
    <div><strong>Get the Smart Sweep app</strong><span class="small">Add it to your home screen. It opens full screen and works offline.</span></div>
    <button class="btn btn-primary btn-sm" data-action="install" data-key="install">Install</button>
  </div>`;
}

export function installHelp(s: InstallState): string {
  if (!s.showHelp) return "";
  const steps = s.ios
    ? ["Open this page in <strong>Safari</strong>.", "Tap the <strong>Share</strong> button (the square with an arrow pointing up).", "Scroll down and tap <strong>Add to Home Screen</strong>.", "Tap <strong>Add</strong>. Smart Sweep appears on your home screen."]
    : ["Open your browser's menu (<strong>⋮</strong> or <strong>…</strong>, usually at the top right).", "Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.", "Confirm. Smart Sweep appears with your other apps."];
  return `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="install-title">
    <h2 id="install-title">Install Smart Sweep</h2>
    <ol class="steps">${steps.map((x) => `<li>${x}</li>`).join("")}</ol>
    <div class="btn-row"><button class="btn btn-primary" data-action="install-close" data-key="install-close">Got it</button></div>
  </div></div>`;
}
