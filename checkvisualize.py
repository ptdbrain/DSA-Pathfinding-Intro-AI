import matplotlib.pyplot as plt
import matplotlib.animation as animation
import pandas as pd
import math
import csv
import numpy as np
from matplotlib.widgets import Button

# Load data
# nodes_file = r"C:\Users\Admin\Desktop\Workspace\CLONEGIT\ai\Project_AI_20242\nodes.csv"  # Đường dẫn đến file nodes.csv của bạn
# edges_file = r"C:\Users\Admin\Desktop\Workspace\CLONEGIT\ai\Project_AI_20242\adj_list_with_weights.csv"  # Đường dẫn đến file adj_list_with_weights.csv của bạn
nodes_file = "nodes.csv"
edges_file = "adj_list_with_weights.csv"

# Đọc và hiển thị thông tin về dữ liệu node
print("Đang đọc dữ liệu từ file nodes.csv...")
nodes_df = pd.read_csv(nodes_file)
print(f"Đọc được {len(nodes_df)} nodes từ file nodes.csv")
print(f"Các cột trong file nodes.csv: {nodes_df.columns.tolist()}")
print("Mẫu dữ liệu nodes:")
print(nodes_df.head())

# Đảm bảo có cột node_id, x, y
required_columns = ['node_id', 'x', 'y']
for col in required_columns:
    if col not in nodes_df.columns:
        raise ValueError(f"Thiếu cột {col} trong file nodes.csv")

# Load node positions từ file nodes.csv
positions = {}
for _, row in nodes_df.iterrows():
    try:
        node_id = int(row['node_id'])
        x = float(row['x']) * 10  # Scale lên cho dễ nhìn
        y = float(row['y']) * 10
        positions[node_id] = (x, y)
    except Exception as e:
        print(f"Lỗi khi đọc node {row['node_id']}: {e}")

print(f"Đã đọc được tọa độ cho {len(positions)} nodes")

# Phân tích phạm vi tọa độ
x_values = [pos[0] for pos in positions.values()]
y_values = [pos[1] for pos in positions.values()]
print(f"Phạm vi tọa độ X: {min(x_values)} đến {max(x_values)}")
print(f"Phạm vi tọa độ Y: {min(y_values)} đến {max(y_values)}")

# Đọc thông tin về adj_list
print("\nĐang đọc dữ liệu từ file adj_list_with_weights.csv...")
# Đọc dòng đầu để kiểm tra định dạng
with open(edges_file, 'r') as f:
    header = next(f)
    sample_line = next(f)
    print(f"Header: {header.strip()}")
    print(f"Dòng mẫu: {sample_line.strip()}")

# Đọc adj_list với phương pháp mới
adj_dict = {}
with open(edges_file, 'r') as f:
    reader = csv.reader(f)
    header = next(reader)  # Skip header
    for row in reader:
        try:
            node = int(row[0])
            neighbors = {}
            
            # Thử nhiều cách khác nhau để parse neighbors_with_weights
            raw_text = row[1]
            
            # In ra để debug nếu cần
            if node < 5:  # Chỉ in một vài node đầu tiên để kiểm tra
                print(f"Node {node}, raw text: {raw_text}")
            
            # Phương pháp 1: Dùng eval() nếu dữ liệu có định dạng Python
            try:
                parsed_data = eval(raw_text.replace('np.float64', ''))
                for neighbor_id, weight in parsed_data:
                    neighbors[int(neighbor_id)] = float(weight)
            except:
                # Phương pháp 2: Parse thủ công
                raw = raw_text.replace('[', '').replace(']', '').replace('np.float64', '') \
                            .replace('(', '').replace(')', '')
                parts = raw.split(',')
                
                # Nếu là danh sách các tuple (neighbor_id, weight)
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

# Kiểm tra sự khác biệt giữa hai nguồn dữ liệu
nodes_in_positions = set(positions.keys())
nodes_in_adj = set(adj_dict.keys())

print(f"\nSố node có trong positions nhưng không có trong adj_dict: {len(nodes_in_positions - nodes_in_adj)}")
print(f"Số node có trong adj_dict nhưng không có trong positions: {len(nodes_in_adj - nodes_in_positions)}")

# Gộp danh sách node từ cả hai nguồn
all_nodes = nodes_in_positions.union(nodes_in_adj)
print(f"Tổng số node hợp nhất: {len(all_nodes)}")

