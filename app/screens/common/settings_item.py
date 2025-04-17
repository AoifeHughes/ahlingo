# -*- coding: utf-8 -*-
from kivy.properties import StringProperty
from kivymd.uix.boxlayout import MDBoxLayout

class SettingsItem(MDBoxLayout):
    """A custom settings item for the settings screen."""
    title = StringProperty("")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.orientation = 'vertical'
        self.adaptive_height = True
        self.padding = ("8dp", "8dp")
        self.spacing = "8dp"
