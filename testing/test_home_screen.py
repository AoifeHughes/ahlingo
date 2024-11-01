# -*- coding: utf-8 -*-
import pytest
import os

os.environ["KIVY_TEST_SCRIPT"] = "1"  # This tells Kivy we're running tests
os.environ["KIVY_NO_ARGS"] = "1"  # Don't process Kivy command line arguments
os.environ["KIVY_NO_CONSOLELOG"] = "1"  # Turn off console logging
os.environ["KIVY_GRAPHICS"] = "mock"  # Use mock graphics

from kivy.tests.common import GraphicUnitTest
from AHLingo.run import LanguageLearningApp
from kivy.clock import Clock


class TestHomeScreen(GraphicUnitTest):
    def setUp(self):
        super().setUp()
        self.app = LanguageLearningApp()

    def test_app_runs(self):
        """Test if the app starts up correctly"""
        Clock.schedule_once(lambda dt: self.app.stop(), 1)  # Stop app after 1 second
        self.app.run()
        assert self.app.root is not None

    def test_screen_navigation(self):
        """Test navigation to each screen from home screen"""
        Clock.schedule_once(lambda dt: self._test_navigation(), 1)
        Clock.schedule_once(lambda dt: self.app.stop(), 2)  # Stop after navigation test
        self.app.run()

    def _test_navigation(self):
        # Get the screen manager and home screen
        screen_manager = self.app.root
        home_screen = screen_manager.get_screen("home")

        # Test navigation to each screen
        screens_to_test = [
            ("pairs", home_screen.go_to_pairs),
            ("conversations", home_screen.go_to_conversation),
            ("translation", home_screen.go_to_translation),
            ("chatbot", home_screen.go_to_chatbot),
            ("revise_mistakes", home_screen.go_to_revise_mistakes),
            ("settings", home_screen.go_to_settings),
        ]

        for screen_name, nav_method in screens_to_test:
            nav_method()
            assert (
                screen_manager.current == screen_name
            ), f"Failed to navigate to {screen_name}"
            screen_manager.current = "home"  # Return to home screen
