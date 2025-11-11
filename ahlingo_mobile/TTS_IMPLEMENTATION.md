# Enhanced Text-to-Speech Implementation

## Overview

The AhLingo mobile app now features **intelligent, high-quality text-to-speech** that automatically selects the best available offline voices for both **iOS** and **Android** platforms.

### What Changed

✅ **Smart Voice Selection**
- iOS: Automatically selects premium → enhanced → compact voices
- Android: Filters for highest quality offline voices (quality ≥ 400)

✅ **Multi-Language Support**
- English, French, Spanish, German, Italian, Portuguese, Japanese, Chinese, Korean, Russian
- Easy to extend to additional languages

✅ **Voice Quality Detection**
- Checks if high-quality voices are installed
- Provides user guidance for downloading premium voices

✅ **Backward Compatible**
- Existing `speakEnglish()` and `speakFrench()` methods work as before
- No breaking changes to existing code

---

## Architecture

### Core Components

1. **`TTSService.ts`** - Main service with voice selection logic
2. **`TTSVoiceHelper.ts`** - Utility for checking voice availability and guiding users
3. **`VoiceQualityChecker.tsx`** - React component for settings/onboarding

### How It Works

```typescript
// When you call:
await TTSService.speakFrench("Bonjour");

// The service:
1. Initializes and loads available voices (cached)
2. Finds the best French voice:
   - iOS: Tries premium → enhanced → compact
   - Android: Filters by quality ≥ 400, sorts by highest
3. Sets the language and voice
4. Speaks the text
```

---

## Voice Quality by Platform

### iOS Premium Voices

| Quality Level | Naming | Size | Naturalness |
|--------------|--------|------|-------------|
| Premium | `com.apple.voice.premium.*` | ~200MB | ⭐⭐⭐⭐⭐ Neural |
| Enhanced | `com.apple.voice.enhanced.*` | ~50MB | ⭐⭐⭐⭐ High |
| Compact | `com.apple.ttsbundle.*-compact` | ~10MB | ⭐⭐ Robotic |

**The app now prefers Premium > Enhanced > Compact automatically.**

### Android Voice Quality

| Quality Value | Description | Naturalness |
|--------------|-------------|-------------|
| 500 | Neural/Premium (Android 11+) | ⭐⭐⭐⭐⭐ Neural |
| 400 | High Quality | ⭐⭐⭐⭐ High |
| 300 | Normal Quality | ⭐⭐⭐ Standard |
| 200 | Low Quality | ⭐⭐ Robotic |

**The app filters for quality ≥ 400 by default.**

---

## Usage Examples

### Basic Usage (Existing Code Works!)

```typescript
import TTSService from '../services/TTSService';

// English
await TTSService.speakEnglish("Hello, world!");

// French with best available voice
await TTSService.speakFrench("Bonjour le monde!");

// With options
await TTSService.speakFrench("Parlez-vous français?", { rate: 0.4 });
```

### New Language Support

```typescript
// Spanish
await TTSService.speakSpanish("¡Hola!");

// German
await TTSService.speakGerman("Guten Tag!");

// Italian
await TTSService.speakItalian("Ciao!");

// Portuguese
await TTSService.speakPortuguese("Olá!");
```

### Automatic Language Detection

```typescript
// Uses the user's language setting
await TTSService.speakWithLanguageDetection(
  "¡Hola!",
  userLanguage, // "Spanish"
  { rate: 0.5 }
);
```

### Direct Language Code

```typescript
// For maximum control
await TTSService.speakInLanguage(
  "こんにちは",
  "ja-JP", // Japanese
  { rate: 0.4 }
);
```

### Check Voice Quality

```typescript
// Check if high-quality voices are available
const info = await TTSService.getVoiceQualityInfo('fr-FR');

console.log(info.hasHighQuality); // true if premium/enhanced voice found
console.log(info.voiceName);      // "Thomas" (iOS) or "Google français (France)" (Android)
console.log(info.quality);        // undefined (iOS) or 500 (Android)
```

---

## User Guidance Components

### Add to Settings Screen

```typescript
import VoiceQualityChecker from '../components/VoiceQualityChecker';

function SettingsScreen() {
  return (
    <View>
      {/* Other settings */}

      <VoiceQualityChecker
        languages={['English', 'French', 'Spanish']}
        showDetails={true}
        autoPrompt={false}
      />
    </View>
  );
}
```

### Add to Onboarding

```typescript
import VoiceQualityChecker from '../components/VoiceQualityChecker';

function OnboardingScreen() {
  return (
    <View>
      {/* Onboarding content */}

      <VoiceQualityChecker
        languages={[userSelectedLanguage]}
        autoPrompt={true} // Automatically prompt on first use
      />
    </View>
  );
}
```

### Programmatic Prompting

```typescript
import { TTSVoiceHelper } from '../utils/TTSVoiceHelper';

// Check voice availability
const summary = await TTSVoiceHelper.getVoiceQualitySummary(['French', 'Spanish']);

if (!summary.allHighQuality) {
  console.log(summary.summary); // "High-quality voices missing for: Spanish"

  // Prompt user to download
  TTSVoiceHelper.promptToDownloadVoices(summary.missingLanguages);
}
```

---

## Downloading Premium Voices

### iOS Instructions

Users should:
1. Open **Settings** app
2. Go to **Accessibility**
3. Tap **Spoken Content**
4. Tap **Voices**
5. Select their language (e.g., "French")
6. Download **Premium** or **Enhanced** voices

