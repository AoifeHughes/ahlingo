# -*- coding: utf-8 -*-
from .base_exercise import BaseExerciseScreen
from AHLingo.components.layouts import ContentLayout, ScrollableContent
from AHLingo.components.buttons import OptionButton
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.label import MDLabel
from kivymd.uix.list import OneLineListItem
from kivy.metrics import dp
import random


class ScoreLabel(MDLabel):
    """Custom label for displaying scores."""

    def __init__(self, halign="left", **kwargs):
        super().__init__(halign=halign, size_hint_y=None, height=dp(50), **kwargs)


class WordButton(OptionButton):
    """Button for word matching with game logic."""

    def __init__(self, word="", pair_id=None, **kwargs):
        super().__init__(**kwargs)
        self.word = word
        self.text = word
        self.pair_id = pair_id
        self.original_color = self.md_bg_color

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
        settings = self.get_user_settings()
        if settings:
            with self.db() as db:
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
                    (topic, settings["language"], settings["difficulty"], self.MAX_PAIRS),
                )
                exercises = db.cursor.fetchall()
                
                if exercises:
                    self.all_pairs = []
                    for exercise in exercises:
                        self.all_pairs.append({
                            "id": exercise[0],
                            "lang1": exercise[1],
                            "lang2": exercise[2],
                        })

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
                (exercise_id,)
            )
            exercise = db.cursor.fetchone()
            
            if exercise:
                self.current_topic = exercise[2]
                self.all_pairs = [{
                    "id": exercise_id,
                    "lang1": exercise[0],
                    "lang2": exercise[1],
                }]
                self.current_pairs = self.all_pairs
                self.total_pairs = 1
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
            btn = WordButton(word=word, pair_id=pair_id)
            btn.bind(on_release=self.on_button_press)
            self.buttons_1.append(btn)
            self.game_layout.left_column.add_widget(btn)

        for word, pair_id in words_2:
            btn = WordButton(word=word, pair_id=pair_id)
            btn.bind(on_release=self.on_button_press)
            self.buttons_2.append(btn)
            self.game_layout.right_column.add_widget(btn)

        self.update_score()

    def on_button_press(self, button):
        """Handle button press in the game."""
        # If the same button is pressed again, deselect it
        if self.selected_button == button:
            button.set_state("default")
            self.selected_button = None
            return

        # If this is the first button selected
        if not self.selected_button:
            self.selected_button = button
            button.set_state("default")
            button.md_bg_color = (0.4, 0.4, 0.4, 1)  # Grey for selected
            return

        # This is the second button - check if it's a match
        is_match = False
        current_exercise_id = None
        
        # Find the current exercise ID based on the selected buttons
        for pair in self.current_pairs:
            if (
                (self.selected_button.word == pair["lang1"] and button.word == pair["lang2"]) or
                (self.selected_button.word == pair["lang2"] and button.word == pair["lang1"])
            ):
                current_exercise_id = pair["id"]
                if self.selected_button.pair_id == current_exercise_id and button.pair_id == current_exercise_id:
                    is_match = True
                break

        settings = self.get_user_settings()
        if settings and current_exercise_id:
            with self.db() as db:
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
                        True  # Successful attempt
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
                        False  # Failed attempt
                    )

        self.update_score()
        self.selected_button = None

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
