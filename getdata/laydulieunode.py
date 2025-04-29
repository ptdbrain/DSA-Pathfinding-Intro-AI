import osmnx as ox
import networkx as nx
import csv
import math
from shapely.geometry import LineString
import geopandas as gpd

# Hàm nội suy cạnh đồ thị
# def interpolate_graph_edges(G, dist=50):
#     G_new = nx.MultiDiGraph(G.copy())
#     new_node_id = max(G.nodes) + 1

#     # Gán added = 0 cho toàn bộ node gốc
#     for node in G_new.nodes:
#         G_new.nodes[node]['added'] = 0

#     edges_to_remove = []
#     edges_to_add = []

#     for u, v, key, data in G.edges(keys=True, data=True):
#         if 'geometry' in data:
#             line = data['geometry']
#         else:
#             u_coords = (G.nodes[u]['x'], G.nodes[u]['y'])
#             v_coords = (G.nodes[v]['x'], G.nodes[v]['y'])
#             line = LineString([u_coords, v_coords])

#         length = data.get('length', line.length * 111000)
#         num_points = int(length / dist)
#         if num_points <= 1:
#             continue

#         distances = [i * dist for i in range(num_points + 1)]
#         points = [line.interpolate(distance) for distance in distances]

#         # Đánh dấu u và v là các node "có trong cạnh được nội suy"
#         G_new.nodes[u]['added'] = 2
#         G_new.nodes[v]['added'] = 2

#         edges_to_remove.append((u, v, key))

#         prev_node = u
#         for point in points[1:-1]:
#             G_new.add_node(new_node_id, x=point.x, y=point.y, added=1)
#             edges_to_add.append((prev_node, new_node_id, {'length': dist}))
#             prev_node = new_node_id
#             new_node_id += 1

#         final_length = LineString([points[-2], points[-1]]).length * 111000
#         edges_to_add.append((prev_node, v, {'length': final_length}))

#     G_new.remove_edges_from(edges_to_remove)
#     for u, v, attrs in edges_to_add:
#         G_new.add_edge(u, v, **attrs)

#     return G_new
import networkx as nx
from shapely.geometry import LineString

def interpolate_graph_edges(G, dist=50):
    G_new = nx.MultiDiGraph(G.copy())  # Chuyển sang đồ thị có hướng
    new_node_id = max(G.nodes) + 1  # Tạo id cho node mới

    # Gán added = 0 cho toàn bộ node gốc
    for node in G_new.nodes:
        G_new.nodes[node]['added'] = 0

    edges_to_remove = []
    edges_to_add = []

    for u, v, key, data in G.edges(keys=True, data=True):
        if 'geometry' in data:
            line = data['geometry']
        else:
            u_coords = (G.nodes[u]['x'], G.nodes[u]['y'])
            v_coords = (G.nodes[v]['x'], G.nodes[v]['y'])
            line = LineString([u_coords, v_coords])

        length = data.get('length', line.length * 111000)
        num_points = int(length / dist)
        if num_points <= 1:
            continue
        

        distances = [i * dist for i in range(num_points + 1)]
        points = [line.interpolate(distance) for distance in distances]

        # Đánh dấu u và v là các node "có trong cạnh được nội suy"
        G_new.nodes[u]['added'] = 2
        G_new.nodes[v]['added'] = 2

        edges_to_remove.append((u, v, key))  # Xóa cạnh hiện tại

        prev_node = u
        for point in points[1:-1]:
            G_new.add_node(new_node_id, x=point.x, y=point.y, added=1)
            edges_to_add.append((prev_node, new_node_id, {'length': dist}))  # Thêm cạnh mới từ prev_node đến node mới
            prev_node = new_node_id
            new_node_id += 1

        final_length = LineString([points[-2], points[-1]]).length * 111000
        edges_to_add.append((prev_node, v, {'length': final_length}))  # Thêm cạnh từ node cuối cùng đến v

    # Xóa các cạnh cũ và thêm các cạnh mới vào đồ thị
    G_new.remove_edges_from(edges_to_remove)
    for u, v, attrs in edges_to_add:
        G_new.add_edge(u, v, **attrs)

    return G_new

