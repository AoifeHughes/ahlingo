# -*- coding: utf-8 -*-
from AHLingo.screens.base_screen import BaseScreen
from AHLingo.components.layouts import ContentLayout
from AHLingo.components.buttons import StandardButton
from kivymd.uix.textfield import MDTextField
from kivymd.uix.label import MDLabel
from kivymd.uix.menu import MDDropdownMenu
from kivy.metrics import dp
from functools import partial


class SettingsTextField(MDTextField):
    """Custom text field for settings with consistent styling."""

    def __init__(self, **kwargs):
        super().__init__(
            size_hint_x=0.8,
            size_hint_y=None,
            height=dp(48),
            pos_hint={"center_x": 0.5},
            required=True,
            **kwargs
        )


class SettingsLabel(MDLabel):
    """Custom label for settings with consistent styling."""

    def __init__(self, **kwargs):
        super().__init__(halign="center", size_hint_y=None, **kwargs)


class SettingsScreen(BaseScreen):
    """Settings screen for user preferences."""

    def __init__(self, db, **kwargs):
        super().__init__(db, **kwargs)
        self.name = "settings"
        self.setup_ui()
        self.setup_menus()
        self.load_existing_settings()

    def setup_ui(self):
        """Setup the settings user interface."""
        # Main container
        main_layout = ContentLayout()

        # Content layout for settings
        content_layout = self.create_content_layout()
        main_layout.add_widget(content_layout)

        self.add_widget(main_layout)

    def create_content_layout(self):
        """Create and return the settings content layout."""
        content_layout = ContentLayout()
        content_layout.size_hint_y = None
        content_layout.height = dp(400)

        # Title
        title = SettingsLabel(text="Settings", font_style="H5", height=dp(50))
        content_layout.add_widget(title)

        # Required fields notice
        required_notice = SettingsLabel(
            text="* All fields are required", theme_text_color="Error", height=dp(30)
        )
        content_layout.add_widget(required_notice)

        # Username field
        self.username_field = SettingsTextField(
            hint_text="Username *",
            helper_text="Enter your username",
            helper_text_mode="on_error",
        )
        content_layout.add_widget(self.username_field)

        # Language selector
        self.language_button = StandardButton(
            text="Select Language *", on_release=self.show_language_menu
        )
        content_layout.add_widget(self.language_button)

        # Difficulty selector
        self.difficulty_button = StandardButton(
            text="Select Difficulty *", on_release=self.show_difficulty_menu
        )
        content_layout.add_widget(self.difficulty_button)

        # Save button
        self.save_button = StandardButton(
            text="Save Settings", on_release=self.save_settings
        )
        content_layout.add_widget(self.save_button)

        return content_layout

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
        )

    def load_existing_settings(self):
        """Load existing user settings if available."""
        if self.settings.exists("username"):
            self.username_field.text = self.settings.get("username")["value"]
        if self.settings.exists("language"):
            self.language_button.text = self.settings.get("language")["value"]
        if self.settings.exists("difficulty"):
            self.difficulty_button.text = self.settings.get("difficulty")["value"]

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

    def validate_settings(self):
        """Validate all required settings are provided."""
        if not self.username_field.text:
            self.username_field.error = True
            return False
        if self.language_button.text == "Select Language *":
            return False
        if self.difficulty_button.text == "Select Difficulty *":
            return False
        return True

    def save_settings(self, *args):
        """Save user settings and create user in database."""
        if not self.validate_settings():
            return

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

        # Navigate to home screen
        self.manager.current = "home"
