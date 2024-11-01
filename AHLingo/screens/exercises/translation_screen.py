# -*- coding: utf-8 -*-
from .base_exercise import BaseExerciseScreen
from AHLingo.components.layouts import ScrollableContent
from AHLingo.components.buttons import StandardButton
from AHLingo.components.labels import AutoHeightLabel
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.label import MDLabel
from kivymd.uix.list import OneLineListItem
from AHLingo.components.buttons import OptionButton
from kivymd.uix.textfield import MDTextField
from kivy.metrics import dp
from kivy.properties import BooleanProperty
from kivy.uix.floatlayout import FloatLayout
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
        super().__init__(halign=halign, size_hint_y=None, **kwargs)


class WordButton(OptionButton):
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

    def reset(self):
        """Reset the button state."""
        self.in_use = False
        self.md_bg_color = self.original_color
        self.disabled = False


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

        # Score layout with flexible height
        score_layout = MDBoxLayout(
            orientation="horizontal",
            size_hint_y=None,
            height=dp(40),
            padding=[dp(16), 0, dp(16), 0],
        )

        self.score_label = ScoreLabel(
            text="Correct: 0/0",
            halign="left",
            size_hint_x=0.5,
            height=dp(40),
        )
        score_layout.add_widget(self.score_label)

        self.incorrect_label = ScoreLabel(
            text="Incorrect: 0",
            halign="right",
            size_hint_x=0.5,
            height=dp(40),
        )
        score_layout.add_widget(self.incorrect_label)

        layout.add_widget(score_layout)

        # Translation layout with adaptive height
        self.translation_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(8),  # Reduced spacing between elements
            padding=[dp(16), dp(4), dp(16), dp(4)],  # Reduced vertical padding
            size_hint_y=None,
        )
        self.translation_layout.bind(
            minimum_height=self.translation_layout.setter("height")
        )

        # Original phrase to translate
        self.phrase_label = AutoHeightLabel(
            text="",
            halign="center",
            size_hint_y=None,
            height=dp(40),  # Set fixed initial height
            font_style="H5",
        )
        self.translation_layout.add_widget(self.phrase_label)

        # Answer text field
        self.answer_field = MDTextField(
            hint_text="Your translation will appear here",
            readonly=True,
            size_hint_y=None,
            height=dp(48),  # Standard height for text field
            multiline=True,
        )
        self.translation_layout.add_widget(self.answer_field)

        # Word buttons container
        self.words_layout = FlowLayout(
            size_hint_y=None,
        )
        self.words_layout.bind(height=self.update_translation_layout_height)
        self.translation_layout.add_widget(self.words_layout)

        # Submit button
        self.submit_button = StandardButton(
            text="Submit",
            on_release=self.check_answer,
            disabled=True,
            size_hint=(None, None),
            width=dp(200),
            height=dp(48),
            pos_hint={"center_x": 0.5},
        )
        self.translation_layout.add_widget(self.submit_button)

        # Create scrollable container
        self.game_container = ScrollableContent(
            self.translation_layout,
            do_scroll_x=False,
            do_scroll_y=True,
            size_hint=(1, 1),
            scroll_type=["bars", "content"],
        )
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
                       WHERE top.topic = ? AND l.language = ? AND d.difficulty_level = ?
                       ORDER BY RANDOM()
                       LIMIT 5""",
                    (topic, settings["language"], settings["difficulty"]),
                )
                exercises = db.cursor.fetchall()

                if exercises:
                    self.exercises = []
                    for exercise in exercises:
                        self.exercises.append(
                            {
                                "id": exercise[0],
                                "lang1": exercise[1],
                                "lang2": exercise[2],
                            }
                        )

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
                   JOIN topics top ON e.topic_id = t.id
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
                    """SELECT e.id, t.language_1_content, t.language_2_content
                       FROM exercises_info e
                       JOIN translation_exercises t ON e.id = t.exercise_id
                       JOIN topics top ON e.topic_id = t.id
                       JOIN languages l ON e.language_id = l.id
                       JOIN difficulties d ON e.difficulty_id = d.id
                       WHERE top.topic = ? AND l.language = ? AND d.difficulty_level = ?
                       AND e.id != ?
                       ORDER BY RANDOM()
                       LIMIT 4""",
                    (exercise[2], exercise[3], exercise[4], exercise_id),
                )
                additional_exercises = db.cursor.fetchall()

                # Start with the specific exercise
                self.exercises = [
                    {
                        "id": exercise_id,
                        "lang1": exercise[0],
                        "lang2": exercise[1],
                    }
                ]

                # Add the additional random exercises
                for ex in additional_exercises:
                    self.exercises.append(
                        {
                            "id": ex[0],
                            "lang1": ex[1],
                            "lang2": ex[2],
                        }
                    )

                # Shuffle the exercises
                random.shuffle(self.exercises)

                # Reset exercise state
                self.total_exercises = len(self.exercises)
                self.correct_answers = 0
                self.incorrect_attempts = 0
                self.current_exercise_index = 0
                self.attempt_recorded = False

                # Switch to exercise view and display first exercise
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

            # Create word buttons
            words = current["lang2"].split()
            random.shuffle(words)

            for i, word in enumerate(words):
                btn = WordButton(
                    text=word, index=i, on_release=self.word_button_pressed
                )
                self.word_buttons.append(btn)
                self.words_layout.add_widget(btn)

            # Schedule the layout updates for the next frame to ensure proper widget sizing
            from kivy.clock import Clock

            def update_layouts(dt):
                self.words_layout.reposition_children()
                self.update_flow_layout_height()
                self.update_translation_layout_height()
                self.update_score()

            Clock.schedule_once(update_layouts)

    def update_translation_layout_height(self, *args):
        """Update the translation layout height when content changes."""
        # Calculate total height needed
        total_height = sum(
            [
                self.phrase_label.height,
                self.answer_field.height,
                self.words_layout.height,
                self.submit_button.height,
            ]
        ) + (
            self.translation_layout.spacing * 3
        )  # Spacing between 4 elements

        # Add padding
        total_height += (
            self.translation_layout.padding[1] + self.translation_layout.padding[3]
        )

        # Update layout height
        self.translation_layout.height = total_height

    def update_flow_layout_height(self, *args):
        """Update FlowLayout height based on content."""
        if hasattr(self, "words_layout"):
            total_height = 0
            current_row_width = 0
            row_height = dp(50)  # Reduced row height
            layout_width = self.words_layout.width - self.words_layout.padding * 2

            for child in self.words_layout.children:
                if current_row_width + child.width + dp(10) > layout_width:
                    total_height += row_height
                    current_row_width = child.width + dp(10)
                else:
                    current_row_width += child.width + dp(10)

            # Add height for the last row
            total_height += row_height

            # Set height with minimal padding
            self.words_layout.height = total_height + dp(10)

            # Update the parent layout
            self.update_translation_layout_height()

    def word_button_pressed(self, button):
        """Handle word button press."""
        if not button.in_use:
            button.in_use = True
            self.answer_words.append(button.text)
            self.update_answer_field()
            # Enable submit button if all words are used
            if all(btn.in_use for btn in self.word_buttons):
                self.submit_button.disabled = False
            # change button color to indicate selection
            button.md_bg_color = [0.5, 0.5, 0.5, 1]
        elif button.in_use:
            button.in_use = False
            self.answer_words.remove(button.text)
            self.update_answer_field()
            self.submit_button.disabled = True
            # change button color back to original
            button.set_state("default")

    def update_answer_field(self):
        """Update the answer field with current words."""
        self.answer_field.text = " ".join(self.answer_words)

    def check_answer(self, *args):
        """Check if the answer is correct."""
        current = self.exercises[self.current_exercise_index]
        user_answer = " ".join(self.answer_words)

        if user_answer == current["lang2"]:
            self.correct_answers += 1
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
                btn.in_use = False
            self.submit_button.disabled = True

        self.update_score()
        self.record_attempt()

    def update_score(self):
        """Update the score display."""
        self.score_label.text = (
            f"Correct: {self.correct_answers}/{self.total_exercises}"
        )
        self.incorrect_label.text = f"Incorrect: {self.incorrect_attempts}"

    def record_attempt(self):
        """Record the exercise attempt in the database."""
        settings = self.get_user_settings()
        if settings and self.current_exercise_id:
            with self.db() as db:
                db.record_exercise_attempt(
                    settings["username"],
                    self.current_exercise_id,
                    self.incorrect_attempts == 0,
                )
            self.attempt_recorded = True
