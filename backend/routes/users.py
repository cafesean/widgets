from flask import Blueprint, request, jsonify
from backend.models.user import User # Adjusted import path
from backend.app import db # Import db

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['POST'])
def create_user():
    data = request.get_json()
    if not data or not 'username' in data or not 'password' in data or not 'email' in data:
        return jsonify({'message': 'Missing required fields'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400

    # In a real app, hash the password before saving
    new_user = User(username=data['username'], password=data['password'], email=data['email'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User created successfully', 'user_id': new_user.id}), 201

@users_bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email
    }), 200

@users_bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'message': 'No input data provided'}), 400

    if 'username' in data and data['username'] != user.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already exists'}), 400
        user.username = data['username']

    if 'email' in data and data['email'] != user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already exists'}), 400
        user.email = data['email']

    if 'password' in data:
        # In a real app, hash the new password
        user.password = data['password']

    db.session.commit()
    return jsonify({'message': 'User updated successfully'}), 200

@users_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    # Consider what to do with user's widgets: delete them, or set user_id to null, or prevent deletion if widgets exist.
    # For now, we'll just delete the user.
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'}), 200
