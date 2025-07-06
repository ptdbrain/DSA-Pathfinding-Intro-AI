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

- You can try the **PathFinder** demo Front-end online at: [PathFinder](https://bienkieu1411.github.io/Project_AI_20242/)
  
- Video demo **PathFinder** for your reference: [VideoDemo](https://l.messenger.com/l.php?u=https%3A%2F%2Fdrive.google.com%2Fdrive%2Ffolders%2F1VvlOnDW2o1OXrMlPqouaBMz2GRDK2GHV%3Fusp%3Dsharing&h=AT0NkO9MbQzUcS6MGhqPYEA3e1-Xpeig5WMzOEBDqYR4KXcE5ME1iESwFf2EH8iqBtvfwz1MEiKXGf9cw_h12tRITVACCQMvr1DOSA_X90oAZt3uepBkDDOJGnH2M92YWD2JKuL10y1YTqB_Jztezw)

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
├── requirements.txt
│
├── run.ps1
│
└── README.md
```

## ⚙️ How to Run

- Open a terminal or PowerShell, navigate to your project directory.

- Run the following command to start the app:
  
```powershell
.\run.ps1
```

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

If you'd like to report bugs, suggest features, or contribute, please open an issue on the [Project_AI_20242](https://github.com/BienKieu1411/Project_AI_20242).
:) :) :) 