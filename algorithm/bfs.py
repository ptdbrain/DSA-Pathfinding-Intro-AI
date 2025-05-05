from typing import Dict, List
from collections import deque

def bfs(adj_list: Dict[int, Dict[int, float]], source: int, destination: int, num_of_iterations: int):
    queue = deque([source])  # Queue for BFS traversal
    visited = set()          # Set to track visited nodes
    parent = {}              # Dictionary to reconstruct the path
    explored_nodes = []      # List to store the order of explored nodes

    iterations = 0

    while queue and iterations < num_of_iterations * 150:
        iterations += 1
        current = queue.popleft()  # Get the next node in the queue
        explored_nodes.append(current)
        visited.add(current)

        if current == destination:
            # Reconstruct path from destination back to source
            path = [destination]
            while path[-1] != source:
                path.append(parent[path[-1]])
            return path[::-1], explored_nodes  # Return path and explored list

        # Explore all unvisited neighbors
        for neighbor in adj_list[current]:
            if neighbor not in visited and neighbor not in queue:
                parent[neighbor] = current
                queue.append(neighbor)

    return explored_nodes  # If no path is found, return only explored nodes
