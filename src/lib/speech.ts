import { useCallback, useEffect, useRef, useState } from "react";
import type { Entry } from "../data/types";
import { useStored } from "./store";

export type VoiceMode = "auto" | "th" | "en";

const supported = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

const findVoice = (voices: SpeechSynthesisVoice[], lang: "th" | "en") =>
  voices.find((voice) => voice.lang.toLowerCase().replace("_", "-").startsWith(lang === "th" ? "th" : "en-us")) ??
  voices.find((voice) => voice.lang.toLowerCase().startsWith(lang));

/** Thai reading guide -> something a TTS voice reads cleanly ("ซี-ที-อาร์" -> "ซี ที อาร์"). */
function cleanThai(value: string) {
  return value.replace(/\([^)]*\)/g, " ").replace(/[-–]/g, " ").replace(/\s+/g, " ").trim();
}

function cleanEnglish(value: string) {
  return value
    .replace(/\([^)]*\)/g, " ")
    .replace(/&/g, " and ")
    .replace(/(\w)–(\w)/g, "$1 to $2")
    .replace(/[-/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Picks exactly what to say for one term — never the explanation.
 * `variantIndex` is the variant the user searched for (e.g. "CVR" in "CR / CVR").
 */
export function utteranceFor(entry: Entry, variantIndex: number, useThai: boolean) {
  const variant = entry.variants[variantIndex] ?? entry.variants[0];
  const thai = variant?.pron ?? (variantIndex === 0 ? entry.variants[0]?.pron : undefined);
  if (useThai && thai) return { text: cleanThai(thai), lang: "th" as const };
  return { text: cleanEnglish(variant?.text ?? entry.term), lang: "en" as const };
}

export function useSpeech() {
  const [mode, setMode] = useStored<VoiceMode>("voice", "auto");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<number>();

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const thaiVoice = findVoice(voices, "th");
  const englishVoice = findVoice(voices, "en");

  const flash = (message: string) => {
    setNotice(message);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setNotice(null), 3200);
  };

  const speak = useCallback(
    (entry: Entry, variantIndex = 0) => {
      if (!supported) return;
      const wantThai = mode !== "en";
      // Some browsers expose voices late; only fall back when we know there is no Thai voice.
      const thaiAvailable = Boolean(thaiVoice) || voices.length === 0;
      const { text, lang } = utteranceFor(entry, variantIndex, wantThai && thaiAvailable);
      if (mode === "th" && !thaiAvailable) flash("เครื่องนี้ยังไม่มีเสียงภาษาไทย จึงอ่านเป็นภาษาอังกฤษแทน");
      const key = `${entry.id}:${variantIndex}`;
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === "th" ? "th-TH" : "en-US";
      const voice = lang === "th" ? thaiVoice : englishVoice;
      if (voice) utterance.voice = voice;
      utterance.rate = lang === "th" ? 0.95 : 0.9;
      utterance.onend = () => setSpeakingKey((current) => (current === key ? null : current));
      utterance.onerror = () => setSpeakingKey((current) => (current === key ? null : current));
      setSpeakingKey(key);
      synth.speak(utterance);
    },
    [mode, thaiVoice, englishVoice, voices.length],
  );

  return { supported, speak, speakingKey, mode, setMode, hasThaiVoice: Boolean(thaiVoice), notice };
}

export type Speech = ReturnType<typeof useSpeech>;
