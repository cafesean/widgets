from flask import Blueprint, request, jsonify
from backend.models.widget import Widget
from backend.models.user import User # Needed to check if user exists
from backend.models.theme import Theme # Add this import
from backend.app import db

widgets_bp = Blueprint('widgets', __name__)

@widgets_bp.route('/', methods=['POST'])
def create_widget():
    data = request.get_json()
    if not data or not 'name' in data or not 'code' in data or not 'user_id' in data:
        return jsonify({'message': 'Missing required fields: name, code, user_id'}), 400

    if not User.query.get(data['user_id']):
        return jsonify({'message': 'User not found'}), 404

    new_widget = Widget(
        name=data['name'],
        code=data['code'],
        user_id=data['user_id'],
        description=data.get('description')
    )
    db.session.add(new_widget)
    db.session.commit()
    return jsonify({'message': 'Widget created successfully', 'widget_id': new_widget.id}), 201

@widgets_bp.route('/', methods=['GET'])
def get_widgets():
    # This could be paginated in a real application
    widgets = Widget.query.all()
    output = []
    for widget in widgets:
        output.append({
            'id': widget.id,
            'name': widget.name,
            'description': widget.description,
            'user_id': widget.user_id
            # 'code' can be large, so maybe not return it in the list view
        })
    return jsonify({'widgets': output}), 200

@widgets_bp.route('/<int:widget_id>', methods=['GET'])
def get_widget(widget_id):
    widget = Widget.query.get(widget_id)
    if not widget:
        return jsonify({'message': 'Widget not found'}), 404
    return jsonify({
        'id': widget.id,
        'name': widget.name,
        'description': widget.description,
        'code': widget.code,
        'user_id': widget.user_id
    }), 200

@widgets_bp.route('/<int:widget_id>', methods=['PUT'])
def update_widget(widget_id):
    widget = Widget.query.get(widget_id)
    if not widget:
        return jsonify({'message': 'Widget not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'message': 'No input data provided'}), 400

    if 'name' in data:
        widget.name = data['name']
    if 'description' in data:
        widget.description = data['description']
    if 'code' in data:
        widget.code = data['code']
    # user_id of a widget is generally not changed. If it is, ensure the new user_id is valid.
    # if 'user_id' in data:
    #     if not User.query.get(data['user_id']):
    #         return jsonify({'message': 'User not found for new user_id'}), 404
    #     widget.user_id = data['user_id']

    db.session.commit()
    return jsonify({'message': 'Widget updated successfully'}), 200

@widgets_bp.route('/<int:widget_id>', methods=['DELETE'])
def delete_widget(widget_id):
    widget = Widget.query.get(widget_id)
    if not widget:
        return jsonify({'message': 'Widget not found'}), 404

    db.session.delete(widget)
    db.session.commit()
    return jsonify({'message': 'Widget deleted successfully'}), 200

@widgets_bp.route('/<int:widget_id>/themes', methods=['GET'])
def get_widget_themes(widget_id):
    widget = Widget.query.get(widget_id) # Widget should already be imported
    if not widget:
        return jsonify({'message': 'Widget not found'}), 404

    themes_output = []
    for theme_obj in widget.themes: # theme_obj to avoid conflict if Theme model is also named theme
        themes_output.append({
            'id': theme_obj.id,
            'name': theme_obj.name,
            'description': theme_obj.description
        })
    return jsonify({'themes': themes_output}), 200

@widgets_bp.route('/<int:widget_id>/themes/<int:theme_id>', methods=['POST'])
def add_theme_to_widget(widget_id, theme_id):
    widget = Widget.query.get(widget_id)
    if not widget:
        return jsonify({'message': 'Widget not found'}), 404

    theme = Theme.query.get(theme_id)
    if not theme:
        return jsonify({'message': 'Theme not found'}), 404

    if theme in widget.themes:
        return jsonify({'message': 'Theme already associated with this widget'}), 400

    widget.themes.append(theme)
    db.session.commit()
    return jsonify({'message': f'Theme {theme_id} added to widget {widget_id}'}), 201 # 201 for successful creation/association

@widgets_bp.route('/<int:widget_id>/themes/<int:theme_id>', methods=['DELETE'])
def remove_theme_from_widget(widget_id, theme_id):
    widget = Widget.query.get(widget_id)
    if not widget:
        return jsonify({'message': 'Widget not found'}), 404

    theme = Theme.query.get(theme_id)
    if not theme:
        return jsonify({'message': 'Theme not found'}), 404

    if theme not in widget.themes:
        return jsonify({'message': 'Theme not associated with this widget'}), 400

    widget.themes.remove(theme)
    db.session.commit()
    return jsonify({'message': f'Theme {theme_id} removed from widget {widget_id}'}), 200
