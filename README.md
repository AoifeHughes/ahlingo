# AHLingo Translation Evaluator
<p align="left">
  <a href="https://results.pre-commit.ci/latest/github/AoifeHughes/ahlingo/main">
    <img src="https://results.pre-commit.ci/badge/github/AoifeHughes/ahlingo/main.svg" alt="pre-commit.ci status">
  </a>
  <a href="https://github.com/AoifeHughes/ahlingo/actions/workflows/tests.yml">
    <img src="https://github.com/AoifeHughes/ahlingo/actions/workflows/tests.yml/badge.svg" alt="Tests">
  </a>
</p>

![logo](./assets/logo.png)

AHLingo Translation Evaluator is a comprehensive tool designed to assist language learners in improving their translation skills. By evaluating translations against source texts, users gain insight into their proficiency and areas of improvement.

## Features

- **Translation Exercises**: Practice translating sentences with immediate feedback
- **Conversation Practice**: Engage in language learning through interactive conversations
- **Pair Matching**: Test your vocabulary with pair matching exercises
- **Progress Tracking**: Track your learning progress and review past mistakes
- **Local Database**: All progress and exercises are stored locally

## Installation

You can install AHLingo directly:

```bash
git clone https://github.com/ahughes/ahlingo.git
cd ahlingo
pip install -e .
```

## Usage

After installation, you can run AHLingo from the command line:

```bash
ahlingo
```

This will launch the main application interface where you can:
1. Select different exercise types (Translation, Conversations, Pairs)
2. Track your progress
3. Review past mistakes
4. Customize your learning experience

## Setting up the Database
You can setup the database by running the following command:

```bash
python create_exercise_db.py
```

For this to work you currently need an openai compatable server running on your
local machine.

See `generation_data` folder for more information on how to set this up.

## Development Setup

For development:

1. Clone the repository:
```bash
git clone https://github.com/ahughes/ahlingo.git
cd ahlingo
```

2. Install in development mode:
```bash
pip install -e .
```

3. Run tests:
```bash
pytest
```

## Contributing

If you are interested in contributing to this project, please contribute via
forking the repository and making a PR.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Feedback & Issues

If you have any feedback or issues, please feel free to open an issue within this repository.
