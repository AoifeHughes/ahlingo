# -*- coding: utf-8 -*-
from kivymd.uix.label import MDLabel


class AutoHeightLabel(MDLabel):
    """Label that automatically adjusts its height based on content."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.size_hint_y = None
        self.bind(texture_size=self._update_height)

    def _update_height(self, instance, value):
        """Update height based on texture size."""
        self.height = value[1]  # texture_size[1] is the height
