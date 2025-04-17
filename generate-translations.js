import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Function to recursively get all supported files
function getSupportedFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules directory
      if (file !== 'node_modules') {
        results = results.concat(getSupportedFiles(filePath));
      }
    } else if (file.match(/\.(js|jsx|tsx|vue)$/)) {
      results.push(filePath);
    }
  }

  return results;
}

// Function to extract translation keys from a file
function extractTranslationKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /t\(['"]([^'"]+)['"]\)/g;
  const keys = new Set();
  let match;

  while ((match = regex.exec(content)) !== null) {
    keys.add(match[1]);
  }

  return Array.from(keys);
}

// Function to load existing translations
function loadExistingTranslations(langCode) {
  const filePath = path.join('src', 'lang', `${langCode}.json`);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn(`Warning: Could not load existing translations for ${langCode}:`, error.message);
  }
  return {};
}

// Function to translate text using DeepSeek API
async function translateText(text, langCode) {
  if (langCode === 'en') return text;

  const langNames = {
    'zh': 'Simplified Chinese',
    'en': 'English',
  };

  const targetLang = langNames[langCode] || langCode;
  const systemPrompt = `You are a professional English to ${targetLang} translator. Translate the given text to natural ${targetLang}. Only return the translation without any explanations.`;

  try {
    const response = await axios.post(API_URL, {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      max_tokens: 100,
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });

    const translation = response.data.choices[0].message.content.trim();
    console.log(`Translated "${text}" to "${translation}"`);
    return translation;
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    return text; // Return original text if translation fails
  }
}

// Main function
async function generateTranslations() {
  const langCode = process.argv[2];

  if (!langCode) {
    console.error('Please specify a language code');
    console.error('Usage: npm run i18n <lang-code>');
    console.error('Example: npm run i18n jp');
    process.exit(1);
  }

  // Get all supported files
  const files = getSupportedFiles('src');

  // Extract all translation keys
  const allKeys = new Set();
  files.forEach(file => {
    const keys = extractTranslationKeys(file);
    keys.forEach(key => allKeys.add(key));
  });

  // Load existing translations
  const existingTranslations = loadExistingTranslations(langCode);

  // Find new keys that need translation
  const newKeys = Array.from(allKeys).filter(key => !existingTranslations[key]);

  console.log(`Found ${allKeys.size} total strings in ${files.length} files`);
  console.log(`${newKeys.length} new strings need translation`);
  console.log('Files scanned:', files.join('\n'));

  // Generate translations object, keeping existing translations
  const translations = { ...existingTranslations };

  // Only translate new keys
  for (const key of newKeys) {
    translations[key] = await translateText(key, langCode);
    // Add a small delay between API calls
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Ensure lang directory exists
  const langDir = path.join('src', 'lang');
  if (!fs.existsSync(langDir)) {
    fs.mkdirSync(langDir, { recursive: true });
  }

  // Write translations file
  const filePath = path.join(langDir, `${langCode}.json`);
  fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf8');
  console.log(`Generated translations at ${filePath}`);
}

generateTranslations().catch(console.error);
