# -*- coding: utf-8 -*-
import os
os.environ["KIVY_NO_CONSOLELOG"] = "1"

from AHLingo import populate_database

if __name__ == "__main__":
    populate_database()
