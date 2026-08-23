# AHLingo - AGENTS.md

## Project Overview

AHLingo is a language learning platform with two major components:

1. **Content Generation System** (Python) - AI-powered pipeline that generates language learning exercises using local LLMs
2. **Mobile App** (React Native) - Cross-platform Android/iOS app that consumes the generated exercise data

**Languages Supported**: French, Ukrainian, Spanish, German, Italian
**Difficulty Levels**: Beginner, Intermediate, Advanced
**Exercise Types**: Conversations, Word Pairs, Translations, Fill-in-the-Blank

---

## Repository Structure

```
ahlingo/
├── content/                          # Content generation system
│   ├── generate_content.py           # Main entry point for exercise generation
│   ├── generate_images.py            # Main entry point for image generation
│   ├── generation/
│   │   ├── core/
│   │   │   ├── llm_client.py         # OpenAI-compatible client (structured output via tool-calling)
│   │   │   ├── exercise_generator.py # Per-exercise-type generation, built on llm_client
│   │   │   ├── audio_generator.py    # TTS audio generation
│   │   │   ├── image_generator.py    # ComfyUI/FLUX.1 clip-art image generation
│   │   │   ├── descriptors_generator.py # Image prompt/descriptor generation
│   │   │   └── model_downloader.py   # Downloads models/LoRAs for the image pipeline
│   │   ├── models/
│   │   │   ├── models.py             # Pydantic models for exercise types (also the tool schemas)
│   │   │   └── validation_models.py  # Validation result models (also tool schemas)
│   │   ├── utils/
│   │   │   ├── assistants.py         # Default example templates per language
│   │   │   ├── exercise_converters.py # Text conversion & validation prompts
│   │   │   └── database_validator.py # Bulk re-validation of exercises already in the DB
│   │   ├── config/
│   │   │   └── database_generation.json # Generation config (languages, topics, LLM settings)
│   │   └── CONTENT_GENERATION.md     # Detailed generation docs
│   ├── database/
│   │   ├── database_manager.py       # SQLite schema + CRUD operations
│   │   └── database_populator.py     # Database population utilities
│   └── tests/                        # Generation tests
├── ahlingo_mobile/                   # React Native mobile app
│   ├── App.tsx                       # Root component
│   ├── src/
│   │   ├── navigation/
│   │   │   └── AppNavigator.tsx      # React Navigation stack config
│   │   ├── screens/                  # 18 screen components
│   │   ├── components/               # Reusable UI components
│   │   ├── services/                 # Database, TTS, chatbot, stats services
│   │   ├── store/                    # Redux Toolkit store + slices
│   │   ├── contexts/                 # React contexts (ThemeContext)
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── types/                    # TypeScript type definitions
│   │   └── utils/                    # Database utils, constants, helpers
│   ├── assets/databases/             # Bundled SQLite databases
│   ├── android/                      # Android native project
│   ├── ios/                          # iOS native project (Xcode)
│   ├── e2e/                          # Detox E2E tests
│   └── package.json
├── database/                         # Generated SQLite database (Git LFS)
│   └── languageLearningDatabase.db
├── scripts/                          # Build and utility scripts
├── requirements.txt                  # Python dependencies
└── .pre-commit-config.yaml
```

---

## Content Generation System

### Architecture

The generation system talks to a local LLM (via OpenAI-compatible API, typically Ollama) using the standard `openai` SDK. Structured output is obtained via native tool-calling: each exercise type is a Pydantic model, its JSON schema becomes a forced tool call, and the API response is validated straight into that model (with a self-repair retry on a validation error). See `content/generation/core/llm_client.py`.

**Pipeline**: Config → LLM Generation (tool-call forced to a Pydantic schema) → Validation → Similarity Check → SQLite Database

### Key File: `content/generate_content.py`

Main entry point. Run from repo root:
```bash
python content/generate_content.py
```

CLI options:
- `--config` - Path to config JSON (default: `content/generation/config/database_generation.json`)
- `--db-path` - Output database path (default: `database/languageLearningDatabase.db`)
- `--languages French,Spanish` - Filter languages
- `--levels beginner,intermediate` - Filter difficulty levels
- `--topics "Food,Travel"` - Filter topics
- `--exercise-types conversations,fill_in_blank` - Filter exercise types
- `--generation-model model_name` - Override LLM model
- `--validation-model model_name` - Override validation model
- `--debug` - Show prompt/response debug info
- `--no-think` - Prepend `/no_think` to prompts (for non-reasoning models)
- `--dry-run` - Generate without database insertion
- `--max-combinations N` - Limit combinations for testing
- `--add-language Portuguese` - Incremental: add new language
- `--retry-failures failures_2025.json` - Retry failed generations

### Configuration: `content/generation/config/database_generation.json`

Defines:
- LLM server URL (default: `http://localhost:11434/v1`)
- Languages, levels, topics, exercise types
- Per-exercise-type temperatures
- `lessons_per_combination` (default: 10 exercises per language/level/topic/type combo)
- `max_retries` (default: 5)
- `validation_threshold` (default: 6/10 minimum quality score)

