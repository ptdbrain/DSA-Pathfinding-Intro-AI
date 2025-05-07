import heapq
import csv

nodes_file = "data/fileCSV/nodes.csv"

def greedy_best_first(adj_list, source, destination, num_iterations):
    def euclidean_distance(n1, n2):
        x1, y1 = n1
        x2, y2 = n2
        return (x1 - x2) ** 2 + (y1 - y2) ** 2  

    # đọc tọa độ
    node_coords = {}
    with open(nodes_file, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            nid = int(row['node_id'])
            node_coords[nid] = (float(row['x']), float(row['y']))

    # khởi tạo open list và các tập
    open_list = []
    heapq.heappush(open_list, (euclidean_distance(node_coords[source], node_coords[destination]), source))

    explored_set = set()
    parent = {}
    list_explored = []

    iterations = 0
    while open_list and iterations < num_iterations * 150:
        iterations += 1
        _, current = heapq.heappop(open_list)

        if current in explored_set:
            continue

        explored_set.add(current)
        list_explored.append(current)

        if current == destination:
            path = [current]
            while path[-1] != source:
                path.append(parent[path[-1]])
            return path[::-1], list_explored

        for neighbor in adj_list[current]:
            if neighbor not in explored_set and neighbor not in parent:
                parent[neighbor] = current
                h = euclidean_distance(node_coords[neighbor], node_coords[destination])
                heapq.heappush(open_list, (h, neighbor))

    return list_explored