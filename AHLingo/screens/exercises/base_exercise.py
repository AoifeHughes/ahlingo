# -*- coding: utf-8 -*-
from AHLingo.screens.base_screen import BaseScreen
from AHLingo.components.layouts import ContentLayout, ScrollableList
from AHLingo.components.toolbars import StandardToolbar
from AHLingo.components.buttons import StandardButton


class BaseExerciseScreen(BaseScreen):
    """Base class for exercise screens."""

    def __init__(self, db, **kwargs):
        super().__init__(db, **kwargs)
        self.main_layout = ContentLayout()
        self.setup_views()
        self.current_topic = None

    def setup_views(self):
        """Setup topic and exercise views."""
        self.topic_view = self.create_topic_view()
        self.exercise_view = self.create_exercise_view()
        self.main_layout.add_widget(self.topic_view)
        self.add_widget(self.main_layout)

    def create_topic_view(self):
        """Create the topic selection view."""
        layout = ContentLayout()
        toolbar = StandardToolbar(
            title="Select Topic", left_action=lambda x: self.go_back_to_home()
        )
        layout.add_widget(toolbar)

        self.topics_list = ScrollableList()
        layout.add_widget(self.topics_list)

        return layout

    def create_exercise_view(self):
        """Create the exercise view."""
        layout = ContentLayout()

        toolbar = StandardToolbar(
            title="Exercise", left_action=lambda x: self.return_to_topics()
        )
        layout.add_widget(toolbar)

        self.reset_button = StandardButton(
            text="Reset Exercise", on_release=self.reset_exercise
        )
        layout.add_widget(self.reset_button)

        return layout

    def load_topics(self):
        """Load topics based on user settings."""
        settings = self.get_user_settings()
        if settings:
            with self.db() as db:
                topics = db.get_topics_by_language_difficulty(
                    settings["language"], settings["difficulty"]
                )
            self.display_topics(topics)

    def display_topics(self, topics):
        """Display the list of topics."""
        raise NotImplementedError("Subclasses must implement display_topics")

    def select_topic(self, topic):
        """Handle topic selection."""
        raise NotImplementedError("Subclasses must implement select_topic")

    def reset_exercise(self, *args):
        """Reset the current exercise."""
        if self.current_topic:
            self.select_topic(self.current_topic)

    def switch_to_exercise(self):
        """Switch to exercise view."""
        self.main_layout.clear_widgets()
        self.main_layout.add_widget(self.exercise_view)

    def return_to_topics(self):
        """Return to topic selection view."""
        self.main_layout.clear_widgets()
        self.create_topic_view()
        self.main_layout.add_widget(self.topic_view)
        self.current_topic = None
