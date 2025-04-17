# -*- coding: utf-8 -*-
import os
from kivymd.uix.screen import MDScreen
from kivymd.uix.toolbar import MDTopAppBar

# KV string for MainMenuScreen
KV_MAIN_MENU = '''
<MainMenuScreen>:
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
            title: "AHLingo"
            elevation: 0
            pos_hint: {"top": 1}
            md_bg_color: get_color_from_hex("#1976D2")
            specific_text_color: get_color_from_hex("#FFFFFF")
        
        MDBoxLayout:
            orientation: 'vertical'
            padding: "16dp"
            spacing: "24dp"
            pos_hint: {"center_x": 0.5, "center_y": 0.5}
            
            MDLabel:
                text: "Language Learning App"
                font_style: "H5"
                halign: "center"
                size_hint_y: None
                height: self.texture_size[1]
                padding_y: "24dp"
            
            MenuButton:
                text: "Pairs Exercises"
                on_release: app.change_screen('topic_selection')
                pos_hint: {"center_x": 0.5}
            
            MenuButton:
                text: "Conversation Exercises"
                on_release: app.change_screen('conversation_exercises')
                pos_hint: {"center_x": 0.5}
            
            MenuButton:
                text: "Translation Exercises"
                on_release: app.change_screen('translation_exercises')
                pos_hint: {"center_x": 0.5}
            
            MenuButton:
                text: "Chatbot"
                on_release: app.change_screen('chatbot')
                pos_hint: {"center_x": 0.5}
            
            MenuButton:
                text: "Settings"
                on_release: app.change_screen('settings')
                pos_hint: {"center_x": 0.5}
            
            Widget:
                size_hint_y: None
                height: "24dp"
'''

class MainMenuScreen(MDScreen):
    """Main menu screen of the AHLingo app."""
    
    def should_show_spacer(self):
        """Check if the colored spacer should be shown based on iOS windowed mode."""
        return os.environ.get("KIVY_BUILD") == "ios" and os.environ.get("IOS_IS_WINDOWED") == "True"
