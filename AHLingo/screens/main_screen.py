from kivymd.uix.screen import MDScreen
from kivymd.uix.button import MDRaisedButton
from kivymd.uix.toolbar import MDTopAppBar
from kivymd.uix.menu import MDDropdownMenu
from kivymd.uix.boxlayout import MDBoxLayout
from kivy.metrics import dp
from kivy.storage.jsonstore import JsonStore
from functools import partial


class HomeScreen(MDScreen):
    def __init__(self, db, **kwargs):
        super().__init__(**kwargs)
        self.name = 'home'
        self.db = db
        self.setup_ui()
        
    def setup_ui(self):
        # Main layout
        layout = MDBoxLayout(orientation='vertical')
        
        # Top toolbar with settings button
        toolbar = MDTopAppBar(
            title="AHLingo",
            right_action_items=[["cog", lambda x: self.go_to_settings()]],
            elevation=4
        )
        layout.add_widget(toolbar)
        
        # Content layout that will be placed at the top
        content_layout = MDBoxLayout(
            orientation='vertical',
            padding=dp(16),
            spacing=dp(10),
            size_hint_y=None,
            height=dp(100)  # Adjust based on your content
        )
        
        pairs_button = MDRaisedButton(
            text="Pairs Exercises",
            size_hint=(None, None),
            width=dp(200),
            height=dp(48),
            pos_hint={'center_x': 0.5}
        )
        pairs_button.bind(on_release=self.go_to_pairs)
        content_layout.add_widget(pairs_button)
        
        # Add the content layout to a top-aligned box
        top_box = MDBoxLayout(
            orientation='vertical',
            size_hint_y=None,
            height=content_layout.height
        )
        top_box.add_widget(content_layout)
        
        # Add top box to main layout
        layout.add_widget(top_box)
        
        # Add a spacer box to push everything up
        spacer = MDBoxLayout(orientation='vertical')
        layout.add_widget(spacer)
        
        self.add_widget(layout)
    
    def go_to_settings(self):
        self.manager.current = 'settings'
    
    def go_to_pairs(self, *args):
        self.manager.current = 'pairs'
        self.manager.get_screen('pairs').load_topics()