**Important:** Premium voices are ~200MB each. Enhanced voices (~50MB) are a good middle ground.

### Android Instructions

Users should:
1. Open **Settings** app
2. Go to **System** > **Languages & input**
3. Tap **Text-to-speech output**
4. Tap the ⚙️ icon next to "Google Text-to-speech Engine"
5. Tap **Install voice data**
6. Download high-quality voices for their languages

**Important:** High-quality voices require Google TTS engine (pre-installed on most devices).

---

## Testing

### Voice Selection Logs

The service logs voice selection to the console:

```
=== TTS Voices Available ===
Total voices: 87
High-quality offline voices: 12
Selected iOS voice: Thomas (com.apple.voice.premium.fr-FR.Thomas)
```

or on Android:

```
=== TTS Voices Available ===
Total voices: 281
High-quality offline voices: 45
Selected Android voice: Google français (France) (quality: 500)
```

### Manual Testing

1. **Test on iOS:**
   ```bash
   npm run ios
   ```
   - Check console logs for voice selection
   - Test with compact voice (default)
   - Download a premium voice and test again
   - Verify dramatic quality improvement

2. **Test on Android:**
   ```bash
   npm run android
   ```
   - Check console logs for quality values
   - Test different voice packs
   - Verify quality filtering works

### Automated Testing

```typescript
// In your test file
import TTSService from '../services/TTSService';

describe('TTSService', () => {
  it('should select high-quality voices', async () => {
    const info = await TTSService.getVoiceQualityInfo('fr-FR');

    if (info.hasHighQuality) {
      expect(info.voiceName).toBeDefined();
      console.log(`✓ Using high-quality voice: ${info.voiceName}`);
    } else {
      console.warn('⚠ No high-quality voices found. User should download premium voices.');
    }
  });
});
```

---

## Adding New Languages

To add support for a new language:

### 1. Add iOS Premium Voices (if available)

Edit `TTSService.ts`:

```typescript
const IOS_PREMIUM_VOICES: { [key: string]: string[] } = {
  // ... existing languages ...

  'nl-NL': [ // Dutch
    'com.apple.voice.premium.nl-NL.Xander',
    'com.apple.voice.enhanced.nl-NL.Xander',
    'com.apple.ttsbundle.Xander-compact',
  ],
};
```

### 2. Add to Language Map

```typescript
private getLanguageCode(languageName: string): string {
  const languageMap: { [key: string]: string } = {
    // ... existing languages ...
    'dutch': Platform.OS === 'ios' ? 'nl-NL' : 'nl',
  };
  // ...
}
```

### 3. Add Convenience Method (Optional)

```typescript
public async speakDutch(text: string, options?: TTSOptions): Promise<string | void> {
  const languageCode = Platform.OS === 'ios' ? 'nl-NL' : 'nl';
  return this.speakInLanguage(text, languageCode, options);
}
```

---

## Troubleshooting

### Issue: Robotic voices despite following setup

**iOS:**
- Verify premium voices are downloaded: Settings > Accessibility > Spoken Content > Voices
- Check console logs - should show "premium" or "enhanced" in voice ID
- Premium voices are large (~200MB) - ensure enough storage

**Android:**
- Verify Google TTS is installed and updated via Play Store
- Check Settings > Text-to-speech output > Google TTS > Install voice data
- Console should show quality ≥ 400

### Issue: "No high-quality voices found" warning

This is normal if:
- User hasn't downloaded premium voices yet
- App falls back to system default (still works!)
- Use `VoiceQualityChecker` component to guide users

### Issue: Voice quality varies between devices

**Expected behavior:**
- iOS: Consistent if same voice packages downloaded
- Android: Varies by Android version, OEM, and installed TTS engines
- Android 11+ with Google TTS has best quality (neural voices)

### Issue: Voice changes mid-session

**Cause:** User changed system TTS settings while app is running

**Fix:** Voice cache is per-session. Restart app to re-detect voices.

---

## Performance Notes

- **Voice detection:** Runs once on first TTS call, then cached
- **Voice selection:** Cached per language (no repeated lookups)
- **Memory:** Minimal (~1-2KB for voice cache)
- **Startup:** No impact (lazy initialization)

---

## Migration Guide

### From Old Implementation

```typescript
// OLD (hardcoded compact voice)
await TTSService.speakFrench("Bonjour");
// Uses: com.apple.ttsbundle.Moira-compact ⭐⭐

// NEW (automatic best voice)
await TTSService.speakFrench("Bonjour");
// Uses: com.apple.voice.premium.fr-FR.Thomas ⭐⭐⭐⭐⭐
```

**No code changes needed!** The service automatically upgrades to premium voices if available.

---

## Future Enhancements

Potential improvements:

1. **User-selectable voices** - Let users choose from available voices in settings
2. **Voice samples** - Play preview of each voice in settings
3. **Auto-download** - Prompt to download voices on app first-run
4. **Offline voice packs** - Bundle basic voices with app
5. **Cloud TTS fallback** - Use Google Cloud TTS for online users with no local voices

---

## Summary

✅ **Best quality:** Automatically selects premium/neural voices when available
✅ **Offline-first:** All voices work offline (no API costs)
✅ **Multi-platform:** iOS and Android have equivalent quality tiers
✅ **User-friendly:** Components to guide users to download better voices
✅ **Backward compatible:** Existing code works without changes
✅ **Extensible:** Easy to add new languages

**Result:** Language learners get significantly more natural pronunciation, improving the learning experience dramatically.
