import heapq
import csv

nodes_file = "data/fileCSV/nodes.csv"

def uniform_cost_search(adj_list, source, destination, num_iterations):
    def euclidean_distance(n1, n2):
        x1, y1 = n1
        x2, y2 = n2
        return ((x1 - x2)**2 + (y1 - y2)**2) ** 0.5

    node_coords = {}
    with open(nodes_file, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            nid = int(row['node_id'])
            node_coords[nid] = (float(row['x']), float(row['y']))

    open_list = []
    heapq.heappush(open_list, (0, source))
    parent = {}
    explored_set = set()
    list_explored = []

    iterations = 0
    while open_list and iterations < num_iterations * 150:
        iterations += 1
        cost, current = heapq.heappop(open_list)
        if current in explored_set:
            continue
        explored_set.add(current)
        list_explored.append(current)

        if current == destination:
            path = [destination]
            while path[-1] != source:
                path.append(parent[path[-1]])
            return path[::-1], list_explored

        for neighbor in adj_list[current]:
            if neighbor not in explored_set:
                parent[neighbor] = current
                g = cost + euclidean_distance(node_coords[current], node_coords[neighbor])
                heapq.heappush(open_list, (g, neighbor))

    return list_explored