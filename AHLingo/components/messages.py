from kivymd.uix.card import MDCard
from kivymd.uix.label import MDLabel
from kivy.metrics import dp
from kivy.properties import StringProperty, BooleanProperty

class MessageBubble(MDCard):
    """Reusable message bubble for chat-like interfaces."""
    message = StringProperty()
    is_right = BooleanProperty(False)
    
    def __init__(self, speaker, message, is_right=False, **kwargs):
        super().__init__(**kwargs)
        self.orientation = 'vertical'
        self.size_hint_y = None
        self.padding = dp(8)
        self.spacing = dp(4)
        self.radius = [dp(15)]
        self.is_right = is_right
        self.size_hint_x = 0.8
        
        self.setup_styling()
        self.add_content(speaker, message)
        
    def setup_styling(self):
        """Configure card styling based on alignment."""
        if self.is_right:
            self.md_bg_color = (0.2, 0.6, 1, 1)
            self.pos_hint = {'right': 0.98, 'center_y': 0.5}
        else:
            self.md_bg_color = (1, 0.4, 0.4, 1)
            self.pos_hint = {'x': 0.02, 'center_y': 0.5}
        
    def add_content(self, speaker, message):
        """Add speaker and message labels to the bubble."""
        # Speaker label
        speaker_label = MDLabel(
            text=speaker,
            theme_text_color="Custom",
            text_color=(1, 1, 1, 1),
            size_hint_y=None,
            height=dp(20),
            bold=True
        )
        
        # Message label with dynamic height
        message_label = MDLabel(
            text=message,
            theme_text_color="Custom",
            text_color=(1, 1, 1, 1),
            size_hint_y=None
        )
        
        # Bind height to content
        message_label.bind(
            texture_size=lambda instance, value: setattr(instance, 'height', value[1])
        )
        
        # Allow text wrapping
        message_label.text_size = (self.width - dp(16), None)  # Account for padding
        
        # Add the labels
        self.add_widget(speaker_label)
        self.add_widget(message_label)
        
        # Update card height based on content
        def update_height(*args):
            self.height = speaker_label.height + message_label.height + dp(16)  # Account for padding
        
        # Bind to size changes
        message_label.bind(height=update_height)
        self.bind(width=lambda *x: setattr(message_label, 'text_size', (self.width - dp(16), None)))