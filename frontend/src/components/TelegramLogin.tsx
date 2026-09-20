import { useEffect, useRef } from "react";
import type { TelegramUser } from "../services/api";

declare global {
  interface Window {
    onTelegramAuth?: (usuario: TelegramUser) => void;
  }
}

const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? "";

export function TelegramLogin({ onLogin }: { onLogin: (usuario: TelegramUser) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!botUsername || !containerRef.current) return;
    window.onTelegramAuth = (usuario) => onLogin(usuario);
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth");
    script.setAttribute("data-request-access", "write");
    containerRef.current.replaceChildren(script);
    return () => {
      delete window.onTelegramAuth;
      containerRef.current?.replaceChildren();
    };
  }, [onLogin]);

  if (!botUsername) {
    return <p>Configure VITE_TELEGRAM_BOT_USERNAME para exibir o login.</p>;
  }
  return <div ref={containerRef} />;
}