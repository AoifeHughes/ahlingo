# -*- coding: utf-8 -*-

import os
os.environ["IOS_IS_WINDOWED"] = "True"

from kivy.app import App

from app.AHLingo import AHLingo

if __name__ == "__main__":
    if os.environ.get("KIVY_BUILD") == "ios":
        # Set to windowed mode to prevent toolbar overlapping with status bar
        
        app = AHLingo()
        # Set the home directory to the iOS app's Documents directory
        os.environ["HOME"] = App.get_running_app().user_data_dir
        # You might also want to set the current working directory
        os.chdir(os.environ["HOME"])
        app.run()
    else:
        # For other platforms, just run the app normally
        AHLingo().run()
