import { getVoiceProvider } from "speech-provider";

// Example 1: Basic usage with browser voices
async function basicBrowserExample() {
  const provider = getVoiceProvider({});
  console.log(`Using voice provider: ${provider.name}`);

  // Get all available voices for English
  const voices = await provider.getVoices({
    lang: "en-US",
    minVoices: 1,
  });

  console.log(`Found ${voices.length} voices:`);
  for (const voice of voices) {
    console.log(`- ${voice.name} (${voice.description || "No description"})`);
  }

  // Get the default voice
  const defaultVoice = await provider.getDefaultVoice({ lang: "en-US" });

  if (defaultVoice) {
    console.log(`Using default voice: ${defaultVoice.name}`);

    // Create an utterance
    const utterance = defaultVoice.createUtterance(
      "Hello! This is a test of browser speech synthesis.",
    );

    // Add event listeners
    utterance.onstart = () => console.log("Started speaking");
    utterance.onend = () => console.log("Finished speaking");

    // Start speaking
    utterance.start();

    // Stop after 5 seconds (for demo purposes)
    setTimeout(() => {
      utterance.stop();
      console.log("Speech stopped manually");
    }, 5000);
  } else {
    console.log("No default voice found");
  }
}

// Example 2: Language matching
async function languageMatchingExample() {
  const provider = getVoiceProvider({});

  // Try with different language codes
  const languages = ["en-US", "en-GB", "es-ES", "fr-FR", "de-DE", "ja-JP"];

  for (const lang of languages) {
    console.log(`\nTrying to find voices for ${lang}`);
    const voices = await provider.getVoices({ lang, minVoices: 1 });
    console.log(`Found ${voices.length} voices matching ${lang}`);

    if (voices.length > 0) {
      const voice = voices[0];
      console.log(`Selected voice: ${voice.name} (${voice.lang})`);

      // Create utterance with a greeting in that language
      const greetings = {
        en: "Hello, how are you today?",
        es: "Hola, ¿cómo estás hoy?",
        fr: "Bonjour, comment allez-vous aujourd'hui?",
        de: "Hallo, wie geht es Ihnen heute?",
        ja: "こんにちは、今日はお元気ですか？",
      };

      const langCode = lang.slice(0, 2);
      const greeting = greetings[langCode] || "Hello";

      const utterance = voice.createUtterance(greeting);
      utterance.start();

      // Wait for speech to complete before continuing
      await new Promise((resolve) => {
        utterance.onend = resolve;
      });
    }
  }
}

// Run the examples
async function runExamples() {
  console.log("=== Basic Browser Example ===");
  await basicBrowserExample();

  console.log("\n=== Language Matching Example ===");
  await languageMatchingExample();
}

// Wait for voices to load before running examples
if (window.speechSynthesis) {
  if (window.speechSynthesis.getVoices().length) {
    runExamples();
  } else {
    window.speechSynthesis.onvoiceschanged = runExamples;
  }
} else {
  console.error("Speech synthesis not supported in this browser");
}
