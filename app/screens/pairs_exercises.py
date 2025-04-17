# -*- coding: utf-8 -*-
import os
import random
from kivymd.uix.screen import MDScreen
from kivymd.uix.toolbar import MDTopAppBar
from kivymd.app import MDApp
from kivymd.uix.button import MDRaisedButton
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.scrollview import MDScrollView
from kivymd.uix.gridlayout import MDGridLayout
from kivymd.uix.label import MDLabel
from kivymd.uix.card import MDCard
from kivy.utils import get_color_from_hex
from kivy.properties import StringProperty, ListProperty, BooleanProperty, NumericProperty, ObjectProperty
from kivy.clock import Clock
from content.database.database_singleton import DatabaseManager

# KV string for PairsExercisesScreen
KV_PAIRS_EXERCISES = '''
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

<PairButton>:
    size_hint: 1, None
    height: "60dp"
    size_hint_min_y: "60dp"
    md_bg_color: get_color_from_hex("#2196F3") if not root.selected and not root.matched else get_color_from_hex("#81C784") if root.matched else get_color_from_hex("#E0E0E0")
    on_release: root.on_button_press()
    disabled: root.matched
    line_color: get_color_from_hex("#CCCCCC")
    line_width: 1
    halign: "center"
    valign: "center"
    text_size: self.width - dp(16), None
    padding: [8, 8, 8, 8]
    text_halign: "center"

<PairsExercisesScreen>:
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
            title: "Pairs Exercises" if root.current_topic == "" else "Match the pairs"
            elevation: 0
            pos_hint: {"top": 1}
            left_action_items: [["arrow-left", lambda x: root.go_back()]]
            right_action_items: [["refresh", lambda x: root.refresh_exercise()]] if root.current_topic != "" else []
            md_bg_color: get_color_from_hex("#1976D2")
            specific_text_color: get_color_from_hex("#FFFFFF")
        
        # Topic selection screen
        MDBoxLayout:
            id: topic_screen
            orientation: 'vertical'
            padding: "16dp"
            opacity: 1 if root.current_topic == "" else 0
            height: self.minimum_height if root.current_topic == "" else 0
            size_hint_y: 1 if root.current_topic == "" else 0.1
            disabled: root.current_topic != ""

            
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
                    
        # Pairs game screen
        MDBoxLayout:
            id: game_screen
            orientation: 'vertical'
            padding: "0dp"
            opacity: 0 if root.current_topic == "" else 1
            height: 0 if root.current_topic == "" else self.parent.height
            size_hint_y: 1 if root.current_topic != "" else None
            disabled: root.current_topic == ""
            
            # Score display
            MDBoxLayout:
                size_hint_y: None
                height: "40dp"
                
                MDLabel:
                    text: "Correct: " + str(root.correct_count)
                    halign: "center"
                    size_hint_x: 0.5
                
                MDLabel:
                    text: "Incorrect: " + str(root.incorrect_count)
                    halign: "center"
                    size_hint_x: 0.5
            
            # Game area
            MDBoxLayout:
                orientation: 'horizontal'
                size_hint_y: 1
                
                # Left column (language_1)
                MDBoxLayout:
                    orientation: 'vertical'
                    size_hint_x: 0.5
                    size_hint_y: 1
                    padding: ["2dp", "2dp", "1dp", "2dp"]
                    
                    MDScrollView:
                        do_scroll_x: False
                        do_scroll_y: True
                        size_hint_y: 1
                        
                        MDGridLayout:
                            id: left_column
                            cols: 1
                            spacing: "8dp"
                            padding: [0, "20dp", 0, "20dp"]
                            size_hint_y: 1
                            adaptive_height: False
                
                # Right column (language_2)
                MDBoxLayout:
                    orientation: 'vertical'
                    size_hint_x: 0.5
                    size_hint_y: 1
                    padding: ["1dp", "2dp", "2dp", "2dp"]
                    
                    MDScrollView:
                        do_scroll_x: False
                        do_scroll_y: True
                        size_hint_y: 1
                        
                        MDGridLayout:
                            id: right_column
                            cols: 1
                            spacing: "8dp"
                            padding: [0, "20dp", 0, "20dp"]
                            size_hint_y: 1
                            adaptive_height: False
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

class PairButton(MDRaisedButton):
    """Button widget for pair items."""
    text = StringProperty("")
    pair_id = NumericProperty(0)
    column = NumericProperty(0)  # 0 for left, 1 for right
    selected = BooleanProperty(False)
    matched = BooleanProperty(False)
    on_select_callback = ObjectProperty(None, allownone=True)
    
    def __init__(self, **kwargs):
        self.on_select_callback = kwargs.pop('on_select_callback', None)
        super(PairButton, self).__init__(**kwargs)
    
    def on_button_press(self):
        if not self.matched and self.on_select_callback is not None:
            self.on_select_callback(self)

class PairsExercisesScreen(MDScreen):
    """Pairs exercises screen of the AHLingo app."""
    current_topic = StringProperty("")
    correct_count = NumericProperty(0)
    incorrect_count = NumericProperty(0)
    pairs_data = ListProperty([])
    selected_left = ObjectProperty(None, allownone=True)
    selected_right = ObjectProperty(None, allownone=True)
    
    def __init__(self, **kwargs):
        super(PairsExercisesScreen, self).__init__(**kwargs)
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
        self.current_topic = topic_name
        self.correct_count = 0
        self.incorrect_count = 0
        self.selected_left = None
        self.selected_right = None
        
        # Load pairs for the selected topic
        self.load_pairs()
    
    def load_pairs(self):
        """Load pairs exercises for the selected topic."""
        settings = self.db.get_user_settings()
        language = settings.get("language", "French")
        level = settings.get("difficulty", "Beginner")
        
        # Get pairs from database
        pairs = self.db.get_random_pair_exercise(language, level, self.current_topic, limit=10)
        self.pairs_data = pairs
        
        # Clear existing columns
        self.ids.left_column.clear_widgets()
        self.ids.right_column.clear_widgets()
        
        # Create lists for left and right columns
        left_items = []
        right_items = []
        
        for i, pair in enumerate(pairs):
            left_items.append((pair["language_1_content"], i))
            right_items.append((pair["language_2_content"], i))
        
        # Shuffle both columns
        random.shuffle(left_items)
        random.shuffle(right_items)
        

        # Add items to columns
        for text, pair_id in left_items:
            btn = PairButton(
                text=text,
                pair_id=pair_id,
                column=0,
                on_select_callback=self.on_pair_button_selected
            )
            self.ids.left_column.add_widget(btn)
        
        for text, pair_id in right_items:
            btn = PairButton(
                text=text,
                pair_id=pair_id,
                column=1,
                on_select_callback=self.on_pair_button_selected
            )
            self.ids.right_column.add_widget(btn)
    
    def on_pair_button_selected(self, button):
        """Handle button selection in the pairs game."""
        # If button is already selected, deselect it
        if button.selected:
            button.selected = False
            if button.column == 0:
                self.selected_left = None
            else:
                self.selected_right = None
            return
        
        # Select the button
        button.selected = True
        
        # Store the selected button
        if button.column == 0:
            if self.selected_left:
                self.selected_left.selected = False
            self.selected_left = button
        else:
            if self.selected_right:
                self.selected_right.selected = False
            self.selected_right = button
        
        # Check if we have a pair selected
        if self.selected_left and self.selected_right:
            # Check if they match
            if self.selected_left.pair_id == self.selected_right.pair_id:
                # Correct match
                self.selected_left.matched = True
                self.selected_right.matched = True
                self.correct_count += 1
                # Reset selection state after a correct match
                self.selected_left = None
                self.selected_right = None
            else:
                # Incorrect match
                self.incorrect_count += 1
                # Reset selection after a short delay
                Clock.schedule_once(self.reset_selection, 1)
    
    def reset_selection(self, dt):
        """Reset button selection."""
        if self.selected_left:
            self.selected_left.selected = False
        if self.selected_right:
            self.selected_right.selected = False
        self.selected_left = None
        self.selected_right = None
    
    def go_back(self):
        """Handle back button press."""
        if self.current_topic:
            # If in game screen, go back to topic selection
            self.current_topic = ""
            self.reset_selection(0)
        else:
            # If in topic selection, go back to previous screen
            app = MDApp.get_running_app()
            app.go_back()
            
    def refresh_exercise(self):
        """Refresh the current exercise with a new random one for the same topic."""
        if self.current_topic:
            # Reset stats
            self.correct_count = 0
            self.incorrect_count = 0
            self.selected_left = None
            self.selected_right = None
            
            # Load new pairs for the same topic
            self.load_pairs()
