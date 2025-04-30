import csv
from flask import Flask, request, jsonify
from flask_cors import CORS
from algorithm.a_star import astar
from algorithm.dijkstra import dijkstra
from algorithm.bfs import bfs
from algorithm.dfs import dfs


edges_file = 'data/fileCsv/adj_list_with_weights.csv'   #đường dẫn đến file csv chứa danh sách cạnh
adj_dict = {}

with open(edges_file, 'r') as f:        # Mở file CSV
    reader = csv.reader(f)
    header = next(reader)   # Bỏ qua dòng đầu tiên (tiêu đề)
    for row in reader:
        try:
            node = int(row[0])  # Chuyển đổi node thành số nguyên
            neighbors = {}

            raw_text = row[1]

            # In vài dòng đầu để kiểm tra
            if node < 5:
                print(f"Node {node}, raw text: {raw_text}")     # In ra 5 dòng đầu tiên để kiểm tra

            try:
                parsed_data = eval(raw_text.replace('np.float64', ''))  # Chuyển đổi chuỗi thành tuple
                for neighbor_id, weight in parsed_data: 
                    neighbors[int(neighbor_id)] = float(weight) # Chuyển đổi id và trọng số thành số nguyên và số thực
            except:     # Nếu eval không thành công, xử lý theo cách khác
                raw = raw_text.replace('[', '').replace(']', '').replace('np.float64', '') \
                              .replace('(', '').replace(')', '')    # Xóa các ký tự không cần thiết
                parts = raw.split(',')  # Tách chuỗi thành danh sách các phần tử

                for i in range(0, len(parts) - 1, 2):   # Duyệt qua các phần tử theo cặp
                    if parts[i].strip() and parts[i+1].strip(): # Kiểm tra xem phần tử có rỗng không
                        neighbor_id = int(parts[i].strip()) # Chuyển đổi id thành số nguyên
                        weight = float(parts[i+1].strip())  # Chuyển đổi trọng số thành số thực
                        neighbors[neighbor_id] = weight # Thêm vào từ điển neighbors

            adj_dict[node] = neighbors  # Thêm vào từ điển adj_dict

        except Exception as e:
            print(f"Lỗi khi xử lý node {row[0]}: {e}")  # In lỗi nếu có
            continue
print(f"Đã đọc được {len(adj_dict)} nodes từ adj_list") # In ra số lượng node đã đọc được

# Flask app
app = Flask(__name__)   # Tạo ứng dụng Flask
CORS(app)

adj_list = adj_dict  # Gán đồ thị gốc

