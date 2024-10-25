# -*- coding: utf-8 -*-
# components/layouts.py
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.scrollview import MDScrollView
from kivy.metrics import dp


class ScrollableList(MDScrollView):
    """Reusable scrollable list layout."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.size_hint = (1, 1)

        # Single content layout that will contain all items
        self.content = MDBoxLayout(
            orientation="vertical",
            spacing=dp(8),
            size_hint_y=None,
            padding=[dp(8), dp(8), dp(8), dp(8)],
        )
        self.content.bind(minimum_height=self.content.setter("height"))
        super().add_widget(self.content)

    def add_item(self, widget):
        """Add an item to the scrollable list."""
        self.content.add_widget(widget)

    def clear(self):
        """Clear all items from the list."""
        self.content.clear_widgets()


class ScrollableContent(MDScrollView):
    """Scrollable content with single content layout."""

    def __init__(self, content_layout, **kwargs):
        super().__init__(**kwargs)
        self.size_hint = (1, 1)
        super().add_widget(content_layout)


class PairsGameLayout(MDBoxLayout):
    """Layout for the pairs matching game."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.orientation = "horizontal"
        self.padding = dp(16)
        self.spacing = dp(16)
        self.size_hint_y = None
        self.bind(minimum_height=self.setter("height"))

        # Create columns for words
        self.left_column = self.create_column()
        self.right_column = self.create_column()

        self.add_widget(self.left_column)
        self.add_widget(self.right_column)

    def create_column(self):
        """Create a column for word buttons."""
        column = MDBoxLayout(
            orientation="vertical", spacing=dp(8), size_hint_x=0.5, size_hint_y=None
        )
        column.bind(minimum_height=column.setter("height"))
        return column


class ConversationLayout(MDBoxLayout):
    """Layout for displaying conversation messages."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.orientation = "vertical"
        self.spacing = dp(8)
        self.size_hint_y = None
        self.padding = [dp(8), dp(8), dp(8), dp(8)]
        self.bind(minimum_height=self.setter("height"))


class ContentLayout(MDBoxLayout):
    """Standard content layout with consistent styling."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.orientation = "vertical"
        self.spacing = dp(8)
        # self.padding = [dp(16), dp(8), dp(16), dp(8)]
