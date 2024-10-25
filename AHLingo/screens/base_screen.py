# -*- coding: utf-8 -*-
from kivymd.uix.screen import MDScreen
from kivy.storage.jsonstore import JsonStore


class BaseScreen(MDScreen):
    """Base screen with common functionality."""

    def __init__(self, db, **kwargs):
        super().__init__(**kwargs)
        self.db = db
        self.settings = JsonStore("settings.json")

    def get_user_settings(self):
        """Get current user settings."""
        if self.settings.exists("language") and self.settings.exists("difficulty") and self.settings.exists("username"):
            return {
                "language": self.settings.get("language")["value"],
                "difficulty": self.settings.get("difficulty")["value"],
                "username": self.settings.get("username")["value"],
            }
        return None

    def go_back_to_home(self):
        """Navigate back to home screen."""
        self.manager.current = "home"
