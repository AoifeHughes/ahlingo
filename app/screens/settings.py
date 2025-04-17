# -*- coding: utf-8 -*-
import os
from kivy.properties import ListProperty
from kivymd.uix.screen import MDScreen
from kivymd.uix.menu import MDDropdownMenu
from kivymd.uix.toolbar import MDTopAppBar
from app.screens.common.settings_item import SettingsItem
from content.database.database_singleton import DatabaseManager

# KV string for SettingsScreen
KV_SETTINGS = '''
<SettingsScreen>:
    MDBoxLayout:
        orientation: 'vertical'

        # Colored Spacer Matching Toolbar (only shown in windowed iOS mode)
        BoxLayout:
            size_hint_y: None
            height: "22dp" if root.should_show_spacer() else 0
            opacity: 1 if root.should_show_spacer() else 0
            canvas.before:
                Color:
                    rgba: get_color_from_hex("#1976D2")
                Rectangle:
                    pos: self.pos
                    size: self.size
        
        MDTopAppBar:
            id: toolbar
            title: "Settings"
            elevation: 0
            pos_hint: {"top": 1}
            left_action_items: [["arrow-left", lambda x: app.go_back()]]
            md_bg_color: get_color_from_hex("#1976D2")
            specific_text_color: get_color_from_hex("#FFFFFF")
        
        MDBoxLayout:
            orientation: 'vertical'
            padding: "16dp"
            spacing: "16dp"
            
            ScrollView:
                do_scroll_x: False
                do_scroll_y: True
                
                MDBoxLayout:
                    orientation: 'vertical'
                    adaptive_height: True
                    padding: "8dp"
                    spacing: "16dp"
                    
                    SettingsItem:
                        title: "Language"
                        
                        MDRaisedButton:
                            id: language_button
                            text: "Select Language"
                            on_release: root.show_language_menu()
                            size_hint_x: 1
                    
                    SettingsItem:
                        title: "Difficulty"
                        
                        MDRaisedButton:
                            id: difficulty_button
                            text: "Select Difficulty"
                            on_release: root.show_difficulty_menu()
                            size_hint_x: 1
                    
                    SettingsItem:
                        title: "API Key"
                        
                        MDTextField:
                            id: api_key_field
                            hint_text: "Enter API Key"
                            helper_text: "Required for external services"
                            helper_text_mode: "on_focus"
                            size_hint_x: 1
                    
                    SettingsItem:
                        title: "API URL"
                        
                        MDTextField:
                            id: api_url_field
                            hint_text: "Enter API URL"
                            helper_text: "URL for API services"
                            helper_text_mode: "on_focus"
                            size_hint_x: 1
                    
                    SettingsItem:
                        title: "Hostname"
                        
                        MDTextField:
                            id: hostname_field
                            hint_text: "Enter Hostname"
                            helper_text: "Server hostname"
                            helper_text_mode: "on_focus"
                            size_hint_x: 1
                    
                    SettingsItem:
                        title: "Username"
                        
                        MDTextField:
                            id: username_field
                            hint_text: "Enter Username"
                            helper_text: "Your username"
                            helper_text_mode: "on_focus"
                            size_hint_x: 1
                    
                    MDRaisedButton:
                        text: "Save Settings"
                        on_release: root.save_settings()
                        size_hint_x: 1
                        pos_hint: {"center_x": 0.5}
                        md_bg_color: get_color_from_hex("#4CAF50")
                        padding: "12dp"
'''

class SettingsScreen(MDScreen):
    """Settings screen of the AHLingo app."""
    language_menu = None
    difficulty_menu = None
    languages = ListProperty([])
    difficulties = ListProperty([])
    
    def should_show_spacer(self):
        """Check if the colored spacer should be shown based on iOS windowed mode."""
        return os.environ.get("KIVY_BUILD") == "ios" and os.environ.get("IOS_IS_WINDOWED") == "True"
    
    def on_enter(self):
        """Called when the screen is entered."""
        self.load_settings()
        self.load_languages()
        self.load_difficulties()
    
    def load_settings(self):
        """Load user settings from the database."""
        db_manager = DatabaseManager()
        db = db_manager.get_db()
        settings = db.get_user_settings()
        
        # Set text field values from settings
        if 'api_key' in settings:
            self.ids.api_key_field.text = settings['api_key']
        if 'api_url' in settings:
            self.ids.api_url_field.text = settings['api_url']
        if 'hostname' in settings:
            self.ids.hostname_field.text = settings['hostname']
        if 'username' in settings:
            self.ids.username_field.text = settings['username']
        if 'language' in settings:
            self.ids.language_button.text = settings['language']
        if 'difficulty' in settings:
            self.ids.difficulty_button.text = settings['difficulty']
    
    def load_languages(self):
        """Load available languages from the database."""
        db_manager = DatabaseManager()
        db = db_manager.get_db()
        self.languages = db.get_languages()
        if not self.languages:
            self.languages = ["English", "Spanish", "French", "German", "Italian"]
    
    def load_difficulties(self):
        """Load available difficulty levels from the database."""
        db_manager = DatabaseManager()
        db = db_manager.get_db()
        self.difficulties = db.get_difficulty_levels()
        if not self.difficulties:
            self.difficulties = ["Beginner", "Intermediate", "Advanced"]
    
    def show_language_menu(self):
        """Show dropdown menu for language selection."""
        menu_items = [
            {
                "text": lang,
                "viewclass": "OneLineListItem",
                "on_release": lambda x=lang: self.set_language(x),
            } for lang in self.languages
        ]
        
        self.language_menu = MDDropdownMenu(
            caller=self.ids.language_button,
            items=menu_items,
            width_mult=4,
        )
        self.language_menu.open()
    
    def set_language(self, language):
        """Set the selected language."""
        self.ids.language_button.text = language
        if self.language_menu:
            self.language_menu.dismiss()
    
    def show_difficulty_menu(self):
        """Show dropdown menu for difficulty selection."""
        menu_items = [
            {
                "text": diff,
                "viewclass": "OneLineListItem",
                "on_release": lambda x=diff: self.set_difficulty(x),
            } for diff in self.difficulties
        ]
        
        self.difficulty_menu = MDDropdownMenu(
            caller=self.ids.difficulty_button,
            items=menu_items,
            width_mult=4,
        )
        self.difficulty_menu.open()
    
    def set_difficulty(self, difficulty):
        """Set the selected difficulty."""
        self.ids.difficulty_button.text = difficulty
        if self.difficulty_menu:
            self.difficulty_menu.dismiss()
    
    def save_settings(self):
        """Save settings to the database."""
        db_manager = DatabaseManager()
        db = db_manager.get_db()
        username = self.ids.username_field.text
        
        # If username is empty, use the most recent user
        if not username:
            username = db.get_most_recent_user()
            self.ids.username_field.text = username
        
        # Save all settings
        db.set_user_setting(username, 'api_key', self.ids.api_key_field.text)
        db.set_user_setting(username, 'api_url', self.ids.api_url_field.text)
        db.set_user_setting(username, 'hostname', self.ids.hostname_field.text)
        db.set_user_setting(username, 'language', self.ids.language_button.text)
        db.set_user_setting(username, 'difficulty', self.ids.difficulty_button.text)
        
        # Show confirmation (in a real app, you'd use a snackbar or dialog)
        print("Settings saved successfully")
