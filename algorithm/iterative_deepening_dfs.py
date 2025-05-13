import csv

nodes_file = "data/fileCSV/nodes.csv"

def iddfs(adj_list, source, destination, num_iterations):
    node_coords = {}
    with open(nodes_file, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            nid = int(row['node_id'])
            node_coords[nid] = (float(row['x']), float(row['y']))

    def dfs_limited(node, depth_limit, visited, explored):
        visited.add(node)
        explored.append(node)
        if node == destination:
            return [node]
        if depth_limit == 0:
            return None
        for neighbor in adj_list[node]:
            if neighbor not in visited:
                result = dfs_limited(neighbor, depth_limit - 1, visited, explored)
                if result:
                    return [node] + result
        return None

    for depth in range(1, num_iterations * 10):  # scale lên để đủ sâu
        visited = set()
        explored = []
        path = dfs_limited(source, depth, visited, explored)
        if path:
            return path, explored

    return explored
