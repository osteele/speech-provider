import { z } from 'https://esm.sh/zod@3.22.4';
import { getVoiceProvider } from 'https://esm.sh/speech-provider@0.1.2';

// Example sentences for different languages
const exampleSentences = {
  'en': 'Hello! This is a test of text-to-speech synthesis.',
  'es': '¡Hola! Esta es una prueba de síntesis de texto a voz.',
  'fr': 'Bonjour! Ceci est un test de synthèse vocale.',
  'de': 'Hallo! Dies ist ein Test der Sprachsynthese.',
  'ja': 'こんにちは！これは音声合成のテストです。',
  'zh': '你好！这是一个语音合成测试。',
  'ko': '안녕하세요! 이것은 음성 합성 테스트입니다.',
  'ru': 'Привет! Это тест синтеза речи.',
  'pt': 'Olá! Este é um teste de síntese de fala.',
  'it': 'Ciao! Questo è un test di sintesi vocale.'
};

// DOM Elements
const apiKeyInput = document.getElementById('apiKey');
const saveKeyButton = document.getElementById('saveKey');
const providersDiv = document.getElementById('providers');
const languagesSelect = document.getElementById('languages');
const voicesDiv = document.getElementById('voices');
const textArea = document.getElementById('text');
const speakButton = document.getElementById('speak');
const stopButton = document.getElementById('stop');
const statusDiv = document.getElementById('status');
const speakTopButton = document.getElementById('speakTop');

// State
let currentProvider = null;
let currentVoice = null;
let currentUtterance = null;

// Load saved API key
const savedApiKey = localStorage.getItem('elevenLabsApiKey');
if (savedApiKey) {
  apiKeyInput.value = savedApiKey;
}

// Initialize voice provider
function initVoiceProvider() {
  const apiKey = apiKeyInput.value || null;
  currentProvider = getVoiceProvider({ elevenLabsApiKey: apiKey });
  updateProviders();
  // Select browser provider by default
  selectProvider('Browser');
}

// Update providers list
function updateProviders() {
  providersDiv.innerHTML = '';

  // Browser provider is always available and selected by default
  const browserProvider = document.createElement('div');
  browserProvider.className = 'provider selected';
  browserProvider.textContent = 'Browser';
  browserProvider.onclick = () => selectProvider('Browser');
  providersDiv.appendChild(browserProvider);

  // Eleven Labs provider if API key is available
  if (apiKeyInput.value) {
    const elevenLabsProvider = document.createElement('div');
    elevenLabsProvider.className = 'provider';
    elevenLabsProvider.textContent = 'Eleven Labs';
    elevenLabsProvider.onclick = () => selectProvider('Eleven Labs');
    providersDiv.appendChild(elevenLabsProvider);
  }
}

// Select a provider
async function selectProvider(name) {
  try {
    // Update UI
    document.querySelectorAll('.provider').forEach(el => {
      el.classList.toggle('selected', el.textContent === name);
    });

    // Update provider
    const isElevenLabs = name.trim() === 'Eleven Labs';
    const apiKey = isElevenLabs ? apiKeyInput.value : null;
    currentProvider = getVoiceProvider({ elevenLabsApiKey: apiKey });

    // Update languages
    await updateLanguages();
  } catch (error) {
    console.error('Error selecting provider:', error);
    statusDiv.textContent = `Error initializing ${name} provider`;
  }
}

// Update languages list
async function updateLanguages() {
  if (!currentProvider) {
    console.error('No provider available');
    return;
  }

  try {
    // Get voices for a few common languages to build the language list
    const languages = new Set();
    const commonLangs = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'zh-CN', 'ko-KR', 'ru-RU', 'pt-BR', 'it-IT'];

    for (const lang of commonLangs) {
      try {
        const voices = await currentProvider.getVoices({ lang, minVoices: 1 });
        if (!voices) {
          continue;
        }
        if (voices.length > 0) {
          languages.add(lang.split('-')[0]);
        }
      } catch (error) {
        console.error(`Error fetching voices for ${lang}:`, error);
        // Continue with other languages even if one fails
        continue;
      }
    }

    if (languages.size === 0) {
      throw new Error('No voices available. Please check your API key if using Eleven Labs.');
    }

    // Update select element
    languagesSelect.innerHTML = '';
    const sortedLangs = Array.from(languages).sort();

    // Add system language first if available
    const systemLang = navigator.language.split('-')[0];
    if (sortedLangs.includes(systemLang)) {
      const option = document.createElement('option');
      option.value = systemLang;
      option.textContent = new Intl.DisplayNames(['en'], { type: 'language' }).of(systemLang);
      languagesSelect.appendChild(option);
    }

    // Add other languages
    sortedLangs.forEach(lang => {
      if (lang !== systemLang) {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = new Intl.DisplayNames(['en'], { type: 'language' }).of(lang);
        languagesSelect.appendChild(option);
      }
    });

    // Update voices for selected language
    if (languagesSelect.value) {
      await updateVoices();
    }
  } catch (error) {
    console.error('Error updating languages:', error);
    if (error.message?.includes('401')) {
      statusDiv.textContent = 'Invalid API key. Please check your Eleven Labs API key.';
    } else {
      statusDiv.textContent = error.message || 'Error loading languages';
    }
    // Clear the languages and voices lists on error
    languagesSelect.innerHTML = '';
    voicesDiv.innerHTML = '';
  }
}

