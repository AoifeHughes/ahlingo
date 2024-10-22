from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.button import MDFillRoundFlatButton
from kivymd.uix.toolbar import MDTopAppBar
from kivymd.uix.label import MDLabel
from kivymd.uix.list import MDList, OneLineListItem
from kivymd.uix.scrollview import MDScrollView
from kivymd.uix.card import MDCard
from kivy.metrics import dp
from kivy.storage.jsonstore import JsonStore
import random
from kivy.properties import StringProperty, ColorProperty
from kivy.utils import get_color_from_hex

class MessageBubble(MDCard):
    text = StringProperty()
    speaker = StringProperty()
    background_color = ColorProperty()
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.size_hint_y = None
        self.height = dp(60)  # Will be adjusted based on content
        self.radius = [dp(20)]
        self.padding = [dp(15), dp(10)]
        self.elevation = 2
        
        # Create layout for speaker and message
        layout = MDBoxLayout(orientation='vertical', spacing=dp(4))
        
        # Speaker label
        speaker_label = MDLabel(
            text=self.speaker,
            bold=True,
            font_style='Caption',
            size_hint_y=None,
            height=dp(20)
        )
        layout.add_widget(speaker_label)
        
        # Message label
        message_label = MDLabel(
            text=self.text,
            size_hint_y=None
        )
        message_label.bind(texture_size=self._update_height)
        layout.add_widget(message_label)
        
        self.add_widget(layout)
    
    def _update_height(self, instance, value):
        # Update height based on content
        self.height = value[1] + dp(40)  # Add padding

