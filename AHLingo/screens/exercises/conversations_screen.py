# -*- coding: utf-8 -*-
from .base_exercise import BaseExerciseScreen
from AHLingo.components.layouts import ContentLayout, ScrollableContent
from AHLingo.components.buttons import OptionButton
from AHLingo.components.messages import MessageBubble
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.label import MDLabel
from kivymd.uix.list import OneLineListItem
from kivy.metrics import dp
from .pairs_screen import AudioManager
import random


class ConversationSummaryButton(OptionButton):
    """Button for conversation summary options."""

    def __init__(self, summary="", **kwargs):
        super().__init__(**kwargs)
        # if text is too long, add newlines to wrap text without breaking words
        size_limit = 30
        words = summary.split()
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
        self.summary = summary

    def set_result(self, is_correct):
        """Update button state based on answer correctness."""
        self.set_state("correct" if is_correct else "incorrect")


class QuestionLayout(ContentLayout):
    """Layout for the summary question and options."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.size_hint_y = None
        self.height = dp(400)  # Increased overall height
        self.spacing = dp(16)  # Add spacing between children
        self.padding = [dp(16), dp(16), dp(16), dp(16)]  # Add padding around all sides

        # Question container to ensure fixed space
        question_container = MDBoxLayout(
            orientation="vertical",
            size_hint_y=None,
            height=dp(80),  # Fixed height for question
            padding=[0, dp(8), 0, dp(8)],  # Add vertical padding
        )

        # Question label
        self.question_label = MDLabel(
            text="What is the main topic of this conversation?",
            halign="center",
            valign="center",  # Center text vertically
            size_hint_y=None,
            height=dp(64),  # Increased height
            font_style="H6",  # Larger font
        )
        question_container.add_widget(self.question_label)
        self.add_widget(question_container)

        # Options container with remaining space
        self.options_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(12),  # Increased spacing between buttons
            size_hint_y=None,
            height=dp(280),  # Increased height for buttons
            padding=[dp(8), dp(4), dp(8), dp(4)],
        )
        self.add_widget(self.options_layout)


class ConversationLayout(ContentLayout):
    """Layout for displaying the conversation messages."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.orientation = "vertical"
        self.spacing = dp(8)
        self.size_hint_y = None
        self.bind(minimum_height=self.setter("height"))


