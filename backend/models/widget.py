from backend.app import db # Import db from the main app

class Widget(db.Model):
    __tablename__ = 'widgets'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    code = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    # Relationship to link with themes (many-to-many)
    themes = db.relationship('Theme', secondary='widget_themes', backref=db.backref('widgets', lazy='dynamic'))


    def __repr__(self):
        return f'<Widget {self.name}>'