# Đảm bảo tất cả các node đều có tọa độ
# Nếu một node có trong adj_dict nhưng không có trong positions,
# gán cho nó một tọa độ ngẫu nhiên trong phạm vi hiện có
if len(nodes_in_adj - nodes_in_positions) > 0:
    print("Đang tạo tọa độ cho các node thiếu...")
    x_min, x_max = min(x_values), max(x_values)
    y_min, y_max = min(y_values), max(y_values)
    
    for node in nodes_in_adj - nodes_in_positions:
        # Tạo tọa độ ngẫu nhiên trong phạm vi hiện có
        x = np.random.uniform(x_min, x_max)
        y = np.random.uniform(y_min, y_max)
        positions[node] = (x, y)
    
    print(f"Đã tạo tọa độ cho {len(nodes_in_adj - nodes_in_positions)} node thiếu")

# Đảm bảo tất cả các node đều có trong adj_dict
# Nếu một node có trong positions nhưng không có trong adj_dict,
# thêm nó vào adj_dict với danh sách kề rỗng
for node in nodes_in_positions - nodes_in_adj:
    adj_dict[node] = {}

# Import A* algorithm nếu có
try:
    from a_star import astar
    a_star_available = True
    print("Đã import thành công module a_star")
except ImportError:
    print("Không tìm thấy module a_star, sẽ tắt tính năng tìm đường")
    a_star_available = False

# Global variables for interaction
selected_points = []
animation_running = False
ani = None
all_edges = []
lines = []
selected_nodes = []
iterations = 200

# Create the main figure
fig, ax = plt.subplots(figsize=(12, 10))
plt.subplots_adjust(bottom=0.15)  # Make space for buttons
ax.set_aspect('equal')
plt.title(f"Visualization ({len(positions)} nodes) - Click to select start and end points")
plt.axis('off')

# Plot all nodes
node_points = []
for node_id, (x, y) in positions.items():
    added_value = int(nodes_df.loc[nodes_df['node_id'] == node_id, 'added'].values[0])
    color = (
        'red' if added_value == 1 else
        'blue'
    )
    ax.plot(x, y, 'o', color=color, markersize=8, alpha=0.7)


# Plot base graph (all edges in light gray)
edge_count = 0
for u in adj_dict:
    for v in adj_dict[u]:
        if u in positions and v in positions:  # Ensure both nodes have positions
            x0, y0 = positions[u]
            x1, y1 = positions[v]
            ax.plot([x0, x1], [y0, y1], color='lightgray', linewidth=0.8)
            edge_count += 1

print(f"Đã vẽ {edge_count} cạnh trên đồ thị")

# Thêm chú thích
legend_elements = [
    plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='blue', markersize=10, label='Node thông thường'),
    plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='orange', markersize=10, label='Node không có kết nối'),
    plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='purple', markersize=10, label='Node được thêm tọa độ')
]
ax.legend(handles=legend_elements, loc='upper right')

# Function to find nearest node to a click
def find_nearest_node(x, y):
    min_dist = float('inf')
    nearest_node = None
    for node_id, (node_x, node_y) in positions.items():
        dist = (node_x - x)**2 + (node_y - y)**2
        if dist < min_dist:
            min_dist = dist
            nearest_node = node_id
    return nearest_node

# Click event handler
def on_click(event):
    global selected_points, selected_nodes
    
    if event.inaxes != ax or animation_running:
        return
    
    # Find the nearest node to the click
    nearest_node = find_nearest_node(event.xdata, event.ydata)
    
    if nearest_node is not None:
        if len(selected_points) < 2:
            # Highlight the selected node
            color = 'green' if len(selected_points) == 0 else 'red'
            point, = ax.plot(positions[nearest_node][0], positions[nearest_node][1], 'o', 
                          markersize=10, color=color, alpha=1.0)
            selected_points.append(point)
            selected_nodes.append(nearest_node)
            
            # Update title
            if len(selected_nodes) == 1:
                plt.title(f"Start point selected (Node {nearest_node}). Now select end point.")
            elif len(selected_nodes) == 2:
                plt.title(f"Start: Node {selected_nodes[0]}, End: Node {selected_nodes[1]} - Press 'Run Animation' to start")
            
            plt.draw()

# Function to reset selection
def reset_selection(event):
    global selected_points, selected_nodes, animation_running, ani, all_edges, lines
    
    # Stop animation if running
    if animation_running and ani is not None:
        ani.event_source.stop()
    
    # Clear selected points
    for point in selected_points:
        point.remove()
    selected_points = []
    selected_nodes = []
    
    # Clear animation lines
    for ln in lines:
        if ln in ax.lines:
            ln.remove()
    lines = []
    all_edges = []
    
    # Reset title
    plt.title(f"Visualization ({len(positions)} nodes) - Click to select start and end points")
    animation_running = False
    plt.draw()

