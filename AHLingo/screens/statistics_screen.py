# -*- coding: utf-8 -*-
from .base_screen import BaseScreen
from AHLingo.components.layouts import ContentLayout, ScrollableContent
from AHLingo.components.toolbars import StandardToolbar
from kivymd.uix.datatables import MDDataTable
from kivymd.uix.label import MDLabel
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.card import MDCard
from kivy.metrics import dp
from datetime import datetime


class StatisticsScreen(BaseScreen):
    """Screen for displaying user statistics and learning progress."""

    def __init__(self, db, **kwargs):
        super().__init__(db, **kwargs)
        self.name = "statistics"
        self.data_tables = {}
        self.setup_screen()

    def setup_screen(self):
        """Setup the screen layout."""
        layout = ContentLayout()

        # Add toolbar
        toolbar = StandardToolbar(
            title="Statistics", left_action=lambda x: self.go_back_to_home()
        )
        layout.add_widget(toolbar)

        # Create scrollable content for statistics
        content_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(16),
            padding=[dp(16), dp(16), dp(16), dp(16)],
            size_hint_y=None,
        )
        content_layout.bind(minimum_height=content_layout.setter("height"))

        # Add statistics sections
        self.add_summary_section(content_layout)
        self.add_streak_section(content_layout)
        self.add_language_section(content_layout)
        self.add_exercise_type_section(content_layout)
        self.add_difficulty_section(content_layout)
        self.add_topic_section(content_layout)

        # Add scrollable container
        scroll_container = ScrollableContent(
            content_layout,
            size_hint=(1, 1),
            pos_hint={"center_x": 0.5, "center_y": 0.5},
        )

        layout.add_widget(scroll_container)
        self.add_widget(layout)

    def add_summary_section(self, parent_layout):
        """Add summary statistics section."""
        # Create section title
        title = MDLabel(
            text="Summary Statistics",
            font_style="H6",
            size_hint_y=None,
            height=dp(40),
        )
        parent_layout.add_widget(title)

        # Create card for summary stats
        card = MDCard(
            orientation="vertical",
            size_hint=(1, None),
            height=dp(120),
            padding=dp(16),
            elevation=1,
            radius=[dp(10)],
        )

        # Will be populated in on_pre_enter
        self.summary_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(8),
            size_hint=(1, None),
            height=dp(88),
        )
        card.add_widget(self.summary_layout)
        parent_layout.add_widget(card)

    def add_streak_section(self, parent_layout):
        """Add streak statistics section."""
        # Create section title
        title = MDLabel(
            text="Streak Information",
            font_style="H6",
            size_hint_y=None,
            height=dp(40),
            padding=[0, dp(16), 0, 0],
        )
        parent_layout.add_widget(title)

        # Create card for streak stats
        card = MDCard(
            orientation="vertical",
            size_hint=(1, None),
            height=dp(120),
            padding=dp(16),
            elevation=1,
            radius=[dp(10)],
        )

        # Will be populated in on_pre_enter
        self.streak_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(8),
            size_hint=(1, None),
            height=dp(88),
        )
        card.add_widget(self.streak_layout)
        parent_layout.add_widget(card)

    def add_language_section(self, parent_layout):
        """Add language statistics section."""
        # Create section title
        title = MDLabel(
            text="Language Statistics",
            font_style="H6",
            size_hint_y=None,
            height=dp(40),
            padding=[0, dp(16), 0, 0],
        )
        parent_layout.add_widget(title)

        # Create container for the data table
        table_container = MDBoxLayout(
            orientation="vertical",
            size_hint=(1, None),
            height=dp(250),
            padding=[0, 0, 0, dp(16)],
        )

        # Data table will be created in on_pre_enter
        self.data_tables["language"] = None
        self.language_container = table_container
        parent_layout.add_widget(table_container)

    def add_exercise_type_section(self, parent_layout):
        """Add exercise type statistics section."""
        # Create section title
        title = MDLabel(
            text="Exercise Type Statistics",
            font_style="H6",
            size_hint_y=None,
            height=dp(40),
            padding=[0, dp(16), 0, 0],
        )
        parent_layout.add_widget(title)

        # Create container for the data table
        table_container = MDBoxLayout(
            orientation="vertical",
            size_hint=(1, None),
            height=dp(250),
            padding=[0, 0, 0, dp(16)],
        )

        # Data table will be created in on_pre_enter
        self.data_tables["exercise_type"] = None
        self.exercise_type_container = table_container
        parent_layout.add_widget(table_container)

    def add_difficulty_section(self, parent_layout):
        """Add difficulty level statistics section."""
        # Create section title
        title = MDLabel(
            text="Difficulty Level Statistics",
            font_style="H6",
            size_hint_y=None,
            height=dp(40),
            padding=[0, dp(16), 0, 0],
        )
        parent_layout.add_widget(title)

        # Create container for the data table
        table_container = MDBoxLayout(
            orientation="vertical",
            size_hint=(1, None),
            height=dp(250),
            padding=[0, 0, 0, dp(16)],
        )

        # Data table will be created in on_pre_enter
        self.data_tables["difficulty"] = None
        self.difficulty_container = table_container
        parent_layout.add_widget(table_container)

    def add_topic_section(self, parent_layout):
        """Add topic statistics section."""
        # Create section title
        title = MDLabel(
            text="Topic Statistics",
            font_style="H6",
            size_hint_y=None,
            height=dp(40),
            padding=[0, dp(16), 0, 0],
        )
        parent_layout.add_widget(title)

        # Create container for the data table
        table_container = MDBoxLayout(
            orientation="vertical",
            size_hint=(1, None),
            height=dp(250),
            padding=[0, 0, 0, dp(16)],
        )

        # Data table will be created in on_pre_enter
        self.data_tables["topic"] = None
        self.topic_container = table_container
        parent_layout.add_widget(table_container)

    def on_pre_enter(self):
        """Load statistics when entering the screen."""
        with self.db() as db:
            settings = db.get_user_settings()
            username = settings.get("username", "default_user")
            
            # Get user stats
            user_stats = db.get_user_stats(username)
            streak_info = db.get_user_streak(username)
            language_stats = db.get_exercises_by_language(username)
            exercise_type_stats = db.get_exercises_by_type(username)
            difficulty_stats = db.get_exercises_by_language_difficulty(username)
            topic_stats = db.get_exercises_by_language_topic(username)

        # Update summary section
        self.update_summary_section(user_stats)
        
        # Update streak section
        self.update_streak_section(streak_info)
        
        # Update language statistics table
        self.update_language_table(language_stats)
        
        # Update exercise type statistics table
        self.update_exercise_type_table(exercise_type_stats)
        
        # Update difficulty statistics table
        self.update_difficulty_table(difficulty_stats)
        
        # Update topic statistics table
        self.update_topic_table(topic_stats)

    def update_summary_section(self, user_stats):
        """Update the summary statistics section."""
        self.summary_layout.clear_widgets()
        
        total_attempts = user_stats.get("total_attempts", 0)
        correct_answers = user_stats.get("correct_answers", 0)
        success_rate = user_stats.get("success_rate", 0)
        
        # Add summary labels
        self.summary_layout.add_widget(
            MDLabel(
                text=f"Total Exercises Attempted: {total_attempts}",
                font_style="Body1",
            )
        )
        self.summary_layout.add_widget(
            MDLabel(
                text=f"Correct Answers: {correct_answers}",
                font_style="Body1",
            )
        )
        self.summary_layout.add_widget(
            MDLabel(
                text=f"Success Rate: {success_rate:.1f}%",
                font_style="Body1",
            )
        )

    def update_streak_section(self, streak_info):
        """Update the streak statistics section."""
        self.streak_layout.clear_widgets()
        
        current_streak = streak_info.get("current_streak", 0)
        best_streak = streak_info.get("best_streak", 0)
        
        # Add streak labels
        self.streak_layout.add_widget(
            MDLabel(
                text=f"Current Daily Streak: {current_streak} day{'s' if current_streak != 1 else ''}",
                font_style="Body1",
            )
        )
        self.streak_layout.add_widget(
            MDLabel(
                text=f"Best Daily Streak: {best_streak} day{'s' if best_streak != 1 else ''}",
                font_style="Body1",
            )
        )
        
        # Add motivational message based on streak
        if current_streak == 0:
            message = "Start a streak today by completing exercises!"
        elif current_streak < 3:
            message = "Keep going! You're building momentum."
        elif current_streak < 7:
            message = "Great consistency! You're making progress."
        else:
            message = "Impressive streak! Your dedication is paying off."
            
        self.streak_layout.add_widget(
            MDLabel(
                text=message,
                font_style="Body1",
                theme_text_color="Secondary",
            )
        )

    def update_language_table(self, language_stats):
        """Update the language statistics table."""
        # Clear previous table if it exists
        if self.data_tables["language"]:
            self.language_container.remove_widget(self.data_tables["language"])
        
        # Create new data table
        self.data_tables["language"] = MDDataTable(
            size_hint=(1, 1),
            use_pagination=False,
            column_data=[
                ("Language", dp(40)),
                ("Exercises Completed", dp(40)),
                ("Correct Answers", dp(40)),
                ("Total Attempts", dp(40)),
            ],
            row_data=[
                (
                    stat["language"],
                    str(stat["completed_exercises"]),
                    str(stat["correct_answers"]),
                    str(stat["total_attempts"]),
                )
                for stat in language_stats
            ] if language_stats else [("No data available", "", "", "")],
            rows_num=10,
            elevation=1,
            background_color_header="#EEEEEE",
            background_color_cell="#FFFFFF",
        )
        
        self.language_container.add_widget(self.data_tables["language"])

    def update_exercise_type_table(self, exercise_type_stats):
        """Update the exercise type statistics table."""
        # Clear previous table if it exists
        if self.data_tables["exercise_type"]:
            self.exercise_type_container.remove_widget(self.data_tables["exercise_type"])
        
        # Create new data table
        self.data_tables["exercise_type"] = MDDataTable(
            size_hint=(1, 1),
            use_pagination=False,
            column_data=[
                ("Exercise Type", dp(40)),
                ("Exercises Completed", dp(40)),
                ("Correct Answers", dp(40)),
                ("Total Attempts", dp(40)),
            ],
            row_data=[
                (
                    stat["exercise_type"],
                    str(stat["completed_exercises"]),
                    str(stat["correct_answers"]),
                    str(stat["total_attempts"]),
                )
                for stat in exercise_type_stats
            ] if exercise_type_stats else [("No data available", "", "", "")],
            rows_num=10,
            elevation=1,
            background_color_header="#EEEEEE",
            background_color_cell="#FFFFFF",
        )
        
        self.exercise_type_container.add_widget(self.data_tables["exercise_type"])

    def update_difficulty_table(self, difficulty_stats):
        """Update the difficulty statistics table."""
        # Clear previous table if it exists
        if self.data_tables["difficulty"]:
            self.difficulty_container.remove_widget(self.data_tables["difficulty"])
        
        # Create new data table
        self.data_tables["difficulty"] = MDDataTable(
            size_hint=(1, 1),
            use_pagination=False,
            column_data=[
                ("Language", dp(30)),
                ("Difficulty", dp(30)),
                ("Exercises Completed", dp(40)),
                ("Correct Answers", dp(40)),
                ("Total Attempts", dp(30)),
            ],
            row_data=[
                (
                    stat["language"],
                    stat["difficulty_level"],
                    str(stat["completed_exercises"]),
                    str(stat["correct_answers"]),
                    str(stat["total_attempts"]),
                )
                for stat in difficulty_stats
            ] if difficulty_stats else [("No data available", "", "", "", "")],
            rows_num=10,
            elevation=1,
            background_color_header="#EEEEEE",
            background_color_cell="#FFFFFF",
        )
        
        self.difficulty_container.add_widget(self.data_tables["difficulty"])

    def update_topic_table(self, topic_stats):
        """Update the topic statistics table."""
        # Clear previous table if it exists
        if self.data_tables["topic"]:
            self.topic_container.remove_widget(self.data_tables["topic"])
        
        # Create new data table
        self.data_tables["topic"] = MDDataTable(
            size_hint=(1, 1),
            use_pagination=False,
            column_data=[
                ("Language", dp(30)),
                ("Topic", dp(40)),
                ("Exercises Completed", dp(40)),
                ("Correct Answers", dp(30)),
                ("Total Attempts", dp(30)),
            ],
            row_data=[
                (
                    stat["language"],
                    stat["topic"],
                    str(stat["completed_exercises"]),
                    str(stat["correct_answers"]),
                    str(stat["total_attempts"]),
                )
                for stat in topic_stats
            ] if topic_stats else [("No data available", "", "", "", "")],
            rows_num=10,
            elevation=1,
            background_color_header="#EEEEEE",
            background_color_cell="#FFFFFF",
        )
        
        self.topic_container.add_widget(self.data_tables["topic"])
