# -*- coding: utf-8 -*-
from kivy.lang import Builder
from kivy.uix.screenmanager import SlideTransition
from kivymd.app import MDApp
from kivymd.uix.screen import MDScreen
from kivymd.uix.button import MDRaisedButton
from kivymd.uix.boxlayout import MDBoxLayout

# Define the KV language string for the app
KV = '''
#:import get_color_from_hex kivy.utils.get_color_from_hex

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

<MainMenuScreen>:
    MDBoxLayout:
        orientation: 'vertical'
        padding: "16dp"
        spacing: "16dp"
        
        MDTopAppBar:
            title: "AHLingo"
            elevation: 4
            md_bg_color: get_color_from_hex("#1976D2")
            specific_text_color: get_color_from_hex("#FFFFFF")
            
        MDBoxLayout:
            orientation: 'vertical'
            padding: "16dp"
            spacing: "24dp"
            adaptive_height: True
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
                on_release: app.change_screen('pairs_exercises')
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

<PairsExercisesScreen>:
    MDBoxLayout:
        orientation: 'vertical'
        
        MDTopAppBar:
            title: "Pairs Exercises"
            elevation: 4
            left_action_items: [["arrow-left", lambda x: app.go_back()]]
            md_bg_color: get_color_from_hex("#1976D2")
            specific_text_color: get_color_from_hex("#FFFFFF")
        
        MDBoxLayout:
            orientation: 'vertical'
            padding: "16dp"
            
            MDLabel:
                text: "Pairs Exercises Content"
                halign: "center"

<ConversationExercisesScreen>:
    MDBoxLayout:
        orientation: 'vertical'
        
        MDTopAppBar:
            title: "Conversation Exercises"
            elevation: 4
            left_action_items: [["arrow-left", lambda x: app.go_back()]]
            md_bg_color: get_color_from_hex("#1976D2")
            specific_text_color: get_color_from_hex("#FFFFFF")
        
        MDBoxLayout:
            orientation: 'vertical'
            padding: "16dp"
            
            MDLabel:
                text: "Conversation Exercises Content"
                halign: "center"

<TranslationExercisesScreen>:
    MDBoxLayout:
        orientation: 'vertical'
        
        MDTopAppBar:
            title: "Translation Exercises"
            elevation: 4
            left_action_items: [["arrow-left", lambda x: app.go_back()]]
            md_bg_color: get_color_from_hex("#1976D2")
            specific_text_color: get_color_from_hex("#FFFFFF")
        
        MDBoxLayout:
            orientation: 'vertical'
            padding: "16dp"
            
            MDLabel:
                text: "Translation Exercises Content"
                halign: "center"

<ChatbotScreen>:
    MDBoxLayout:
        orientation: 'vertical'
        
        MDTopAppBar:
            title: "Chatbot"
            elevation: 4
            left_action_items: [["arrow-left", lambda x: app.go_back()]]
            md_bg_color: get_color_from_hex("#1976D2")
            specific_text_color: get_color_from_hex("#FFFFFF")
        
        MDBoxLayout:
            orientation: 'vertical'
            padding: "16dp"
            
            MDLabel:
                text: "Chatbot Content"
                halign: "center"

<SettingsScreen>:
    MDBoxLayout:
        orientation: 'vertical'
        
        MDTopAppBar:
            title: "Settings"
            elevation: 4
            left_action_items: [["arrow-left", lambda x: app.go_back()]]
            md_bg_color: get_color_from_hex("#1976D2")
            specific_text_color: get_color_from_hex("#FFFFFF")
        
        MDBoxLayout:
            orientation: 'vertical'
            padding: "16dp"
            
            MDLabel:
                text: "Settings Content"
                halign: "center"
'''

class MainMenuScreen(MDScreen):
    pass

class PairsExercisesScreen(MDScreen):
    pass

class ConversationExercisesScreen(MDScreen):
    pass

class TranslationExercisesScreen(MDScreen):
    pass

class ChatbotScreen(MDScreen):
    pass

class SettingsScreen(MDScreen):
    pass

class AHLingo(MDApp):
    def build(self):
        self.theme_cls.primary_palette = "Blue"
        self.theme_cls.primary_hue = "700"
        self.theme_cls.theme_style = "Light"
        
        # Load the KV string
        return Builder.load_string(KV)
    
    def change_screen(self, screen_name):
        """Change to the specified screen with a slide transition."""
        self.root.transition = SlideTransition(direction='left')
        self.root.current = screen_name
    
    def go_back(self):
        """Navigate back to the main menu."""
        self.root.transition = SlideTransition(direction='right')
        self.root.current = 'main_menu'

if __name__ == "__main__":
    AHLingo().run()
