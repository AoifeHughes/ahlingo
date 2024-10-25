# -*- coding: utf-8 -*-
from kivymd.uix.card import MDCard
from kivymd.uix.label import MDLabel
from kivy.metrics import dp
from kivy.properties import StringProperty, BooleanProperty, NumericProperty
from kivy.clock import Clock


class MessageBubble(MDCard):
    """Reusable message bubble for chat-like interfaces with typing animation."""

    message = StringProperty()
    is_right = BooleanProperty(False)
    display_text = StringProperty("")
    char_delay = NumericProperty(0.03)  # Delay between characters

    def __init__(self, speaker, message, is_right=False, animate=False, **kwargs):
        super().__init__(**kwargs)
        self.orientation = "vertical"
        self.size_hint_y = None
        self.padding = dp(8)
        self.spacing = dp(4)
        self.radius = [dp(15)]
        self.is_right = is_right
        self.size_hint_x = 0.8
        self.full_message = message
        self.char_index = 0
        self.typing_scheduled = None

        self.setup_styling()
        self.add_content(speaker, "")  # Start with empty message

        if animate:
            Clock.schedule_once(lambda dt: self.start_typing_animation(), 0.1)
        else:
            self.display_text = message

    def setup_styling(self):
        """Configure card styling based on alignment."""
        if self.is_right:
            self.md_bg_color = (0.2, 0.6, 1, 1)
            self.pos_hint = {"right": 0.98, "center_y": 0.5}
        else:
            self.md_bg_color = (1, 0.4, 0.4, 1)
            self.pos_hint = {"x": 0.02, "center_y": 0.5}

    def add_content(self, speaker, message):
        """Add speaker and message labels to the bubble."""
        # Speaker label
        self.speaker_label = MDLabel(
            text=speaker,
            theme_text_color="Custom",
            text_color=(1, 1, 1, 1),
            size_hint_y=None,
            height=dp(20),
            bold=True,
        )

        # Message label with dynamic height
        self.message_label = MDLabel(
            text=message,
            theme_text_color="Custom",
            text_color=(1, 1, 1, 1),
            size_hint_y=None,
        )

        # Bind height to content
        self.message_label.bind(
            texture_size=lambda instance, value: setattr(instance, "height", value[1])
        )

        # Allow text wrapping
        self.message_label.text_size = (self.width - dp(16), None)

        # Add the labels
        self.add_widget(self.speaker_label)
        self.add_widget(self.message_label)

        # Bind to size changes
        self.message_label.bind(height=self.update_height)
        self.bind(
            width=lambda *x: setattr(
                self.message_label, "text_size", (self.width - dp(16), None)
            )
        )

        # Bind display text to message label
        self.bind(display_text=self.update_message_text)

    def update_message_text(self, instance, value):
        """Update message label text and trigger height update."""
        self.message_label.text = value

    def update_height(self, *args):
        """Update card height based on content."""
        self.height = self.speaker_label.height + self.message_label.height + dp(16)

    def start_typing_animation(self):
        """Start the typing animation."""
        self.char_index = 0
        self.type_next_char()

    def type_next_char(self, *args):
        """Type the next character in the animation."""
        if self.char_index < len(self.full_message):
            self.display_text = self.full_message[: self.char_index + 1]
            self.char_index += 1
            self.typing_scheduled = Clock.schedule_once(
                self.type_next_char, self.char_delay
            )
        else:
            self.typing_finished()

    def typing_finished(self):
        """Called when typing animation is complete."""
        if hasattr(self, "on_typing_finished"):
            self.on_typing_finished()

    def stop_typing(self):
        """Stop the typing animation and show full message."""
        if self.typing_scheduled:
            self.typing_scheduled.cancel()
        self.display_text = self.full_message