# Function to run A* animation
def run_animation(event):
    global animation_running, ani, all_edges, selected_nodes, iterations
    
    if len(selected_nodes) != 2 or animation_running or not a_star_available:
        if not a_star_available:
            plt.title("A* module không khả dụng - Không thể chạy tìm đường")
            plt.draw()
        return
    
    animation_running = True
    source = selected_nodes[0]
    destination = selected_nodes[1]
    
    plt.title(f"A* Animation from Node {source} to Node {destination}")
    
    # Calculate A* steps
    all_edges = []
    try:
        for it in range(1, iterations + 1):
            result = astar(adj_dict, source, destination, it)
            if not isinstance(result, list):
                all_edges.append([])
                continue
            edge_set = []
            for node in result:
                for neighbor in adj_dict.get(node, {}):
                    edge_set.append((node, neighbor))
            all_edges.append(edge_set)
        
        # Create animation
        ani = animation.FuncAnimation(fig, update_frame, frames=len(all_edges), interval=80)
    except Exception as e:
        plt.title(f"Lỗi khi chạy A*: {str(e)}")
        animation_running = False
    
    plt.draw()

# Function to update each frame
final_path_drawn = False  # Cờ để chỉ vẽ đường đi một lần
final_path_nodes = []

def update_frame(frame):
    global lines, final_path_drawn

    for ln in lines:
        if ln in ax.lines:
            ln.remove()
    lines = []

    if frame >= len(all_edges):
        if not final_path_drawn:
            draw_final_path()
            final_path_drawn = True
        return

    edges = all_edges[frame]

    if not edges or len(selected_nodes) < 2:
        return

    source = selected_nodes[0]
    max_dist = 1e-6
    dist_map = {}

    for u, _ in edges:
        if u in positions and source in positions:
            dx = positions[source][0] - positions[u][0]
            dy = positions[source][1] - positions[u][1]
            dist_map[u] = math.sqrt(dx*dx + dy*dy)
            max_dist = max(max_dist, dist_map[u])

    for u, v in edges:
        if u in positions and v in positions:
            fac = math.sqrt(dist_map.get(u, 0) / max_dist) if u in dist_map else 0.5
            r = 0.1 + 0.8 * fac
            g = 1.0 - 0.5 * fac
            b = 0.2 + 0.5 * fac
            x0, y0 = positions[u]
            x1, y1 = positions[v]
            ln, = ax.plot([x0, x1], [y0, y1], color=(r, g, b), linewidth=2)
            lines.append(ln)

# Function to save animation
def save_animation(event):
    global ani, selected_nodes
    
    if not animation_running or ani is None or len(selected_nodes) != 2:
        plt.title("Please run the animation first before saving")
        plt.draw()
        return
    
    try:
        source = selected_nodes[0]
        destination = selected_nodes[1]
        filename = f"astar_from_{source}_to_{destination}.mp4"
        ani.save(filename, writer="ffmpeg", fps=10)
        plt.title(f"Animation saved as {filename}")
    except Exception as e:
        plt.title(f"Error saving animation: {str(e)}")
    
    plt.draw()

def draw_final_path():
    global selected_nodes, final_path_nodes

    if not a_star_available or len(selected_nodes) != 2:
        return

    try:
        # Gọi thuật toán A* với số lượng lặp lớn để đảm bảo tìm ra đường đi ngắn nhất
        final_path_nodes = astar(adj_dict, selected_nodes[0], selected_nodes[1], 1000)

        if isinstance(final_path_nodes, list) and len(final_path_nodes) > 1:
            print("\n✅ Đường đi ngắn nhất đã tìm được:")
            for i in range(len(final_path_nodes) - 1):
                u = final_path_nodes[i]
                v = final_path_nodes[i + 1]
                if u in positions and v in positions:
                    x0, y0 = positions[u]
                    x1, y1 = positions[v]
                    ax.plot([x0, x1], [y0, y1], color='darkorange', linewidth=4, linestyle='--')
                    print(f" - Từ node {u} đến node {v}")
            plt.title(f"✅ Đường đi ngắn nhất từ {selected_nodes[0]} đến {selected_nodes[1]} đã được hiển thị")
        else:
            print("⚠️ Không tìm được đường đi ngắn nhất.")
            plt.title("⚠️ Không tìm được đường đi ngắn nhất.")

        plt.draw()

    except Exception as e:
        print(f"❌ Lỗi khi tìm đường: {e}")
# Connect the click event
fig.canvas.mpl_connect('button_press_event', on_click)

# Add buttons
ax_reset = plt.axes([0.15, 0.05, 0.2, 0.05])
reset_button = Button(ax_reset, 'Reset Selection')
reset_button.on_clicked(reset_selection)

ax_run = plt.axes([0.4, 0.05, 0.2, 0.05])
run_button = Button(ax_run, 'Run Animation')
run_button.on_clicked(run_animation)

ax_save = plt.axes([0.65, 0.05, 0.2, 0.05])
save_button = Button(ax_save, 'Save Animation')
save_button.on_clicked(save_animation)

plt.show()