from flask import Flask, request, Response
from lifextractor import Pattern, extract

import json

app = Flask(__name__)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response


@app.route('/from_file', methods=['POST'])
def upload_file():
    file = request.files.get('file')
    if file is None:
        return Response({'error': 'missing file'}, status=400, mimetype='application/json')
    content = file.read().decode('utf-8').split('\n')
    pattern = extract(content)
    retval = {
        'position': pattern.position,
        'survival': pattern.survival,
        'birth': pattern.birth,
        'pattern': pattern.pattern
    }
    return Response(json.dumps(retval), mimetype='application/json')


if __name__ == '__main__':
    app.run()
