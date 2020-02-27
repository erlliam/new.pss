from flask import Blueprint, render_template

bp = Blueprint('index', __name__)

@bp.route('/')
def index():
    return render_template('index/index.html')
    return 'Welcome to index'


