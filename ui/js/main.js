// Các biến toàn cục
let reset = false;
let isBlockMode = false;
let isDrawing = false;
let algorithm = "Dijkstra";
let selectedPoints = [];
let blockedEdges = [];
let startPoint = null;
let temporaryLine = null;
let points = [];
let banPolyline = null;
let bannedLines = [];
let isPlacingObstacle = false;
let obstacleMarkers = [];
let isAdmin = false; // Biến toàn cục để xác định chế độ Admin hay Guest
let showNodes = false;
let showEdges = false;
// Khởi tạo bản đồ
const map = L.map("map").setView([21.0453, 105.8426], 16);
L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
  maxZoom: 19,
}).addTo(map);

// Xử lý chuyển đổi Guest/Admin
const roleToggle = document.getElementById("roleToggle");
const guestControls = document.getElementById("guestControls");
const adminControls = document.getElementById("adminControls");

roleToggle.addEventListener("change", function () {
  isAdmin = this.checked;

  if (isAdmin) {
    guestControls.classList.add("hide");
    adminControls.classList.add("show");
  } else {
    guestControls.classList.remove("hide");
    adminControls.classList.remove("show");
    // Reset chỉ các biến trạng thái, giữ lại đường cấm
    isBlockMode = false;
    isDrawing = false;
    // if (temporaryLine) {
    //   map.removeLayer(temporaryLine);
    //   temporaryLine = null;
    // }
    startPoint = null;
  }
});

// Các hàm tiện ích
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function segmentsIntersect(p1, p2, q1, q2) {
  function ccw(a, b, c) {
    return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
  }
  return (
    ccw(p1, q1, q2) !== ccw(p2, q1, q2) && ccw(p1, p2, q1) !== ccw(p1, p2, q2)
  );
}

function drawPath(path) {
  const latlngs = path.map((id) => {
    const node = nodes.find((n) => n.node_id === id);
    return [node.lat, node.lon];
  });

  L.polyline(latlngs, {
    color: "green",
    weight: 4,
    opacity: 0.8,
  }).addTo(map);
}

