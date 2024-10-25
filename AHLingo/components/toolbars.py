from kivymd.uix.toolbar import MDTopAppBar

class StandardToolbar(MDTopAppBar):
    """Standard toolbar with consistent styling."""
    def __init__(self, title, left_action=None, right_action=None, **kwargs):
        left_items = [["arrow-left", left_action]] if left_action else []
        right_items = [[right_action[0], right_action[1]]] if right_action else []
        
        super().__init__(
            title=title,
            left_action_items=left_items,
            right_action_items=right_items,
            elevation=4,
            **kwargs
        )
