# -*- coding: utf-8 -*-
from .base_exercise import BaseExerciseScreen
from AHLingo.components.layouts import ContentLayout, ScrollableContent
from AHLingo.components.buttons import OptionButton
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.label import MDLabel
from kivymd.uix.list import OneLineListItem
from kivy.metrics import dp
from kivy.core.audio import SoundLoader
import random
import json
import os
from pathlib import Path


class AudioManager:
    """Manages audio playback for pronunciation files from database or files."""
    
    def __init__(self):
        self.current_sound = None
        self.audio_metadata = None
        self.audio_base_path = None
        self.db = None
        self.temp_file = None
        
        # Try to connect to the database
        self._connect_to_database()
        
        # For backward compatibility, also try to load metadata from file
        self._load_audio_metadata()
    
    def _connect_to_database(self):
        """Connect to the language database."""
        try:
            from AHLingo.database.database_manager import LanguageDB
            
            # Try different possible database paths
            possible_db_paths = [
                "./database/languageLearningDatabase.db",
                "../database/languageLearningDatabase.db",
                os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                            "../../../database/languageLearningDatabase.db"),
                "./languageLearningDatabase.db",
                "../languageLearningDatabase.db",
                os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                            "../../../languageLearningDatabase.db")
            ]
            
            for db_path in possible_db_paths:
                if os.path.exists(db_path):
                    self.db = LanguageDB(db_path)
                    print(f"Connected to database at {db_path}")
                    return
            
            print("Warning: Could not find language database")
        except Exception as e:
            print(f"Error connecting to database: {e}")
    
    def _load_audio_metadata(self):
        """Load audio metadata from the audio database (for backward compatibility)."""
        # Try to find the audio_metadata.json file
        possible_paths = [
            Path("./audio_database/audio_metadata.json"),
            Path("../audio_database/audio_metadata.json"),
            Path(os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                             "../../../audio_database/audio_metadata.json"))
        ]
        
        for path in possible_paths:
            if path.exists():
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        self.audio_metadata = json.load(f)
                    self.audio_base_path = path.parent
                    print(f"Loaded audio metadata from {path}")
                    return
                except Exception as e:
                    print(f"Error loading audio metadata from {path}: {e}")
        
        if not self.db:
            print("Warning: Could not find audio metadata file or connect to database")
    
    def find_audio_for_text(self, text, language=None):
        """Find the audio file path for the given text (for backward compatibility)."""
        if not self.audio_metadata:
            return None
            
        # Search in pairs section of metadata
        for pair_id, pair_data in self.audio_metadata.get("pairs", {}).items():
            # Check English text
            if pair_data["english"]["text"] == text:
                return os.path.join(self.audio_base_path, pair_data["english"]["file"])
            
            # Check target language text
            if pair_data["target_language"]["text"] == text:
                return os.path.join(self.audio_base_path, pair_data["target_language"]["file"])
        
        return None
    
    def _create_temp_file(self, audio_data):
        """Create a temporary file with the audio data."""
        import tempfile
        
        # Clean up previous temp file if it exists
        if self.temp_file and os.path.exists(self.temp_file):
            try:
                os.unlink(self.temp_file)
            except:
                pass
        
        # Create a new temporary file
        fd, temp_path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        
        # Write audio data to the file
        with open(temp_path, "wb") as f:
            f.write(audio_data)
        
        self.temp_file = temp_path
        return temp_path
    
    def play_audio(self, text, language=None):
        """Play audio for the given text, stopping any currently playing audio."""
        # Stop current audio if playing
        self.stop_audio()
        
        # First try to get audio from database
        if self.db:
            try:
                audio_data = self.db.get_pronunciation_audio(text, language)
                if audio_data:
                    # Create a temporary file with the audio data
                    temp_path = self._create_temp_file(audio_data)
                    
                    # Load and play the audio
                    sound = SoundLoader.load(temp_path)
                    if sound:
                        self.current_sound = sound
                        sound.play()
                        return True
            except Exception as e:
                print(f"Error playing audio from database: {e}")
        
        # If database approach failed, try file-based approach (backward compatibility)
        audio_path = self.find_audio_for_text(text, language)
        if not audio_path:
            print(f"No audio found for text: {text}")
            return False
        
        # Load and play the audio
        try:
            sound = SoundLoader.load(audio_path)
            if sound:
                self.current_sound = sound
                sound.play()
                return True
            else:
                print(f"Could not load sound: {audio_path}")
                return False
        except Exception as e:
            print(f"Error playing audio: {e}")
            return False
    
    def stop_audio(self):
        """Stop any currently playing audio."""
        if self.current_sound:
            self.current_sound.stop()
            self.current_sound = None
    
    def __del__(self):
        """Clean up temporary files when the object is destroyed."""
        if self.temp_file and os.path.exists(self.temp_file):
            try:
                os.unlink(self.temp_file)
            except:
                pass
        
        # Close database connection
        if self.db:
            try:
                self.db.close()
            except:
                pass


