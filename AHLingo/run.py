# -*- coding: utf-8 -*-
from kivymd.app import MDApp
from kivymd.uix.screenmanager import MDScreenManager
from kivy.core.window import Window
from kivy.utils import platform
from kivy.storage.jsonstore import JsonStore
from kivy.config import Config
import os

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


class AppSettings:
    """Manages application settings."""

    SETTINGS_FILE = "settings.json"
    REQUIRED_SETTINGS = ["username", "language", "difficulty"]

    @classmethod
    def check_settings(cls) -> str:
        """
        Check if settings exist and are complete.
        Returns: Initial screen name based on settings state.
        """
        if not os.path.exists(cls.SETTINGS_FILE):
            return "settings"

        settings = JsonStore(cls.SETTINGS_FILE)
        if not all(settings.exists(setting) for setting in cls.REQUIRED_SETTINGS):
            return "settings"

        return "home"


class DatabaseManager:
    """Manages database connection and initialization."""

    DB_PATH = "./database/languageLearningDatabase.db"

    @classmethod
    def get_database(cls):
        """
        Initialize and return database connection.
        Creates necessary directories if they don't exist.
        """
        os.makedirs(os.path.dirname(cls.DB_PATH), exist_ok=True)
        return lambda: LanguageDB(cls.DB_PATH)


class ScreenManager(MDScreenManager):
    """Custom screen manager with screen initialization."""

    def __init__(self, database):
        super().__init__()
        self.db = database
        self.setup_screens()

    def setup_screens(self):
        """Initialize and add all application screens."""
        screens = [
            HomeScreen(self.db),
            SettingsScreen(self.db),
            PairsExerciseScreen(self.db),
            ConversationExerciseScreen(self.db),
            ChatbotExerciseScreen(self.db),
            TranslationExerciseScreen(self.db),
            ReviseMistakesScreen(self.db),
        ]
        for screen in screens:
            self.add_widget(screen)


class LanguageLearningApp(MDApp):
    """Main application class."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.setup_window()
        self.setup_theme()
        self.icon = "./assets/logo.png"

    def setup_window(self):
        """Configure window properties."""
        pass
        if platform not in ("android", "ios"):
            Window.size = (400, 800)

    def setup_theme(self):
        """Configure application theme."""
        self.theme_cls.primary_palette = "Blue"
        self.theme_cls.theme_style = "Light"

    def build(self):
        """Build and return the application's root widget."""
        # Initialize database
        self.db = DatabaseManager.get_database()

        # Create and initialize screen manager
        self.screen_manager = ScreenManager(self.db)

        # Set initial screen based on settings
        initial_screen = AppSettings.check_settings()
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
        print(f"Settings File: {os.path.exists(AppSettings.SETTINGS_FILE)}")

        if os.path.exists(AppSettings.SETTINGS_FILE):
            settings = JsonStore(AppSettings.SETTINGS_FILE)
            print("\nCurrent Settings:")
            for setting in AppSettings.REQUIRED_SETTINGS:
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
