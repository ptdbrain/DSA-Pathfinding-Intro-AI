from typing import Dict
# input: a dictionary, source, destination, and integer num_of_iterations
# output: dict or list of nodes explored after n iterations or if destination reached, then return path to destination with all the explored nodes

def dijkstra(adj_list: Dict[int, Dict[int, float]], source: int, destination: int, num_of_iterations: int):
    explored_nodes = [] # List to keep track of explored nodes

    visited = {}
    remaining = set()
    distances = {}
    predecessors = {}

    for vertex in adj_list.keys():
        distances[vertex] = float('inf')  # Set initial distance to infinity for all nodes
        remaining.add(vertex)  # Add all nodes to the set of remaining nodes
        visited[vertex] = False  # Mark all nodes as not visited
        predecessors[vertex] = None  # Set initial predecessor to None for all nodes

    distances[source] = 0.0

    for _ in range(num_of_iterations * 100):
        # Find the vertex with the smallest distance in the remaining set
        current_vertex = min(remaining, key=lambda x: distances[x])

        visited[current_vertex] = True
        remaining.remove(current_vertex)
        explored_nodes.append(current_vertex)

        # If the destination is reached, return the shortest path
        if current_vertex == destination:
            path = [destination]
            while predecessors[path[-1]] != source:
                path.append(predecessors[path[-1]])
            path.append(source)
            return path[::-1] , explored_nodes  # Return the path and the list of explored nodes

        # Update distances and predecessors for neighbors of the current vertex
        for neighbor in adj_list[current_vertex].keys():
            new_distance = distances[current_vertex] + adj_list[current_vertex][neighbor]

            # Check if the new distance is smaller than the current distance
            if new_distance < distances[neighbor]:
                distances[neighbor] = new_distance
                predecessors[neighbor] = current_vertex

    return explored_nodes  # Return the list of explored nodes if the destination is not reached