from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
# Configure your database URI here
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///../database/widgets.db'
db = SQLAlchemy(app)

from models.user import User
from models.widget import Widget
from models.theme import Theme
from models.widget_theme import widget_themes

# Import and register blueprints
from routes.users import users_bp
from routes.widgets import widgets_bp
from routes.themes import themes_bp

app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(widgets_bp, url_prefix='/api/widgets')
app.register_blueprint(themes_bp, url_prefix='/api/themes')

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
