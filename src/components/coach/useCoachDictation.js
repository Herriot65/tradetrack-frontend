import { useEffect, useRef, useState } from "react";

// Speech recognition starts only after an explicit microphone click. Browsers
// may use their own speech service; no audio is stored by this application.
export default function useCoachDictation({ value, onChange, disabled, onFinish }) {
  const [listening, setListening] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const stopping = useRef(false);
  const [error, setError] = useState("");
  const recognition = useRef(null);
  const finishTimer = useRef(null);
  const silenceTimer = useRef(null);
  const heardSpeech = useRef(false);
  const callbacks = useRef({ onChange, onFinish });
  useEffect(() => { callbacks.current = { onChange, onFinish }; });

  function finish(session, message, abort = false) {
    if (recognition.current !== session) return;
    clearTimeout(finishTimer.current);
    clearTimeout(silenceTimer.current);
    recognition.current = null;
    stopping.current = false;
    session.onstart = session.onresult = session.onerror = session.onend = null;
    if (abort) { try { session.abort(); } catch { /* Already stopped. */ } }
    setListening(false);
    setFinishing(false);
    if (message) setError(message);
    callbacks.current.onFinish?.();
  }

  function stop() {
    if (!recognition.current || stopping.current) return;
    stopping.current = true;
    setFinishing(true);
    const session = recognition.current;
    clearTimeout(silenceTimer.current);
    // Some speech services never dispatch onend after an empty recording.
    // Bound the final-result wait and preserve any text already received.
    finishTimer.current = setTimeout(() => finish(session, heardSpeech.current
      ? "Voice input stopped. Please review your draft."
      : "No speech was detected. Tap the microphone to try again.", true), 4000);
    // stop() requests the final recognition result before onend. Keep handlers
    // attached until then so the final words are included in the draft.
    try { session.stop(); }
    catch {
      finish(session, "Voice input stopped. Your draft is still here; please review it.", true);
    }
  }

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
    session.continuous = true;
    session.interimResults = true;
    recognition.current = session;
    heardSpeech.current = false;
    stopping.current = false;
    setFinishing(false);
    setError("");
    setListening(true);
    silenceTimer.current = setTimeout(() => finish(session, "No speech was detected. Tap the microphone to try again.", true), 12000);
    session.onstart = () => { if (recognition.current === session) setListening(true); };
    session.onresult = event => {
      if (recognition.current !== session) return;
      const transcript = Array.from(event.results, result => result[0]?.transcript || "").join(" ").trim();
      if (!transcript) return;
      heardSpeech.current = true;
      clearTimeout(silenceTimer.current);
      callbacks.current.onChange([prefix, transcript].filter(Boolean).join(" ").slice(0, 4000));
    };
    session.onerror = event => {
      if (recognition.current !== session) return;
      const messages = {
        "not-allowed": "Microphone access was denied. Allow it in your browser to use voice input.",
        "service-not-allowed": "Voice input isn't available in this browser. You can still type your message.",
        "audio-capture": "No microphone was found. Connect one and try again.",
        "no-speech": "No speech was detected. Tap the microphone to try again.",
        "network": "Voice input couldn't connect. Please try again or type your message.",
      };
      finish(session, messages[event.error] || "Voice input stopped. Please try again or type your message.", true);
    };
    session.onend = () => {
      if (recognition.current !== session) return;
      finish(session, heardSpeech.current ? "" : "No speech was detected. Tap the microphone to try again.");
    };
    try { session.start(); }
    catch {
      finish(session, "Voice input couldn't start. Please try again or type your message.", true);
    }
  }

  useEffect(() => {
    if (disabled && recognition.current) finish(recognition.current, "", true);
  }, [disabled]);
  useEffect(() => () => {
    const session = recognition.current;
    clearTimeout(finishTimer.current);
    clearTimeout(silenceTimer.current);
    recognition.current = null;
    if (session) {
      session.onstart = session.onresult = session.onerror = session.onend = null;
      session.abort();
    }
  }, []);

  return { listening, finishing, error, start, stop };
}