function distanceToLine(point, lineStart, lineEnd) {
  const x = point[0];
  const y = point[1];
  const x1 = lineStart[0];
  const y1 = lineStart[1];
  const x2 = lineEnd[0];
  const y2 = lineEnd[1];

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;

  if (len_sq != 0) param = dot / len_sq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

function isEdgeNearLine(edgeStart, edgeEnd, lineStart, lineEnd, threshold) {
  const d1 = distanceToLine(edgeStart, lineStart, lineEnd);
  const d2 = distanceToLine(edgeEnd, lineStart, lineEnd);
  const d3 = distanceToLine(lineStart, edgeStart, edgeEnd);
  const d4 = distanceToLine(lineEnd, edgeStart, edgeEnd);
  return Math.min(d1, d2, d3, d4) < threshold;
}

function isEdgeBlocked(edge) {
  return blockedEdges.some(
    (blocked) =>
      (blocked[0] === edge[0] && blocked[1] === edge[1]) ||
      (blocked[0] === edge[1] && blocked[1] === edge[0])
  );
}

function handleBlockedEdge(edge) {
  if (!isEdgeBlocked(edge)) {
    blockedEdges.push(edge);
    console.log(`🚫 Cạnh bị cấm: ${edge[0]} - ${edge[1]}`);
    console.log();
  }
}

function detectBlockedEdgesByCut(cutLine) {
  const [p1, p2] = cutLine;
  // console.log("Đang kiểm tra các cạnh bị cắt bởi đường cấm... ", adj_list.length);
  for (let u = 0; u < adj_list.length; u++) {
    console.log(adj_list[u].node_id);
    const currentNodeId = adj_list[u].node_id;
    const nodeU = nodes.find((n) => n.node_id === currentNodeId);
    if (
      !nodeU ||
      typeof nodeU.lat !== "number" ||
      typeof nodeU.lon !== "number" ||
      isNaN(nodeU.lat) ||
      isNaN(nodeU.lon)
    ) {
      console.warn("Thiếu dữ liệu hoặc dữ liệu không hợp lệ tại nodeV:", nodeU);
      continue;
    }
    const lat1 = nodeU.lat;
    const lon1 = nodeU.lon;

    for (let v = 0; v < adj_list[u].neighbors_indices.length; v++) {
      const nodeV = nodes.find(
        (n) => n.node_id === adj_list[u].neighbors_indices[v]
      );
      if (
        !nodeV ||
        typeof nodeV.lat !== "number" ||
        typeof nodeV.lon !== "number" ||
        isNaN(nodeV.lat) ||
        isNaN(nodeV.lon)
      ) {
        console.warn(
          "Thiếu dữ liệu hoặc dữ liệu không hợp lệ tại nodeV:",
          nodeV
        );
        continue;
      }
      const edgeLine = [
        [nodeU.lat, nodeU.lon],
        [nodeV.lat, nodeV.lon],
      ];
      if (segmentsIntersect(p1, p2, edgeLine[0], edgeLine[1])) {
        handleBlockedEdge([nodeU.node_id, nodeV.node_id]);
      }
    }
  }
}

function redrawBannedLines() {
  bannedLines.forEach((points) => {
    points.forEach((point) => {
      L.circleMarker(point, {
        radius: 5,
        color: "#f44336",
        fillColor: "#f44336",
        fillOpacity: 1,
      }).addTo(map);
    });

    L.polyline(points, {
      color: "#f44336",
      weight: 3,
      dashArray: "10,10",
      opacity: 0.8,
    }).addTo(map);
  });
}

// Xử lý sự kiện reset
function resetMap() {
  // Xóa các điểm đã chọn
  selectedPoints = [];
  startPoint = null;
  isDrawing = false;
  isBlockMode = false;
  // kiểm tra xem có giữ lại đường cấm hay không
  if (isAdmin) {
    bannedLines = [];
    if (temporaryLine) {
      temporaryLine = null;
    }
    // Xóa tất cả các layer trên bản đồ
    map.eachLayer(function (layer) {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });
    // Xóa các vật cản
    obstacleMarkers = [];
    isPlacingObstacle = false;
  } else {
    map.eachLayer(function (layer) {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });
  }
  blockedEdges = [];
  const placeObstacleBtn = document.getElementById("placeObstacleBtn");
  placeObstacleBtn.textContent = "Đặt vật cản";
  placeObstacleBtn.classList.remove("btn-danger");
  placeObstacleBtn.classList.add("btn-warning");
}

// Event Listeners cho các nút reset
document
  .getElementById("guestResetButton")
  .addEventListener("click", () => resetMap()); // Guest reset - giữ lại đường cấm

document
  .getElementById("adminResetButton")
  .addEventListener("click", () => resetMap()); // Admin reset - xóa tất cả

// Xử lý click trên bản đồ
map.on("click", function (e) {
  // Lấy tọa độ điẻm chấm trên bản đổ
  const clickedLat = e.latlng.lat;
  const clickedLon = e.latlng.lng;

  // Chế độ cấm đường
  if (isBlockMode) {
    if (!isDrawing) {
      isDrawing = true;
      startPoint = [clickedLat, clickedLon];
    }

    // Thêm điểm đầu và vẽ
    points.push([clickedLat, clickedLon]);
    L.circleMarker([clickedLat, clickedLon], {
      radius: 5,
      color: "#f44336",
      fillColor: "#f44336",
      fillOpacity: 1,
    }).addTo(map); // Vẽ chấm đầu của cấm đường

    if (banPolyline) {
      map.removeLayer(banPolyline);
    }

    banPolyline = L.polyline(points, {
      color: "#f44336",
      weight: 3,
      dashArray: "10,10",
      opacity: 0.8,
    }).addTo(map);
    return;
  }

  // Chế độ đặt vật cản
  if (isPlacingObstacle) {
    const radius = document.getElementById("obstacleRadius").value;
    const clickedPoint = [e.latlng.lat, e.latlng.lng];

    // Tạo chấm tròn điêm cấm
    const obstacleMarker = L.circleMarker(clickedPoint, {
      radius: 8,
      color: "#ff0000",
      fillColor: "#ff0000",
      fillOpacity: 0.7,
    }).addTo(map);

    // Tạo vòng tròn bán kinh bị cấm
    const radiusCircle = L.circle(clickedPoint, {
      radius: parseFloat(radius),
      color: "#ff0000",
      fillColor: "#ff0000",
      fillOpacity: 0.1,
      weight: 1,
    }).addTo(map);

    // Danh sách các điểm đạt vật cản [điểm ở giữa, các điểm ảnh hưởng xung quanh]
    obstacleMarkers.push([obstacleMarker, radiusCircle]);
    // Xử lý khi đặt vật cản
    detectBlockedEdgesByObstacle(clickedPoint, radius);
    return;
  }

  let closestNode = null;
  let minDist = Infinity;

  // Tìm node gần nhất trên bản đồ với điểm được đánh dấu
  // Cải thiện đc thêm
  nodes.forEach((node) => {
    const d = getDistance(clickedLat, clickedLon, node.lat, node.lon);
    if (d < minDist) {
      minDist = d;
      closestNode = node;
    }
  });

  if (!closestNode) return;

  if (selectedPoints.length < 2) {
    // Thêm diểm vào selectdPoints
    selectedPoints.push(closestNode.node_id);
    L.circleMarker([closestNode.lat, closestNode.lon], {
      radius: 6,
      color: "red",
      fillColor: "red",
      fillOpacity: 1,
    }).addTo(map);

    // Chạy thuật toán tìm đường đi
    if (selectedPoints.length === 2) {
      fetch("http://127.0.0.1:5000/find_path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: selectedPoints[0],
          end: selectedPoints[1],
          blocked_edges: blockedEdges,
          algorithm: document.getElementById("algorithmSelect").value,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.path) {
            drawPath(data.path);
            selectedPoints = [];
          } else {
            alert(data.error || "Không tìm thấy đường đi.");
          }
        })
        .catch((err) => {
          console.error("Lỗi:", err);
          alert("Có lỗi xảy ra khi tìm đường.");
        });
    }
  }
});

