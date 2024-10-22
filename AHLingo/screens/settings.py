from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.button import MDRaisedButton
from kivymd.uix.textfield import MDTextField
from kivymd.uix.label import MDLabel
from kivymd.uix.menu import MDDropdownMenu
from kivy.metrics import dp
from kivy.storage.jsonstore import JsonStore
from functools import partial

class SettingsScreen(MDScreen):
    def __init__(self, db, **kwargs):
        super().__init__(**kwargs)
        self.name = 'settings'
        self.db = db
        self.settings = JsonStore('settings.json')
        self.setup_ui()
        
    def setup_ui(self):
        # Main layout with top padding
        main_layout = MDBoxLayout(
            orientation='vertical',
            padding=[dp(16), dp(16), dp(16), dp(16)]
        )
        
        # Content layout that will be placed at the top
        content_layout = MDBoxLayout(
            orientation='vertical',
            spacing=dp(20),
            size_hint_y=None,
            height=dp(400)  # Adjust this value based on your content
        )
        
        # Title
        title = MDLabel(
            text="Settings",
            font_style="H5",
            halign="center",
            size_hint_y=None,
            height=dp(50)
        )
        content_layout.add_widget(title)
        
        # Required fields notice
        required_notice = MDLabel(
            text="* All fields are required",
            theme_text_color="Error",
            halign="center",
            size_hint_y=None,
            height=dp(30)
        )
        content_layout.add_widget(required_notice)
        
        # Username field
        self.username_field = MDTextField(
            hint_text="Username *",
            helper_text="Enter your username",
            helper_text_mode="on_error",
            required=True,
            size_hint_x=0.8,
            size_hint_y=None,
            height=dp(48),
            pos_hint={'center_x': 0.5}
        )
        content_layout.add_widget(self.username_field)
        
        # Language selector
        self.language_button = MDRaisedButton(
            text="Select Language *",
            size_hint=(None, None),
            width=dp(200),
            height=dp(48),
            pos_hint={'center_x': 0.5}
        )
        self.language_button.bind(on_release=self.show_language_menu)
        content_layout.add_widget(self.language_button)
        
        # Difficulty selector
        self.difficulty_button = MDRaisedButton(
            text="Select Difficulty *",
            size_hint=(None, None),
            width=dp(200),
            height=dp(48),
            pos_hint={'center_x': 0.5}
        )
        self.difficulty_button.bind(on_release=self.show_difficulty_menu)
        content_layout.add_widget(self.difficulty_button)
        
        # Save button
        self.save_button = MDRaisedButton(
            text="Save Settings",
            size_hint=(None, None),
            width=dp(200),
            height=dp(48),
            pos_hint={'center_x': 0.5}
        )
        self.save_button.bind(on_release=self.save_settings)
        content_layout.add_widget(self.save_button)
        
        # Add the content layout to a top-aligned box
        top_box = MDBoxLayout(
            orientation='vertical',
            size_hint_y=None,
            height=content_layout.height
        )
        top_box.add_widget(content_layout)
        
        # Add top box to main layout
        main_layout.add_widget(top_box)
        
        # Add a spacer box to push everything up
        spacer = MDBoxLayout(orientation='vertical')
        main_layout.add_widget(spacer)
        
        self.add_widget(main_layout)
        self.setup_menus()
        self.load_existing_settings()
    
    def setup_menus(self):
        with self.db() as db:
            languages = db.get_languages()
            difficulties = db.get_difficulty_levels()
        
        self.language_menu = MDDropdownMenu(
            caller=self.language_button,
            items=[{
                "text": lang,
                "viewclass": "OneLineListItem",
                "on_release": partial(self.set_language, lang)
            } for lang in languages],
            width_mult=4
        )
        
        self.difficulty_menu = MDDropdownMenu(
            caller=self.difficulty_button,
            items=[{
                "text": diff,
                "viewclass": "OneLineListItem",
                "on_release": partial(self.set_difficulty, diff)
            } for diff in difficulties],
            width_mult=4
        )
    
    def load_existing_settings(self):
        if self.settings.exists('username'):
            self.username_field.text = self.settings.get('username')['value']
        if self.settings.exists('language'):
            self.language_button.text = self.settings.get('language')['value']
        if self.settings.exists('difficulty'):
            self.difficulty_button.text = self.settings.get('difficulty')['value']
    
    def show_language_menu(self, button):
        self.language_menu.open()
    
    def show_difficulty_menu(self, button):
        self.difficulty_menu.open()
    
    def set_language(self, language, *args):
        self.language_button.text = language
        self.language_menu.dismiss()
    
    def set_difficulty(self, difficulty, *args):
        self.difficulty_button.text = difficulty
        self.difficulty_menu.dismiss()
    
    def validate_settings(self):
        if not self.username_field.text:
            self.username_field.error = True
            return False
        if self.language_button.text == "Select Language *":
            return False
        if self.difficulty_button.text == "Select Difficulty *":
            return False
        return True
    
    def save_settings(self, *args):
        if not self.validate_settings():
            return
        
        # Save settings
        self.settings.put('username', value=self.username_field.text)
        self.settings.put('language', value=self.language_button.text)
        self.settings.put('difficulty', value=self.difficulty_button.text)
        
        # Create user if doesn't exist
        with self.db() as db:
            db.cursor.execute(
                "INSERT OR IGNORE INTO users (name) VALUES (?)",
                (self.username_field.text,)
            )
        
        # Navigate to home screen
        self.manager.current = 'home'