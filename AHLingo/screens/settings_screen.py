# -*- coding: utf-8 -*-
from AHLingo.screens.base_screen import BaseScreen
from AHLingo.components.layouts import ContentLayout, ScrollableContent
from AHLingo.components.toolbars import StandardToolbar
from AHLingo.components.buttons import StandardButton
from kivymd.uix.textfield import MDTextField
from kivymd.uix.label import MDLabel
from kivymd.uix.menu import MDDropdownMenu
from kivymd.uix.boxlayout import MDBoxLayout
from kivy.metrics import dp
from functools import partial


class SettingsTextField(MDTextField):
    """Custom text field for settings with consistent styling."""

    def __init__(self, **kwargs):
        super().__init__(
            mode="fill",  # Use filled style for consistency
            size_hint_x=1,  # Take full width
            size_hint_y=None,
            height=dp(56),  # Match toolbar height
            required=True,
            **kwargs
        )


class SettingsScreen(BaseScreen):
    """Settings screen for user preferences with consistent styling."""

    def __init__(self, db, **kwargs):
        super().__init__(db, **kwargs)
        self.name = "settings"
        self.setup_screen()
        self.setup_menus()
        self.load_existing_settings()

    def setup_screen(self):
        """Setup the screen layout."""
        # Main layout
        layout = ContentLayout()

        # Add toolbar with back button
        toolbar = StandardToolbar(
            title="Settings", left_action=lambda x: self.go_back_to_home()
        )
        layout.add_widget(toolbar)

        # Button container at the top
        button_container = MDBoxLayout(
            orientation="vertical",
            size_hint_y=None,
            height=dp(160),  # Height for 2 buttons + padding
            padding=[dp(16), dp(8), dp(16), dp(8)],
            spacing=dp(8),
        )

        # Language selector
        self.language_button = StandardButton(
            text="Select Language",
            on_release=self.show_language_menu,
            size_hint=(1, None),
            height=dp(56),
        )
        button_container.add_widget(self.language_button)

        # Difficulty selector
        self.difficulty_button = StandardButton(
            text="Select Difficulty",
            on_release=self.show_difficulty_menu,
            size_hint=(1, None),
            height=dp(56),
        )
        button_container.add_widget(self.difficulty_button)

        layout.add_widget(button_container)

        # Create main content layout for username and notice
        content_layout = ContentLayout()
        content_layout.spacing = dp(16)
        content_layout.padding = [dp(16), dp(16), dp(16), dp(16)]

        # Username field
        self.username_field = SettingsTextField(
            hint_text="Username",
            helper_text="Enter your username",
            helper_text_mode="on_error",
            size_hint=(1, None),
        )
        layout.add_widget(self.username_field)

        # Required fields notice
        required_notice = MDLabel(
            text="* All fields are required",
            theme_text_color="Error",
            size_hint_y=None,
            height=dp(48),
            halign="center",
        )
        layout.add_widget(required_notice)

        # Wrap remaining content in scrollable container
        content_container = ScrollableContent(
            content_layout,
            size_hint=(1, 1),
        )

        layout.add_widget(content_container)
        self.add_widget(layout)

    def setup_menus(self):
        """Setup dropdown menus for language and difficulty selection."""
        with self.db() as db:
            languages = db.get_languages()
            difficulties = db.get_difficulty_levels()

        # Language menu
        self.language_menu = self.create_dropdown_menu(
            self.language_button, languages, self.set_language
        )

        # Difficulty menu
        self.difficulty_menu = self.create_dropdown_menu(
            self.difficulty_button, difficulties, self.set_difficulty
        )

    def create_dropdown_menu(self, caller, items, callback):
        """Create a dropdown menu with consistent styling."""
        return MDDropdownMenu(
            caller=caller,
            items=[
                {
                    "text": item,
                    "viewclass": "OneLineListItem",
                    "on_release": partial(callback, item),
                }
                for item in items
            ],
            width_mult=4,
            radius=[dp(4), dp(4), dp(4), dp(4)],
            background_color=self.theme_cls.bg_normal,
        )

    def show_language_menu(self, button):
        """Show language selection dropdown."""
        self.language_menu.open()

    def show_difficulty_menu(self, button):
        """Show difficulty selection dropdown."""
        self.difficulty_menu.open()

    def set_language(self, language, *args):
        """Set selected language."""
        self.language_button.text = language
        self.language_menu.dismiss()

    def set_difficulty(self, difficulty, *args):
        """Set selected difficulty."""
        self.difficulty_button.text = difficulty
        self.difficulty_menu.dismiss()

    def load_existing_settings(self):
        """Load existing user settings if available."""
        if self.settings.exists("username"):
            self.username_field.text = self.settings.get("username")["value"]
        if self.settings.exists("language"):
            self.language_button.text = self.settings.get("language")["value"]
        if self.settings.exists("difficulty"):
            self.difficulty_button.text = self.settings.get("difficulty")["value"]

    def validate_settings(self):
        """Validate all required settings are provided."""
        if not self.username_field.text:
            self.username_field.error = True
            return False
        if self.language_button.text == "Select Language":
            return False
        if self.difficulty_button.text == "Select Difficulty":
            return False
        return True

    def on_leave(self, *args):
        """Save settings when leaving the screen."""
        if self.validate_settings():
            # Save settings
            self.settings.put("username", value=self.username_field.text)
            self.settings.put("language", value=self.language_button.text)
            self.settings.put("difficulty", value=self.difficulty_button.text)

            # Create user if doesn't exist
            with self.db() as db:
                db.cursor.execute(
                    "INSERT OR IGNORE INTO users (name) VALUES (?)",
                    (self.username_field.text,),
                )
