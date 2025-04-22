from typing import Dict

def dfs(adj_list: Dict[int, Dict[int, float]], source: int, destination: int, num_of_iterations: int):
    stack = [source]         # Stack for DFS traversal
    visited = set()          # Set to track visited nodes
    parent = {}              # Dictionary to reconstruct the path
    explored_nodes = []      # List to store the order of explored nodes

    iterations = 0

    while stack and iterations < num_of_iterations * 150:
        iterations += 1
        current = stack.pop()  # Get the next node from the top of the stack

        if current in visited:
            continue

        explored_nodes.append(current)
        visited.add(current)

        if current == destination:
            # Reconstruct path from destination back to source
            path = [destination]
            while path[-1] != source:
                path.append(parent[path[-1]])
            return path[::-1], explored_nodes  # Return path and explored list

        # Reverse neighbors to maintain left-to-right order in DFS
        for neighbor in reversed(list(adj_list[current].keys())):
            if neighbor not in visited:
                parent[neighbor] = current
                stack.append(neighbor)

    return explored_nodes  # If no path is found, return only explored nodes