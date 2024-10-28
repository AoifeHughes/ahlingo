# -*- coding: utf-8 -*-
from AHLingo.screens.base_screen import BaseScreen
from AHLingo.components.layouts import ContentLayout
from AHLingo.components.toolbars import StandardToolbar
from AHLingo.components.buttons import StandardButton
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.gridlayout import MDGridLayout
from kivymd.uix.button import MDIconButton
from kivymd.uix.label import MDLabel
from kivy.uix.image import Image
from kivy.metrics import dp
from kivymd.uix.card import MDCard


class HomeScreen(BaseScreen):
    """Modern home screen of the application with enhanced visual elements."""

    def __init__(self, db, **kwargs):
        super().__init__(db, **kwargs)
        self.name = "home"
        self.setup_ui()

    def setup_ui(self):
        """Setup the enhanced user interface with icons and better styling."""
        # Main layout
        main_layout = MDBoxLayout(
            orientation="vertical",
            spacing=0
        )

        # Custom toolbar with logo, centered title, and settings button
        toolbar_layout = MDBoxLayout(
            orientation="horizontal",
            size_hint_y=None,
            height=dp(56),
            padding=[dp(8), 0, dp(8), 0],
            md_bg_color=self.theme_cls.primary_color
        )

        # Logo in toolbar
        logo = Image(
            source="./assets/logo.png",
            size_hint=(None, None),
            size=(dp(40), dp(40)),
            pos_hint={"center_y": 0.5}
        )
        
        # Title layout (centered)
        title_layout = MDBoxLayout(
            orientation="horizontal",
            size_hint_x=1,
            padding=[0, 0, 0, 0]
        )
        
        # Title label
        title = MDLabel(
            text="AHLingo",
            halign="center",
            theme_text_color="Custom",
            text_color="white",
            font_style="H6"
        )
        
        # Add logo
        toolbar_layout.add_widget(logo)
        
        # Add centered title
        title_layout.add_widget(title)
        toolbar_layout.add_widget(title_layout)
        
        # Settings button
        settings_button = MDIconButton(
            icon="cog",
            theme_icon_color="Custom",
            icon_color="white",
            pos_hint={"center_y": 0.5},
            on_release=self.go_to_settings
        )
        toolbar_layout.add_widget(settings_button)
        
        main_layout.add_widget(toolbar_layout)

        # Content layout with adjusted padding
        content_layout = MDBoxLayout(
            orientation="vertical",
            padding=[dp(16), dp(24), dp(16), dp(24)],
            spacing=dp(24),
            size_hint_y=None,
            height=dp(480),
            pos_hint={"center_x": 0.5, "center_y": 0.5}
        )

        # Enhanced grid for menu buttons
        grid_layout = MDGridLayout(
            cols=2,
            spacing=dp(16),
            size_hint_y=None,
            height=dp(320),
            pos_hint={"center_x": 0.5},
            padding=[dp(8), 0, dp(8), 0]
        )

        # Updated buttons data with icons
        buttons_data = [
            ("Pairs\nExercises", "card-multiple", self.go_to_pairs),
            ("Conversation\nExercises", "message-text", self.go_to_conversation),
            ("Translation\nExercises", "translate", self.go_to_translation),
            ("Chatbot\nExercises", "robot", self.go_to_chatbot)
        ]

        for text, icon, callback in buttons_data:
            # Create a card-like button with icon
            button_card = MDCard(
                size_hint=(1, None),
                height=dp(140),
                padding=dp(8),
                spacing=dp(4),
                md_bg_color=self.theme_cls.primary_color,
                radius=[dp(10)],
                ripple_behavior=True,
                on_release=callback
            )

            # Button content layout
            button_content = MDBoxLayout(
                orientation="vertical",
                spacing=dp(4),
                padding=[dp(8), dp(8), dp(8), dp(8)],
                pos_hint={"center_x": 0.5, "center_y": 0.5}
            )

            # Add icon with on_release event
            icon_button = MDIconButton(
                icon=icon,
                theme_icon_color="Custom",
                icon_color="white",
                pos_hint={"center_x": 0.5},
                size_hint=(None, None),
                size=(dp(48), dp(48)),
                on_release=callback
            )
            button_content.add_widget(icon_button)

            # Add text with on_release event
            button = StandardButton(
                text=text,
                theme_text_color="Custom",
                text_color="white",
                size_hint=(1, None),
                height=dp(48),
                md_bg_color=[0, 0, 0, 0],
                pos_hint={"center_x": 0.5},
                on_release=callback  # Added callback here
            )
            button_content.add_widget(button)
            
            button_card.add_widget(button_content)
            grid_layout.add_widget(button_card)

        # Center the grid layout
        grid_container = MDBoxLayout(
            size_hint_x=0.95,
            pos_hint={"center_x": 0.5}
        )
        grid_container.add_widget(grid_layout)
        content_layout.add_widget(grid_container)

        # Enhanced revise mistakes button
        revise_layout = MDBoxLayout(
            padding=[dp(8), dp(8), dp(8), 0],
            size_hint_y=None,
            height=dp(80),
            size_hint_x=0.95,
            pos_hint={"center_x": 0.5}
        )
        
        revise_card = MDCard(
            size_hint=(1, None),
            height=dp(80),
            padding=dp(8),
            md_bg_color=self.theme_cls.primary_color,
            radius=[dp(10)],
            ripple_behavior=True,
            on_release=self.go_to_revise_mistakes
        )

        revise_content = MDBoxLayout(
            spacing=dp(8),
            padding=[dp(16), 0, dp(16), 0]
        )

        revise_icon = MDIconButton(
            icon="history",
            theme_icon_color="Custom",
            icon_color="white",
            size_hint=(None, None),
            size=(dp(48), dp(48)),
            pos_hint={"center_y": 0.5},
            on_release=self.go_to_revise_mistakes
        )
        revise_content.add_widget(revise_icon)

        revise_button = StandardButton(
            text="Revise Mistakes",
            theme_text_color="Custom",
            text_color="white",
            size_hint=(1, None),
            height=dp(48),
            md_bg_color=[0, 0, 0, 0],
            pos_hint={"center_y": 0.5},
            on_release=self.go_to_revise_mistakes  # Added callback here
        )
        revise_content.add_widget(revise_button)
        
        revise_card.add_widget(revise_content)
        revise_layout.add_widget(revise_card)
        content_layout.add_widget(revise_layout)

        # Add content layout to main layout
        content_container = MDBoxLayout(
            pos_hint={"center_x": 0.5},
            size_hint_x=1
        )
        content_container.add_widget(content_layout)
        main_layout.add_widget(content_container)
        
        self.add_widget(main_layout)

    # Navigation methods remain unchanged
    def go_to_conversation(self, *args):
        """Navigate to conversation exercises screen."""
        screen = self.manager.get_screen("conversations")
        screen.load_topics()
        self.manager.current = "conversations"

    def go_to_settings(self, *args):
        """Navigate to settings screen."""
        self.manager.current = "settings"

    def go_to_pairs(self, *args):
        """Navigate to pairs exercises screen."""
        screen = self.manager.get_screen("pairs")
        screen.load_topics()
        self.manager.current = "pairs"

    def go_to_translation(self, *args):
        """Navigate to translation exercises screen."""
        screen = self.manager.get_screen("translation")
        screen.load_topics()
        self.manager.current = "translation"

    def go_to_chatbot(self, *args):
        """Navigate to chatbot exercises screen."""
        self.manager.current = "chatbot"

    def go_to_revise_mistakes(self, *args):
        """Navigate to revise mistakes screen."""
        self.manager.current = "revise_mistakes"
