from backend.app import db # Import db from the main app

# Association table for the many-to-many relationship between widgets and themes
widget_themes = db.Table('widget_themes',
    db.Column('widget_id', db.Integer, db.ForeignKey('widgets.id'), primary_key=True),
    db.Column('theme_id', db.Integer, db.ForeignKey('themes.id'), primary_key=True)
)
