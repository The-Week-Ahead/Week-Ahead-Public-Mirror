from flask import Flask, request, jsonify, render_template, send_file, send_from_directory

app = Flask(__name__, static_url_path='/week-ahead/static')

APP_VERSION = "3.4.6"

@app.route('/week-ahead', methods=['GET'])
def weekAhead():
    return render_template('index.html', version=APP_VERSION)

@app.route('/week-ahead/version', methods=['GET'])
def get_version():
    return jsonify({"version": APP_VERSION})

@app.route('/week-ahead/static/js/worker.min.js')
def service_worker():
    from flask import make_response, send_from_directory
    response = make_response(send_from_directory('static/js', 'worker.min.js'))
    response.headers['Content-Type'] = 'application/javascript'
    response.headers['Service-Worker-Allowed'] = '/'
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


if __name__ == '__main__':
    app.run(host="127.0.0.1", port=6000)
