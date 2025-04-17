# -*- coding: utf-8 -*-
import os
from kivymd.uix.screen import MDScreen
from kivymd.uix.toolbar import MDTopAppBar
from kivymd.app import MDApp
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.scrollview import MDScrollView
from kivymd.uix.gridlayout import MDGridLayout
from kivymd.uix.label import MDLabel
from kivymd.uix.card import MDCard
from kivy.utils import get_color_from_hex
from kivy.properties import StringProperty
from kivy.clock import Clock
from content.database.database_singleton import DatabaseManager

# KV string for TopicSelectionScreen
KV_TOPIC_SELECTION = '''
<TopicCard>:
    orientation: "vertical"
    size_hint_y: None
    height: "80dp"
    padding: "8dp"
    radius: [10, 10, 10, 10]
    md_bg_color: get_color_from_hex("#E0E0E0")
    ripple_behavior: True
    
    MDLabel:
        text: root.topic_name
        halign: "center"
        font_style: "H6"

<TopicSelectionScreen>:
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
            title: "Pairs Exercises"
            elevation: 0
            pos_hint: {"top": 1}
            left_action_items: [["arrow-left", lambda x: root.go_back()]]
            md_bg_color: get_color_from_hex("#1976D2")
            specific_text_color: get_color_from_hex("#FFFFFF")
        
        MDBoxLayout:
            orientation: 'vertical'
            padding: "16dp"
            
            MDLabel:
                text: "Select a Topic"
                halign: "center"
                font_style: "H5"
                size_hint_y: None
                height: "50dp"
            
            MDScrollView:
                do_scroll_x: False
                do_scroll_y: True
                
                MDGridLayout:
                    id: topics_grid
                    cols: 1
                    spacing: "8dp"
                    padding: "8dp"
                    size_hint_y: None
                    height: self.minimum_height
'''

class TopicCard(MDCard):
    """Card widget for displaying a topic."""
    topic_name = StringProperty("")
    
    def __init__(self, topic_name, on_press_callback, **kwargs):
        super(TopicCard, self).__init__(**kwargs)
        self.topic_name = topic_name
        self.on_press_callback = on_press_callback
    
    def on_touch_up(self, touch):
        if self.collide_point(*touch.pos) and touch.is_mouse_scrolling is False:
            self.on_press_callback(self.topic_name)
        return super(TopicCard, self).on_touch_up(touch)

class TopicSelectionScreen(MDScreen):
    """Topic selection screen for pairs exercises."""
    
    def __init__(self, **kwargs):
        super(TopicSelectionScreen, self).__init__(**kwargs)
        self.db = DatabaseManager().get_db()
        Clock.schedule_once(self.load_topics, 0.1)
    
    def should_show_spacer(self):
        """Check if the colored spacer should be shown based on iOS windowed mode."""
        return os.environ.get("KIVY_BUILD") == "ios" and os.environ.get("IOS_IS_WINDOWED") == "True"
    
    def load_topics(self, dt):
        """Load topics from the database based on user settings."""
        settings = self.db.get_user_settings()
        print("User settings:", settings)
        language = settings.get("language", "French")  # Default to French if not set
        level = settings.get("difficulty", "Beginner")  # Default to Beginner if not set
        
        topics = self.db.get_topics_by_language_difficulty(language, level)
        
        # Clear existing topics
        self.ids.topics_grid.clear_widgets()
        
        # Add topics to the grid
        for topic in topics:
            topic_card = TopicCard(topic_name=topic, on_press_callback=self.select_topic)
            self.ids.topics_grid.add_widget(topic_card)
    
    def select_topic(self, topic_name):
        """Handle topic selection."""
        # Navigate to the pairs game screen with the selected topic
        app = MDApp.get_running_app()
        app.root.get_screen('pairs_game').set_topic(topic_name)
        app.change_screen('pairs_game')
    
    def go_back(self):
        """Handle back button press."""
        # Go back to the main menu
        app = MDApp.get_running_app()
        app.go_back()
