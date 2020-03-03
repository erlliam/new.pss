from flask import Blueprint, render_template, request
from .. import daybreak_api

bp = Blueprint('index', __name__)

@bp.route('/')
def index():
    return render_template('index/index.html')

@bp.route('/character')
def character():
    search = request.args.get('name')
    if search:
        char = daybreak_api.get_character(search.lower())
        if char:
            return render_template('index/character.html', char=char)
        else:
            print('Not found!')

    return render_template('index/character.html')

@bp.route('/outfit')
def outfit():
    return render_template('index/outfit.html')
