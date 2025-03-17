# -*- coding: utf-8 -*-
from kivymd.uix.screen import MDScreen


class BaseScreen(MDScreen):
    """Base screen with common functionality."""

    def __init__(self, db, **kwargs):
        super().__init__(**kwargs)
        self.db = db

    def go_back_to_home(self):
        """Navigate back to home screen."""
        self.manager.current = "home"
