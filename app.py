import csv
from flask import Flask, request, jsonify
from flask_cors import CORS
from algorithm.a_star import astar
from algorithm.dijkstra import dijkstra
from algorithm.bfs import bfs
from algorithm.dfs import dfs
from algorithm.greedy_best_first import greedy_best_first
from algorithm.iterative_deepening_dfs import iddfs
from algorithm.uniform_cost_search import uniform_cost_search

edges_file = 'data/fileCsv/adj_list_with_weights.csv'
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

    # lấy dữ liệu từ request
    start = int(data['start'])
    end = int(data['end'])
    num_iterations = int(data.get('iterations', 10))
    blocked_edges = data.get('blocked_edges', [])
    algorithm = data.get('algorithm', 'A*')
    trafic_edges = data.get('traffic_edges', [])
    trafic_level = data.get('traffic_level', 0)

    # kiểm tra điều kiện đầu vào 
    if 'start' not in data or 'end' not in data:
        return jsonify({"error": "Missing 'start' or 'end' node in request data"}), 400
    if start not in adj_list or end not in adj_list:
        return jsonify({"error": f"Invalid 'start' or 'end' node. {start} or {end} not found in the graph."}), 400
    
    
    # Kiểm tra nếu start hoặc end nằm trong các cạnh bị cấm
    for edge in blocked_edges:
        if len(edge) != 2:
            continue
        u, v = edge
        # Kiểm tra nếu start hoặc end là một phần của cạnh bị cấm
        if start == u and end == v or start == v and end == u:
            return jsonify({"error": f"💀Vị trí bạn chọn nằm trong vùng cấm!!!\nVui lòng chọn lại vị trí"}), 400



    print(f"Received data: {data}")
    # Kiểm tra dữ liệu đầu vào 
    print(f"\n=== Finding path from {start} to {end} ===")
    print(f"Algorithm: {algorithm}")
    print(f"Number Blocked edges: {len(blocked_edges)}")
    print(f"Number Traffic edges: {len(trafic_edges)}")
    print(f"Traffic level: {trafic_level}")
    print(f"Number of iterations: {num_iterations}")
    try:
        # Tạo bản sao đồ thị và xóa các cạnh bị cấm
        from copy import deepcopy
        adj_list_filtered = deepcopy(adj_list)

        #------------------------------- Xử lý các cạnh bị cấm --------------------------------#     
        for edge in blocked_edges:
            if len(edge) != 2:
                continue
            u, v = edge
            
            # Xóa cạnh theo cả hai chiều
            if isinstance(adj_list_filtered[u], dict):
                adj_list_filtered[u].pop(v, None)
            elif isinstance(adj_list_filtered[u], list):
                if v in adj_list_filtered[u]:
                    adj_list_filtered[u].remove(v)
                    
            if isinstance(adj_list_filtered[v], dict):
                adj_list_filtered[v].pop(u, None)
            elif isinstance(adj_list_filtered[v], list):
                if u in adj_list_filtered[v]:
                    adj_list_filtered[v].remove(u)

        #------------------------------- Xử lý các cạnh tắc --------------------------------#
        k = 1.5 if(int(trafic_level) == 1) else int(trafic_level)     
        for edge in trafic_edges:
            if len(edge) != 2:
                continue
            u, v = edge
            # Kiểm tra xem cạnh có tồn tại trong đồ thị không
            if u in adj_list_filtered and v in adj_list_filtered[u]:
                # Cập nhật trọng số của cạnh
                adj_list_filtered[u][v] *= k
            if v in adj_list_filtered and u in adj_list_filtered[v]:
                # Cập nhật trọng số của cạnh theo chiều ngược lại
                adj_list_filtered[v][u] *= k

    
        algorithms = {
            'A Star': astar,
            'Dijkstra': dijkstra,
            'BFS': bfs,
            'DFS': dfs,
            'Greedy Best First' : greedy_best_first,
            'Iterative Deepening DFS' : iddfs,
            'Uniform Cost Search' : uniform_cost_search,
        }

        if algorithm in algorithms:
            path, explored_nodes = algorithms[algorithm](adj_list_filtered, start, end, num_iterations)
            list_explore_node = list(explored_nodes)
            print("\n✅List of explored nodes:")
            print(list_explore_node)

            if path:
                print("\n✅ Path found:", path)
                list_explore_node.insert(0, start)
                list_explore_node.append(end)
                return jsonify({
                    "path": path,
                    "explored_nodes": list_explore_node,
                    "message": "Path found successfully.",
                    "Cost": "someone"
                })
            else:
                print("❌ No path found.")
                return jsonify({"error": "No path found between the nodes."}), 404
        else:
            return jsonify({"error": "Invalid algorithm specified."}), 400

    except Exception as e:
        print(f"❌ Có lỗi xảy ra ")
        return jsonify({"error": "❌ Có lỗi xảy ra "}), 500


if __name__ == '__main__':
    app.run(debug=True)
