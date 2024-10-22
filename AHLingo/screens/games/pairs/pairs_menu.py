from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.button import MDRaisedButton
from kivymd.uix.toolbar import MDTopAppBar
from kivymd.uix.label import MDLabel
from kivymd.uix.list import MDList, OneLineListItem
from kivymd.uix.scrollview import MDScrollView
from kivy.metrics import dp
from kivy.storage.jsonstore import JsonStore
import random

class PairsScreen(MDScreen):
    def __init__(self, db,  **kwargs):
        self.db = db
        super().__init__(**kwargs)
        self.name = 'pairs'
        
        # Create the main layout that will hold both topic selection and exercise
        self.main_layout = MDBoxLayout(orientation='vertical')
        
        # Create both views
        self.topic_view = self.create_topic_view()
        self.exercise_view = self.create_exercise_view()
        
        # Start with topic view
        self.main_layout.add_widget(self.topic_view)
        self.add_widget(self.main_layout)
        
        # Initialize exercise state
        self.selected_button = None
        self.pairs = []
        self.buttons_1 = []
        self.buttons_2 = []
        self.correct_pairs = 0
        self.total_pairs = 0

    def create_topic_view(self):
        layout = MDBoxLayout(orientation='vertical')
        
        # Top toolbar with back button
        toolbar = MDTopAppBar(
            title="Select Topic",
            left_action_items=[["arrow-left", lambda x: self.go_back_to_home()]],
            elevation=4
        )
        layout.add_widget(toolbar)
        
        # Scrollable list of topics
        scroll = MDScrollView()
        self.topics_list = MDList()
        scroll.add_widget(self.topics_list)
        layout.add_widget(scroll)
        
        return layout

    def create_exercise_view(self):
        layout = MDBoxLayout(orientation='vertical')
        
        # Top toolbar with back button
        self.exercise_toolbar = MDTopAppBar(
            title="Match the Pairs",
            left_action_items=[["arrow-left", lambda x: self.return_to_topics()]],
            elevation=4
        )
        layout.add_widget(self.exercise_toolbar)
        
        # Score label
        self.score_label = MDLabel(
            text="Matched: 0/0",
            halign="center",
            size_hint_y=None,
            height=dp(50)
        )
        layout.add_widget(self.score_label)

        # Container for word buttons
        content_layout = MDBoxLayout(
            orientation='horizontal',
            padding=dp(16),
            spacing=dp(16)
        )

        # Left column (language 1)
        self.left_column = MDBoxLayout(
            orientation='vertical',
            spacing=dp(8),
            size_hint_x=0.5
        )
        content_layout.add_widget(self.left_column)

        # Right column (language 2)
        self.right_column = MDBoxLayout(
            orientation='vertical',
            spacing=dp(8),
            size_hint_x=0.5
        )
        content_layout.add_widget(self.right_column)

        layout.add_widget(content_layout)
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
                exercises = db.get_random_pair_exercise(language, difficulty, topic)
                if exercises:
                    self.pairs = []
                    for exercise in exercises:
                        self.pairs.append({
                            'lang1': exercise['language_1_content'],
                            'lang2': exercise['language_2_content']
                        })
                    
                    self.total_pairs = len(self.pairs)
                    self.correct_pairs = 0
                    self.switch_to_exercise()
                    self.display_pairs()

    def switch_to_exercise(self):
        self.main_layout.clear_widgets()
        self.main_layout.add_widget(self.exercise_view)

    def return_to_topics(self):
        self.main_layout.clear_widgets()
        self.main_layout.add_widget(self.topic_view)
        # Reset exercise state
        self.selected_button = None
        self.correct_pairs = 0
        self.total_pairs = 0

    def display_pairs(self):
        # Clear existing buttons
        self.left_column.clear_widgets()
        self.right_column.clear_widgets()
        self.buttons_1 = []
        self.buttons_2 = []
        self.selected_button = None

        # Create lists of words
        words_1 = [pair['lang1'] for pair in self.pairs]
        words_2 = [pair['lang2'] for pair in self.pairs]

        # Shuffle both lists
        random.shuffle(words_1)
        random.shuffle(words_2)

        # Create buttons for language 1
        for word in words_1:
            btn = MDRaisedButton(
                text=word,
                size_hint=(1, None),
                height=dp(50),
                md_bg_color=(0.2, 0.6, 1, 1)  # Default blue color
            )
            btn.word = word
            btn.bind(on_release=self.on_button_press)
            self.buttons_1.append(btn)
            self.left_column.add_widget(btn)

        # Create buttons for language 2
        for word in words_2:
            btn = MDRaisedButton(
                text=word,
                size_hint=(1, None),
                height=dp(50),
                md_bg_color=(0.2, 0.6, 1, 1)  # Default blue color
            )
            btn.word = word
            btn.bind(on_release=self.on_button_press)
            self.buttons_2.append(btn)
            self.right_column.add_widget(btn)

        self.update_score()

    def on_button_press(self, button):
        # If the same button is pressed again, deselect it
        if self.selected_button == button:
            self.selected_button.md_bg_color = (0.2, 0.6, 1, 1)  # Reset to default blue
            self.selected_button = None
            return

        # If this is the first button selected
        if not self.selected_button:
            self.selected_button = button
            button.md_bg_color = (0.4, 0.4, 0.4, 1)  # Change to grey when selected
            return

        # This is the second button - check if it's a match
        is_match = False
        for pair in self.pairs:
            if (self.selected_button.word == pair['lang1'] and button.word == pair['lang2']) or \
               (self.selected_button.word == pair['lang2'] and button.word == pair['lang1']):
                is_match = True
                break

        if is_match:
            # Correct match
            self.selected_button.md_bg_color = (0, 0.8, 0, 1)  # Green for correct
            button.md_bg_color = (0, 0.8, 0, 1)
            self.selected_button.disabled = True
            button.disabled = True
            self.correct_pairs += 1
            self.update_score()
        else:
            # Wrong match
            self.selected_button.md_bg_color = (0.2, 0.6, 1, 1)  # Reset to default blue
            button.md_bg_color = (0.2, 0.6, 1, 1)

        self.selected_button = None

    def update_score(self):
        self.score_label.text = f"Matched: {self.correct_pairs}/{self.total_pairs}"

    def go_back_to_home(self):
        self.manager.current = 'home'