// Xử lý các cạnh bị vật cản chắn
function detectBlockedEdgesByObstacle(clickedPoint, radius) {
  adj_list.forEach((nodeU) => {
    const u = nodeU.node_id;

    // Tìm nodeU trong mảng nodes
    const nodeUObj = nodes.find((n) => n.node_id === u);
    if (!nodeUObj) {
      console.error(`Không tìm thấy node với id ${u}`);
      return; // Nếu không tìm thấy, bỏ qua node này
    }
    const latU = nodeUObj.lat;
    const lonU = nodeUObj.lon;

    nodeU.neighbors_indices.forEach((v) => {
      if (u < v) {
        // Tránh xét trùng các cạnh
        const nodeVObj = nodes.find((n) => n.node_id === v);
        if (!nodeVObj) {
          console.error(`Không tìm thấy node với id ${v}`);
          return; // Nếu không tìm thấy, bỏ qua node này
        }
        const latV = nodeVObj.lat;
        const lonV = nodeVObj.lon;

        const edgeMidpoint = [(latU + latV) / 2, (lonU + lonV) / 2];

        const distance = getDistance(
          clickedPoint[0],
          clickedPoint[1],
          edgeMidpoint[0],
          edgeMidpoint[1]
        );

        if (distance <= radius) {
          if (!isEdgeBlocked([u, v])) {
            blockedEdges.push([u, v]);
            console.log(`🚫 Cạnh bị chặn bởi vật cản: ${u} - ${v}`);
          }
        }
      }
    });
  });
}

