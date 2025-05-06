// Các biến toàn cục
let reset = false; // Biến reset, dùng để reset lại bản đồ
let isBlockMode = false; // Biến trạng thái vẽ đường cấm
let isDrawing = false; // Biến đang trong quá trình vẽ đường cấm
let algorithm = "Dijkstra"; // Biến trạng thái thuật toán tìm đường
let selectedPoints = []; // Danh sách các điểm được chọn
let blockedEdges = []; // Danh sách cạnh bị cấm
let startPoint = null; //
let temporaryLine = null; // Đường nối từ điểm cuối đến con trỏ chuột trong chế độ vẽ đường cấm
let points = []; // Điểm
let banPolyline = null; // Đường cấm tạm thời
let bannedLines = []; // Biến toàn cục để xác định chế độ đặt vật cản
let isPlacingObstacle = false; // Trạng thái đang đặt vật cản
let obstacleMarkers = []; // Các điểm đặt vật cản
let isAdmin = false; // Biến toàn cục để xác định chế độ Admin hay Guest
let showNodes = false; // Xem tất cả các node và edge
let showEdges = false;
// Xử lý tắc đường
let trafficLevel; // Biến toàn cục để xác định mức độ tắc đường
let trafficMarkers = []; // Biến toàn cục để lưu các marker tắc đường
let trafficPolyline = null; // Biến toàn cục để lưu polyline tắc đường
let isTrafficMode = false; // Biến toàn cục để xác định chế độ tắc đường
let trafficLine = [];
let trafficEdges = []; // Biến toàn cục để lưu các cạnh tắc đường

let algorithmSelect = document.getElementById("algorithmSelect");
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

// ------------------------- Xử lý đổi giao diện theme -------------------------
document
  .querySelector(".theme-toggle-btn")
  .addEventListener("click", function () {
    this.classList.toggle("active");
  });

function switchTheme(theme) {
  if (theme === "light") {
    document.documentElement.classList.remove("theme-dark", "theme-sunset");
    document.documentElement.classList.add("theme-light");
  } else if (theme === "dark") {
    document.documentElement.classList.remove("theme-light", "theme-sunset");
    document.documentElement.classList.add("theme-dark");
  } else if (theme === "sunset") {
    document.documentElement.classList.remove("theme-light", "theme-dark");
    document.documentElement.classList.add("theme-sunset");
  }
}

/* Xử lý chọn chế độ Guest - Admin */
roleToggle.addEventListener("change", function () {
  const isChecked = this.checked;
  const newRole = isChecked ? "Admin" : "Guest";
  console.log("Bạn đang ở chế độ", newRole);

  if (isDrawing && !isChecked) {
    alert(
      "Bạn đang trong chế độ vẽ đường cấm!\nVui lòng hoàn thành (nhấn ESC) hoặc hủy vẽ trước khi chuyển sang Guest."
    );
    this.checked = true; // Giữ lại Admin
    return;
  }

  isAdmin = isChecked;

  // Toggle hiển thị control
  guestControls.classList.toggle("hide", isChecked);
  adminControls.classList.toggle("show", isChecked);

  if (isAdmin) {
    resetMapWithGuest(); // Reset bản đồ khi sang Admin
  } else {
    // Reset trạng thái vẽ, giữ lại các đường cấm
    isBlockMode = false;
    isDrawing = false;
    isPlacingObstacle = false;
    isTrafficMode = false;
    selectedPoints = [];
    startPoint = null;
  }
});

const trafficInput = document.getElementById("trafficLevel");

trafficInput.addEventListener("input", () => {
  let val = parseInt(trafficInput.value);
  if (val > 3) {
    trafficInput.value = 3;
  } else if (val < 1) {
    trafficInput.value = 1;
  }
});

/*----------------------------------- HIện các node (icon giống gg) ---------------------------*/
const googleIcon = L.icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png", // icon giống trên gg map
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});
document.getElementById("toggleNodes").addEventListener("click", () => {
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
});