class ConversationExerciseScreen(BaseExerciseScreen):
    """Screen for the conversation exercise."""

    def __init__(self, db, **kwargs):
        super().__init__(db, **kwargs)
        self.name = (
            "conversations"  # Fixed: Changed from "conversation" to "conversations"
        )
        self.current_summary = None
        self.current_exercise_id = None
        self.attempt_recorded = False

        # Initialize audio manager
        self.audio_manager = AudioManager()

    def create_exercise_view(self):
        """Create the exercise view with conversation components."""
        layout = super().create_exercise_view()

        # Update toolbar title
        layout.children[-1].title = "Conversation Exercise"

        # Update reset button text
        self.reset_button.text = "New Conversation"

        # Create conversation area
        self.conversation_layout = ConversationLayout()
        self.messages_scroll = ScrollableContent(self.conversation_layout)
        layout.add_widget(self.messages_scroll)

        # Create question area
        self.question_layout = QuestionLayout()
        layout.add_widget(self.question_layout)

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
        """Handle topic selection and load conversation."""
        with self.db() as db:
            settings = db.get_user_settings()
            # Get a random exercise_id for the selected topic
            db.cursor.execute(
                """
                SELECT DISTINCT ce.exercise_id
                FROM conversation_exercises ce
                JOIN exercises_info ei ON ce.exercise_id = ei.id
                JOIN topics t ON ei.topic_id = t.id
                JOIN languages l ON ei.language_id = l.id
                JOIN difficulties d ON ei.difficulty_id = d.id
                WHERE t.topic = ? AND l.language = ? AND d.difficulty_level = ?
                ORDER BY RANDOM() LIMIT 1
            """,
                (topic, settings["language"], settings["difficulty"]),
            )

            result = db.cursor.fetchone()
            if result:
                self.current_exercise_id = result[0]
                self.current_topic = topic
                self.attempt_recorded = False
                self.load_conversation(self.current_exercise_id, settings)
                self.switch_to_exercise()

    def load_specific_exercise(self, exercise_id):
        """Load a specific exercise by ID."""
        with self.db() as db:
            settings = db.get_user_settings()
            # Get exercise details
            db.cursor.execute(
                """SELECT t.topic
                    FROM exercises_info e
                    JOIN topics t ON e.topic_id = t.id
                    WHERE e.id = ?""",
                (exercise_id,),
            )
            exercise_info = db.cursor.fetchone()

            if exercise_info:
                self.current_topic = exercise_info[
                    0
                ]  # Fixed: Changed from exercise_info["topic"] to exercise_info[0]
                self.current_exercise_id = exercise_id
                self.attempt_recorded = False
                self.load_conversation(exercise_id, settings)
                self.switch_to_exercise()

    def load_conversation(self, exercise_id, settings):
        """Load and display conversation and summary options."""
        with self.db() as db:
            # Get conversation messages
            db.cursor.execute(
                """
                SELECT speaker, message, conversation_order
                FROM conversation_exercises
                WHERE exercise_id = ?
                ORDER BY conversation_order
            """,
                (exercise_id,),
            )
            messages = db.cursor.fetchall()

            # Get correct summary
            db.cursor.execute(
                """
                SELECT summary
                FROM conversation_summaries
                WHERE exercise_id = ?
            """,
                (exercise_id,),
            )
            correct_summary = db.cursor.fetchone()[0]
            self.current_summary = correct_summary

            # Get two random different summaries
            db.cursor.execute(
                """
                SELECT summary
                FROM conversation_summaries
                WHERE exercise_id != ?
                ORDER BY RANDOM()
                LIMIT 2
            """,
                (exercise_id,),
            )
            other_summaries = [row[0] for row in db.cursor.fetchall()]

            self.display_conversation(messages)
            self.display_summary_options(correct_summary, other_summaries)

    def play_message_audio(self, instance):
        """Play audio for the message when bubble is clicked."""
        # Get the message text from the bubble
        message_text = instance.full_message
        # Play the audio using the audio manager
        self.audio_manager.play_audio(message_text)

    def on_bubble_touch(self, instance, touch):
        """Handle touch events on message bubbles."""
        # Check if the touch is within this widget
        if instance.collide_point(*touch.pos):
            # Play the audio for this message
            self.play_message_audio(instance)
            # Return True to indicate the touch was handled
            return True
        # Return False to allow the touch to propagate to other widgets
        return False

    def display_conversation(self, messages):
        """Display conversation messages."""
        self.conversation_layout.clear_widgets()
        for msg in messages:
            is_right = "2" in msg["speaker"].lower()
            bubble = MessageBubble(
                speaker=msg["speaker"], message=msg["message"], is_right=is_right
            )
            # Make the bubble clickable
            bubble.bind(
                on_touch_down=lambda instance, touch, bubble=bubble: self.on_bubble_touch(
                    bubble, touch
                )
            )
            self.conversation_layout.add_widget(bubble)

    def display_summary_options(self, correct_summary, other_summaries):
        """Display summary options buttons."""
        self.question_layout.options_layout.clear_widgets()

        # Combine and shuffle summaries
        all_summaries = [correct_summary] + other_summaries
        random.shuffle(all_summaries)

        # Create buttons for each summary
        for summary in all_summaries:
            btn = ConversationSummaryButton(summary=summary)
            btn.bind(on_release=lambda x, s=summary: self.check_answer(s))
            self.question_layout.options_layout.add_widget(btn)

    def check_answer(self, selected_summary):
        """Check if selected summary is correct and update UI."""
        if not self.attempt_recorded:
            is_correct = selected_summary == self.current_summary

            # Record the attempt
            if self.current_exercise_id:
                with self.db() as db:
                    settings = db.get_user_settings()
                    db.record_exercise_attempt(
                        settings["username"], self.current_exercise_id, is_correct
                    )
                self.attempt_recorded = True

        # Update all button states
        for child in self.question_layout.options_layout.children:
            if isinstance(child, ConversationSummaryButton):
                is_correct = child.summary == self.current_summary
                selected = child.summary == selected_summary
                if selected:
                    child.set_result(is_correct)

    def reset_exercise(self, *args):
        """Reset the current exercise."""
        super().reset_exercise(*args)
        if self.current_topic:
            self.select_topic(self.current_topic)