// Helper function to speak text
async function speakText(voice) {
  if (!voice || !textArea.value) return;

  try {
    // Stop any current utterance
    if (currentUtterance) {
      currentUtterance.stop();
    }

    // Create new utterance and set up handlers
    currentUtterance = voice.createUtterance(textArea.value);
    speakButton.disabled = true;
    speakTopButton.disabled = true;
    stopButton.disabled = false;
    statusDiv.textContent = 'Speaking...';

    currentUtterance.onstart = () => {
      statusDiv.textContent = 'Speaking...';
      speakButton.disabled = true;
      speakTopButton.disabled = true;
      stopButton.disabled = false;
    };
    currentUtterance.onend = () => {
      statusDiv.textContent = voice === currentVoice ? `Selected voice: ${voice.name}` : 'Finished speaking';
      speakButton.disabled = false;
      speakTopButton.disabled = false;
      stopButton.disabled = true;
    };

    // Start speaking
    currentUtterance.start();
  } catch (error) {
    console.error('Error speaking:', error);
    statusDiv.textContent = 'Error speaking text';
    speakButton.disabled = false;
    speakTopButton.disabled = false;
    stopButton.disabled = true;
  }
}

// Update voices list
async function updateVoices() {
  if (!currentProvider || !languagesSelect.value) return;

  try {
    const lang = languagesSelect.value;
    const voices = await currentProvider.getVoices({ lang, minVoices: 1 });

    if (!voices || voices.length === 0) {
      voicesDiv.innerHTML = '<div class="voice">No voices available for this language</div>';
      return;
    }

    // Group voices by base name
    const voiceGroups = new Map();
    voices.forEach(voice => {
      const baseName = voice.name.split('(')[0].trim();
      if (!voiceGroups.has(baseName)) {
        voiceGroups.set(baseName, []);
      }
      voiceGroups.get(baseName).push(voice);
    });

    voicesDiv.innerHTML = '';
    voiceGroups.forEach(groupVoices => {
      const voiceDiv = document.createElement('div');
      voiceDiv.className = 'voice';

      // Use the first voice's base name and description
      const baseName = groupVoices[0].name.split('(')[0].trim();
      const description = groupVoices[0].description;

      // Extract and format regions
      const regions = groupVoices
        .map(v => {
          const match = /\((.*?)\)/.exec(v.name);
          return match ? match[1] : null;
        })
        .filter(r => r)
        .join(', ');

      voiceDiv.innerHTML = `
        <strong>${baseName}</strong>
        ${regions ? `<br><small>Regions: ${regions}</small>` : ''}
        ${description ? `<br>${description}` : ''}
      `;

      // Use the first voice for playback
      voiceDiv.onclick = () => selectVoice(groupVoices[0]);
      voicesDiv.appendChild(voiceDiv);
    });

    // Update example text
    textArea.value = exampleSentences[lang] || exampleSentences['en'];
  } catch (error) {
    console.error('Error updating voices:', error);
    if (error.message?.includes('401')) {
      statusDiv.textContent = 'Invalid API key. Please check your Eleven Labs API key.';
      voicesDiv.innerHTML = '';
    } else {
      statusDiv.textContent = 'Error loading voices';
      voicesDiv.innerHTML = '<div class="voice">Error loading voices</div>';
    }
  }
}

// Select a voice
async function selectVoice(voice) {
  // Update UI
  document.querySelectorAll('.voice').forEach(el => {
    el.classList.toggle('selected', el.textContent.includes(voice.name.split('(')[0].trim()));
  });

  // Update state
  currentVoice = voice;
  statusDiv.textContent = `Selected voice: ${voice.name}`;

  // Automatically play example
  await speakText(voice);
}

// Event Listeners
saveKeyButton.onclick = () => {
  const apiKey = apiKeyInput.value.trim();
  if (apiKey) {
    localStorage.setItem('elevenLabsApiKey', apiKey);
    initVoiceProvider();
    statusDiv.textContent = 'API key saved';
  } else {
    localStorage.removeItem('elevenLabsApiKey');
    initVoiceProvider();
    statusDiv.textContent = 'API key removed';
  }
};

languagesSelect.onchange = updateVoices;

speakButton.onclick = () => speakText(currentVoice);
speakTopButton.onclick = () => speakText(currentVoice);

stopButton.onclick = () => {
  if (currentUtterance) {
    currentUtterance.stop();
    statusDiv.textContent = 'Stopped speaking';
    speakButton.disabled = false;
    speakTopButton.disabled = false;
    stopButton.disabled = true;
  }
};

// Initialize
initVoiceProvider();
