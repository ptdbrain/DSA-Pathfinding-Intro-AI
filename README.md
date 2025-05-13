# 🧠 AI Smart Pathfinding Web App
This project is a web-based smart pathfinding application built with Flask (Python backend) and HTML/CSS/JavaScript (frontend). It visualizes various graph search algorithms (like A*, Dijkstra, BFS, etc.) and allows interactive simulation on a custom graph or map.

## 🚀 Features
- Visualizes pathfinding using algorithms:

  - A*

  - Dijkstra

  - BFS
    
  - DFS

  - Greedy Best-First Search

  - Uniform Cost Search

  - Iterative Deepening Search

- Admin controls for creating blocked roads, simulating traffic, etc.

- Extendable and modular code structure

## 🌐 Demo

You can try the **PathFinder** demo online at: [PathFinder](https://bienkieu1411.github.io/Project_AI_20242/)  

## 🗂️ Project Structure

```bash
Project_AI_20242/
│
├── .idea/
│
├── .vscode/
│
├── __pycache__/
│
├── algorithm/                 
│   ├── a_star.py
│   ├── bfs.py
│   ├── dfs.py
│   ├── dijkstra.py
│   ├── greedy_best_first.py
│   ├── iterative_deepening_dfs.py
│   └── uniform_cost_search.py
│
├── data/
│   ├── fileCSV/
│       ├── adj_list.csv
│       ├── adj_list_with_weights.csv
│       ├── nodes.csv
│       └── nodes_latlon.csv
│   └── fileJs/
│       ├── adj_list.js
│       ├── adj_list_with_weights.js      
│       └── nodes.js
│
├── getdata/
│   ├── adj_list_with_weights.py
│   ├── checkvisualize.py
│   ├── datalatlon.py
│   └── laydulieunode.py
│
├── ui/
│   ├── css/
│       └── styles.css
│   └── js/
│       └── main.js
│
├── app.py
│
├── index.html
│
└── README.md
```

## ⚙️ How to Run
### 1. Install dependencies
- Make sure you have Python 3, Flask, osmnx installed.

```bash
pip install flask osmnx
```

### 2. Start Flask server

```bash
py app.py
```

- You will see something like:

```nginx
Running on http://127.0.0.1:5000
```
### 3. Open in browser
- Open your browser and go to:

```cpp
http://127.0.0.1:5000
```

- ✅ DO NOT open index.html directly using Live Server or double-clicking it, as that will bypass Flask and break API communication.

## 🛠️ Add New Algorithms
- To add a new search algorithm:

  - Create a new .py file inside the algorithm/ directory.

  - Follow the input/output format as shown in existing algorithms.

  - Register your algorithm in app.py where routing is handled.

## 📧 Contact

For any questions, feel free to reach out to the project team members:

- **Project Members**:
  - Kiều Giang Biên
  - Phan Trọng Đạt
  - Phạm Trung Đức
  - Lê Trường Giang
  - Phạm Ngọc Tuyên

<<<<<<< HEAD
If you'd like to report bugs, suggest features, or contribute, please open an issue on the [Project_AI_20242](https://github.com/BienKieu1411/Project_AI_20242).
=======
If you'd like to report bugs, suggest features, or contribute, please open an issue on the [Project_AI_20242](https://github.com/BienKieu1411/Project_AI_20242).
>>>>>>> cffef43263d8d4721d0f83b75ad65cfb5f88b44c
