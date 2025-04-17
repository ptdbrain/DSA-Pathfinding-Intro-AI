from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS

app = Flask(__name__)
CORS(app)  # Cho phép tất cả các nguồn (origins)

@app.route('/find_path', methods=['POST'])
def find_path():
    # Lấy dữ liệu từ request
    data = request.get_json()
    start = data['start']
    end = data['end']

    # In ra dữ liệu nhận được
    print(f"Start: {start}, End: {end}")

    # Giả sử kết quả tìm đường là một danh sách các node
    result = {"status": "success", "path": [start, end]}
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
