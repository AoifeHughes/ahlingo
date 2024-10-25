from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.button import MDRaisedButton
from kivymd.uix.toolbar import MDTopAppBar
from kivymd.uix.label import MDLabel
from kivymd.uix.list import MDList, OneLineListItem, TwoLineListItem
from kivymd.uix.scrollview import MDScrollView
from kivymd.uix.card import MDCard
from kivy.metrics import dp
from kivy.storage.jsonstore import JsonStore
from kivy.properties import StringProperty
import random

class MessageBubble(MDCard):
    message = StringProperty()
    
    def __init__(self, speaker, message, is_right=False, **kwargs):
        super().__init__(**kwargs)
        self.orientation = 'vertical'
        self.size_hint_y = None
        self.height = dp(60)  # Adjust based on content
        self.padding = dp(8)
        self.spacing = dp(4)
        self.radius = [dp(15)]
        
        # Set different colors and alignment based on speaker
        if is_right:
            self.md_bg_color = (0.2, 0.6, 1, 1)  # Blue for speaker2
            self.pos_hint = {'right': 0.98, 'center_y': 0.5}
            self.size_hint_x = 0.8
        else:
            self.md_bg_color = (1, 0.4, 0.4, 1)  # Red for speaker1
            self.pos_hint = {'x': 0.02, 'center_y': 0.5}
            self.size_hint_x = 0.8
        
        # Add speaker label
        speaker_label = MDLabel(
            text=speaker,
            theme_text_color="Custom",
            text_color=(1, 1, 1, 1),
            size_hint_y=None,
            height=dp(20),
            bold=True
        )
        
        # Add message label
        message_label = MDLabel(
            text=message,
            theme_text_color="Custom",
            text_color=(1, 1, 1, 1),
            size_hint_y=None
        )
        message_label.bind(texture_size=lambda instance, value: setattr(instance, 'height', value[1]))
        
        self.add_widget(speaker_label)
        self.add_widget(message_label)
        
        # Update card height based on content
        self.height = speaker_label.height + message_label.height + dp(16)

