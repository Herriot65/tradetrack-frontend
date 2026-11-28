import { useEffect, useRef, useState } from "react";

// Speech recognition starts only after an explicit microphone click. Browsers
// may use their own speech service; no audio is stored by this application.
export default function useCoachDictation({ value, onChange, disabled, onFinish }) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recognition = useRef(null);
  const callbacks = useRef({ onChange, onFinish });
  useEffect(() => { callbacks.current = { onChange, onFinish }; });

  function stop() { recognition.current?.stop(); }

  function start() {
    if (disabled || recognition.current) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input isn't supported in this browser. You can use your keyboard's microphone or type your message.");
      return;
    }
    const session = new SpeechRecognition();
    const prefix = value.trimEnd();
    session.lang = navigator.language || "en-US";
    session.continuous = false;
    session.interimResults = true;
    recognition.current = session;
    setError("");
    setListening(true);
    session.onstart = () => { if (recognition.current === session) setListening(true); };
    session.onresult = event => {
      if (recognition.current !== session) return;
      const transcript = Array.from(event.results, result => result[0]?.transcript || "").join(" ").trim();
      callbacks.current.onChange([prefix, transcript].filter(Boolean).join(" ").slice(0, 4000));
    };
    session.onerror = event => {
      if (recognition.current !== session || event.error === "aborted") return;
      const messages = {
        "not-allowed": "Microphone access was denied. Allow it in your browser to use voice input.",
        "service-not-allowed": "Voice input isn't available in this browser. You can still type your message.",
        "audio-capture": "No microphone was found. Connect one and try again.",
        "no-speech": "No speech was detected. Tap the microphone to try again.",
        "network": "Voice input couldn't connect. Please try again or type your message.",
      };
      setError(messages[event.error] || "Voice input stopped. Please try again or type your message.");
    };
    session.onend = () => {
      if (recognition.current !== session) return;
      recognition.current = null;
      setListening(false);
      callbacks.current.onFinish?.();
    };
    try { session.start(); }
    catch {
      recognition.current = null;
      setListening(false);
      setError("Voice input couldn't start. Please try again or type your message.");
    }
  }

  useEffect(() => {
    if (disabled) recognition.current?.stop();
  }, [disabled]);
  useEffect(() => () => {
    const session = recognition.current;
    recognition.current = null;
    if (session) {
      session.onstart = session.onresult = session.onerror = session.onend = null;
      session.abort();
    }
  }, []);

  return { listening, error, start, stop };
}
