# main.py modifications
from kivymd.app import MDApp
from kivymd.uix.screenmanager import MDScreenManager
from kivy.core.window import Window
from kivy.utils import platform
from AHLingo.screens.main_screen import HomeScreen
from AHLingo.screens.settings import SettingsScreen
from AHLingo.screens.games.pairs.pairs_menu import PairsScreen
from AHLingo.screens.games.conversations.conversations_menu import ConversationScreen
from AHLingo.database.database_manager import LanguageDB
from kivy.storage.jsonstore import JsonStore
import os
from kivy.config import Config

Config.set('input', 'mouse', 'mouse,multitouch_on_demand')

class LanguageLearningApp(MDApp):
    def build(self):
        if platform not in ('android', 'ios'):
            Window.size = (400, 800)
        
        self.theme_cls.primary_palette = "Blue"
        self.theme_cls.theme_style = "Light"
        
        self.db = lambda: LanguageDB("./database/languageLearningDatabase.db")
        
        # Create screen manager
        sm = MDScreenManager()
        sm.add_widget(HomeScreen(self.db))
        sm.add_widget(PairsScreen(self.db))
        sm.add_widget(ConversationScreen(self.db))
        sm.add_widget(SettingsScreen(self.db))
        
        
        # Check if settings exist and are complete
        print("Checking settings...")
        initial_screen = 'home'
        if not os.path.exists('settings.json'):
            initial_screen = 'settings'
        else:
            settings = JsonStore('settings.json')
            required_settings = ['username', 'language', 'difficulty']
            if not all(settings.exists(setting) for setting in required_settings):
                initial_screen = 'settings'
        
        sm.current = initial_screen
        print(f"Initial screen: {initial_screen}")
        return sm