class ConversationScreen(MDScreen):
    def __init__(self, db, **kwargs):
        super().__init__(**kwargs)
        self.db = db
        self.name = 'conversation'
        self.current_summary = None
        self.current_exercise_id = None
        
        # Create main layout
        self.main_layout = MDBoxLayout(orientation='vertical')
        
        # Create both views
        self.topic_view = self.create_topic_view()
        self.exercise_view = self.create_exercise_view()
        
        # Start with topic view
        self.main_layout.add_widget(self.topic_view)
        self.add_widget(self.main_layout)
    
    def create_topic_view(self):
        layout = MDBoxLayout(orientation='vertical')
        
        # Top toolbar with back button
        toolbar = MDTopAppBar(
            title="Select Conversation Topic",
            left_action_items=[["arrow-left", lambda x: self.go_back_to_home()]],
            elevation=4
        )
        layout.add_widget(toolbar)
        
        # Scrollable list of topics
        scroll = MDScrollView(size_hint=(1, 1))
        self.topics_list = MDList()
        scroll.add_widget(self.topics_list)
        layout.add_widget(scroll)
        
        return layout
    
    def create_exercise_view(self):
        layout = MDBoxLayout(orientation='vertical', spacing=dp(8))
        
        # Top toolbar with back button
        self.exercise_toolbar = MDTopAppBar(
            title="Conversation Exercise",
            left_action_items=[["arrow-left", lambda x: self.return_to_topics()]],
            elevation=4
        )
        layout.add_widget(self.exercise_toolbar)
        
        # Add reset button
        self.reset_button = MDRaisedButton(
            text="New Conversation",
            size_hint=(None, None),
            width=dp(200),
            height=dp(48),
            pos_hint={'center_x': 0.5}
        )
        self.reset_button.bind(on_release=self.reset_exercise)
        reset_container = MDBoxLayout(
            size_hint_y=None,
            height=dp(56),
            padding=[0, dp(4), 0, dp(4)]
        )
        reset_container.add_widget(self.reset_button)
        layout.add_widget(reset_container)
        
        # Conversation messages area
        self.messages_scroll = MDScrollView(size_hint=(1, 0.7))
        self.messages_layout = MDBoxLayout(
            orientation='vertical',
            spacing=dp(8),
            size_hint_y=None,
            padding=[dp(8), dp(8), dp(8), dp(8)]
        )
        self.messages_layout.bind(minimum_height=self.messages_layout.setter('height'))
        self.messages_scroll.add_widget(self.messages_layout)
        layout.add_widget(self.messages_scroll)
        
        # Summary question
        self.question_label = MDLabel(
            text="What is the main topic of this conversation?",
            halign="center",
            size_hint_y=None,
            height=dp(48)
        )
        layout.add_widget(self.question_label)
        
        # Summary options buttons
        self.options_layout = MDBoxLayout(
            orientation='vertical',
            spacing=dp(8),
            size_hint_y=None,
            height=dp(180),
            padding=[dp(16), dp(8), dp(16), dp(8)]
        )
        layout.add_widget(self.options_layout)
        
        return layout
    
    def load_topics(self):
        settings = JsonStore('settings.json')
        if settings.exists('language') and settings.exists('difficulty'):
            language = settings.get('language')['value']
            difficulty = settings.get('difficulty')['value']
            
            with self.db() as db:
                topics = db.get_topics_by_language_difficulty(language, difficulty)
            
            self.topics_list.clear_widgets()
            for topic in topics:
                self.topics_list.add_widget(
                    OneLineListItem(
                        text=topic,
                        on_release=lambda x, t=topic: self.select_topic(t)
                    )
                )
    
    def select_topic(self, topic):
        settings = JsonStore('settings.json')
        if settings.exists('language') and settings.exists('difficulty'):
            language = settings.get('language')['value']
            difficulty = settings.get('difficulty')['value']
            
            with self.db() as db:
                # Get a random exercise_id for the selected topic
                db.cursor.execute("""
                    SELECT DISTINCT ce.exercise_id 
                    FROM conversation_exercises ce
                    JOIN exercises_info ei ON ce.exercise_id = ei.id
                    JOIN topics t ON ei.topic_id = t.id
                    JOIN languages l ON ei.language_id = l.id
                    JOIN difficulties d ON ei.difficulty_id = d.id
                    WHERE t.topic = ? AND l.language = ? AND d.difficulty_level = ?
                    ORDER BY RANDOM() LIMIT 1
                """, (topic, language, difficulty))
                
                result = db.cursor.fetchone()
                if result:
                    exercise_id = result[0]
                    self.current_exercise_id = exercise_id
                    self.load_conversation(exercise_id)
                    self.switch_to_exercise()
    
    def load_conversation(self, exercise_id):
        with self.db() as db:
            # Get conversation messages
            db.cursor.execute("""
                SELECT speaker, message, conversation_order 
                FROM conversation_exercises 
                WHERE exercise_id = ? 
                ORDER BY conversation_order
            """, (exercise_id,))
            messages = db.cursor.fetchall()
            
            # Get correct summary
            db.cursor.execute("""
                SELECT summary 
                FROM conversation_summaries 
                WHERE exercise_id = ?
            """, (exercise_id,))
            correct_summary = db.cursor.fetchone()[0]
            self.current_summary = correct_summary
            
            # Get two random different summaries
            db.cursor.execute("""
                SELECT summary 
                FROM conversation_summaries 
                WHERE exercise_id != ? 
                ORDER BY RANDOM() 
                LIMIT 2
            """, (exercise_id,))
            other_summaries = [row[0] for row in db.cursor.fetchall()]
            
            # Display conversation
            self.messages_layout.clear_widgets()
            for msg in messages:
                is_right = "2" in msg['speaker'].lower()
                self.messages_layout.add_widget(
                    MessageBubble(msg['speaker'], msg['message'], is_right)
                )
            
            # Create and shuffle summary options
            summary_options = [correct_summary] + other_summaries
            random.shuffle(summary_options)
            
            # Create summary buttons
            self.options_layout.clear_widgets()
            for summary in summary_options:
                btn = MDRaisedButton(
                    text=summary,
                    size_hint=(1, None),
                    height=dp(48),
                    md_bg_color=(0.2, 0.6, 1, 1)
                )
                btn.bind(on_release=lambda x, s=summary: self.check_answer(s))
                self.options_layout.add_widget(btn)
    
    def check_answer(self, selected_summary):
        # Get all buttons
        for child in self.options_layout.children:
            if isinstance(child, MDRaisedButton):
                if child.text == selected_summary:
                    # Update color based on correctness
                    if selected_summary == self.current_summary:
                        child.md_bg_color = (0, 0.8, 0, 1)  # Green for correct
                    else:
                        child.md_bg_color = (0.8, 0, 0, 1)  # Red for incorrect
    
    def reset_exercise(self, *args):
        if self.current_exercise_id:
            self.load_conversation(self.current_exercise_id)
    
    def switch_to_exercise(self):
        self.main_layout.clear_widgets()
        self.main_layout.add_widget(self.exercise_view)
    
    def return_to_topics(self):
        self.main_layout.clear_widgets()
        self.main_layout.add_widget(self.topic_view)
        self.current_summary = None
        self.current_exercise_id = None
    
    def go_back_to_home(self):
        self.manager.current = 'home'