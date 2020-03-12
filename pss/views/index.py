from flask import Blueprint, render_template, request
from .. import daybreak_api

bp = Blueprint('index', __name__)

@bp.route('/')
def index():
    return render_template('index/index.html')

@bp.route('/character')
def character():
    return render_template('index/character.html')

@bp.route('/outfit')
def outfit():
    return render_template('index/outfit.html')