### Generator: `content/generation/core/exercise_generator.py`

Each exercise type is generated as a single object via `LLMClient.generate()` (forced tool-calling):
- `generate_conversation()` - 1 dialogue with culturally-appropriate speaker names
- `generate_pairs()` - 5-7 English↔target language word pairs (one exercise, bundled)
- `generate_translation()` - 1 English↔target language sentence pair
- `generate_fill_in_blank()` - 1 sentence with blank, correct answer, 2 distractors

Conversations and translations request exactly the one exercise that gets inserted, rather
than a batch that's mostly discarded (the historical `outlines`-based generator asked for a
batch of e.g. 2-4 conversations and just used the first, wasting most of the generation).

Each generator fetches existing exercises from the database as examples to ensure diversity.

### Validation

After generation, each exercise is validated by a separate LLM call:
1. Exercise converted to text via `exercise_converters.py`
2. Validation prompt sent to LLM
3. Quality score (1-10) parsed from response
4. Exercises below `validation_threshold` are rejected
5. Fill-in-blank exercises have additional checks (unambiguous answers, no blanks in translation)
6. Similarity check against existing exercises (threshold: 0.6)

### Database Schema

The SQLite database (`database/languageLearningDatabase.db`) has these key tables:
- `exercises_info` - Core metadata (name, language_id, topic_id, difficulty_id, exercise_type, lesson_id)
- `languages`, `difficulties`, `topics` - Lookup tables
- `pair_exercises` - Word pairs (exercise_id FK, language_1/2, content_1/2)
- `conversation_exercises` - Dialogue turns (exercise_id FK, order, speaker, message)
- `conversation_summaries` - Summary per exercise
- `translation_exercises` - Sentence translations (exercise_id FK, language_1/2, content_1/2)
- `fill_in_blank_exercises` - Blank exercises (exercise_id FK, sentence, correct_answer, incorrect_1/2, blank_position, translation)
- `pronunciation_audio` - TTS audio blobs
- `users`, `user_exercise_attempts`, `user_settings` - User data
- `chat_details`, `chat_histories` - Chatbot sessions
- `database_metadata` - Version tracking

### Audio Generation

The `TTS` Python library (with XTTS-v2) generates pronunciation audio. Special handling for Ukrainian with native TTS. Audio stored as BLOBs in `pronunciation_audio` table.

### Python Dependencies

```
huggingface_hub  # Model downloads for the image generation pipeline
openai           # LLM API client (structured output via tool-calling)
pydantic         # Data models / tool schemas
tqdm             # Progress bars
TTS              # Text-to-speech
```

Install: `pip install -r requirements.txt`

### Image Generation

`content/generate_images.py` drives a ComfyUI-based pipeline (via `content/generation/core/image_generator.py`) that produces flat vector clip-art illustrations per topic using FLUX.1 Dev (GGUF) plus a style LoRA. `content/generation/core/model_downloader.py` fetches the required models/LoRAs/upscalers into a local ComfyUI install (`--list` to see them, `--dry-run` to preview, `--pipeline` to print the node chain). Requires a running ComfyUI instance with the `ComfyUI-GGUF` custom node.

---

## Mobile App (React Native)

### Tech Stack

- **Framework**: React Native 0.80.0 with TypeScript
- **Navigation**: React Navigation (Native Stack + Bottom Tabs)
- **State**: Redux Toolkit
- **Database**: `react-native-sqlite-storage` (SQLite)
- **Storage**: `@react-native-async-storage/async-storage`
- **TTS**: `react-native-tts`
- **LLM**: `llama.rn` (on-device Llama inference for chatbot)
- **Testing**: Jest + React Native Testing Library + Detox (E2E)
- **Linting**: ESLint + Prettier

### Two-Database Architecture

The app uses **two SQLite databases**:
1. **`content.db`** (read-only) - Exercises, lessons, topics. Attached as `content` schema. Replaced on app update.
2. **`userdata.db`** (read-write) - User progress, settings, chat history. Never replaced.

At startup, `userdata.db` is opened and `content.db` is attached via `ATTACH DATABASE`. All content queries use the `content.` prefix (e.g., `content.exercises_info`).

### Database Initialization Flow

1. `App.tsx` → `initializeDatabase()` from `RefactoredDatabaseService`
2. `ensureDatabaseCopied()` copies databases from app bundle to device storage
3. Content DB version checked against `DATABASE_CONFIG.CONTENT_DB.VERSION` (currently 141)
4. If bundled version > installed version, old DB is replaced
5. User DB initialized from template if first launch
6. `content.db` attached to `userdata.db`
7. Schema migrations run if needed

### Database Bundle Location

Databases are bundled in `ahlingo_mobile/assets/databases/`:
- `content.db` - Exercise content
- `userdata_template.db` - Empty user schema template
- `languageLearningDatabase.db` - Legacy (for migration)

