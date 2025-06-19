from flask import Blueprint, request, jsonify
from backend.models.theme import Theme
from backend.app import db

themes_bp = Blueprint('themes', __name__)

@themes_bp.route('/', methods=['POST'])
def create_theme():
    data = request.get_json()
    if not data or not 'name' in data or not 'css_code' in data:
        return jsonify({'message': 'Missing required fields: name, css_code'}), 400

    new_theme = Theme(
        name=data['name'],
        css_code=data['css_code'],
        description=data.get('description')
    )
    db.session.add(new_theme)
    db.session.commit()
    return jsonify({'message': 'Theme created successfully', 'theme_id': new_theme.id}), 201

@themes_bp.route('/', methods=['GET'])
def get_themes():
    themes = Theme.query.all()
    output = []
    for theme in themes:
        output.append({
            'id': theme.id,
            'name': theme.name,
            'description': theme.description
            # css_code can be large, so maybe not return it in the list view by default
        })
    return jsonify({'themes': output}), 200

@themes_bp.route('/<int:theme_id>', methods=['GET'])
def get_theme(theme_id):
    theme = Theme.query.get(theme_id)
    if not theme:
        return jsonify({'message': 'Theme not found'}), 404
    return jsonify({
        'id': theme.id,
        'name': theme.name,
        'description': theme.description,
        'css_code': theme.css_code
    }), 200

@themes_bp.route('/<int:theme_id>', methods=['PUT'])
def update_theme(theme_id):
    theme = Theme.query.get(theme_id)
    if not theme:
        return jsonify({'message': 'Theme not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'message': 'No input data provided'}), 400

    if 'name' in data:
        theme.name = data['name']
    if 'description' in data:
        theme.description = data['description']
    if 'css_code' in data:
        theme.css_code = data['css_code']

    db.session.commit()
    return jsonify({'message': 'Theme updated successfully'}), 200

@themes_bp.route('/<int:theme_id>', methods=['DELETE'])
def delete_theme(theme_id):
    theme = Theme.query.get(theme_id)
    if not theme:
        return jsonify({'message': 'Theme not found'}), 404

    # Before deleting a theme, consider what to do with widgets that might be using it.
    # For now, we'll just delete the theme. The association table will handle broken links.
    db.session.delete(theme)
    db.session.commit()
    return jsonify({'message': 'Theme deleted successfully'}), 200