@app.route('/find_path', methods=['POST'])  # Định nghĩa route cho API
def find_path():
    data = request.get_json()

    # lấy dữ liệu từ request
    start = int(data['start'])  # Chuyển đổi start thành số nguyên
    end = int(data['end'])      # Chuyển đổi end thành số nguyên
    num_iterations = int(data.get('iterations', 10))    # Số lần lặp (mặc định là 10)
    blocked_edges = data.get('blocked_edges', [])       # Các cạnh bị cấm (mặc định là rỗng)
    algorithm = data.get('algorithm', 'A*') # Thuật toán (mặc định là A*)
    trafic_edges = data.get('traffic_edges', [])    # Các cạnh tắc (mặc định là rỗng)
    trafic_level = data.get('traffic_level', 0) # Mức độ tắc (mặc định là 0)

     # kiểm tra điều kiện đầu vào 
    if 'start' not in data or 'end' not in data:    # Kiểm tra xem có 'start' và 'end' trong dữ liệu không
        return jsonify({"error": "Missing 'start' or 'end' node in request data"}), 400     # Nếu không có thì trả về lỗi 400
    if start not in adj_list or end not in adj_list:    # Kiểm tra xem 'start' và 'end' có trong đồ thị không
        return jsonify({"error": f"Invalid 'start' or 'end' node. {start} or {end} not found in the graph."}), 400   # Nếu không có thì trả về lỗi 400
    
    
    # Kiểm tra nếu start hoặc end nằm trong các cạnh bị cấm
    for edge in blocked_edges:
        if len(edge) != 2:
            continue
        u, v = edge # Lấy các đỉnh của cạnh bị cấm
        # Kiểm tra nếu start hoặc end là một phần của cạnh bị cấm
        if start == u and end == v or start == v and end == u:  # Nếu start và end nằm trong cạnh bị cấm
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
        from copy import deepcopy   # Sử dụng deepcopy để tạo bản sao sâu của đồ thị
        adj_list_filtered = deepcopy(adj_list)  # Tạo bản sao của đồ thị gốc để không làm thay đổi nó

        #------------------------------- Xử lý các cạnh bị cấm --------------------------------#     
        for edge in blocked_edges:      
            if len(edge) != 2:  ## Kiểm tra xem cạnh có đúng định dạng không
                continue
            u, v = edge
            
            # Xóa cạnh theo cả hai chiều
            if isinstance(adj_list_filtered[u], dict):      ## Nếu là dict thì xóa theo chiều u -> v
                adj_list_filtered[u].pop(v, None)   
            elif isinstance(adj_list_filtered[u], list):    ## Nếu là list thì xóa theo chiều u -> v
                if v in adj_list_filtered[u]:               ## Kiểm tra xem v có trong danh sách không
                    adj_list_filtered[u].remove(v)

            if isinstance(adj_list_filtered[v], dict):    ## Nếu là dict thì xóa theo chiều v -> u
                adj_list_filtered[v].pop(u, None)
            elif isinstance(adj_list_filtered[v], list):    ## Nếu là list thì xóa theo chiều v -> u
                if u in adj_list_filtered[v]:
                    adj_list_filtered[v].remove(u)          #   Xóa cạnh theo chiều v -> u
            # Nếu không có cạnh nào thì xóa node

        #------------------------------- Xử lý các cạnh tắc --------------------------------#
        for edge in trafic_edges:
            if len(edge) != 2:  ## Kiểm tra xem cạnh có đúng định dạng không
                continue
            u, v = edge ## Lấy các đỉnh của cạnh tắc
            # Kiểm tra xem cạnh có tồn tại trong đồ thị không
            if u in adj_list_filtered and v in adj_list_filtered[u]:    ## Nếu có thì cập nhật trọng số
                # Cập nhật trọng số của cạnh
                adj_list_filtered[u][v] *= int(trafic_level)    ## Cập nhật trọng số của cạnh theo chiều u -> v
            if v in adj_list_filtered and u in adj_list_filtered[v]:#  Nếu có thì cập nhật trọng số
                # Cập nhật trọng số của cạnh theo chiều ngược lại
                adj_list_filtered[v][u] *= int(trafic_level)    ## Cập nhật trọng số của cạnh theo chiều v -> u

    
        algorithms = {
            'A Star': astar,
            'Dijkstra': dijkstra,
            'BFS': bfs,
            'DFS': dfs
        }

        if algorithm in algorithms:
            path, explored_nodes = algorithms[algorithm](adj_list_filtered, start, end, num_iterations) # Gọi hàm tìm đường đi theo thuật toán đã chọn
            list_explore_node = list(explored_nodes)    # Chuyển đổi tập hợp thành danh sách để dễ dàng in ra
            print("\n✅List of explored nodes:")             
            print(list_explore_node)

            if path:
                print("\n✅ Path found:", path)
                list_explore_node.insert(0, start)           # Thêm node bắt đầu vào danh sách đã khám phá
                list_explore_node.append(end)             # Thêm node kết thúc vào danh sách đã khám phá
                return jsonify({
                    "path": path,       ## Trả về đường đi
                    "explored_nodes": list_explore_node,    ## Trả về danh sách các node đã khám phá  
                    "message": "Path found successfully." ## Trả về thông báo thành công
                })
            else:
                print("❌ No path found.")
                return jsonify({"error": "No path found between the nodes."}), 404      # Nếu không tìm thấy đường đi thì trả về lỗi 404
        else:
            return jsonify({"error": "Invalid algorithm specified."}), 400  # Nếu thuật toán không hợp lệ thì trả về lỗi 400

    except Exception as e:
        print(f"❌ Không tìm thấy đường đi")
        return jsonify({"error": "❌ Không tìm thấy đường đi"}), 500    # Nếu có lỗi xảy ra thì trả về lỗi 500


if __name__ == '__main__':
    app.run(debug=True) # Chạy ứng dụng Flask với chế độ debug