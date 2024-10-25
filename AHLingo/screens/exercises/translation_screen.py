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


class TranslationButton(OptionButton):
    """Button for translation options."""

    def __init__(self, text="", is_correct=False, **kwargs):
        super().__init__(**kwargs)
        self.text = text
        self.is_correct = is_correct
        self.original_color = self.md_bg_color


class TranslationExerciseScreen(BaseExerciseScreen):
    """Screen for the translation exercise."""

    def __init__(self, db, **kwargs):
        super().__init__(db, **kwargs)
        self.name = "translation"
        self.current_exercise_index = 0
        self.exercises = []
        self.correct_answers = 0
        self.incorrect_attempts = 0
        self.total_exercises = 0
        self.current_exercise_id = None
        self.attempt_recorded = False

    def create_exercise_view(self):
        """Create the exercise view with translation components."""
        layout = super().create_exercise_view()

        # Update toolbar title
        layout.children[-1].title = "Translation Exercise"

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
            text="Correct: 0/0", halign="left", size_hint_x=0.5
        )
        score_layout.add_widget(self.score_label)

        self.incorrect_label = ScoreLabel(
            text="Incorrect: 0", halign="right", size_hint_x=0.5
        )
        score_layout.add_widget(self.incorrect_label)

        layout.add_widget(score_layout)

        # Translation layout
        self.translation_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(20),
            padding=dp(16),
            size_hint_y=None,
            height=dp(400),
        )

        # Phrase to translate
        self.phrase_label = MDLabel(
            text="",
            halign="center",
            size_hint_y=None,
            height=dp(100),
            font_style="H5",
        )
        self.translation_layout.add_widget(self.phrase_label)

        # Options container
        self.options_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(10),
            size_hint_y=None,
            height=dp(200),
        )
        self.translation_layout.add_widget(self.options_layout)

        self.game_container = ScrollableContent(self.translation_layout)
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
        """Handle topic selection and load translation exercises."""
        settings = self.get_user_settings()
        if settings:
            with self.db() as db:
                # Get exercises
                db.cursor.execute(
                    """SELECT e.id, t.language_1_content, t.language_2_content
                       FROM exercises_info e
                       JOIN translation_exercises t ON e.id = t.exercise_id
                       JOIN topics top ON e.topic_id = top.id
                       JOIN languages l ON e.language_id = l.id
                       JOIN difficulties d ON e.difficulty_id = d.id
                       WHERE top.topic = ? AND l.language = ? AND d.difficulty_level = ?""",
                    (topic, settings["language"], settings["difficulty"]),
                )
                exercises = db.cursor.fetchall()
                
                if exercises:
                    self.exercises = []
                    for exercise in exercises:
                        self.exercises.append({
                            "id": exercise[0],
                            "lang1": exercise[1],
                            "lang2": exercise[2],
                        })

                    random.shuffle(self.exercises)
                    self.total_exercises = len(self.exercises)
                    self.correct_answers = 0
                    self.incorrect_attempts = 0
                    self.current_exercise_index = 0
                    self.attempt_recorded = False
                    self.current_topic = topic
                    self.switch_to_exercise()
                    self.display_current_exercise()

    def load_specific_exercise(self, exercise_id):
        """Load a specific exercise by ID."""
        with self.db() as db:
            # Get exercise details
            db.cursor.execute(
                """SELECT t.language_1_content, t.language_2_content,
                          top.topic, l.language, d.difficulty_level
                   FROM exercises_info e
                   JOIN translation_exercises t ON e.id = t.exercise_id
                   JOIN topics top ON e.topic_id = top.id
                   JOIN languages l ON e.language_id = l.id
                   JOIN difficulties d ON e.difficulty_id = d.id
                   WHERE e.id = ?""",
                (exercise_id,)
            )
            exercise = db.cursor.fetchone()
            
            if exercise:
                self.current_topic = exercise[2]
                # Get additional exercises for wrong answers
                db.cursor.execute(
                    """SELECT t.language_1_content
                       FROM exercises_info e
                       JOIN translation_exercises t ON e.id = t.exercise_id
                       WHERE e.id != ?
                       ORDER BY RANDOM()
                       LIMIT 2""",
                    (exercise_id,)
                )
                wrong_answers = db.cursor.fetchall()
                
                self.exercises = [{
                    "id": exercise_id,
                    "lang1": exercise[0],
                    "lang2": exercise[1],
                }]
                
                self.total_exercises = 1
                self.correct_answers = 0
                self.incorrect_attempts = 0
                self.current_exercise_index = 0
                self.attempt_recorded = False
                self.switch_to_exercise()
                self.display_current_exercise()

    def display_current_exercise(self):
        """Display the current translation exercise."""
        if self.current_exercise_index < len(self.exercises):
            current = self.exercises[self.current_exercise_index]
            self.current_exercise_id = current["id"]
            
            # Display the phrase to translate
            self.phrase_label.text = current["lang2"]
            
            # Clear previous options
            self.options_layout.clear_widgets()
            
            # Create answer options
            correct_answer = current["lang1"]
            wrong_answers = self.get_wrong_answers(correct_answer)
            
            # Combine and shuffle options
            options = [correct_answer] + wrong_answers
            random.shuffle(options)
            
            # Create buttons for options
            for option in options:
                btn = TranslationButton(
                    text=option,
                    is_correct=(option == correct_answer),
                )
                btn.bind(on_release=self.check_answer)
                self.options_layout.add_widget(btn)

            self.update_score()

    def get_wrong_answers(self, correct_answer):
        """Get two wrong answers from other exercises."""
        wrong_answers = []
        available_answers = [ex["lang1"] for ex in self.exercises if ex["lang1"] != correct_answer]
        
        if len(available_answers) >= 2:
            wrong_answers = random.sample(available_answers, 2)
        else:
            # If not enough wrong answers, get some from the database
            with self.db() as db:
                db.cursor.execute(
                    """SELECT DISTINCT language_1_content 
                       FROM translation_exercises 
                       WHERE language_1_content != ?
                       ORDER BY RANDOM()
                       LIMIT 2""",
                    (correct_answer,)
                )
                wrong_answers = [row[0] for row in db.cursor.fetchall()]
        
        return wrong_answers[:2]  # Ensure we only return 2 wrong answers

    def check_answer(self, button):
        """Check if the selected answer is correct."""
        if button.is_correct:
            button.set_state("correct")
            self.correct_answers += 1
            
            # Record the successful attempt
            if not self.attempt_recorded:
                self.record_attempt()
            
            self.current_exercise_index += 1
            
            if self.current_exercise_index < self.total_exercises:
                # Show next exercise after a short delay
                self.display_current_exercise()
        else:
            button.set_state("wrong")
            self.incorrect_attempts += 1
        
        self.update_score()

    def update_score(self):
        """Update the score display."""
        self.score_label.text = f"Correct: {self.correct_answers}/{self.total_exercises}"
        self.incorrect_label.text = f"Incorrect: {self.incorrect_attempts}"

    def record_attempt(self):
        """Record the exercise attempt in the database."""
        settings = self.get_user_settings()
        if settings and self.current_exercise_id:
            with self.db() as db:
                db.record_exercise_attempt(
                    settings["username"],
                    self.current_exercise_id,
                    self.incorrect_attempts == 0
                )
            self.attempt_recorded = True

    def reset_exercise(self, *args):
        """Reset the current exercise."""
        super().reset_exercise(*args)
        if self.current_topic:
            self.select_topic(self.current_topic)
