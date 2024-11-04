# -*- coding: utf-8 -*-
from AHLingo.screens.exercises.base_exercise import BaseExerciseScreen
from AHLingo.components.layouts import ContentLayout, ScrollableContent
from AHLingo.components.messages import MessageBubble
from AHLingo.content_creation.chatbot import ChatbotHandler
from AHLingo.components.buttons import StandardButton
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.textfield import MDTextField
from kivymd.uix.button import MDIconButton
from kivymd.uix.datatables import MDDataTable
from kivy.metrics import dp
from kivy.clock import Clock
import threading
from datetime import datetime


class ChatInputField(MDTextField):
    """Custom text field for chat input with consistent styling."""

    def __init__(self, submit_callback, **kwargs):
        super().__init__(
            multiline=False, size_hint=(1, None), height=dp(50), mode="fill", **kwargs
        )
        self.submit_callback = submit_callback

    def on_text_validate(self):
        """Handle text submission on enter press."""
        if self.text.strip() and not self.disabled:
            self.submit_callback(self.text)
            self.text = ""


class ChatInputLayout(MDBoxLayout):
    """Layout for chat input area with text field and send button."""

    def __init__(self, submit_callback, **kwargs):
        super().__init__(
            orientation="horizontal",
            size_hint_y=None,
            height=dp(60),
            spacing=dp(8),
            padding=[dp(8), dp(4), dp(8), dp(4)],
            **kwargs
        )

        # Create text input
        self.text_input = ChatInputField(
            submit_callback=submit_callback, hint_text="Type your message..."
        )

        # Create send button
        self.send_button = MDIconButton(
            icon="send", on_release=lambda x: self.submit_message()
        )

        # Add widgets
        self.add_widget(self.text_input)
        self.add_widget(self.send_button)

    def submit_message(self):
        """Handle message submission from send button."""
        if self.text_input.text.strip() and not self.text_input.disabled:
            self.text_input.submit_callback(self.text_input.text)
            self.text_input.text = ""

    def set_enabled(self, enabled: bool):
        """Enable or disable the input controls."""
        self.text_input.disabled = not enabled
        self.send_button.disabled = not enabled


