from backend.app import db # Import db from the main app

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False) # In a real app, hash passwords!
    email = db.Column(db.String(255), unique=True, nullable=False)
    widgets = db.relationship('Widget', backref='user', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'
