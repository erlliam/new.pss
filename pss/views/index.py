from flask import Blueprint, render_template, request, flash
from .. import daybreak_api

bp = Blueprint('index', __name__)

@bp.route('/')
def index():
    return render_template('index/index.html')

@bp.route('/character')
def character():
    return render_template('index/character.html')
# String is the default variable rule. Usleess?
@bp.route('/flash', methods=['POST'])
def flash_message():
    message = request.json['message']
    flash(message)
    # HTTP 204 No content
    return ('', 204)

@bp.route('/outfit')
def outfit():
    return render_template('index/outfit.html')
