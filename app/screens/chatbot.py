# -*- coding: utf-8 -*-
import os
from kivymd.uix.screen import MDScreen
from kivymd.uix.toolbar import MDTopAppBar

# KV string for ChatbotScreen
KV_CHATBOT = '''
<ChatbotScreen>:
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
            title: "Chatbot"
            elevation: 0
            pos_hint: {"top": 1}
            left_action_items: [["arrow-left", lambda x: app.go_back()]]
            md_bg_color: get_color_from_hex("#1976D2")
            specific_text_color: get_color_from_hex("#FFFFFF")
        
        MDBoxLayout:
            orientation: 'vertical'
            padding: "16dp"
            
            MDLabel:
                text: "Chatbot Content"
                halign: "center"
'''

class ChatbotScreen(MDScreen):
    """Chatbot screen of the AHLingo app."""
    
    def should_show_spacer(self):
        """Check if the colored spacer should be shown based on iOS windowed mode."""
        return os.environ.get("KIVY_BUILD") == "ios" and os.environ.get("IOS_IS_WINDOWED") == "True"
