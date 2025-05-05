import csv
import json
import os

def csv_to_js():
    # Read the CSV file
    csv_file_path = 'data/fileCsv/adj_list_with_weights.csv'
    js_file_path = 'data/fileJs/adj_list_with_weights.js'
    
    adj_list = {}
    
    # Read CSV and convert to dictionary
    with open(csv_file_path, 'r') as file:
        csv_reader = csv.reader(file)
        for row in csv_reader:
            if len(row) >= 3:  # Ensure row has source, destination, and weight
                source = row[0]
                dest = row[1]
                weight = float(row[2])
                
                if source not in adj_list:
                    adj_list[source] = []
                
                # Add destination and weight as a tuple
                adj_list[source].append({"node": dest, "weight": weight})
    
    # Convert to JavaScript format
    js_content = f"const adjListWithWeights = {json.dumps(adj_list, indent=2)};\n\n"
    js_content += "export { adjListWithWeights };"
    
    # Write to JavaScript file
    with open(js_file_path, 'w') as file:
        file.write(js_content)
    
    print(f"Successfully created {js_file_path}")

if __name__ == "__main__":
    csv_to_js()