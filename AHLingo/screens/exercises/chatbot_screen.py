# -*- coding: utf-8 -*-
from AHLingo.screens.exercises.base_exercise import BaseExerciseScreen
from AHLingo.components.layouts import ContentLayout, ScrollableContent
from AHLingo.components.messages import MessageBubble
from AHLingo.content_creation.chatbot import ChatbotHandler
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
        self.setup_chat_interface()

    def setup_chat_interface(self):
        """Setup the chat interface directly instead of using base exercise layout."""
        # Main layout
        self.main_layout = ContentLayout()

        # Create toolbar
        toolbar = self.create_toolbar()
        self.main_layout.add_widget(toolbar)

        # Create messages area
        self.messages_layout = ChatMessagesLayout()
        self.messages_scroll = ScrollableContent(self.messages_layout)
        self.main_layout.add_widget(self.messages_scroll)

        # Create input area
        self.input_layout = ChatInputLayout(submit_callback=self.send_message)
        self.main_layout.add_widget(self.input_layout)

        # Add main layout to screen
        self.add_widget(self.main_layout)

        # Initialize chat with welcome message
        Clock.schedule_once(lambda dt: self.initialize_chat(), 0.1)

    def create_toolbar(self):
        """Create the toolbar with a back button and reset button."""
        toolbar = MDBoxLayout(
            orientation="horizontal",
            size_hint_y=None,
            height=dp(56),
            padding=[dp(4), 0, dp(4), 0],
            spacing=dp(4),
        )

        # Title spacer
        title_spacer = MDBoxLayout(size_hint_x=1)
        toolbar.add_widget(title_spacer)

        # Reset button
        reset_button = MDIconButton(
            icon="refresh", on_release=lambda x: self.reset_chat()
        )
        toolbar.add_widget(reset_button)

        return toolbar

    def initialize_chat(self):
        """Initialize the chat with a welcome message."""
        self.conversation_history = []
        self.messages_layout.clear_widgets()
        self.add_message(
            "Bot",
            "Hello! What would you like to talk about? If you don't understand something just ask!",
            is_right=False,
        )

    def get_bot_response_in_thread(self, message):
        """Get bot response in a separate thread."""
        settings = self.get_user_settings()
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
        self.initialize_chat()

    # Override unused methods from BaseExerciseScreen
    def display_topics(self, topics):
        pass

    def select_topic(self, topic):
        pass