class ConversationScreen(MDScreen):
    def __init__(self, db, **kwargs):
        super().__init__(**kwargs)
        self.name = 'conversation'
        self.db = db
        
        # Create the main layout
        self.main_layout = MDBoxLayout(orientation='vertical')
        
        # Create both views
        self.topic_view = self.create_topic_view()
        self.exercise_view = self.create_exercise_view()
        
        # Start with topic view
        self.main_layout.add_widget(self.topic_view)
        self.add_widget(self.main_layout)
        
        # Initialize state
        self.current_topic = None
        self.current_language = None
        self.current_difficulty = None
        self.correct_summary = None
        self.speaker_colors = {}
        
        # Define colors for speakers
        self.colors = {
            'speaker1': get_color_from_hex('#E3F2FD'),  # Light blue
            'speaker2': get_color_from_hex('#F3E5F5')   # Light purple
        }
    
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
        
        # Top toolbar with back button and reset
        self.exercise_toolbar = MDTopAppBar(
            title="Conversation Exercise",
            left_action_items=[["arrow-left", lambda x: self.return_to_topics()]],
            elevation=4
        )
        layout.add_widget(self.exercise_toolbar)
        
        # Add reset button
        self.reset_button = MDFillRoundFlatButton(
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
        
        # Conversation messages container
        scroll = MDScrollView(size_hint=(1, 1))
        self.conversation_layout = MDBoxLayout(
            orientation='vertical',
            spacing=dp(10),
            padding=dp(16),
            size_hint_y=None
        )
        self.conversation_layout.bind(minimum_height=self.conversation_layout.setter('height'))
        scroll.add_widget(self.conversation_layout)
        layout.add_widget(scroll)
        
        # Summary options container
        self.summary_layout = MDBoxLayout(
            orientation='vertical',
            spacing=dp(10),
            padding=dp(16),
            size_hint_y=None,
            height=dp(200)
        )
        
        # Summary prompt
        summary_prompt = MDLabel(
            text="What is this conversation about?",
            halign="center",
            size_hint_y=None,
            height=dp(40)
        )
        self.summary_layout.add_widget(summary_prompt)
        
        # Summary buttons will be added dynamically
        layout.add_widget(self.summary_layout)
        
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
            self.current_language = settings.get('language')['value']
            self.current_difficulty = settings.get('difficulty')['value']
            self.current_topic = topic
            self.load_conversation()
    
    def load_conversation(self):
        with self.db() as db:
            # Get random conversation for the topic
            db.cursor.execute("""
                SELECT ce.exercise_id, ce.conversation_order, ce.speaker, ce.message, cs.summary
                FROM conversation_exercises ce
                JOIN exercises_info ei ON ce.exercise_id = ei.id
                JOIN topics t ON ei.topic_id = t.id
                JOIN difficulties d ON ei.difficulty_id = d.id
                JOIN languages l ON ei.language_id = l.id
                JOIN conversation_summaries cs ON ce.exercise_id = cs.exercise_id
                WHERE t.topic = ? AND d.difficulty_level = ? AND l.language = ?
                ORDER BY RANDOM()
                LIMIT 1
            """, (self.current_topic, self.current_difficulty, self.current_language))
            
            conversation = db.cursor.fetchall()
            if conversation:
                exercise_id = conversation[0]['exercise_id']
                
                # Get all messages for this exercise
                db.cursor.execute("""
                    SELECT conversation_order, speaker, message
                    FROM conversation_exercises
                    WHERE exercise_id = ?
                    ORDER BY conversation_order
                """, (exercise_id,))
                messages = db.cursor.fetchall()
                
                # Get correct summary and two random other summaries
                db.cursor.execute("""
                    SELECT summary FROM conversation_summaries
                    WHERE exercise_id != ?
                    ORDER BY RANDOM() LIMIT 2
                """, (exercise_id,))
                other_summaries = [row['summary'] for row in db.cursor.fetchall()]
                
                self.correct_summary = conversation[0]['summary']
                self.display_conversation(messages, self.correct_summary, other_summaries)
    

    def display_conversation(self, messages, correct_summary, other_summaries):
        # Switch to exercise view
        self.main_layout.clear_widgets()
        self.main_layout.add_widget(self.exercise_view)
        
        # Clear previous conversation
        self.conversation_layout.clear_widgets()
        self.summary_layout.clear_widgets()
        self.speaker_colors = {}
        
        # Add messages
        for msg in messages:
            if msg['speaker'] not in self.speaker_colors:
                self.speaker_colors[msg['speaker']] = len(self.speaker_colors) + 1
            
            speaker_num = self.speaker_colors[msg['speaker']]
            color = self.colors[f'speaker{speaker_num}']
            pos_hint = {'left': 1} if speaker_num == 1 else {'right': 1}
            
            bubble = MessageBubble(
                text=msg['message'],
                speaker=msg['speaker'],
                background_color=[color[0], color[1], color[2], 0.8],
                size_hint_x=0.8,
                pos_hint=pos_hint
            )
            self.conversation_layout.add_widget(bubble)
        
        # Add summary prompt
        summary_prompt = MDLabel(
            text="What is this conversation about?",
            halign="center",
            size_hint_y=None,
            height=dp(40)
        )
        self.summary_layout.add_widget(summary_prompt)
        
        # Create and shuffle summary options
        summaries = [correct_summary] + other_summaries
        random.shuffle(summaries)
        
        # Add summary buttons
        for summary in summaries:
            # Create a container for the button
            button_container = MDBoxLayout(
                orientation='vertical',
                size_hint_y=None,
                height=dp(80),  # Adjust this value based on your needs
                padding=[dp(10), dp(5)],
                spacing=dp(5)
            )
            
            # Create the button with proper text wrapping
            btn = MDFillRoundFlatButton(
                text=summary,
                size_hint=(0.9, None),
                height=dp(70),  # Adjust this value based on your needs
                pos_hint={'center_x': 0.5},
                halign='center',
                text_size=(dp(280), None),
            )
            
            # Configure text properties for wrapping
            btn.text_size = (dp(280), None)  # Fixed width for text
            btn.line_height = 1.2
            btn.halign = 'center'
            
            # Style the button
            btn.md_bg_color = (0.9, 0.9, 0.9, 1)
            btn.text_color = (0, 0, 0, 1)
            
            # Bind the button click event
            btn.bind(on_release=lambda x, s=summary: self.check_summary(s))
            
            # Add the button to its container
            button_container.add_widget(btn)
            
            # Add the container to the summary layout
            self.summary_layout.add_widget(button_container)
            
            # Add spacing between buttons
            spacing = MDBoxLayout(
                size_hint_y=None,
                height=dp(10)
            )
            self.summary_layout.add_widget(spacing)
        
        # Update summary layout height based on content
        total_height = sum(child.height for child in self.summary_layout.children)
        self.summary_layout.height = total_height + dp(20)  # Add some padding
    def check_summary(self, selected_summary):
        # Loop through direct children of summary_layout
        for button in self.summary_layout.children:
            if isinstance(button, MDFillRoundFlatButton):
                if button.text == selected_summary:
                    if selected_summary == self.correct_summary:
                        # Selected correct answer - turn green
                        button.md_bg_color = (0, 0.8, 0, 1)  # Bright green
                        button.text_color = (1, 1, 1, 1)  # White text
                    else:
                        # Selected wrong answer - turn red
                        button.md_bg_color = (0.8, 0, 0, 1)  # Bright red
                        button.text_color = (1, 1, 1, 1)  # White text
                        # Find and highlight correct answer
                        for other_button in self.summary_layout.children:
                            if isinstance(other_button, MDFillRoundFlatButton) and other_button.text == self.correct_summary:
                                other_button.md_bg_color = (0, 0.8, 0, 1)  # Bright green
                                other_button.text_color = (1, 1, 1, 1)  # White text
                
                #button.disabled = True  # Disable all buttons after selection
    def reset_exercise(self, *args):
        if self.current_topic:
            self.load_conversation()
    
    def return_to_topics(self):
        self.main_layout.clear_widgets()
        self.main_layout.add_widget(self.topic_view)
        self.current_topic = None
    
    def go_back_to_home(self):
        self.manager.current = 'home'
