from backend.app import db # Import db from the main app

class Theme(db.Model):
    __tablename__ = 'themes'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    css_code = db.Column(db.Text, nullable=False)

    def __repr__(self):
        return f'<Theme {self.name}>'