/*----------------------------------- Hiện đường đi trên bản đổ --------------------------------*/
document.getElementById("togglePaths").addEventListener("click", () => {
  if (!showEdges) {
    for (let i = 0; i < adj_list_with_weights.length; i++) {
      const nodeU = nodes.find(
        (n) => n.node_id === adj_list_with_weights[i].node_id
      );
      for (let u = 0; u < adj_list_with_weights[i].neighbors.length; u++) {
        const nodeV = nodes.find(
          (n) =>
            n.node_id === adj_list_with_weights[i].neighbors[u].node_neighbor
        );
        const latlngs = [
          [nodeU.lat, nodeU.lon],
          [nodeV.lat, nodeV.lon],
        ];

        L.polyline(latlngs, {
          color: "green",
          weight: 4,
          opacity: 0.8,
        }).addTo(map);
      }
    }
  } else resetMapWithGuest();
  showEdges = !showEdges;
});

/*----------------------------------Xử lý sự kiện trên bàn đồ------------------------------------------------*/
// Xử lý click trên bản đồ
map.on("click", function (e) {
  // Lấy tọa độ điẻm chấm trên bản đổ
  const { lat, lng } = e.latlng;

  // Nếu đang là Admin và không trong các chế độ vẽ
  if (isAdmin && !isBlockMode && !isPlacingObstacle && !isTrafficMode) {
    alert(
      "Chế độ Admin đang hoạt động.\nBạn không thể tìm đường"
    );
    return;
  }

  // 1. Chế độ vẽ đường cấm hoặc tắc đường (đều sử dụng polyline)
  if (isBlockMode || isTrafficMode) {
    handleDrawingMode(lat, lng, isTrafficMode);
    return;
  }

  // 2. Chế độ đặt vật cản
  if (isPlacingObstacle) {
    handleObstaclePlacement(lat, lng);
    return;
  }

  let closestNode = null;
  let minDist = Infinity;

  // Tìm node gần nhất trên bản đồ với điểm được đánh dấu
  // Cải thiện đc thêm
  nodes.forEach((node) => {
    const d = getDistance(lat, lng, node.lat, node.lon);
    if (d < minDist) {
      minDist = d;
      closestNode = node;
    }
  });

  if (!closestNode) return;
  // Kiểm tra số điểm đã chọn
  if (selectedPoints.length >= 2) {
    alert("Đã có 2 điểm! Reset để tìm đường mới");
    console.log("Chỉ được chọn 2 điểm để tìm đường.");
    return;
  }
  if (selectedPoints.length < 2) {
    // Thêm diểm vào selectdPoints
    selectedPoints.push(closestNode.node_id);
    L.circleMarker([closestNode.lat, closestNode.lon], {
      radius: 6,
      color: "green",
      fillColor: "green",
      fillOpacity: 1,
    }).addTo(map);

    // Chạy thuật toán tìm đường đi
    if (selectedPoints.length === 2) {
      findAndDrawPath();
    }
  }
});

