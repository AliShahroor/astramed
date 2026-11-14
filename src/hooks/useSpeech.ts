import { useCallback, useEffect, useState } from 'react';

const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const speak = useCallback((text: string) => {
    if (!supported()) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    return true;
  }, []);
  const stop = useCallback(() => { if (supported()) window.speechSynthesis.cancel(); setSpeaking(false); }, []);
  useEffect(() => () => { if (supported()) window.speechSynthesis.cancel(); }, []);
  return { speak, stop, speaking, supported: supported() };
}
