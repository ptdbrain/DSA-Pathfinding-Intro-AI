DSA-Pathfinding-Intro-AI
This project is part of an Artificial Intelligence course. It focuses on implementing and visualizing pathfinding algorithms such as Dijkstra and A* on real-world map data sourced from OpenStreetMap. The application provides a web-based visualization tool that allows users to interact with the algorithms step-by-step.

🚀 Features
Display real-world map using OpenStreetMap data.

Implement pathfinding algorithms: Dijkstra and A*.

Visualize the pathfinding process interactively on the web.

Load map and graph data from CSV files (nodes.csv, adj_list.csv, adj_list_with_weights.csv).

🗂️ Project Structure
python
Copy
Edit
DSA-Pathfinding-Intro-AI/
├── algorithm/                 # Algorithms implementations
├── cache/                     # Cached data for optimization
├── data/                      # Map data and graph input files
├── getdata/                   # Scripts for processing OSM data
├── __pycache__/               # Python bytecode cache
├── adj_list.csv               # Graph adjacency list
├── adj_list_with_weights.csv  # Weighted adjacency list
├── nodes.csv                  # List of graph nodes with coordinates
├── map.osm                    # OSM map file for visualization
├── app.py                     # Flask application (backend)
├── index.html                 # Web interface (frontend)
├── test.py                    # Testing script
└── README.md                  # Project documentation
🛠️ Setup and Run
Requirements
Python 3.7+

Flask

NetworkX

Other dependencies listed in requirements.txt

Installation
Clone the repository:

bash
Copy
Edit
git clone https://github.com/ptdbrain/DSA-Pathfinding-Intro-AI.git
cd DSA-Pathfinding-Intro-AI
Create a virtual environment and install dependencies:

bash
Copy
Edit
python -m venv venv
source venv/bin/activate     # On Windows: venv\Scripts\activate
pip install -r requirements.txt
Running the Application
Start the Flask server:

bash
Copy
Edit
python app.py
Open your browser and navigate to:

arduino
Copy
Edit
http://localhost:5000
to use the web interface.

📊 Data Files
nodes.csv: Node ID and (x, y) coordinates for each node.

adj_list.csv: Graph edges in adjacency list format.

adj_list_with_weights.csv: Same as above but includes weights (distances/costs).

map.osm: Raw map file from OpenStreetMap used to render the background map.

⚠️ Notes
Ensure all CSV files and map.osm are placed in the correct directories.

If you encounter errors, check file formats and ensure consistency between node IDs and edges.

📄 License
This project is licensed under the MIT License.