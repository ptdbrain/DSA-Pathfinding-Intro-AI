import csv
from pyproj import Proj, transform

def convert_nodes_csv_to_latlon(input_csv, output_csv,
                                 viz_scale=1164.4480383638293,
                                 x_min=587022.7688767575,
                                 y_min=2326815.145163071,
                                 utm_zone=48):
    """
    Đọc file nodes.csv (tọa độ đã scale), chuyển về lat/lon và ghi ra file mới.
    """
    # Hệ tọa độ UTM & WGS84
    utm_proj = Proj(proj='utm', zone=utm_zone, datum='WGS84')
    wgs84_proj = Proj(proj="latlong", datum="WGS84")

    def utm_to_wgs84(utm_x, utm_y):
        lon, lat = transform(utm_proj, wgs84_proj, utm_x, utm_y)
        return lon, lat

    with open(input_csv, "r") as infile, open(output_csv, "w", newline="") as outfile:
        reader = csv.DictReader(infile)
        fieldnames = ['node_id', 'lat', 'lon', 'added']
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()

        for row in reader:
            scaled_x = float(row["x"])
            scaled_y = float(row["y"])
            added = row.get("added", 0)
            node_id = row["node_id"]

            # Scale ngược về UTM
            utm_x = scaled_x * viz_scale + x_min
            utm_y = scaled_y * viz_scale + y_min

            # UTM → LatLon
            lon, lat = utm_to_wgs84(utm_x, utm_y)

            writer.writerow({
                'node_id': node_id,
                'lat': lat,
                'lon': lon,
                'added': added
            })
convert_nodes_csv_to_latlon("nodes.csv", "nodes_latlon.csv")