class ChatMessagesLayout(ContentLayout):
    """Layout for displaying chat messages."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.orientation = "vertical"
        self.spacing = dp(8)
        self.size_hint_y = None
        self.bind(minimum_height=self.setter("height"))


class ChatbotExerciseScreen(BaseExerciseScreen):
    """Screen for the chatbot exercise."""

    def __init__(self, db, **kwargs):
        super().__init__(db, **kwargs)
        self.name = "chatbot"
        self.chatbot = ChatbotHandler()
        self.conversation_history = []
        self.chat_id = None
        self.exercise_view = None
        self.data_table = None
        self.load_topics()

    def setup_chat_interface(self):
        """Setup the chat interface."""
        if self.exercise_view is None:
            # Create exercise view with toolbar from base class
            self.exercise_view = self.create_exercise_view()
            self.exercise_view.children[-1].title = "Chat Exercise"  # Update toolbar title

            # Create messages area
            self.messages_layout = ChatMessagesLayout()
            self.messages_scroll = ScrollableContent(self.messages_layout)
            self.exercise_view.add_widget(self.messages_scroll)

            # Create input area
            self.input_layout = ChatInputLayout(submit_callback=self.send_message)
            self.exercise_view.add_widget(self.input_layout)

        # Initialize chat with welcome message
        Clock.schedule_once(lambda dt: self.initialize_chat(), 0.1)

    def initialize_chat(self):
        """Initialize the chat with a welcome message or load existing conversation."""
        self.conversation_history = []
        self.messages_layout.clear_widgets()

        settings = None
        with self.db() as db:
            settings = db.get_user_settings()
            if not settings:
                return

            # Get most recent chat for this language
            chats = db.get_user_chats(db.get_most_recent_user())
            matching_chats = [
                chat for chat in chats 
                if chat["language"] == settings["language"] and 
                   chat["difficulty"] == settings["difficulty"]
            ]

            if matching_chats:
                # Load most recent chat
                most_recent_chat = matching_chats[0]
                self.chat_id = most_recent_chat["id"]
                chat_history = db.get_chat_history(self.chat_id)
                
                # Restore conversation history and display messages
                for msg in chat_history:
                    self.conversation_history.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })
                    self.add_message(
                        "You" if msg["role"] == "user" else "Bot",
                        msg["content"],
                        is_right=(msg["role"] == "user"),
                        animate=False
                    )
            else:
                # Create new chat session
                self.chat_id = db.create_chat_session(
                    db.get_most_recent_user(),
                    settings["language"],
                    settings["difficulty"],
                    "gpt-3.5-turbo"  # Default model
                )
                # Add welcome message
                welcome_msg = "Hello! What would you like to talk about? If you don't understand something just ask!"
                self.add_message("Bot", welcome_msg, is_right=False)
                db.add_chat_message(self.chat_id, "assistant", welcome_msg)
                self.conversation_history.append({
                    "role": "assistant",
                    "content": welcome_msg
                })

    def get_bot_response_in_thread(self, message):
        """Get bot response in a separate thread."""
        settings = None
        with self.db() as db:
            settings = db.get_user_settings()
        if not settings:
            return "Error: Could not get user settings"

        response = self.chatbot.get_chat_response(
            message=message,
            language=settings["language"],
            difficulty=settings["difficulty"],
            conversation_history=self.conversation_history,
        )

        # Schedule the response handling on the main thread
        Clock.schedule_once(lambda dt: self.handle_bot_response(response), 0)

    def send_message(self, message):
        """Handle sending a new message."""
        # Disable input while processing
        self.input_layout.set_enabled(False)

        # Add user message (no animation for user messages)
        self.add_message("You", message, is_right=True, animate=False)

        # Add typing indicator
        self.add_message("Bot", "...", is_right=False, animate=False)

        # Update conversation history with user message
        self.conversation_history.append({"role": "user", "content": message})

        # Save user message to database
        with self.db() as db:
            db.add_chat_message(self.chat_id, "user", message)

        # Start a new thread for the API call
        threading.Thread(
            target=self.get_bot_response_in_thread, args=(message,), daemon=True
        ).start()

    def handle_bot_response(self, response):
        """Handle the bot response on the main thread."""
        # Remove typing indicator
        self.messages_layout.remove_widget(self.messages_layout.children[0])

        # Update conversation history with bot response
        self.conversation_history.append({"role": "assistant", "content": response})

        # Save bot response to database
        with self.db() as db:
            db.add_chat_message(self.chat_id, "assistant", response)

        # Add bot response with animation
        message_bubble = self.add_message("Bot", response, is_right=False, animate=True)
        message_bubble.on_typing_finished = self.on_bot_response_finished

    def add_message(self, speaker, message, is_right=False, animate=False):
        """Add a new message bubble to the chat."""
        message_bubble = MessageBubble(
            speaker=speaker, message=message, is_right=is_right, animate=animate
        )
        self.messages_layout.add_widget(message_bubble)
        self.scroll_to_bottom()
        return message_bubble

    def on_bot_response_finished(self):
        """Called when bot response typing animation is complete."""
        # Re-enable input
        self.input_layout.set_enabled(True)

        # Ensure we're scrolled to the bottom
        self.scroll_to_bottom()

    def scroll_to_bottom(self):
        """Scroll the chat to the bottom."""
        self.messages_scroll.scroll_y = 0

    def reset_chat(self, *args):
        """Reset the chat to initial state."""
        self.chat_id = None
        self.initialize_chat()

    def setup_views(self):
        """Override setup_views to ensure proper initialization order."""
        self.topic_view = self.create_topic_view()
        self.main_layout.add_widget(self.topic_view)
        self.add_widget(self.main_layout)

    def create_topic_view(self):
        """Override to create a customized topic view for chat."""
        layout = super().create_topic_view()
        # Update the toolbar title immediately after creation
        layout.children[-1].title = "Previous Chats"
        return layout

    def create_data_table(self):
        """Create the data table for displaying previous chats."""
        self.data_table = MDDataTable(
            size_hint=(1, 1),
            pos_hint={"center_x": 0.5, "center_y": 0.5},
            use_pagination=False,
            column_data=[
                ("Chat Preview", dp(60)),
                ("Date", dp(40)),
                ("ID", dp(20)),
            ],
            row_data=[],
            rows_num=10,
            elevation=1,
            background_color_header="#EEEEEE",
            background_color_cell="#FFFFFF",
        )
        self.data_table.bind(on_row_press=self.on_row_press)
        return self.data_table

    def on_row_press(self, instance_table, instance_row):
        """Handle row press event."""
        idx = int(instance_row.index / len(instance_table.column_data))
        row_data = instance_table.row_data[idx]
        
        if row_data[0] == "No previous chats":
            return
            
        chat_id = row_data[2]
        self.select_chat(chat_id)

    def return_to_topics(self):
        """Override return_to_topics to properly handle table recreation."""
        self.main_layout.clear_widgets()
        self.topic_view = self.create_topic_view()  # Recreate the topic view
        self.data_table = None  # Reset data table so it will be recreated
        self.load_topics()  # This will recreate the table and reload data
        self.main_layout.add_widget(self.topic_view)

    def load_topics(self):
        """Override load_topics to handle initial loading and reloading."""
        self.display_topics([])  # Pass empty list since we don't use traditional topics

    def display_topics(self, topics):
        """Display previous conversations in a table format."""
        if not hasattr(self, 'topic_view') or not self.topic_view:
            self.topic_view = self.create_topic_view()
            
        self.topics_list.clear_widgets()
        
        # Create data table if it doesn't exist
        if not self.data_table:
            self.data_table = self.create_data_table()
            self.topics_list.add_widget(self.data_table)
        
        with self.db() as db:
            settings = db.get_user_settings()
            if not settings:
                return
            
            # Get all chats for current user with matching language/difficulty
            chats = db.get_user_chats(db.get_most_recent_user())
            matching_chats = [
                chat for chat in chats 
                if chat["language"] == settings["language"] and 
                   chat["difficulty"] == settings["difficulty"]
            ]
            
            if matching_chats:
                # Format the data for the table
                row_data = []
                for chat in matching_chats:
                    chat_history = db.get_chat_history(chat["id"])
                    if chat_history:
                        preview = chat_history[0]["content"][:50] + "..." if len(chat_history[0]["content"]) > 50 else chat_history[0]["content"]
                        date = datetime.fromisoformat(chat["created_at"]).strftime("%Y-%m-%d %H:%M")
                        row_data.append((preview, date, str(chat["id"])))
                self.data_table.row_data = row_data
            else:
                # Show "No previous chats" message and create new chat button
                self.data_table.row_data = [("No previous chats", "", "")]
                new_chat_button = StandardButton(
                    text="Start New Chat",
                    on_release=lambda x: self.start_new_chat(),
                    size_hint=(None, None),
                    width=dp(200),
                    height=dp(48),
                    pos_hint={"center_x": 0.5}
                )
                self.topics_list.add_widget(new_chat_button)

    def start_new_chat(self):
        """Start a new chat session."""
        self.chat_id = None
        self.setup_chat_interface()
        self.switch_to_exercise()
            
    def select_chat(self, chat_id):
        """Load and display selected chat."""
        self.chat_id = chat_id
        self.setup_chat_interface()
        self.switch_to_exercise()
        self.initialize_chat()

    def select_topic(self, topic):
        """Not used in chatbot screen."""
        pass
