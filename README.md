# Translation Generator Script

A standalone script for generating translation files from source code by DeepSeek API. This script is framework-agnostic and can be used with any JavaScript/TypeScript project that uses a `t()` function for translations.

## Features

- Automatically extracts translatable text from source files
- Supports .js, .jsx, .tsx, and .vue files
- Incremental translation (only translates new strings)
- Uses DeepSeek API for automatic translation
- Maintains existing translations

## Dependencies

The script only requires two dependencies:
- `axios`: For making API calls to DeepSeek
- `dotenv`: For loading environment variables

## Setup

1. Create a `.env` file in the scripts directory with your DeepSeek API key:
```
DEEPSEEK_API_KEY=your-api-key-here
```

2. Language Support:
- By default, the script assumes source text is in English
- Built-in support for:
  * Chinese (zh)
  * Japanese (jp)
- To add support for other languages:
  1. Open generate-translations.js
  2. Add your language code and name to the langNames object:
  ```javascript
  const langNames = {
    'zh': 'Simplified Chinese',
    'jp': 'Japanese',
    'your-code': 'Your Language Name'
  };
  ```

## Usage

Run from the project root:
```bash
npm run i18n <language-code>
```

Example:
```bash
npm run i18n zh  # Generate Chinese translations
npm run i18n jp  # Generate Japanese translations
npm run i18n en  # Generate English translations (keeps original text)
```

## How it Works

1. Scans all supported files in the src directory
2. Extracts text wrapped in `t()` function calls
3. Loads existing translations if available
4. Only translates new or missing strings
5. Generates/updates translation files in src/lang directory

## Output

Translation files are generated in the `src/lang` directory:
- `zh.json`: Chinese translations
- `jp.json`: Japanese translations
- `en.json`: English translations (original text)

## Note

This script is independent of any translation framework (i18next, react-i18next, etc.). It only generates the translation JSON files, which can then be used with any translation system that supports JSON format.
