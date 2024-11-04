# -*- coding: utf-8 -*-
from AHLingo.screens.exercises.base_exercise import BaseExerciseScreen
from AHLingo.components.layouts import ContentLayout, ScrollableContent
from AHLingo.components.messages import MessageBubble
from AHLingo.content_creation.chatbot import ChatbotHandler
from AHLingo.components.buttons import StandardButton
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.textfield import MDTextField
from kivymd.uix.button import MDIconButton
from kivy.metrics import dp
from kivy.clock import Clock
import threading


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
        self.exercise_view = None  # Will be created when needed
        self.load_topics()  # Start by showing conversation list

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

    def display_topics(self, topics):
        """Display previous conversations instead of topics."""
        # Create topics view with toolbar from base class
        if not hasattr(self, 'topics_view'):
            self.topics_view = self.create_exercise_view()
            self.topics_view.children[-1].title = "Previous Chats"  # Update toolbar title
        
        self.topics_list.clear_widgets()
        
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
            
            if not matching_chats:
                # If no previous conversations, start a new one
                self.chat_id = None
                self.setup_chat_interface()
                self.switch_to_exercise()
                return
                
            # Add button for each chat, showing first message as preview
            for chat in matching_chats:
                chat_history = db.get_chat_history(chat["id"])
                if chat_history:
                    preview = chat_history[0]["content"][:50] + "..." if len(chat_history[0]["content"]) > 50 else chat_history[0]["content"]
                    button = StandardButton(
                        text=preview,
                        on_release=lambda x, chat_id=chat["id"]: self.select_chat(chat_id)
                    )
                    self.topics_list.add_widget(button)

    def select_chat(self, chat_id):
        """Load and display selected chat."""
        self.chat_id = chat_id
        self.setup_chat_interface()
        self.switch_to_exercise()
        self.initialize_chat()

    def select_topic(self, topic):
        """Not used in chatbot screen."""
        pass