### Key Services (`ahlingo_mobile/src/services/`)

| Service | Purpose |
|---------|---------|
| `RefactoredDatabaseService.ts` | Re-exports all database services, backward compat |
| `DatabaseService.ts` | Basic queries: languages, difficulties, topics |
| `BaseExerciseService.ts` | Exercise fetching, attempt recording |
| `ConversationExerciseService.ts` | Conversation summaries |
| `MixedExerciseService.ts` | Mixed/shuffled exercise queries |
| `StatsService.ts` | User progress, failed exercises |
| `UserService.ts` | User management, settings |
| `TTSService.ts` | Text-to-speech |
| `ChatService.ts` | Chatbot session management |
| `LocalLlamaService.ts` | On-device LLM chat |
| `ModelService.ts` | Local model management |
| `OpenAIService.ts` | Remote LLM API calls |

### Screen Flow

```
WelcomeScreen (first launch, create user)
  └── MainMenuScreen
        ├── TopicSelectionScreen → PairsGameScreen
        ├── TopicSelectionScreen → ConversationExercisesScreen
        ├── TopicSelectionScreen → TranslationExercisesScreen
        ├── TopicSelectionScreen → FillInTheBlankScreen
        ├── StudyTopicScreen → StudyTopicShuffleScreen → ExerciseShuffleStartScreen → [exercise screens] → ExerciseShuffleSummaryScreen
        ├── ChatbotScreen
        ├── StatsScreen
        ├── RetryMistakesScreen
        ├── SettingsScreen
        └── AboutScreen
```

### TypeScript Types (`ahlingo_mobile/src/types/index.ts`)

Key interfaces: `User`, `Language`, `Topic`, `Difficulty`, `ExerciseInfo`, `PairExercise`, `TranslationExercise`, `FillInBlankExercise`, `ConversationExercise`, `ChatDetail`, `ChatHistory`, `AppSettings`, `LocalModel`, `RootStackParamList`

### SQL Queries

All SQL queries are centralized in `ahlingo_mobile/src/utils/constants.ts` as `SQL_QUERIES`. Content queries use `content.` table prefix.

### Build & Run

```bash
cd ahlingo_mobile

# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (macOS only, requires CocoaPods)
npm run ios

# Lint
npm run lint

# Type check
npm run type-check

# Format
npm run format

# Unit tests
npm test

# E2E tests (iOS)
npm run test:e2e:build:ios && npm run test:e2e:test:ios

# Build release APK
npm run build:apk
```

### Android Build (CI)

See `.github/workflows/android-build.yml`. Requires JDK 17, Android SDK. Produces debug APK at `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## Updating Content Database

When you generate new content and want to ship it to the mobile app:

1. Run generation: `python content/generate_content.py`
2. Increment `DATABASE_CONFIG.CONTENT_DB.VERSION` in `ahlingo_mobile/src/utils/constants.ts`
3. Copy the new `database/languageLearningDatabase.db` → split into `content.db` + `userdata_template.db`
4. Place `content.db` and `userdata_template.db` in `ahlingo_mobile/assets/databases/`
5. The app will auto-update on next install (version check in `ensureDatabaseCopied()`)

---

## CI/CD

### Pre-commit Hooks (`.pre-commit-config.yaml`)

- **Black** - Python formatting
- **ESLint** - React Native linting (`npm run lint`)
- **Prettier** - Auto-format TypeScript/JSX
- **TypeScript** - Type checking (`tsc --noEmit`)
- **Pre-commit hooks** - JSON/XML/YAML validation, merge conflict detection, trailing whitespace, large file prevention
- **Database guard** - Prevents committing `.db` files

### GitHub Actions

- **Tests** (`.github/workflows/tests.yml`) - Python pytest on `content/tests`; manual (`workflow_dispatch`) only, since the integration tests require a locally running LLM server
- **Android Build** (`.github/workflows/android-build.yml`) - Debug APK build on push/PR to main
- **Mobile CI** (`.github/workflows/mobile-ci.yml`) - Type check, lint, format check, unit tests + coverage, and a basic security scan for the mobile app on push/PR to main

Note: workflow files only take effect from the repo root's `.github/workflows/` — a workflow file placed anywhere else (e.g. `ahlingo_mobile/.github/workflows/`) is never discovered or run by GitHub Actions.

---

## Key Conventions

- Content queries in the mobile app always use `content.` prefix (e.g., `content.exercises_info`)
- User data queries use no prefix (local `userdata.db`)
- Exercise types are stored as strings: `'pairs'`, `'conversation'`, `'translation'`, `'fill_in_blank'`
- Language in exercises is always `"English"` ↔ target language
- Difficulty levels are capitalized: `"Beginner"`, `"Intermediate"`, `"Advanced"`
- Database version is tracked in `database_metadata` table with key `"version"`
- Generation uses `lesson_id` to group exercises from the same generation session
- Each exercise gets a unique `exercise_name` with timestamp + UUID suffix
