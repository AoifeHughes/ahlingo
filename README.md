# AHLingo Language Learning Platform
<p align="left">
  <a href="https://results.pre-commit.ci/latest/github/AoifeHughes/ahlingo/main">
    <img src="https://results.pre-commit.ci/badge/github/AoifeHughes/ahlingo/main.svg" alt="pre-commit.ci status">
  </a>
  <a href="https://github.com/AoifeHughes/ahlingo/actions/workflows/tests.yml">
    <img src="https://github.com/AoifeHughes/ahlingo/actions/workflows/tests.yml/badge.svg" alt="Tests">
  </a>
</p>

![logo](./assets/logo.png)

AHLingo is a comprehensive language learning platform that combines AI-powered content generation with a modern React Native mobile application. The platform helps users improve their language skills through interactive exercises and personalized learning experiences.

## Project Structure

- **`/content`** - AI-powered content generation system for creating language exercises
- **`/ahlingo_mobile`** - React Native mobile application
- **`/database`** - SQLite database with pre-generated exercises

## Features

- **Translation Exercises**: Practice translating sentences with immediate feedback
- **Conversation Practice**: Engage in language learning through interactive conversations
- **Pair Matching**: Test your vocabulary with pair matching exercises
- **Progress Tracking**: Track your learning progress and review past mistakes
- **AI Content Generation**: Generate new exercises using local language models
- **Offline Support**: All exercises work without internet connection

## Content Generation System

AHLingo includes a sophisticated AI-powered content generation system that creates language learning exercises using local language models. The system generates three types of exercises:

- **Conversation Exercises**: Interactive dialogues with culturally appropriate speaker names
- **Word Pair Exercises**: Vocabulary matching between English and target languages  
- **Translation Exercises**: Sentence translation practice with varied structures

### Setting up the Database

You can setup the database by running the following command:

```bash
python content/create_exercise_database.py
```

**Requirements:**
- An OpenAI-compatible server running locally (default: `http://localhost:11434/v1`)
- Ollama or similar local LLM server with a model named "llama"

### Content Generation Configuration

The generation system is configured through files in the `content/generation_data/` directory:
- `languages.txt` - Target languages to generate content for
- `levels.txt` - Difficulty levels (Beginner, Intermediate, Advanced)
- `topics.txt` - Learning topics and themes

For detailed information about the content generation architecture, see [Content Generation Documentation](content/content_creation/CONTENT_GENERATION.md).

## Mobile App Development

The React Native application is located in `/ahlingo_mobile`. See the [Mobile App README](ahlingo_mobile/README.md) for setup instructions.

## Content Generation Development

To work on the content generation system:

1. Clone the repository:
```bash
git clone https://github.com/ahughes/ahlingo.git
cd ahlingo
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run content generation:
```bash
cd content
python create_exercise_database.py
```

## Contributing

If you are interested in contributing to this project, please contribute via
forking the repository and making a PR.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Feedback & Issues

If you have any feedback or issues, please feel free to open an issue within this repository.