// Xử lý di chuyển chuột
map.on("mousemove", function (e) {
  if (isBlockMode && isDrawing) {
    if (temporaryLine) {
      map.removeLayer(temporaryLine);
    }

    const lastPoint =
      points.length > 0 ? points[points.length - 1] : startPoint;
    if (lastPoint) {
      temporaryLine = L.polyline([lastPoint, [e.latlng.lat, e.latlng.lng]], {
        color: "#f44336",
        weight: 3,
        opacity: 0.5,
        dashArray: "5, 10",
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
    }
  }
});

// Xử lý phím ESC
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && isBlockMode && isDrawing) {
    if (points.length > 0) {
      console.log("Hoàn thành vẽ đường cấm");

      // Lưu đường cấm vào danh sách
      bannedLines.push([...points]);

      // Vẽ đường cấm
      const blockedLine = L.polyline(points, {
        color: "#f44336",
        weight: 3,
        dashArray: "10,10",
        opacity: 0.8,
      }).addTo(map);

      // Xác định các cạnh bị cắt
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        if (p1 && p2) {
          detectBlockedEdgesByCut([p1, p2]);
        } else {
          console.warn("Điểm không hợp lệ:", p1, p2);
        }
      }

      // Xóa đường tạm nếu có
      if (temporaryLine) {
        map.removeLayer(temporaryLine);
        temporaryLine = null;
      }

      if (banPolyline) {
        map.removeLayer(banPolyline);
        banPolyline = null;
      }

      console.log("Tổng số cạnh bị cấm:", blockedEdges.length);
      console.log("=== Kết thúc vẽ đường cấm ===");

      // Reset trạng thái
      points = [];
      isBlockMode = false;
      isDrawing = false;
      startPoint = null;
    } else {
      console.warn("Không có điểm nào để tạo đường cấm.");
    }
  }
});

// Xử lý nút cấm đường
document.getElementById("banEdgeBtn").addEventListener("click", function () {
  isBlockMode = true;
  points = [];
  if (banPolyline) {
    map.removeLayer(banPolyline);
    banPolyline = null;
  }
  alert("Click bản đồ để cấm đường \n ESC để hủy tắt vẽ cấm đường");
  console.log("Bật chế độ cấm đường");
});

document.getElementById("restoreBanBtn").addEventListener("click", function () {
  if (bannedLines.length === 0) {
    console.warn("Không còn đường cấm nào để khôi phục.");
    return;
  }

  // Bỏ đường cấm cuối cùng
  bannedLines.pop();

  // Xóa tất cả các đường cấm đang có trên bản đồ
  map.eachLayer(function (layer) {
    if (
      (layer instanceof L.Polyline &&
        layer.options.dashArray === "10,10" &&
        layer.options.color === "#f44336") ||
      layer instanceof L.CircleMarker
    ) {
      map.removeLayer(layer);
    }
  });

  // Vẽ lại tất cả các đường cấm còn lại
  bannedLines.forEach((linePoints) => {
    L.polyline(linePoints, {
      color: "#f44336",
      weight: 3,
      dashArray: "10,10",
      opacity: 0.8,
    }).addTo(map);
  });

  // Cập nhật lại danh sách blockedEdges
  blockedEdges = [];
  bannedLines.forEach((linePoints) => {
    for (let i = 0; i < linePoints.length - 1; i++) {
      const p1 = linePoints[i];
      const p2 = linePoints[i + 1];
      if (p1 && p2) {
        detectBlockedEdgesByCut([p1, p2]);
      }
    }
  });

  console.log("Đã khôi phục lại các đường cấm còn lại.");
});

const placeObstacleBtn = document.getElementById("placeObstacleBtn");

placeObstacleBtn.addEventListener("click", function () {
  isPlacingObstacle = !isPlacingObstacle;

  placeObstacleBtn.textContent = isPlacingObstacle
    ? "Hủy đặt vật cản"
    : "Đặt vật cản";
  placeObstacleBtn.classList.toggle("btn-danger", isPlacingObstacle);
  placeObstacleBtn.classList.toggle("btn-warning", !isPlacingObstacle);

  if (isPlacingObstacle) {
    alert("Click vào bản đồ để đặt vật cản. Các cạnh xung quanh sẽ bị chặn.");
  }
});

// HIện các node (icon giống gg)
const googleIcon = L.icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png", // icon giống trên gg map
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});
function toggleNodes() {
  if (!showNodes) {
    nodeMarkers = nodes.map((n) => {
      const marker = L.marker([n.lat, n.lon], { icon: googleIcon }).addTo(map);
      return marker;
    });
  } else {
    // Ẩn các node
    nodeMarkers.forEach((marker) => map.removeLayer(marker));
    nodeMarkers = [];
  }

  showNodes = !showNodes;
}
document
  .getElementById("toggleNodes")
  .addEventListener("click", () => toggleNodes());

// hiện đường đi !! chưa xong
function togglePaths() {}
document
  .getElementById("togglePaths")
  .addEventListener("click", () => togglePaths());
// Xử lý tắc đường
