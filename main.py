# -*- coding: utf-8 -*-

import os
os.environ["IOS_IS_WINDOWED"] = "True"
os.environ['AHLINGO_RESET'] = "True"
from kivy.app import App
from app.AHLingo import AHLingo
import shutil

if __name__ == "__main__":
    app = AHLingo()

    if os.environ.get("KIVY_BUILD") == "ios":
        print("Running on iOS - preparing database for writable access.")

        original_dir = os.getcwd()
        original_db_path = os.path.join(original_dir, "database", "languageLearningDatabase.db")

        print(f"Original working directory: {original_dir}")
        print(f"Looking for original database at: {original_db_path}")
        if os.path.exists(original_db_path):
            print(f"Original database found. Size: {os.path.getsize(original_db_path) / (1024 * 1024):.2f} MB")
        else:
            print("Original database file not found!")
        
        user_data_dir = App.get_running_app().user_data_dir
        os.environ["HOME"] = user_data_dir
        os.chdir(user_data_dir)

        print(f"Changed working directory to user data dir: {user_data_dir}")

        db_folder_path = os.path.join(user_data_dir, "database")
        target_db_path = os.path.join(db_folder_path, "languageLearningDatabase.db")

        if os.environ.get("AHLINGO_RESET") == "True":
            if os.path.exists(db_folder_path):
                print("Reset is enabled. Removing existing database folder.")
                shutil.rmtree(db_folder_path)

        if not os.path.exists(db_folder_path):
            os.makedirs(db_folder_path)
            print(f"Created database directory at: {db_folder_path}")

        if not os.path.exists(target_db_path):
            shutil.copy(original_db_path, target_db_path)
            print(f"Copied database to writable location: {target_db_path}")
        else:
            print("Writable database already exists.")

        if os.path.exists(target_db_path):
            print(f"Final database location confirmed: {target_db_path}")
            print(f"Database file size: {os.path.getsize(target_db_path) / (1024 * 1024):.2f} MB")
        else:
            print("Error: Database file not found in target location!")

        app.run()
    else:
        print("Running on non-iOS platform.")
        app.run()
