# -*- coding: utf-8 -*-
import sys
from kivymd.app import MDApp
from kivymd.uix.screenmanager import MDScreenManager
from kivy.core.window import Window
from kivy.utils import platform
from kivy.storage.jsonstore import JsonStore
from kivy.config import Config
import os
import pkg_resources

# Import screens
from AHLingo.screens.home_screen import HomeScreen
from AHLingo.screens.settings_screen import SettingsScreen
from AHLingo.screens.exercises.pairs_screen import PairsExerciseScreen
from AHLingo.screens.exercises.conversations_screen import ConversationExerciseScreen
from AHLingo.screens.exercises.chatbot_screen import ChatbotExerciseScreen
from AHLingo.screens.exercises.translation_screen import TranslationExerciseScreen
from AHLingo.screens.revise_mistakes_screen import ReviseMistakesScreen

# Import database
from AHLingo.database.database_manager import LanguageDB

# Configure input
Config.set("input", "mouse", "mouse,multitouch_on_demand")


def get_resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller"""
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = pkg_resources.resource_filename("AHLingo", "")

    return os.path.join(base_path, relative_path)


class AppSettings:
    """Manages application settings."""

    def __init__(self):
        self.settings_dir = "./"
        os.makedirs(self.settings_dir, exist_ok=True)
        self.SETTINGS_FILE = os.path.join(self.settings_dir, "settings.json")
        self.REQUIRED_SETTINGS = ["username", "language", "difficulty"]

    def check_settings(self) -> str:
        """
        Check if settings exist and are complete.
        Returns: Initial screen name based on settings state.
        """
        if not os.path.exists(self.SETTINGS_FILE):
            return "settings"

        settings = JsonStore(self.SETTINGS_FILE)
        if not all(settings.exists(setting) for setting in self.REQUIRED_SETTINGS):
            return "settings"

        return "home"


class DatabaseManager:
    """Manages database connection and initialization."""

    def __init__(self):
        self.db_dir = os.path.expanduser("./database")
        os.makedirs(self.db_dir, exist_ok=True)
        self.DB_PATH = os.path.join(self.db_dir, "languageLearningDatabase.db")

    def get_database(self):
        """
        Initialize and return database connection.
        Creates necessary directories if they don't exist.
        """
        return lambda: LanguageDB(self.DB_PATH)


class LanguageLearningApp(MDApp):
    """Main application class."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.setup_window()
        self.setup_theme()
        
        self.screen_manager = None
        self.db = None
        self.settings = AppSettings()
        self.db_manager = DatabaseManager()

    def setup_window(self):
        """Configure window properties."""
        if platform not in ("android", "ios"):
            Window.size = (400, 800)

    def setup_theme(self):
        """Configure application theme."""
        self.theme_cls.primary_palette = "Blue"
        self.theme_cls.theme_style = "Light"
        self.theme_cls.material_style = "M3"

    def build(self):
        """Build and return the application's root widget."""
        self.icon = get_resource_path("../assets/logo.png")
        # Initialize database
        self.db = self.db_manager.get_database()

        # Create screen manager
        self.screen_manager = MDScreenManager()

        # Initialize and add all screens
        screens = {
            "home": HomeScreen(self.db),
            "settings": SettingsScreen(self.db),
            "pairs": PairsExerciseScreen(self.db),
            "conversations": ConversationExerciseScreen(self.db),
            "chatbot": ChatbotExerciseScreen(self.db),
            "translation": TranslationExerciseScreen(self.db),
            "revise_mistakes": ReviseMistakesScreen(self.db),
        }

        for screen in screens.values():
            self.screen_manager.add_widget(screen)

        # Set initial screen based on settings
        initial_screen = self.settings.check_settings()
        self.screen_manager.current = initial_screen

        return self.screen_manager

    def on_start(self):
        """Handle application startup."""
        print("Application started")
        self.print_debug_info()

    def print_debug_info(self):
        """Print debug information about the application state."""
        print("\nApplication Debug Information:")
        print("-" * 30)
        print(f"Current Screen: {self.screen_manager.current}")
        print(
            f"Available Screens: {[screen.name for screen in self.screen_manager.screens]}"
        )
        print(f"Settings File: {os.path.exists(self.settings.SETTINGS_FILE)}")

        if os.path.exists(self.settings.SETTINGS_FILE):
            settings = JsonStore(self.settings.SETTINGS_FILE)
            print("\nCurrent Settings:")
            for setting in self.settings.REQUIRED_SETTINGS:
                value = (
                    settings.get(setting)["value"]
                    if settings.exists(setting)
                    else "Not Set"
                )
                print(f"{setting}: {value}")

        print("\nDatabase Information:")
        with self.db() as db:
            db.cursor.execute("SELECT COUNT(*) FROM languages")
            lang_count = db.cursor.fetchone()[0]
            print(f"Number of languages: {lang_count}")

        print("-" * 30)


def main():
    """Entry point for the application when installed as a package."""
    LanguageLearningApp().run()


if __name__ == "__main__":
    main()
