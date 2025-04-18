import csv
import json  # Dùng json thay cho ast
from flask import Flask, request, jsonify
from flask_cors import CORS
from a_star import astar  # Import hàm tìm đường và đồ thị
edges_file = 'data/adj_list_with_weights.csv'  # Đường dẫn đến file edges.csv
adj_dict = {}
with open(edges_file, 'r') as f:
    reader = csv.reader(f)
    header = next(reader)  # Skip header
    for row in reader:
        try:
            node = int(row[0])
            neighbors = {}
            
            # Thử nhiều cách khác nhau để parse neighbors_with_weights
            raw_text = row[1]
            
            # In ra để debug nếu cần
            if node < 5:  # Chỉ in một vài node đầu tiên để kiểm tra
                print(f"Node {node}, raw text: {raw_text}")
            
            # Phương pháp 1: Dùng eval() nếu dữ liệu có định dạng Python
            try:
                parsed_data = eval(raw_text.replace('np.float64', ''))
                for neighbor_id, weight in parsed_data:
                    neighbors[int(neighbor_id)] = float(weight)
            except:
                # Phương pháp 2: Parse thủ công
                raw = raw_text.replace('[', '').replace(']', '').replace('np.float64', '') \
                            .replace('(', '').replace(')', '')
                parts = raw.split(',')
                
                # Nếu là danh sách các tuple (neighbor_id, weight)
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

# Tạo Flask app
app = Flask(__name__)
CORS(app)
adj_list = adj_dict  # Đồ thị dưới dạng danh sách kề
@app.route('/find_path', methods=['POST'])
def find_path():
    data = request.get_json()

    # Kiểm tra và xử lý đầu vào

    if 'start' not in data or 'end' not in data:
        return jsonify({"error": "Missing 'start' or 'end' node in request data"}), 400
    
    start = int(data['start'])
    end = int(data['end'])
    num_iterations = int(data.get('iterations', 10))

    print(f"\n=== Finding path from {start} to {end} ===")
    print(start, end, num_iterations)
    
    # Kiểm tra xem start và end có hợp lệ không
    if start not in adj_list or end not in adj_list:
        return jsonify({"error": f"Invalid 'start' or 'end' node. {start} or {end} not found in the graph."}), 400
    
    # Gọi hàm A* để tìm đường đi
    try:
        path, explored_nodes = astar(adj_list, start, end, num_iterations)
        list_explore_node = list(explored_nodes)
        if path:
            print("✅ Path found:", path)
            print("Nodes explored in order:")
            list_explore_node.insert(0, start)  # Thêm node bắt đầu vào danh sách đã duyệt
            list_explore_node.append(end)
            for node in explored_nodes:
                print(node)
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
