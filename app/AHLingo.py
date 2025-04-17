# -*- coding: utf-8 -*-
import os
from kivy.lang import Builder
from kivy.uix.screenmanager import SlideTransition
from kivy.core.window import Window
from kivy.utils import get_color_from_hex
from kivymd.app import MDApp

# Import common components
from app.screens.common.settings_item import SettingsItem

# Import screens
from app.screens.main_menu import MainMenuScreen, KV_MAIN_MENU
from app.screens.pairs_exercises import PairsExercisesScreen, KV_PAIRS_EXERCISES
from app.screens.conversation_exercises import ConversationExercisesScreen, KV_CONVERSATION_EXERCISES
from app.screens.translation_exercises import TranslationExercisesScreen, KV_TRANSLATION_EXERCISES
from app.screens.chatbot import ChatbotScreen, KV_CHATBOT
from app.screens.settings import SettingsScreen, KV_SETTINGS

# Import database
from content.database.database_singleton import DatabaseManager

# Define the KV language string for the app
KV = '''
#:import get_color_from_hex kivy.utils.get_color_from_hex
#:import platform kivy.utils.platform

<SettingsItem>:
    orientation: 'vertical'
    adaptive_height: True
    padding: "8dp", "8dp"
    spacing: "8dp"
    
    MDLabel:
        id: label
        text: root.title
        font_style: "Body1"
        size_hint_y: None
        height: self.texture_size[1]
    
    Widget:
        size_hint_y: None
        height: "4dp"

<MenuButton@MDRaisedButton>:
    size_hint: 0.8, None
    height: "56dp"
    font_size: "18sp"
    md_bg_color: get_color_from_hex("#2196F3")
    elevation: 3
    padding: "12dp"
    spacing: "12dp"

ScreenManager:
    id: screen_manager
    
    MainMenuScreen:
        name: 'main_menu'
        id: main_menu
    
    PairsExercisesScreen:
        name: 'pairs_exercises'
        id: pairs_exercises
    
    ConversationExercisesScreen:
        name: 'conversation_exercises'
        id: conversation_exercises
    
    TranslationExercisesScreen:
        name: 'translation_exercises'
        id: translation_exercises
    
    ChatbotScreen:
        name: 'chatbot'
        id: chatbot
    
    SettingsScreen:
        name: 'settings'
        id: settings
'''

class AHLingo(MDApp):
    # Database manager instance
    db_manager = None
    
    def build(self):
        # Initialize the database manager
        self.db_manager = DatabaseManager()
        
        self.theme_cls.primary_palette = "Blue"
        self.theme_cls.primary_hue = "700"
        self.theme_cls.theme_style = "Light"
        
        # Handle keyboard properly on iOS
        if os.environ.get("KIVY_BUILD") == "ios":
            Window.softinput_mode = "below_target"
        
        # Load all KV strings
        self._load_kv_strings()
        
        # Load the main KV string
        return Builder.load_string(KV)
    
    def _load_kv_strings(self):
        """Load all KV strings for screens."""
        # Load KV strings for each screen
        Builder.load_string(KV_MAIN_MENU)
        Builder.load_string(KV_PAIRS_EXERCISES)
        Builder.load_string(KV_CONVERSATION_EXERCISES)
        Builder.load_string(KV_TRANSLATION_EXERCISES)
        Builder.load_string(KV_CHATBOT)
        Builder.load_string(KV_SETTINGS)
    
    def on_start(self):
        """Called when the application starts."""
        # Initialize database and load user settings
        db = self.db_manager.get_db()
        # Get the most recent user or create a default one
        username = db.get_most_recent_user()
        # Update the login time for this user
        db.update_user_login(username)
    
    def change_screen(self, screen_name):
        """Change to the specified screen with a slide transition."""
        self.root.transition = SlideTransition(direction='left')
        self.root.current = screen_name
    
    def go_back(self):
        """Navigate back to the main menu."""
        self.root.transition = SlideTransition(direction='right')
        self.root.current = 'main_menu'

    def on_stop(self):
        """Called when the application stops."""
        # Close the database connection
        if self.db_manager:
            self.db_manager.close()

if __name__ == "__main__":
    AHLingo().run()
