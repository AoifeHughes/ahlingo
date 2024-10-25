from .base_exercise import BaseExerciseScreen
from AHLingo.components.layouts import ContentLayout, ScrollableContent
from AHLingo.components.buttons import StandardButton, OptionButton
from AHLingo.components.toolbars import StandardToolbar
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.label import MDLabel
from kivymd.uix.list import OneLineListItem
from kivy.metrics import dp
import random

class ScoreLabel(MDLabel):
    """Custom label for displaying scores."""
    def __init__(self, halign="left", **kwargs):
        super().__init__(
            halign=halign,
            size_hint_y=None,
            height=dp(50),
            **kwargs
        )

class WordButton(OptionButton):
    """Button for word matching with game logic."""
    def __init__(self, word="", **kwargs):
        super().__init__(**kwargs)
        self.word = word
        self.text = word
        self.original_color = self.md_bg_color
        
    def reset(self):
        """Reset button to original state."""
        self.md_bg_color = self.original_color
        self.disabled = False

class PairsGameLayout(ContentLayout):
    """Layout for the pairs matching game."""
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.orientation = 'horizontal'
        self.padding = dp(16)
        self.spacing = dp(16)
        self.size_hint_y = None
        self.bind(minimum_height=self.setter('height'))

        # Create columns for words
        self.left_column = self.create_column()
        self.right_column = self.create_column()
        
        self.add_widget(self.left_column)
        self.add_widget(self.right_column)

    def create_column(self):
        """Create a column for word buttons."""
        column = MDBoxLayout(
            orientation='vertical',
            spacing=dp(8),
            size_hint_x=0.5,
            size_hint_y=None
        )
        column.bind(minimum_height=column.setter('height'))
        return column

class PairsExerciseScreen(BaseExerciseScreen):
    """Screen for the pairs matching exercise."""
    def __init__(self, db, **kwargs):
        super().__init__(db, **kwargs)
        self.name = 'pairs'
        self.selected_button = None
        self.pairs = []
        self.buttons_1 = []
        self.buttons_2 = []
        self.correct_pairs = 0
        self.incorrect_attempts = 0
        self.total_pairs = 0
        
    def create_exercise_view(self):
        """Create the exercise view with game components."""
        layout = super().create_exercise_view()
        
        # Update toolbar title
        layout.children[-1].title = "Match the Pairs"  # Update toolbar title
        
        # Add reset button
        self.reset_button.text = "Reset Exercise"
        
        # Score layout
        score_layout = MDBoxLayout(
            orientation='horizontal',
            size_hint_y=None,
            height=dp(50),
            padding=[dp(16), 0, dp(16), 0]
        )
        
        self.score_label = ScoreLabel(
            text="Matched: 0/0",
            halign="left",
            size_hint_x=0.5
        )
        score_layout.add_widget(self.score_label)
        
        self.incorrect_label = ScoreLabel(
            text="Incorrect: 0",
            halign="right",
            size_hint_x=0.5
        )
        score_layout.add_widget(self.incorrect_label)
        
        layout.add_widget(score_layout)
        
        # Game layout
        self.game_layout = PairsGameLayout()
        self.game_container = ScrollableContent(self.game_layout)
        layout.add_widget(self.game_container)
    
        
        return layout
    
    def display_topics(self, topics):
        """Display available topics."""
        self.topics_list.clear()
        for topic in topics:
            self.topics_list.add_item(
                OneLineListItem(
                    text=topic,
                    on_release=lambda x, t=topic: self.select_topic(t)
                )
            )
    
    def select_topic(self, topic):
        """Handle topic selection and load pairs."""
        settings = self.get_user_settings()
        if settings:
            with self.db() as db:
                exercises = db.get_random_pair_exercise(
                    settings['language'],
                    settings['difficulty'],
                    topic
                )
                if exercises:
                    self.pairs = []
                    for exercise in exercises:
                        self.pairs.append({
                            'lang1': exercise['language_1_content'],
                            'lang2': exercise['language_2_content']
                        })
                    
                    self.total_pairs = len(self.pairs)
                    self.correct_pairs = 0
                    self.incorrect_attempts = 0
                    self.current_topic = topic
                    self.switch_to_exercise()
                    self.display_pairs()
    
    def display_pairs(self):
        """Display word pairs in the game layout."""
        # Clear existing buttons
        self.game_layout.left_column.clear_widgets()
        self.game_layout.right_column.clear_widgets()
        self.buttons_1 = []
        self.buttons_2 = []
        self.selected_button = None

        # Create lists of words
        words_1 = [pair['lang1'] for pair in self.pairs]
        words_2 = [pair['lang2'] for pair in self.pairs]

        # Shuffle both lists
        random.shuffle(words_1)
        random.shuffle(words_2)

        # Create buttons for both languages
        for word in words_1:
            btn = WordButton(word=word)
            btn.bind(on_release=self.on_button_press)
            self.buttons_1.append(btn)
            self.game_layout.left_column.add_widget(btn)

        for word in words_2:
            btn = WordButton(word=word)
            btn.bind(on_release=self.on_button_press)
            self.buttons_2.append(btn)
            self.game_layout.right_column.add_widget(btn)

        self.update_score()
    
    def on_button_press(self, button):
        """Handle button press in the game."""
        # If the same button is pressed again, deselect it
        if self.selected_button == button:
            button.set_state('default')
            self.selected_button = None
            return

        # If this is the first button selected
        if not self.selected_button:
            self.selected_button = button
            button.set_state('default')
            button.md_bg_color = (0.4, 0.4, 0.4, 1)  # Grey for selected
            return

        # This is the second button - check if it's a match
        is_match = False
        for pair in self.pairs:
            if ((self.selected_button.word == pair['lang1'] and 
                 button.word == pair['lang2']) or
                (self.selected_button.word == pair['lang2'] and 
                 button.word == pair['lang1'])):
                is_match = True
                break

        if is_match:
            # Correct match
            self.selected_button.set_state('correct')
            button.set_state('correct')
            self.selected_button.disabled = True
            button.disabled = True
            self.correct_pairs += 1
        else:
            # Wrong match
            self.selected_button.set_state('default')
            button.set_state('default')
            self.incorrect_attempts += 1

        self.update_score()
        self.selected_button = None

    def update_score(self):
        """Update the score display."""
        self.score_label.text = f"Matched: {self.correct_pairs}/{self.total_pairs}"
        self.incorrect_label.text = f"Incorrect: {self.incorrect_attempts}"

    def reset_exercise(self, *args):
        """Reset the current exercise."""
        super().reset_exercise(*args)
        if self.current_topic:
            self.select_topic(self.current_topic)