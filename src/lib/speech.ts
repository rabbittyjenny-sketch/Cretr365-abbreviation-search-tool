import { useCallback, useEffect, useState } from "react";
import type { Entry } from "../data/types";

const supported = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

const englishVoice = (voices: SpeechSynthesisVoice[]) =>
  voices.find((voice) => voice.lang.toLowerCase().replace("_", "-").startsWith("en-us")) ??
  voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));

/** Makes a full name read naturally: drops Thai glosses and turns symbols into words. */
function cleanEnglish(value: string) {
  return value
    .split(" — ")[0]
    .replace(/\([^)]*\)/g, " ")
    .replace(/[฀-๿]+/g, (thai) => (thai === "ถึง" ? " to " : " "))
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/\s*(→|\/)\s*/g, ", ")
    .replace(/(\w)–(\w)/g, "$1 to $2")
    .replace(/\s+/g, " ")
    .replace(/^[\s,]+|[\s,]+$/g, "")
    .trim();
}

/**
 * What the speaker says for one term: its full name (คำเต็ม), never the
 * abbreviation and never the explanation. Falls back to the term itself
 * when the source gives no English full name (e.g. "Content", "TikTok Shop").
 */
export function utteranceFor(entry: Entry) {
  const full = cleanEnglish(entry.fullName);
  if (/[A-Za-z]/.test(full)) return full;
  return cleanEnglish(entry.term);
}

export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const speak = useCallback(
    (entry: Entry) => {
      if (!supported) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(utteranceFor(entry));
      utterance.lang = "en-US";
      const voice = englishVoice(voices);
      if (voice) utterance.voice = voice;
      utterance.rate = 0.92;
      const done = () => setSpeakingId((current) => (current === entry.id ? null : current));
      utterance.onend = done;
      utterance.onerror = done;
      setSpeakingId(entry.id);
      synth.speak(utterance);
    },
    [voices],
  );

  return { supported, speak, speakingId };
}

export type Speech = ReturnType<typeof useSpeech>;
