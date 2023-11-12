from kivy.uix.screenmanager import Screen

class MainMenuScreen(Screen):
    def go_to_settings(self):
        self.manager.current = 'settings'

    def switch_to_screen(self, screen_name):
        # Here you would switch to the appropriate screen
        # For now, let's just print the screen we want to go to
        print(f'Switching to {screen_name} screen')