// Xử lý di chuyển chuột
map.on("mousemove", function (e) {
  if ((isBlockMode || isTrafficMode) && isDrawing) {
    if (temporaryLine) {
      map.removeLayer(temporaryLine);
    }
    const lastPoint =
      points.length > 0 ? points[points.length - 1] : startPoint;
    let color;
    let trafficLevel = parseInt(document.getElementById("trafficLevel").value);
    if (isBlockMode) {
      color = "#f44336"; // Đỏ - cấm đường
    } else {
      switch (trafficLevel) {
        case 1:
          color = "#fdd835"; // Tắc nhẹ - vàng tươi
          break;
        case 2:
          color = "#ffb300"; // Tắc vừa - cam đậm
          break;
        case 3:
          color = "#bf360c"; // Tắc nặng - nâu cam đậm
          break;
      }
    }
    if (lastPoint) {
      temporaryLine = L.polyline([lastPoint, [e.latlng.lat, e.latlng.lng]], {
        color: color,
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
  if (e.key === "Escape" && isDrawing) {
    let mode = null;
    let lineList = null;
    let tempLine = null;
    let edgesList = null;

    if (isBlockMode) {
      mode = "block";
      lineList = bannedLines;
      tempLine = banPolyline;
      edgesList = blockedEdges;
    } else if (isTrafficMode) {
      mode = "traffic";
      lineList = trafficLine;
      tempLine = trafficPolyline;
      edgesList = trafficEdges;
    }

    if (mode && points.length > 0) {
      console.log(`Hoàn thành vẽ đường ${mode === "block" ? "cấm" : "tắc"}`);

      // Lưu đường vào danh sách
      lineList.push([...points]);

      let color;
      let trafficLevel = parseInt(document.getElementById("trafficLevel").value);
      if (mode === "block") {
        color = "#f44336"; // Đỏ - cấm đường
      } else if (mode === "traffic") {
        switch (trafficLevel) {
          case 1:
            color = "#fdd835"; // Tắc nhẹ - vàng 
            break;
          case 2:
            color = "#ffb300"; // Tắc vừa - cam đậm
            break;
          case 3:
            color = "#bf360c"; // Tắc nặng - nâu cam đậm
            break;
        }
      }

      // Vẽ đường
      L.polyline(points, {
        color: color,
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

      // Xóa đường tạm
      if (temporaryLine) {
        map.removeLayer(temporaryLine);
        temporaryLine = null;
      }

      if (tempLine) {
        map.removeLayer(tempLine);
        tempLine = null;
      }

      console.log(
        `Tổng số cạnh ${mode === "block" ? "bị cấm" : "tắc đường"}:`,
        edgesList.length
      );
      if (mode === "traffic") {
        console.log("Hệ số tắc đường:", trafficLevel);
      }
      console.log(
        `=== Kết thúc vẽ đường ${mode === "block" ? "cấm" : "tắc"} ===`
      );

      // Reset trạng thái
      points = [];
      isBlockMode = false;
      isTrafficMode = false;
      isDrawing = false;
      startPoint = null;
    } else if (mode) {
      console.warn(
        `Không có điểm nào để tạo đường ${mode === "block" ? "cấm" : "tắc"}.`
      );
    }
  }
});

// Hàm truyền đối số cho backend
function findAndDrawPath() {
  fetch("http://127.0.0.1:5000/find_path", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      start: selectedPoints[0], // Điểm khởi đầu
      end: selectedPoints[1], // Điểm kết thúc
      blocked_edges: blockedEdges, // Đường cấm
      algorithm: algorithm, // Thuật toán
      traffic_edges: trafficEdges, // Đường tắc
      traffic_level: trafficLevel, // Hệ số tắc đường
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.path) {
        // -- Vẽ đường đi cho Gle
        // exploredNodes = data.explored_nodes;
        // highlightExploredNodes(exploredNodes, () => drawPath(data.path));
        // // selectedPoints = [];
        console.log(
          "Tìm thấy đường đi giữa 2 điểm " +
            selectedPoints[0] +
            " -> " +
            selectedPoints[1] + "\n Chi phí đường đi " + data.Cost
        );
        drawPath(data.path);
      } else {
        alert(data.error || "Không tìm thấy đường đi.");
      }
    })
    .catch((err) => {
      console.error("Lỗi:", err);
      alert("12");
    });
}

// ----------------------------------- Xử lý thuật toán ------------------------------
algorithmSelect.addEventListener("change", function () {
  algorithm = this.value;
  alert(
    "Thuật toán đã được chọn: " +
      algorithm +
      "\n Chúng tôi sẽ làm mới đường đi cho bạn 🤖"
  );
  getAlgorithm();
});
function getAlgorithm() {
  map.eachLayer(function (layer) {
    if (
      layer instanceof L.Polyline && // Là Polyline
      !(layer instanceof L.TileLayer) && // Không phải TileLayer
      layer.options.color === "green" // Có màu xanh
    ) {
      map.removeLayer(layer);
    }
  });
  findAndDrawPath();
}

/*---------------------------------------------------- Xử lý tắc đường ---------------------------*/
document.getElementById("trafficBtn").addEventListener("click", function () {
  isTrafficMode = true;
  isDrawing = true;
  points = [];
  trafficLevel = document.getElementById("trafficLevel").value;
  console.log("Mức độ tắc đường:", trafficLevel.value);
  if (trafficPolyline) {
    map.removeLayer(trafficPolyline);
    trafficPolyline = null;
  }
  alert("Click bản đồ để tạo vùng tắc \n ESC để hủy tắt vẽ cấm đường");
  console.log("Bật chế độ vẽ vùng tắc");
});

function isEdgeTraffic(edge) {
  return trafficEdges.some(
    (blocked) =>
      (blocked[0] === edge[0] && blocked[1] === edge[1]) ||
      (blocked[0] === edge[1] && blocked[1] === edge[0])
  );
}

function handleTrafficEdge(edge) {
  if (!isEdgeTraffic(edge)) {
    trafficEdges.push(edge);
    console.log(`💢 Cạnh xảy ra tắc đường: ${edge[0]} - ${edge[1]}`);
    console.log();
  }
}

/* ------------------------------------- Xử lý cấm đường ------------------------------------*/
document.getElementById("banEdgeBtn").addEventListener("click", function () {
  isBlockMode = true;
  isDrawing = true;
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

function redrawBannedLines() {
  let color;
  let trafficLevel = parseInt(document.getElementById("trafficLevel").value);
  if (isBlockMode) {
    color = "#f44336"; // Đỏ - cấm đường
  } else {
    switch (trafficLevel) {
      case 1:
        color = "#fdd835"; // Tắc nhẹ - vàng tươi
        break;
      case 2:
        color = "#ffb300"; // Tắc vừa - cam đậm
        break;
      case 3:
        color = "#bf360c"; // Tắc nặng - nâu cam đậm
        break;
    }
  }
  bannedLines.forEach((points) => {
    points.forEach((point) => {
      L.circleMarker(point, {
        radius: 5,
        color: color,
        fillColor: color,
        fillOpacity: 1,
      }).addTo(map);
    });

    L.polyline(points, {
      color: color,
      weight: 3,
      dashArray: "10,10",
      opacity: 0.8,
    }).addTo(map);
  });
  trafficLine.forEach((points) => {
    points.forEach((point) => {
      L.circleMarker(point, {
        radius: 5,
        color: color,
        fillColor: color,
        fillOpacity: 1,
      }).addTo(map);
    });

    L.polyline(points, {
      color: color,
      weight: 3,
      dashArray: "10,10",
      opacity: 0.8,
    }).addTo(map);
  });
}

/*-------------------------------------- Xử lý đặt vật cản -------------------------------------*/
function handleObstaclePlacement(lat, lng) {
  const radius = document.getElementById("obstacleRadius").value;
  const center = [lat, lng];

  const obstacle = drawObstacle(center, radius);
  obstacleMarkers.push(obstacle);

  detectBlockedEdgesByObstacle(center, radius);
}
const placeObstacleBtn = document.getElementById("placeObstacleBtn");

function drawObstacle(clickedPoint, radius) {
  // Tạo chấm tròn điểm cấm (điểm tâm)
  const obstacleMarker = L.circleMarker(clickedPoint, {
    radius: 8,
    color: "#ff0000",
    fillColor: "#ff0000",
    fillOpacity: 0.7,
  }).addTo(map);

  // Tạo vòng tròn bán kính vùng cấm
  const radiusCircle = L.circle(clickedPoint, {
    radius: parseFloat(radius),
    color: "#ff0000",
    fillColor: "#ff0000",
    fillOpacity: 0.1,
    weight: 1,
  }).addTo(map);

  // Trả về cả 2 marker để quản lý
  return [obstacleMarker, radiusCircle];
}

function detectBlockedEdgesByObstacle(clickedPoint, radius) {
  adj_list_with_weights.forEach((node) => {
    const u = node.node_id;
    // Tìm nodeU trong mảng nodes
    const nodeUObj = nodes.find((n) => n.node_id === u);
    if (!nodeUObj) {
      console.error(`Không tìm thấy node với id ${u}`);
      return;
    }

    const latU = nodeUObj.lat;
    const lonU = nodeUObj.lon;

    // Duyệt qua các neighbors có weight
    node.neighbors.forEach((neighborInfo) => {
      const v = neighborInfo.node_neighbor; // Lấy node_id của neighbor
      const weight = neighborInfo.weight; // Lấy weight của cạnh

      const nodeVObj = nodes.find((n) => n.node_id === v);
      if (!nodeVObj) {
        console.error(`Không tìm thấy node với id ${v}`);
        return;
      }
      const latV = nodeVObj.lat;
      const lonV = nodeVObj.lon;

      // Tính điểm giữa của cạnh
      const edgeMidpoint = [(latU + latV) / 2, (lonU + lonV) / 2];

      // Tính khoảng cách từ vật cản đến điểm giữa cạnh
      const distance = getDistance(
        clickedPoint[0],
        clickedPoint[1],
        edgeMidpoint[0],
        edgeMidpoint[1]
      );
      // Nếu khoảng cách nhỏ hơn hoặc bằng bán kính vật cản
      if (distance <= radius) {
        if (!isEdgeBlocked([u, v])) {
          blockedEdges.push([u, v]);
          console.log(`Cạnh bị chặn bởi vật cản: ${u} - ${v}`);
        }
      }
    });
  });

  console.log("Tổng số cạnh bị chặn bởi vật cản:", blockedEdges.length);
}

placeObstacleBtn.addEventListener("click", function () {
  isPlacingObstacle = !isPlacingObstacle;

  placeObstacleBtn.textContent = isPlacingObstacle
    ? "Hủy đặt vật cản"
    : "Đặt vật cản";
  placeObstacleBtn.classList.toggle("btn-danger", isPlacingObstacle);
  placeObstacleBtn.classList.toggle("btn-warning", !isPlacingObstacle);

  if (isPlacingObstacle) {
    alert("Click vào bản đồ để đặt vật cản");
  }
});

/*-------------------------------------- Xử lý sự kiện Reset -------------------------------------*/
function resetMapWithGuest() {
  selectedPoints = [];
  startPoint = null;
  isDrawing = false;
  isBlockMode = false;
  isTrafficMode = false;
  showNodes = false;
  map.eachLayer(function (layer) {
    if (!(layer instanceof L.TileLayer)) {
      map.removeLayer(layer);
    }
  });
  redrawBannedLines();
  obstacleMarkers.forEach(([marker, circle]) => {
    // Vẽ lại điểm tâm và vòng tròn bán kính của vật cản
    drawObstacle(marker.getLatLng(), circle.getRadius());
  });
  const placeObstacleBtn = document.getElementById("placeObstacleBtn");
  placeObstacleBtn.textContent = "Đặt vật cản";
  placeObstacleBtn.classList.remove("btn-danger");
  placeObstacleBtn.classList.add("btn-warning");
}

function resetMapWithAdmin() {
  if (!isAdmin) {
    console.warn("Error Reset Admin");
    return;
  }
  selectedPoints = [];
  startPoint = null;
  isDrawing = false;
  isBlockMode = false;
  isTrafficMode = false;
  bannedLines = [];
  trafficLine = [];
  if (temporaryLine) {
    temporaryLine = null;
  }
  // Xóa các vật cản
  obstacleMarkers = [];
  isPlacingObstacle = false;
  blockedEdges = [];
  trafficEdges = [];

  // Xóa tất cả các layer trên bản đồ
  map.eachLayer(function (layer) {
    if (!(layer instanceof L.TileLayer)) {
      map.removeLayer(layer);
    }
  });
  console.log("\nReset bản đồ thành công!\n");
  console.log("Blocked edges: ", blockedEdges);
  console.log("TrafficEdges: ", trafficEdges);
  const placeObstacleBtn = document.getElementById("placeObstacleBtn");
  placeObstacleBtn.textContent = "Đặt vật cản";
  placeObstacleBtn.classList.remove("btn-danger");
  placeObstacleBtn.classList.add("btn-warning");
}
document
  .getElementById("guestResetButton")
  .addEventListener("click", () => resetMapWithGuest()); // Guest reset - giữ lại đường cấm

document
  .getElementById("adminResetButton")
  .addEventListener("click", () => resetMapWithAdmin());

/*----------------------------------------- Các hàm hỗ trợ -----------------------------------------*/
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

function segmentsIntersect(p1, p2, q1, q2, epsilon) {
  function ccw(a, b, c) {
    return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
  }

  function pointSegmentDistance(p, a, b) {
    // Tính khoảng cách từ điểm p tới đoạn thẳng a-b
    let l2 = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    if (l2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]); // a==b
    let t =
      ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / l2;
    t = Math.max(0, Math.min(1, t));
    let projection = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    return Math.hypot(p[0] - projection[0], p[1] - projection[1]);
  }

  function segmentsDistance(p1, p2, q1, q2) {
    // Khoảng cách nhỏ nhất giữa 2 đoạn thẳng
    return Math.min(
      pointSegmentDistance(p1, q1, q2),
      pointSegmentDistance(p2, q1, q2),
      pointSegmentDistance(q1, p1, p2),
      pointSegmentDistance(q2, p1, p2)
    );
  }

  let intersect =
    ccw(p1, q1, q2) !== ccw(p2, q1, q2) && ccw(p1, p2, q1) !== ccw(p1, p2, q2);

  if (intersect) return true;

  let distance = segmentsDistance(p1, p2, q1, q2);
  return distance <= epsilon;
}

function drawPath(path) {
  const latlngs = path.map((id) => {
    const node = nodes.find((n) => n.node_id === id);
    return [node.lat, node.lon];
  });

  L.polyline(latlngs, {
    color: "green",
    weight: 3,
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
  for (let u = 0; u < adj_list_with_weights.length; u++) {
    // console.log(adj_list_with_weights[u].node_id);
    const currentNodeId = adj_list_with_weights[u].node_id;
    const nodeU = nodes.find((n) => n.node_id === currentNodeId);

    const lat1 = nodeU.lat;
    const lon1 = nodeU.lon;

    for (let v = 0; v < adj_list_with_weights[u].neighbors.length; v++) {
      const nodeV = nodes.find(
        (n) => n.node_id === adj_list_with_weights[u].neighbors[v].node_neighbor
      );
      const edgeLine = [
        [nodeU.lat, nodeU.lon],
        [nodeV.lat, nodeV.lon],
      ];
      if (segmentsIntersect(p1, p2, edgeLine[0], edgeLine[1], 0.0001)) {
        if (isBlockMode) handleBlockedEdge([nodeU.node_id, nodeV.node_id]);
        if (isTrafficMode) handleTrafficEdge([nodeU.node_id, nodeV.node_id]);
      }
    }
  }
}

function handleDrawingMode(lat, lng, isTraffic = false) {
  isDrawing = true;
  startPoint = [lat, lng];
  points.push([lat, lng]);

  let color;
  let trafficLevel = parseInt(document.getElementById("trafficLevel").value);
  if (!isTraffic) {
    color = "#f44336"; // Đỏ - cấm đường
  } else {
    switch (trafficLevel) {
      case 1:
        color = "#fdd835"; // Tắc nhẹ - vàng tươi
        break;
      case 2:
        color = "#ffb300"; // Tắc vừa - cam đậm
        break;
      case 3:
        color = "#bf360c"; // Tắc nặng - nâu cam đậm
        break;
    }
  } // cam cho traffic, đỏ cho cấm
  const polylineOptions = {
    color: color,
    weight: 3,
    dashArray: "10,10",
    opacity: 0.8,
  };

  const currentPoint = [lat, lng];

  // Vẽ chấm tròn tại điểm click
  L.circleMarker(currentPoint, {
    radius: 5,
    color: color,
    fillColor: color,
    fillOpacity: 1,
  }).addTo(map);

  // Xóa polyline cũ nếu có
  if (isTraffic && trafficPolyline) {
    map.removeLayer(trafficPolyline);
  } else if (!isTraffic && banPolyline) {
    map.removeLayer(banPolyline);
  }

  // Tạo polyline mới
  if (isTraffic) {
    trafficPolyline = L.polyline(points, polylineOptions).addTo(map);
  } else {
    banPolyline = L.polyline(points, polylineOptions).addTo(map);
  }
}

// /*---------------------------  Hiệu ứng duyệt qua các node  ----------------------------------------*/
// let exploredNodes = []; // Danh sách lưu các marker đã vẽ

// function highlightExploredNodes(explored, callback) {
//   let i = 0;

//   // Xóa interval trước đó nếu tồn tại
//   if (highlightInterval) {
//     clearInterval(highlightInterval);
//   }

//   // Xóa tất cả marker đã được vẽ trước đó
//   exploredNodes.forEach((marker) => marker.remove());
//   exploredNodes = []; // Đặt lại danh sách marker

//   highlightInterval = setInterval(() => {
//     if (i >= explored.length || reset) {
//       clearInterval(highlightInterval); // Dừng interval
//       highlightInterval = null; // Đặt lại biến
//       if (callback) callback(); // Gọi callback nếu có
//       return;
//     }

//     const node = nodes.find((n) => n.node_id === explored[i]);
//     if (node) {
//       if (!reset) {
//         const marker = L.circleMarker([node.lat, node.lon], {
//           radius: 4,
//           color: "purple",
//           fillColor: "purple",
//           fillOpacity: 0.9,
//         })
//           .addTo(map)
//           .bindTooltip(`Node ${node.node_id}`);

//         exploredNodes.push(marker); // Thêm marker vào danh sách
//       }
//     }
//     i++;
//   }, 50);
//   reset = false; // Đặt lại biến reset về false sau khi bắt đầu highlight
// }
