import heapq
import csv

nodes_file = "nodes.csv"
def astar(adj_list, source, destination, num_iterations):
    # Đọc tọa độ của các node từ file nodes.csv
    node_coordinates = {}
    with open(nodes_file, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            node_id = int(row['node_id'])
            x, y = float(row['x']), float(row['y'])
            node_coordinates[node_id] = (x, y)

    def euclidean_distance(node1, node2):
        # Hàm heuristic: khoảng cách Euclidean (bỏ căn bậc hai để tối ưu)
        x1, y1 = node_coordinates[node1]
        x2, y2 = node_coordinates[node2]
        return (x1 - x2) ** 2 + (y1 - y2) ** 2

    # Danh sách mở (open list) - lưu các node cần xem xét
    open_list = []

    # set to store explored nodes
    explored_nodes = set()

    # dictionary to store parent info
    parent = {}
    
    # Dictionary lưu g-value: chi phí từ điểm đầu đến node
    g_values = {node: float('inf') for node in adj_list}
    g_values[source] = 0
    
    # Dictionary lưu f-value: tổng g-value và heuristic
    f_values = {node: float('inf') for node in adj_list}
    f_values[source] = g_values[source] + euclidean_distance(source, destination)
    
    # Thêm node bắt đầu vào open list
    heapq.heappush(open_list, (f_values[source], source))
    
    iterations = 0
    
    while open_list and iterations < num_iterations * 150:
        iterations += 1
        
        # Lấy node có f-value nhỏ nhất từ open list
        current_f, current_node = heapq.heappop(open_list)

        # mark the current node as explored
        explored_nodes.add(current_node)

        # if destination is reached, reconstruct and return path
        if current_node == destination:
            path = [destination]
            while destination in parent:
                destination = parent[destination]
                path.append(destination)
            return path[::-1]

        # explore neighbors of the current node
        for neighbor, weight in adj_list[current_node].items():
            # Nếu node kề đã xét, bỏ qua
            if neighbor in closed_set:
                continue
                
            # Tính g-value mới: chi phí từ nguồn đến neighbor thông qua current_node
            tentative_g = g_values[current_node] + weight  # Sử dụng weight từ adj_list
            
            # Kiểm tra xem đường đi mới có tốt hơn không
            if tentative_g < g_values[neighbor]:
                # Cập nhật thông tin
                parent[neighbor] = current_node
                g_values[neighbor] = tentative_g
                f_values[neighbor] = g_values[neighbor] + euclidean_distance(neighbor, destination)
                
                # Thêm vào open list để xét sau
                heapq.heappush(open_list, (f_values[neighbor], neighbor))
    
    # Nếu không tìm được đường đi sau số lần lặp quy định, trả về danh sách các node đã xét
    return list(closed_set)