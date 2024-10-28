# -*- coding: utf-8 -*-
from .base_exercise import BaseExerciseScreen
from AHLingo.components.layouts import ContentLayout, ScrollableContent
from AHLingo.components.buttons import StandardButton
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.label import MDLabel
from kivymd.uix.list import OneLineListItem
from kivymd.uix.button import MDRaisedButton
from kivymd.uix.textfield import MDTextField
from kivy.metrics import dp
from kivy.properties import BooleanProperty
from kivy.uix.floatlayout import FloatLayout
from kivy.core.window import Window
import random


class FlowLayout(FloatLayout):
    """Layout that flows widgets from left to right, wrapping to new rows as needed."""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.bind(size=self.reposition_children)
        self.spacing = dp(10)
        self.row_height = dp(50)
        self.padding = dp(1)

    def reposition_children(self, *args):
        """Reposition children in a flow layout pattern."""
        x = self.padding
        y = self.height - self.row_height
        max_width = self.width - self.padding
        row_width = self.padding
        row_widgets = []

        # First pass: calculate rows
        for child in self.children:
            child_width = child.width + self.spacing
            
            if row_width + child_width > max_width:
                # Position widgets in current row
                self._position_row(row_widgets, y)
                # Start new row
                y -= self.row_height
                row_width = self.padding + child_width
                row_widgets = [child]
            else:
                row_width += child_width
                row_widgets.append(child)

        # Position last row
        if row_widgets:
            self._position_row(row_widgets, y)

        # Update layout height to fit all rows
        needed_height = self.height - y + self.row_height
        if self.height < needed_height:
            self.height = needed_height

    def _position_row(self, widgets, y):
        """Position widgets in a single row."""
        x = self.padding
        for widget in widgets:
            widget.pos = (x, y)
            x += widget.width + self.spacing


class ScoreLabel(MDLabel):
    """Custom label for displaying scores."""
    def __init__(self, halign="left", **kwargs):
        super().__init__(halign=halign, size_hint_y=None, height=dp(50), **kwargs)


class WordButton(MDRaisedButton):
    """Button for individual words in the translation."""
    enabled = BooleanProperty(True)

    def __init__(self, text="", index=0, **kwargs):
        super().__init__(**kwargs)
        self.text = text
        self.index = index
        self.original_color = self.md_bg_color
        self.size_hint = (None, None)
        self.height = dp(40)
        # Adjust width based on text length
        self.width = max(len(text) * dp(15), dp(80))  # Minimum width of 80dp
        self.in_use = False


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
        self.word_buttons = []
        self.answer_words = []

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
            height=dp(500),
        )

        # Original phrase to translate
        self.phrase_label = MDLabel(
            text="",
            halign="center",
            size_hint_y=None,
            height=dp(100),
            font_style="H5",
        )
        self.translation_layout.add_widget(self.phrase_label)

        # Answer text field
        self.answer_field = MDTextField(
            hint_text="Your translation will appear here",
            readonly=True,
            size_hint_y=None,
            height=dp(100),
            multiline=True,
        )
        self.translation_layout.add_widget(self.answer_field)

        # Word buttons container using FlowLayout
        self.words_layout = FlowLayout(
            size_hint_y=None,
            height=dp(150)  # Initial height, will adjust automatically
        )
        self.translation_layout.add_widget(self.words_layout)

        # Submit button
        self.submit_button = StandardButton(
            text="Submit",
            on_release=self.check_answer,
            disabled=True,
            size_hint=(None, None),
            width=dp(200),
            height=dp(50),
            pos_hint={'center_x': 0.5}
        )
        self.translation_layout.add_widget(self.submit_button)

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

    def display_current_exercise(self):
        """Display the current translation exercise."""
        if self.current_exercise_index < len(self.exercises):
            current = self.exercises[self.current_exercise_index]
            self.current_exercise_id = current["id"]
            
            # Display the phrase to translate
            self.phrase_label.text = current["lang1"]
            
            # Clear previous state
            self.words_layout.clear_widgets()
            self.answer_field.text = ""
            self.word_buttons = []
            self.answer_words = []
            self.submit_button.disabled = True
            
            # Split language_2_content into words and create buttons
            words = current["lang2"].split()
            random.shuffle(words)  # Randomize word order
            
            for i, word in enumerate(words):
                btn = WordButton(
                    text=word,
                    index=i,
                    on_release=self.word_button_pressed
                )
                self.word_buttons.append(btn)
                self.words_layout.add_widget(btn)

            # Trigger layout update
            self.words_layout.reposition_children()
            self.update_score()

    def word_button_pressed(self, button):
        """Handle word button press."""
        if not button.in_use:
            button.in_use = True
            self.answer_words.append(button.text)
            self.update_answer_field()
            # Enable submit button if all words are used
            if all(not btn.enabled for btn in self.word_buttons):
                self.submit_button.disabled = False
            # change button color to indicate selection
            button.md_bg_color = [0.5, 0.5, 0.5, 1]
        elif button.in_use:
            button.in_use = False
            self.answer_words.remove(button.text)
            self.update_answer_field()
            self.submit_button.disabled = True

    def update_answer_field(self):
        """Update the answer field with current words."""
        self.answer_field.text = " ".join(self.answer_words)

    def check_answer(self, *args):
        """Check if the answer is correct."""
        current = self.exercises[self.current_exercise_index]
        user_answer = " ".join(self.answer_words)
        
        if user_answer == current["lang2"]:
            self.correct_answers += 1
            if not self.attempt_recorded:
                self.record_attempt()
            self.current_exercise_index += 1
            
            if self.current_exercise_index < self.total_exercises:
                self.display_current_exercise()
        else:
            self.incorrect_attempts += 1
            # Reset the answer field and re-enable all buttons
            self.answer_words = []
            self.answer_field.text = ""
            for btn in self.word_buttons:
                btn.enabled = True
                btn.disabled = False
            self.submit_button.disabled = True
        
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