# Hàm chính
def main():
    # Lấy đồ thị từ OSM
    # G = ox.graph_from_place("Truc Bach, Ba Dinh, Ha Noi", network_type="all", simplify=False, retain_all=True, truncate_by_edge=False)
    
    # Lấy đồ thị có hướng từ OSM
    G = ox.graph_from_point("Truc Bach, Ba Dinh, Ha Noi", network_type="all", simplify=False, retain_all=True, truncate_by_edge=False)

    # Chuyển đồ thị thành đồ thị có hướng
    # G = ox.utils_graph.get_directions(G)
    G_proj = ox.project_graph(G)  # chuyển sang hệ toạ độ phẳng để tính toán chính xác

    # Nội suy cạnh
    G_interp = interpolate_graph_edges(G_proj, dist=50)

    nodes = G_interp.nodes(data=True)

    x_min = float('inf')
    y_min = float('inf')
    x_max = float('-inf')
    y_max = float('-inf')

    for node, data in nodes:
        x = data['x']
        y = data['y']
        x_min = min(x_min, x)
        y_min = min(y_min, y)
        x_max = max(x_max, x)
        y_max = max(y_max, y)

    viz_scale = y_max - y_min if y_max != y_min else 1

    # Ghi toạ độ nodes
    with open('nodes.csv', 'w', newline='') as csvfile:
        fieldnames = ['node_id', 'x', 'y', 'added']  # Thêm trường 'added'
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        index = 0
        for node, data in nodes:
            x = data['x']
            y = data['y']
            new_x = (x - x_min) / viz_scale
            new_y = (y - y_min) / viz_scale
            added = data.get('added', 0)  # Lấy giá trị 'added', nếu không có thì mặc định 0
            writer.writerow({'node_id': index, 'x': new_x, 'y': new_y, 'added': added})
            print(index, new_x, new_y, added)  # In ra thông tin node
            index += 1
            


    # Tạo danh sách kề
    adj_list_with_weights = {}
    adj_list = {}
    adj_list_i = {}
    indices = {}
    n = 0

    for node in G_interp.nodes():
        indices[node] = n
        n += 1

    for node in G_interp.nodes():
        neighbors_and_weights = []
        neighbors = []
        for neighbor in G_interp[node]:
            for key, data in G_interp[node][neighbor].items():
                length = data.get('length', None)
                if length is not None:
                    neighbors_and_weights.append((indices[neighbor], length))
                neighbors.append(neighbor)
        adj_list_with_weights[node] = neighbors_and_weights
        adj_list[node] = neighbors

    for node in adj_list:
        indexed_neighbors = [indices[neighbor] for neighbor in adj_list[node]]
        key = indices[node]
        adj_list_i[key] = indexed_neighbors

    # Ghi adj_list
    with open('adj_list.csv', 'w', newline='') as csvfile:
        fieldnames = ['node_index', 'neighbors_indices']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for node_id, neighbors in adj_list_i.items():
            writer.writerow({'node_index': node_id, 'neighbors_indices': neighbors})

    # Ghi adj_list_with_weights
    with open('adj_list_with_weights.csv', 'w', newline='') as csvfile2:
        fieldnames2 = ['node_id', 'neighbors_with_weights']
        writer2 = csv.DictWriter(csvfile2, fieldnames=fieldnames2)
        writer2.writeheader()
        for node_id, neighbors_and_weights in adj_list_with_weights.items():
            writer2.writerow({'node_id': indices[node_id], 'neighbors_with_weights': neighbors_and_weights})

# Điểm bắt đầu chương trình
if __name__ == '__main__':
    main()
