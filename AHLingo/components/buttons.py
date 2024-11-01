# -*- coding: utf-8 -*-
from kivymd.uix.button import MDRaisedButton
from kivy.metrics import dp
from kivy.uix.image import Image
from kivy.uix.behaviors import ButtonBehavior
import webbrowser


class ImageButton(ButtonBehavior, Image):
    def __init__(self, **kwargs):
        super(ImageButton, self).__init__(**kwargs)

    def on_press(self):
        webbrowser.open("https://github.com/aoifehughes/ahlingo")


class StandardButton(MDRaisedButton):
    """Standard button with consistent styling."""

    def __init__(self, **kwargs):
        super().__init__(
            # width=dp(300),  # Increased from 200
            # height=dp(80),  # Increased from 48
            # pos_hint={"center_x": 0.5},
            **kwargs
        )


class OptionButton(MDRaisedButton):
    """Button for quiz options with state management."""

    def __init__(self, **kwargs):
        super().__init__(
            size_hint=(1, None), height=dp(48), md_bg_color=(0.2, 0.6, 1, 1), **kwargs
        )
        self.original_color = self.md_bg_color

    def set_state(self, state):
        """Update button color based on state."""
        colors = {
            "default": (0.2, 0.6, 1, 1),
            "correct": (0, 0.8, 0, 1),
            "incorrect": (0.8, 0, 0, 1),
        }
        self.md_bg_color = colors.get(state, self.original_color)
