# -*- coding: utf-8 -*-
from AHLingo.screens.base_screen import BaseScreen
from AHLingo.components.layouts import ContentLayout
from AHLingo.components.toolbars import StandardToolbar
from AHLingo.components.buttons import StandardButton
from kivymd.uix.boxlayout import MDBoxLayout
from kivy.uix.image import Image
from kivy.metrics import dp


class HomeScreen(BaseScreen):
    """Main home screen of the application."""

    def __init__(self, db, **kwargs):
        super().__init__(db, **kwargs)
        self.name = "home"
        self.setup_ui()

    def setup_ui(self):
        """Setup the main user interface."""
        # Main layout with vertical orientation
        main_layout = MDBoxLayout(orientation="vertical")

        # Top toolbar with settings button
        toolbar = StandardToolbar(
            title="AHLingo", right_action=("cog", self.go_to_settings)
        )
        main_layout.add_widget(toolbar)

        # Content layout for logo and buttons
        content_layout = ContentLayout()

        # Add logo image
        logo_layout = MDBoxLayout(
            orientation="vertical",
            size_hint_y=None,
            height=dp(150),
            padding=[dp(16), dp(20), dp(16), dp(20)],
            spacing=dp(20),
        )

        logo_container = MDBoxLayout(
            size_hint_x=None, width=dp(150), pos_hint={"center_x": 0.5}
        )

        logo = Image(
            source="./assets/logo.png", size_hint=(None, None), size=(dp(150), dp(150))
        )

        logo_container.add_widget(logo)
        logo_layout.add_widget(logo_container)
        content_layout.add_widget(logo_layout)

        # Create buttons container
        buttons_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(20),
            padding=[dp(16), dp(20), dp(16), dp(20)],
            size_hint_y=None,
            height=self.calculate_buttons_height(),
        )

        # Create and add buttons
        self.add_exercise_buttons(buttons_layout)

        # Add buttons layout to content
        content_layout.add_widget(buttons_layout)

        # Add content layout to main layout
        main_layout.add_widget(content_layout)

        self.add_widget(main_layout)

    def calculate_buttons_height(self):
        """Calculate total height needed for buttons section."""
        button_height = dp(80)
        spacing = dp(20)
        padding = dp(40)
        num_buttons = 3

        return (button_height * num_buttons) + (spacing * (num_buttons - 1)) + padding

    def add_exercise_buttons(self, layout):
        """Add exercise buttons to the layout."""
        # Pairs Exercise Button
        pairs_button = StandardButton(
            text="Pairs Exercises", on_release=self.go_to_pairs
        )
        layout.add_widget(pairs_button)

        # Conversation Exercise Button
        conversation_button = StandardButton(
            text="Conversation Exercises", on_release=self.go_to_conversation
        )
        layout.add_widget(conversation_button)

        chatbot_button = StandardButton(
            text="Chatbot Exercises", on_release=self.go_to_chatbot
        )
        layout.add_widget(chatbot_button)

    def go_to_conversation(self, *args):
        """Navigate to conversation exercises screen."""
        screen = self.manager.get_screen("conversation")
        screen.load_topics()
        self.manager.current = "conversation"

    def go_to_settings(self, *args):
        """Navigate to settings screen."""
        self.manager.current = "settings"

    def go_to_pairs(self, *args):
        """Navigate to pairs exercises screen."""
        screen = self.manager.get_screen("pairs")
        screen.load_topics()
        self.manager.current = "pairs"

    def go_to_chatbot(self, *args):
        """Navigate to chatbot exercises screen."""
        self.manager.current = "chatbot"
