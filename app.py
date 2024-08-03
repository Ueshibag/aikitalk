
from flask import Flask, jsonify, render_template, request, send_file
from gtts import gTTS

import os

import aikitalk

app = Flask(__name__)

# We want json to keep the order of lists elements untouched.
app.json.sort_keys = False

AUDIO_FOLDER = os.path.join(app.root_path, 'static', 'audio')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get_grades_files')
def get_grades_files():
    grades_files = aikitalk.get_grades_files(app.root_path)
    return jsonify(grades_files)


@app.route('/get_data')
def get_data():
    """
    Parses the INI file provided as argument and returns the jsonified content.
    :return:
    """
    ini_file_name = request.args.get('ini_file_name')

    data = aikitalk.parse_config(app.root_path, ini_file_name)
    return jsonify(data)


@app.route('/get_techniques')
def get_techniques():
    ini_file_name = request.args.get('ini_file_name')
    situation = request.args.get('situation')
    attack = request.args.get('attack')

    data = aikitalk.parse_config(app.root_path, ini_file_name)
    techniques = data[situation][attack]
    return jsonify(techniques)


@app.route('/speak')
def speak():
    """
    Creates a MP3 file from the text argument and returns the MP3 file.
    """
    text = request.args.get('text')

    tts = gTTS(text=aikitalk.get_speech_of_sentence(text.lower()), lang='fr')
    filename = os.path.join(AUDIO_FOLDER, 'temp.mp3')
    tts.save(filename)
    return send_file(filename, as_attachment=True, download_name='technique.mp3', mimetype='audio/mpeg')


if __name__ == '__main__':
    app.run(debug=True)
