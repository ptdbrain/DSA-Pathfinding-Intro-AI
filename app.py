import csv
from flask import Flask, request, jsonify
from flask_cors import CORS
from a_star import astar

edges_file = 'data/adj_list_with_weights.csv'
adj_dict = {}

with open(edges_file, 'r') as f:
    reader = csv.reader(f)
    header = next(reader)

    for row in reader:
        try:
            node = int(row[0])
            neighbors = {}

            raw_text = row[1]

            # In vài dòng đầu để kiểm tra
            if node < 5:
                print(f"Node {node}, raw text: {raw_text}")

            try:
                parsed_data = eval(raw_text.replace('np.float64', ''))
                for neighbor_id, weight in parsed_data:
                    neighbors[int(neighbor_id)] = float(weight)
            except:
                raw = raw_text.replace('[', '').replace(']', '').replace('np.float64', '') \
                              .replace('(', '').replace(')', '')
                parts = raw.split(',')

                for i in range(0, len(parts) - 1, 2):
                    if parts[i].strip() and parts[i+1].strip():
                        neighbor_id = int(parts[i].strip())
                        weight = float(parts[i+1].strip())
                        neighbors[neighbor_id] = weight

            adj_dict[node] = neighbors

        except Exception as e:
            print(f"Lỗi khi xử lý node {row[0]}: {e}")
            continue

print(f"Đã đọc được {len(adj_dict)} nodes từ adj_list")

# Flask app
app = Flask(__name__)
CORS(app)

adj_list = adj_dict  # Gán đồ thị gốc

@app.route('/find_path', methods=['POST'])
def find_path():
    data = request.get_json()

    if 'start' not in data or 'end' not in data:
        return jsonify({"error": "Missing 'start' or 'end' node in request data"}), 400
    print(f"Received data: {data}")
    start = int(data['start'])
    end = int(data['end'])
    num_iterations = int(data.get('iterations', 10))
    blocked_edges = data.get('blocked_edges', [])  # Danh sách cạnh bị cấm, dạng [[id1, id2], ...]

    print(f"\n=== Finding path from {start} to {end} ===")

    if start not in adj_list or end not in adj_list:
        return jsonify({"error": f"Invalid 'start' or 'end' node. {start} or {end} not found in the graph."}), 400

    try:
        # Tạo bản sao đồ thị và xóa các cạnh bị cấm
        from copy import deepcopy
        adj_list_filtered = deepcopy(adj_list)

        for edge in blocked_edges:
            if len(edge) != 2:
                continue  # Bỏ qua nếu không hợp lệ
            u, v = edge
            if u in adj_list_filtered and v in adj_list_filtered[u]:
                del adj_list_filtered[u][v]
            if v in adj_list_filtered and u in adj_list_filtered[v]:
                del adj_list_filtered[v][u]

        path, explored_nodes = astar(adj_list_filtered, start, end, num_iterations)
        list_explore_node = list(explored_nodes)

        if path:
            print("✅ Path found:", path)
            list_explore_node.insert(0, start)
            list_explore_node.append(end)

            return jsonify({
                "path": path,
                "explored_nodes": list_explore_node,
                "message": "Path found successfully."
            })
        else:
            print("❌ No path found.")
            return jsonify({"error": "No path found between the nodes."}), 404

    except Exception as e:
        print(f"❌ Error during A* search: {e}")
        return jsonify({"error": f"Error during A* search: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)