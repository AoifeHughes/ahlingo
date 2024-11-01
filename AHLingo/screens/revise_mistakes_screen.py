# -*- coding: utf-8 -*-
from .base_screen import BaseScreen
from AHLingo.components.layouts import ContentLayout, ScrollableContent
from AHLingo.components.toolbars import StandardToolbar
from kivymd.uix.datatables import MDDataTable
from kivymd.uix.dialog import MDDialog
from kivymd.uix.button import MDFlatButton
from kivy.metrics import dp
from datetime import datetime


class ReviseMistakesScreen(BaseScreen):
    """Screen for reviewing and retrying failed exercise attempts."""

    def __init__(self, db, **kwargs):
        super().__init__(db, **kwargs)
        self.name = "revise_mistakes"
        self.data_table = None
        self.dialog = None
        self.setup_screen()

    def setup_screen(self):
        """Setup the screen layout."""
        layout = ContentLayout()

        # Add toolbar
        toolbar = StandardToolbar(
            title="Revise Mistakes", left_action=lambda x: self.go_back_to_home()
        )
        layout.add_widget(toolbar)

        # Create data table
        self.create_data_table()

        # Add table to a scrollable container with proper positioning
        table_container = ScrollableContent(
            self.data_table,
            size_hint=(1, 0.9),  # Take full width, 90% of height
            pos_hint={"center_x": 0.5, "center_y": 0.5},  # Center in available space
        )

        # Add padding around the container
        table_container.padding = [
            dp(16),
            dp(16),
            dp(16),
            dp(16),
        ]  # left, top, right, bottom

        layout.add_widget(table_container)
        self.add_widget(layout)

    def create_data_table(self):
        """Create the data table for displaying failed attempts."""
        self.data_table = MDDataTable(
            size_hint=(1, 1),  # Take full size of container
            pos_hint={"center_x": 0.5, "center_y": 0.5},
            use_pagination=False,
            column_data=[
                ("Exercise Topic", dp(40)),
                ("Exercise Type", dp(30)),
                ("ID", dp(20)),
                ("Attempted Date", dp(40)),
            ],
            row_data=[],
            rows_num=10,  # Show 10 rows before scrolling
            elevation=1,  # Add slight shadow
            background_color_header="#EEEEEE",  # Light grey header
            background_color_cell="#FFFFFF",  # White cells
        )
        self.data_table.bind(on_row_press=self.on_row_press)

    def on_row_press(self, instance_table, instance_row):
        """
        Handle row press event.
        Works consistently regardless of which column is clicked.

        Args:
            instance_table: The MDDataTable instance
            instance_row: The row that was clicked
        """
        # Check if there's actual data (not the "Nothing to cover" message)
        idx = int(instance_row.index / len(instance_table.column_data))
        row_data = instance_table.row_data[idx]
        if row_data[0] == "Nothing to cover":
            return

        # The exercise type and ID are always in the second and third columns
        exercise_type = row_data[1]
        exercise_id = row_data[2]

        if not self.dialog:
            self.dialog = MDDialog(
                title="Retry Exercise",
                text="Would you like to attempt this exercise again?",
                buttons=[
                    MDFlatButton(text="No", on_release=lambda x: self.dialog.dismiss()),
                    MDFlatButton(
                        text="Yes",
                        on_release=lambda x: self.start_exercise(
                            exercise_type, exercise_id
                        ),
                    ),
                ],
            )
        self.dialog.open()

    def start_exercise(self, exercise_type, exercise_id):
        """Start the selected exercise."""
        self.dialog.dismiss()

        # Get the screen manager from the app
        screen_manager = self.parent

        # Navigate to the appropriate exercise screen
        if exercise_type == "Pairs":
            screen = screen_manager.get_screen("pairs")
            screen.load_specific_exercise(exercise_id)
            screen_manager.current = "pairs"
        elif exercise_type == "Conversation":
            screen = screen_manager.get_screen("conversations")
            screen.load_specific_exercise(exercise_id)
            screen_manager.current = "conversations"
        elif exercise_type == "Translation":
            screen = screen_manager.get_screen("translation")
            screen.load_specific_exercise(exercise_id)
            screen_manager.current = "translation"

    def on_pre_enter(self):
        """Load failed attempts when entering the screen."""
        settings = self.get_user_settings()
        if settings:
            with self.db() as db:
                failed_attempts = db.get_failed_attempts(settings["username"])

            if failed_attempts:
                # Format the data for the table
                row_data = [
                    (
                        attempt["exercise_topic"],
                        attempt["exercise_type"],
                        str(attempt["exercise_id"]),
                        datetime.fromisoformat(attempt["attempt_date"]).strftime(
                            "%Y-%m-%d %H:%M"
                        ),
                    )
                    for attempt in failed_attempts
                ]
                self.data_table.row_data = row_data
            else:
                # Show "Nothing to cover" message
                self.data_table.row_data = [("Nothing to cover", "", "", "")]