class ScoreLabel(MDLabel):
    """Custom label for displaying scores."""

    def __init__(self, halign="left", **kwargs):
        super().__init__(halign=halign, size_hint_y=None, height=dp(50), **kwargs)


class WordButton(OptionButton):
    """Button for word matching with game logic."""

    def __init__(self, lang_num, word="", pair_id=None, **kwargs):
        super().__init__(**kwargs)
        self.word = word

        size_limit = 20
        words = word.split()
        lines = []
        current_line = ""
        for word in words:
            if len(current_line) + len(word) + 1 > size_limit:
                lines.append(current_line)
                current_line = word
            else:
                if current_line:
                    current_line += " " + word
                else:
                    current_line = word
        if current_line:
            lines.append(current_line)
        self.text = "\n".join(lines)

        self.pair_id = pair_id
        self.original_color = self.md_bg_color
        self.lang_num = lang_num
        
    def play_audio(self, audio_manager):
        """Play pronunciation audio for this word."""
        return audio_manager.play_audio(self.word)

    def reset(self):
        """Reset button to original state."""
        self.md_bg_color = self.original_color
        self.disabled = False


class PairsGameLayout(ContentLayout):
    """Layout for the pairs matching game."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.orientation = "horizontal"
        self.padding = dp(16)
        self.spacing = dp(16)
        self.size_hint_y = None
        self.bind(minimum_height=self.setter("height"))

        # Create columns for words
        self.left_column = self.create_column()
        self.right_column = self.create_column()

        self.add_widget(self.left_column)
        self.add_widget(self.right_column)

    def create_column(self):
        """Create a column for word buttons."""
        column = MDBoxLayout(
            orientation="vertical", spacing=dp(8), size_hint_x=0.5, size_hint_y=None
        )
        column.bind(minimum_height=column.setter("height"))
        return column


class PairsExerciseScreen(BaseExerciseScreen):
    """Screen for the pairs matching exercise."""

    MAX_PAIRS = 5  # Maximum number of pairs to show at once

    def __init__(self, db, **kwargs):
        super().__init__(db, **kwargs)
        self.name = "pairs"
        self.selected_button = None
        self.all_pairs = []  # Store all pairs
        self.current_pairs = []  # Store current batch of pairs
        self.buttons_1 = []
        self.buttons_2 = []
        self.correct_pairs = 0
        self.incorrect_attempts = 0
        self.total_pairs = 0
        self.current_exercise_id = None
        self.completed_pairs = set()
        self.current_batch_index = 0
        self.lang1_is_selected = False
        self.lang2_is_selected = False
        
        # Initialize audio manager
        self.audio_manager = AudioManager()

    def create_exercise_view(self):
        """Create the exercise view with game components."""
        layout = super().create_exercise_view()

        # Update toolbar title
        layout.children[-1].title = "Match the Pairs"

        # Add reset button
        self.reset_button.text = "Reset Exercise"

        # Score layout
        score_layout = MDBoxLayout(
            orientation="horizontal",
            size_hint_y=None,
            height=dp(50),
            padding=[dp(16), 0, dp(16), 0],
        )

        self.score_label = ScoreLabel(
            text="Matched: 0/0", halign="left", size_hint_x=0.5
        )
        score_layout.add_widget(self.score_label)

        self.incorrect_label = ScoreLabel(
            text="Incorrect: 0", halign="right", size_hint_x=0.5
        )
        score_layout.add_widget(self.incorrect_label)

        layout.add_widget(score_layout)

        # Game layout
        self.game_layout = PairsGameLayout()
        self.game_container = ScrollableContent(self.game_layout)
        layout.add_widget(self.game_container)

        return layout

    def display_topics(self, topics):
        """Display available topics."""
        self.topics_list.clear()
        for topic in topics:
            self.topics_list.add_item(
                OneLineListItem(
                    text=topic, on_release=lambda x, t=topic: self.select_topic(t)
                )
            )

    def select_topic(self, topic):
        """Handle topic selection and load pairs."""
        with self.db() as db:
            settings = db.get_user_settings()
            # Get exercise ID and pairs
            db.cursor.execute(
                """SELECT e.id, p.language_1_content, p.language_2_content
                    FROM exercises_info e
                    JOIN pair_exercises p ON e.id = p.exercise_id
                    JOIN topics t ON e.topic_id = t.id
                    JOIN languages l ON e.language_id = l.id
                    JOIN difficulties d ON e.difficulty_id = d.id
                    WHERE t.topic = ? AND l.language = ? AND
                    d.difficulty_level = ?
                    LIMIT ?""",
                (
                    topic,
                    settings["language"],
                    settings["difficulty"],
                    self.MAX_PAIRS,
                ),
            )
            exercises = db.cursor.fetchall()

            if exercises:
                self.all_pairs = []
                for exercise in exercises:
                    self.all_pairs.append(
                        {
                            "id": exercise[0],
                            "lang1": exercise[1],
                            "lang2": exercise[2],
                        }
                    )

                random.shuffle(self.all_pairs)
                self.current_batch_index = 0
                self.load_next_batch()
                self.current_topic = topic
                self.switch_to_exercise()

    def load_next_batch(self):
        """Load the next batch of pairs."""
        start_idx = self.current_batch_index
        end_idx = min(start_idx + self.MAX_PAIRS, len(self.all_pairs))

        self.current_pairs = self.all_pairs[start_idx:end_idx]
        self.total_pairs = len(self.current_pairs)
        self.correct_pairs = 0
        self.incorrect_attempts = 0
        self.completed_pairs = set()

        if self.current_pairs:
            self.display_pairs()

    def load_specific_exercise(self, exercise_id):
        """Load a specific exercise by ID."""
        with self.db() as db:
            # Get exercise details
            db.cursor.execute(
                """SELECT p.language_1_content, p.language_2_content,
                          t.topic, l.language, d.difficulty_level
                   FROM exercises_info e
                   JOIN pair_exercises p ON e.id = p.exercise_id
                   JOIN topics t ON e.topic_id = t.id
                   JOIN languages l ON e.language_id = l.id
                   JOIN difficulties d ON e.difficulty_id = d.id
                   WHERE e.id = ?""",
                (exercise_id,),
            )
            exercise = db.cursor.fetchone()

            if exercise:
                self.current_topic = exercise[2]
                # Get 4 additional random exercises with the same topic, language, and difficulty
                db.cursor.execute(
                    """SELECT e.id, p.language_1_content, p.language_2_content
                       FROM exercises_info e
                       JOIN pair_exercises p ON e.id = p.exercise_id
                       JOIN topics t ON e.topic_id = t.id
                       JOIN languages l ON e.language_id = l.id
                       JOIN difficulties d ON e.difficulty_id = d.id
                       WHERE t.topic = ? AND l.language = ? AND d.difficulty_level = ?
                       AND e.id != ?
                       ORDER BY RANDOM()
                       LIMIT 4""",
                    (exercise[2], exercise[3], exercise[4], exercise_id),
                )
                additional_exercises = db.cursor.fetchall()

                # Start with the specific exercise
                self.all_pairs = [
                    {
                        "id": exercise_id,
                        "lang1": exercise[0],
                        "lang2": exercise[1],
                    }
                ]

                # Add the additional random exercises
                for ex in additional_exercises:
                    self.all_pairs.append(
                        {
                            "id": ex[0],
                            "lang1": ex[1],
                            "lang2": ex[2],
                        }
                    )

                # Shuffle the pairs
                random.shuffle(self.all_pairs)

                self.current_pairs = self.all_pairs
                self.total_pairs = len(self.all_pairs)
                self.correct_pairs = 0
                self.incorrect_attempts = 0
                self.completed_pairs = set()
                self.current_batch_index = 0
                self.switch_to_exercise()
                self.display_pairs()

    def display_pairs(self):
        """Display word pairs in the game layout."""
        # Clear existing buttons
        self.game_layout.left_column.clear_widgets()
        self.game_layout.right_column.clear_widgets()
        self.buttons_1 = []
        self.buttons_2 = []
        self.selected_button = None

        # Create lists of words
        words_1 = [(pair["lang1"], pair["id"]) for pair in self.current_pairs]
        words_2 = [(pair["lang2"], pair["id"]) for pair in self.current_pairs]

        # Shuffle both lists
        random.shuffle(words_1)
        random.shuffle(words_2)

        # Create buttons for both languages
        for word, pair_id in words_1:
            btn = WordButton(1, word=word, pair_id=pair_id)
            btn.bind(on_release=self.on_button_press)
            self.buttons_1.append(btn)
            self.game_layout.left_column.add_widget(btn)

        for word, pair_id in words_2:
            btn = WordButton(2, word=word, pair_id=pair_id)
            btn.bind(on_release=self.on_button_press)
            self.buttons_2.append(btn)
            self.game_layout.right_column.add_widget(btn)

        self.update_score()

    def on_button_press(self, button):
        """Handle button press in the game."""
        # Play audio for the button's word
        button.play_audio(self.audio_manager)
        
        # If the same button is pressed again, deselect it
        if self.selected_button == button:
            button.set_state("default")
            self.selected_button = None
            if button.lang_num == 1:
                self.lang1_is_selected = False
                return
            self.lang2_is_selected = False
            return

        if (button.lang_num == 1 and self.lang1_is_selected) or (
            button.lang_num == 2 and self.lang2_is_selected
        ):
            return

        # If this is the first button selected
        if not self.selected_button:
            self.selected_button = button
            button.set_state("default")
            button.md_bg_color = (0.4, 0.4, 0.4, 1)  # Grey for selected
            if button.lang_num == 1:
                self.lang1_is_selected = True
            else:
                self.lang2_is_selected = True
            return

        # This is the second button - check if it's a match
        is_match = False
        current_exercise_id = button.pair_id

        if self.selected_button.pair_id == current_exercise_id:
            is_match = True

        if current_exercise_id:
            with self.db() as db:
                settings = db.get_user_settings()
                if is_match:
                    # Correct match
                    self.selected_button.set_state("correct")
                    button.set_state("correct")
                    self.selected_button.disabled = True
                    button.disabled = True
                    self.correct_pairs += 1
                    self.completed_pairs.add(current_exercise_id)

                    # Record successful attempt
                    db.record_exercise_attempt(
                        settings["username"],
                        current_exercise_id,
                        True,  # Successful attempt
                    )

                    # Check if batch is complete
                    if self.correct_pairs == self.total_pairs:
                        self.current_batch_index += self.MAX_PAIRS
                        if self.current_batch_index < len(self.all_pairs):
                            self.load_next_batch()
                else:
                    # Wrong match
                    self.selected_button.set_state("default")
                    button.set_state("default")
                    self.incorrect_attempts += 1

                    # Record failed attempt
                    db.record_exercise_attempt(
                        settings["username"],
                        current_exercise_id,
                        False,  # Failed attempt
                    )

        self.update_score()
        self.selected_button.set_state("default")
        self.selected_button = None
        self.lang1_is_selected = False
        self.lang2_is_selected = False
        button.set_state("default")

    def update_score(self):
        """Update the score display."""
        total_completed = self.current_batch_index + self.correct_pairs
        total_pairs = len(self.all_pairs)
        self.score_label.text = f"Matched: {total_completed}/{total_pairs}"
        self.incorrect_label.text = f"Incorrect: {self.incorrect_attempts}"

    def reset_exercise(self, *args):
        """Reset the current exercise."""
        super().reset_exercise(*args)
        if self.current_topic:
            self.select_topic(self.current_topic)
