export const speech = {
  speak: (text) => {
    window.speechSynthesis.cancel();
    const clean = text.replace(/\*\*/g, '');
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'en-US';
    utter.rate = 0.9;
    utter.pitch = 1.0;
    window.speechSynthesis.speak(utter);
  },
  stop: () => window.speechSynthesis.cancel(),
  isSpeaking: () => window.speechSynthesis.speaking,
};
