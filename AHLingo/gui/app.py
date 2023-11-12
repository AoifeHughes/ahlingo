from kivy.uix.screenmanager import ScreenManager
from kivy.app import App
from .mainmenu import MainMenuScreen
from kivy.lang import Builder
from kivy.core.text import LabelBase


class AHLingoApp(App):
    def build(self):
        Builder.load_file('./gui/styles/mainmenu.kv')
        sm = ScreenManager()
        sm.add_widget(MainMenuScreen(name='menu'))
        return sm

if __name__ == '__main__':
    AHLingoApp().run()
