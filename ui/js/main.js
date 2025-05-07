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

let floodLevel; // Biến toàn cục để xác định mức độ ngập
let floodMarkers = []; // Biến toàn cục để lưu các marker ngập
let floodPolyline = null; // Biến toàn cục để lưu polyline ngập
let isFloodMode = false; // Biến toàn cục để xác định chế độ ngập
let floodLine = [];
let floodEdges = []; // Biến toàn cục để lưu các cạnh ngập

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
    isFloodMode = false;
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

const floodInput = document.getElementById("floodLevel");

floodInput.addEventListener("input", () => {
  let val = parseInt(floodInput.value);
  if (val > 3) {
    floodInput.value = 3;
  } else if (val < 1) {
    floodInput.value = 1;
  }
});

const obstacleRadiusInput = document.getElementById("obstacleRadius");

obstacleRadiusInput.addEventListener("input", () => {
  let val = parseInt(obstacleRadiusInput.value);
  if (val > 200) {
    obstacleRadiusInput.value = 200;
  } else if (val < 10) {
    obstacleRadiusInput.value = 10;
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
          weight: 3,
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

  if (isAdmin && isOneWayEdgeMode) { // Ưu tiên chế độ này
    handleOneWayEdgeModeClick(e); // Truyền cả event `e`
    return;
  }

  // Nếu đang là Admin và không trong các chế độ vẽ
  if (isAdmin && !isBlockMode && !isPlacingObstacle && !isTrafficMode && !isFloodMode) {
    alert(
      "Chế độ Admin đang hoạt động.\nBạn không thể tìm đường"
    );
    return;
  }

  // 1. Chế độ vẽ đường cấm hoặc tắc đường (đều sử dụng polyline)
  if (isBlockMode || isTrafficMode || isFloodMode) {
    handleDrawingMode(lat, lng, isTrafficMode, isFloodMode);
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
  if ((isBlockMode || isTrafficMode || isFloodMode) && isDrawing) {
    if (temporaryLine) {
      map.removeLayer(temporaryLine);
    }
    const lastPoint = points.length > 0 ? points[points.length - 1] : startPoint;
    let color;
    let trafficLevel = parseInt(document.getElementById("trafficLevel").value);
    let floodLevel = parseInt(document.getElementById("floodLevel").value);
    if (!isTrafficMode && !isFloodMode) {
      color = "#f44336"; // Đỏ - cấm đường
    } else if(isTrafficMode){
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
    }  else {
      switch (floodLevel) {
        case 1:
          color = "#64b5f6"; // Ngập nhẹ - xanh dương nhạt
          break;
        case 2:
          color = "#2196f3"; // Ngập vừa - xanh dương vừa
          break;
        case 3:
          color = "#0d47a1"; // Ngập nặng - xanh dương đậm nhất
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
    } else if (isFloodMode) {
      mode = "flood";
      lineList = floodLine;
      tempLine = floodPolyline;
      edgesList = floodEdges;
    }

    if (mode && points.length > 0) {
      console.log(`Hoàn thành vẽ đường ${mode === "block" ? "cấm" : "tắc"}`);

      // Lưu đường vào danh sách
      lineList.push([...points]);

      let color;
      let trafficLevel = parseInt(document.getElementById("trafficLevel").value);
      let floodLevel = parseInt(document.getElementById("floodLevel").value);
      if (mode === "block") {
        color = "#f44336"; // Đỏ - cấm đường
      } else if(mode === "traffic"){
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
      }  else {
        switch (floodLevel) {
          case 1:
            color = "#64b5f6"; // Ngập nhẹ - xanh dương nhạt
            break;
          case 2:
            color = "#2196f3"; // Ngập vừa - xanh dương vừa
            break;
          case 3:
            color = "#0d47a1"; // Ngập nặng - xanh dương đậm nhất
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
      isFloodMode = false;
      isDrawing = false;
      startPoint = null;
    } else if (mode) {
      console.warn(
        `Không có điểm nào để tạo đường ${mode === "block" ? "cấm" : "tắc"}.`
      );
    }
  }
  if (e.key === "Escape") {
    if (isAdmin && isOneWayEdgeMode) {
        isOneWayEdgeMode = false;
        const btn = document.getElementById("toggleOneWayEdgeModeBtn");
        if (btn) {
            btn.textContent = "Đường 1 chiều";
            btn.classList.remove("btn-danger");
            btn.classList.add("btn-warning"); // Nhất quán với class mặc định của nút
        }
        map.getContainer().style.cursor = '';
        map.closePopup(); // Đóng popup nếu đang mở
        console.log("Đã thoát chế độ đặt đường một chiều.");
        return;
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
      flood_edges: floodEdges,
      flood_level: floodLevel,
      one_way_edges: oneWayEdges
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

/*---------------------------------------------------- Xử lý ngập lụt ---------------------------*/
document.getElementById("floodBtn").addEventListener("click", function () {
  isFloodMode = true;
  isDrawing = true;
  points = [];
  floodLevel = document.getElementById("floodLevel").value;
  console.log("Mức độ ngập lụt:", floodLevel.value);
  if (floodPolyline) {
    map.removeLayer(floodPolyline);
    floodPolyline = null;
  }
  alert("Click bản đồ để tạo vùng ngập lụt \n ESC để hủy tắt vẽ ngập lụt");
  console.log("Bật chế độ vẽ ngập lụt");
});

document.getElementById("restoreFloodBtn").addEventListener("click", function () {
  if (floodLine.length === 0) {
    console.warn("Không còn đường ngập lụt nào để khôi phục.");
    return;
  }
  floodLine.pop();

  map.eachLayer(function (layer) {
    if (
      (layer instanceof L.Polyline &&
        (layer.options.color === "#64b5f6"||
        layer.options.color === "#2196f3" ||
        layer.options.color === "#0d47a1")
      ) ||
      layer instanceof L.CircleMarker
    ) {
      map.removeLayer(layer);
    }
  });

  floodLine.forEach((linePoints) => {

    L.polyline(linePoints, {
      color: "#ffb300",
      weight: 3,
      dashArray: "10,10",
      opacity: 0.8,
    }).addTo(map);
  });

  // Cập nhật lại danh sách blockedEdges
  floodEdges = [];
  floodLine.forEach((linePoints) => {
    for (let i = 0; i < linePoints.length - 1; i++) {
      const p1 = linePoints[i];
      const p2 = linePoints[i + 1];
      if (p1 && p2) {
        detectBlockedEdgesByCut([p1, p2]);
      }
    }
  });

  console.log("Đã khôi phục lại các đường tắc còn lại.");
});

function isEdgeFlood(edge) {
  return floodEdges.some(
    (blocked) =>
      (blocked[0] === edge[0] && blocked[1] === edge[1]) ||
      (blocked[0] === edge[1] && blocked[1] === edge[0])
  );
}

function handleFloodEdge(edge) {
  if (!isEdgeFlood(edge)) {
    floodEdges.push(edge);
    console.log(`💢 Cạnh xảy ra ngập lụt: ${edge[0]} - ${edge[1]}`);
    console.log();
  }
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
  alert("Click bản đồ để tạo vùng tắc \n ESC để hủy tắt vẽ tắc đường");
  console.log("Bật chế độ vẽ vùng tắc");
});

document.getElementById("restoreTacBtn").addEventListener("click", function () {
  if (trafficLine.length === 0) {
    console.warn("Không còn đường tắc nào để khôi phục.");
    return;
  }
  trafficLine.pop();

  map.eachLayer(function (layer) {
    if (
      (layer instanceof L.Polyline &&
        (layer.options.color === "#fdd835"||
        layer.options.color === "#ffb300" ||
        layer.options.color === "#bf360c")
      ) ||
      layer instanceof L.CircleMarker
    ) {
      map.removeLayer(layer);
    }
  });

  trafficLine.forEach((linePoints) => {

    L.polyline(linePoints, {
      color: "#ffb300",
      weight: 3,
      dashArray: "10,10",
      opacity: 0.8,
    }).addTo(map);
  });

  // Cập nhật lại danh sách blockedEdges
  trafficEdges = [];
  trafficLine.forEach((linePoints) => {
    for (let i = 0; i < linePoints.length - 1; i++) {
      const p1 = linePoints[i];
      const p2 = linePoints[i + 1];
      if (p1 && p2) {
        detectBlockedEdgesByCut([p1, p2]);
      }
    }
  });

  console.log("Đã khôi phục lại các đường tắc còn lại.");
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
  bannedLines.forEach((points) => {
    points.forEach((point) => {
      L.circleMarker(point, {
        radius: 5,
        color: "red",
        fillColor: "red",
        fillOpacity: 1,
      }).addTo(map);
    });

    L.polyline(points, {
      color: "red",
      weight: 3,
      dashArray: "10,10",
      opacity: 0.8,
    }).addTo(map);
  });

  trafficLine.forEach((points) => {
    points.forEach((point) => {
      L.circleMarker(point, {
        radius: 5,
        color: "yellow",
        fillColor: "yellow",
        fillOpacity: 1,
      }).addTo(map);
    });

    L.polyline(points, {
      color: "yellow",
      weight: 3,
      dashArray: "10,10",
      opacity: 0.8,
    }).addTo(map);
  });

  floodLine.forEach((points) => {
    points.forEach((point) => {
      L.circleMarker(point, {
        radius: 5,
        color: "blue",
        fillColor: "blue",
        fillOpacity: 1,
      }).addTo(map);
    });

    L.polyline(points, {
      color: "blue",
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
  isFloodMode = false;
  showNodes = false;
  isOneWayEdgeMode = false;
  map.eachLayer(function (layer) {
      if (
          (layer instanceof L.Polyline && layer.options.color === "green") ||
          (layer instanceof L.CircleMarker && layer.options.color === "green")
      ) {
          map.removeLayer(layer);
      }
      // Cẩn thận khi xóa circleMarker, tránh xóa của admin
      if (layer instanceof L.CircleMarker && ["yellow", "blue", "red"].includes(layer.options.color) ) {
          // Đây là cách đơn giản, có thể cần logic phức tạp hơn để không xóa nhầm
          // Ví dụ: kiểm tra xem marker có phải là phần của obstacleMarkers không
          let isObstaclePt = obstacleMarkers.some(om => om[0] === layer);
          if(!isObstaclePt) {
              // map.removeLayer(layer); // Tạm thời comment để tránh xóa nhầm
          }
      }
  });
  redrawBannedLines();
  obstacleMarkers.forEach(([marker, circle]) => {
      if (marker && circle && map.hasLayer(marker) && map.hasLayer(circle)) { // Kiểm tra marker có tồn tại
           // Không cần vẽ lại nếu chúng đã có trên bản đồ và không bị xóa
      } else if (marker && circle) { // Nếu bị xóa thì vẽ lại
          drawObstacle(marker.getLatLng(), circle.getRadius());
      }
  });
  redrawAllOneWayArrows();
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
  isFloodMode = false;
  isOneWayEdgeMode = false;
  bannedLines = [];
  trafficLine = [];
  floodLine = [];
  const oneWayBtn = document.getElementById("toggleOneWayEdgeModeBtn");
  if (oneWayBtn) {
      oneWayBtn.textContent = "Đường 1 chiều";
      oneWayBtn.classList.remove("btn-danger");
      oneWayBtn.classList.add("btn-info");
  }
  map.getContainer().style.cursor = '';
  oneWayEdges = []; // Xóa danh sách cạnh một chiều
  redrawAllOneWayArrows(); // Sẽ xóa tất cả mũi tên vì oneWayEdges rỗng
  map.closePopup(); // Đóng popup nếu có
  if (temporaryLine) {
    temporaryLine = null;
  }
  // Xóa các vật cản
  obstacleMarkers = [];
  isPlacingObstacle = false;
  blockedEdges = [];
  trafficEdges = [];
  floodEdges = [];

  // Xóa tất cả các layer trên bản đồ
  map.eachLayer(function (layer) {
    if (!(layer instanceof L.TileLayer)) {
      map.removeLayer(layer);
    }
  });
  console.log("\nReset bản đồ thành công!\n");
  console.log("Blocked edges: ", blockedEdges);
  console.log("TrafficEdges: ", trafficEdges);
  console.log("TrafficEdges: ", floodEdges);
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
        if (isFloodMode) handleFloodEdge([nodeU.node_id, nodeV.node_id])
      }
    }
  }
}

function handleDrawingMode(lat, lng, isTraffic = false, isFlood = false) {
  isDrawing = true;
  startPoint = [lat, lng];
  points.push([lat, lng]);

  let color;
  let trafficLevel = parseInt(document.getElementById("trafficLevel").value);
  let floodLevel = parseInt(document.getElementById("floodLevel").value);
  if (!isTraffic && !isFlood) {
    color = "#f44336"; // Đỏ - cấm đường
  } else if(isTraffic){
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
  }  else {
    switch (floodLevel) {
      case 1:
        color = "#64b5f6"; // Ngập nhẹ - xanh dương nhạt
        break;
      case 2:
        color = "#2196f3"; // Ngập vừa - xanh dương vừa
        break;
      case 3:
        color = "#0d47a1"; // Ngập nặng - xanh dương đậm nhất
        break;
    }
  }
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
  } else if (isFlood && floodPolyline){
    map.removeLayer(floodPolyline);
  } else if (banPolyline) {
    map.removeLayer(banPolyline);
  }

  // Tạo polyline mới
  if (isTraffic) {
    trafficPolyline = L.polyline(points, polylineOptions).addTo(map);
  } else if (isFlood){
    floodPolyline = L.polyline(points, polylineOptions).addTo(map);
  } else {
    banPolyline = L.polyline(points, polylineOptions).addTo(map);
  }
}

let isOneWayEdgeMode = false; // Thay cho isOneWayMode cũ, quản lý chế độ chọn cạnh
let oneWayEdges = [];         // Danh sách các cạnh một chiều [[sourceId, destId], ...]
let oneWayArrowDecorators = {}; // Lưu các layer mũi tên, key dạng "sourceId-destId"

const ONE_WAY_ARROW_COLOR = 'purple'; // Màu cho mũi tên và đường một chiều
const ONE_WAY_CLICK_THRESHOLD_METERS = 20; // Ngưỡng khoảng cách (mét) để chọn cạnh khi click

function distToSegmentSquared(clickLat, clickLon, lat1, lon1, lat2, lon2) {
    const l2 = (lat1 - lat2) * (lat1 - lat2) + (lon1 - lon2) * (lon1 - lon2);
    if (l2 === 0) { // p1 và p2 trùng nhau
        const distSq = (clickLat - lat1) * (clickLat - lat1) + (clickLon - lon1) * (clickLon - lon1);
        return { distanceSquared: distSq, closestPoint: { lat: lat1, lon: lon1 } };
    }


    let t = ((clickLat - lat1) * (lat2 - lat1) + (clickLon - lon1) * (lon2 - lon1)) / l2;

    let closestLat, closestLon;

    if (t < 0) { // Điểm chiếu nằm ngoài đoạn thẳng, về phía p1
        closestLat = lat1;
        closestLon = lon1;
    } else if (t > 1) { // Điểm chiếu nằm ngoài đoạn thẳng, về phía p2
        closestLat = lat2;
        closestLon = lon2;
    } else { // Điểm chiếu nằm trên đoạn thẳng p1p2
        closestLat = lat1 + t * (lat2 - lat1);
        closestLon = lon1 + t * (lon2 - lon1);
    }

    const dx = clickLat - closestLat;
    const dy = clickLon - closestLon;
    return {
        distanceSquared: dx * dx + dy * dy,
        closestPoint: { lat: closestLat, lon: closestLon }
    };
}

function findClosestEdgeToPoint(clickLatlng) {
    let closestEdge = null;
    let minDistanceSquared = Infinity; // Sẽ làm việc với bình phương khoảng cách để tránh Math.sqrt


    if (!adj_list_with_weights || !nodes) {
        console.error("LỖI: adj_list_with_weights hoặc nodes chưa được tải.");
        return null;
    }
    if (nodes.length === 0 || adj_list_with_weights.length === 0) {
        console.error("LỖI: Dữ liệu nodes hoặc adj_list_with_weights rỗng!");
        return null;
    }
    // Kiểm tra clickLatlng
    if (!clickLatlng || typeof clickLatlng.lat !== 'number' || typeof clickLatlng.lng !== 'number' || isNaN(clickLatlng.lat) || isNaN(clickLatlng.lng)) {
        console.error("LỖI: clickLatlng không hợp lệ:", clickLatlng);
        return null;
    }
    const cLat = clickLatlng.lat;
    const cLon = clickLatlng.lng;


    adj_list_with_weights.forEach((u_node_info, indexU) => {
        const nodeU = nodes.find(n => n.node_id === u_node_info.node_id);
        if (!nodeU) return;

        const uLat = parseFloat(nodeU.lat);
        const uLon = parseFloat(nodeU.lon);
        if (isNaN(uLat) || isNaN(uLon)) {
            console.warn(`Node U ${nodeU.node_id}: Dữ liệu lat/lon gốc hoặc sau parseFloat là NaN. Gốc: lat=${nodeU.lat}, lon=${nodeU.lon}`);
            return;
        }

        if (!u_node_info.neighbors || u_node_info.neighbors.length === 0) return;

        u_node_info.neighbors.forEach((v_neighbor, indexV) => {
            const nodeV = nodes.find(n => n.node_id === v_neighbor.node_neighbor);
            if (!nodeV) return;

            const vLat = parseFloat(nodeV.lat);
            const vLon = parseFloat(nodeV.lon);
            if (isNaN(vLat) || isNaN(vLon)) {
                console.warn(`Node V ${nodeV.node_id}: Dữ liệu lat/lon gốc hoặc sau parseFloat là NaN. Gốc: lat=${nodeV.lat}, lon=${nodeV.lon}`);
                return;
            }

            const segmentInfo = distToSegmentSquared(cLat, cLon, uLat, uLon, vLat, vLon);
            const currentDistSq = segmentInfo.distanceSquared;
            if (currentDistSq < minDistanceSquared) {
                minDistanceSquared = currentDistSq;
                closestEdge = {
                    u: nodeU,
                    v: nodeV,
                };
            }
        });
    });

    console.log("Kết quả findClosestEdgeToPoint (tự tính): Cạnh gần nhất:", closestEdge ? `${closestEdge.u.node_id}-${closestEdge.v.node_id}` : null, "Bình phương khoảng cách nhỏ nhất:", minDistanceSquared === Infinity ? "Infinity" : minDistanceSquared.toFixed(8));

    if (closestEdge) { 

        const clickPointLatLng = L.latLng(cLat, cLon);
        let actualDistanceToEdgeMeters = Infinity;

        if (closestEdge.u && closestEdge.v) { 
            const closestPtOnSeg = distToSegmentSquared(cLat, cLon, parseFloat(closestEdge.u.lat), parseFloat(closestEdge.u.lon), parseFloat(closestEdge.v.lat), parseFloat(closestEdge.v.lon)).closestPoint;
            actualDistanceToEdgeMeters = getDistance(cLat, cLon, closestPtOnSeg.lat, closestPtOnSeg.lon);
            console.log(`Khoảng cách thực tế (tính bằng getDistance) tới cạnh ${closestEdge.u.node_id}-${closestEdge.v.node_id} là: ${actualDistanceToEdgeMeters.toFixed(2)}m`);
        }


        if (actualDistanceToEdgeMeters < ONE_WAY_CLICK_THRESHOLD_METERS) {
            console.log(`Tìm thấy cạnh ${closestEdge.u.node_id}-${closestEdge.v.node_id} trong ngưỡng (${ONE_WAY_CLICK_THRESHOLD_METERS}m).`);
            return closestEdge;
        } else {
            console.log(`Cạnh gần nhất ${closestEdge.u.node_id}-${closestEdge.v.node_id} (${actualDistanceToEdgeMeters.toFixed(2)}m) không nằm trong ngưỡng (${ONE_WAY_CLICK_THRESHOLD_METERS}m).`);
            return null;
        }
    }

    console.log("Không tìm thấy cạnh nào (có thể do không có cạnh hoặc không trong ngưỡng).");
    return null;
}

function addOneWayArrow(sourceNodeId, destNodeId) {
    const sourceNode = nodes.find(n => n.node_id === sourceNodeId);
    const destNode = nodes.find(n => n.node_id === destNodeId);

    // Tạo một key duy nhất cho cả đường polyline, các marker và decorator của hướng này
    const key = `${sourceNodeId}-${destNodeId}`;

    // Xóa các thành phần cũ nếu có (tránh trùng lặp)
    if (oneWayArrowDecorators[key]) {
        if (oneWayArrowDecorators[key].polyline) {
            map.removeLayer(oneWayArrowDecorators[key].polyline);
        }
        if (oneWayArrowDecorators[key].decorator) {
            map.removeLayer(oneWayArrowDecorators[key].decorator);
        }
        if (oneWayArrowDecorators[key].sourceMarker) {
            map.removeLayer(oneWayArrowDecorators[key].sourceMarker);
        }
        if (oneWayArrowDecorators[key].destMarker) {
            map.removeLayer(oneWayArrowDecorators[key].destMarker);
        }
        delete oneWayArrowDecorators[key]; // Xóa entry cũ
    }

    if (sourceNode && destNode) {
        // Đảm bảo tọa độ là số (quan trọng!)
        const sLat = parseFloat(sourceNode.lat);
        const sLon = parseFloat(sourceNode.lon);
        const dLat = parseFloat(destNode.lat);
        const dLon = parseFloat(destNode.lon);

        if (isNaN(sLat) || isNaN(sLon) || isNaN(dLat) || isNaN(dLon)) {
            console.error(`Tọa độ không hợp lệ cho node ${sourceNodeId} hoặc ${destNodeId}. Không thể vẽ đường một chiều.`);
            return;
        }

        const latlngs = [[sLat, sLon], [dLat, dLon]];
        
        // 1. Vẽ Markers cho Node Đầu và Cuối
        const sourceMarker = L.circleMarker([sLat, sLon], {
            radius: 8, // Kích thước marker
            fillColor: ONE_WAY_ARROW_COLOR,
            color: "#fff", // Màu viền marker
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);

        const destMarker = L.circleMarker([dLat, dLon], {
            radius: 4,
            fillColor: ONE_WAY_ARROW_COLOR,
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);

        // 2. Polyline cơ sở to hơn
        const polyline = L.polyline(latlngs, {
            color: ONE_WAY_ARROW_COLOR,
            weight: 3, // Độ dày của đường to hơn
            opacity: 0.7
        }).addTo(map);

        // 3. Nhiều mũi tên hơn
        const arrowDecorator = L.polylineDecorator(latlngs, {
            patterns: [
                {
                    offset: 20,       // Bắt đầu vẽ mũi tên đầu tiên sau 20px từ điểm bắt đầu
                    repeat: '40px',  // Lặp lại mũi tên mỗi 80px
                    symbol: L.Symbol.arrowHead({
                        pixelSize: 15,
                        polygon: false,
                        pathOptions: {
                            stroke: true,
                            color: ONE_WAY_ARROW_COLOR,
                            weight: 2, // Giữ nguyên độ dày của mũi tên hoặc điều chỉnh nếu muốn
                            opacity: 1,
                            fillOpacity: 1
                        }
                    })
                }
            ]
        }).addTo(map);
        
        // Lưu tất cả các layer liên quan để có thể xóa chúng sau này
        oneWayArrowDecorators[key] = {
            polyline: polyline,
            decorator: arrowDecorator,
            sourceMarker: sourceMarker,
            destMarker: destMarker
        };
    } else {
        console.warn(`Không tìm thấy sourceNode (ID: ${sourceNodeId}) hoặc destNode (ID: ${destNodeId}) để vẽ đường một chiều.`);
    }
}


function removeOneWayArrow(nodeId1, nodeId2) {
    // Xóa cho hướng nodeId1 -> nodeId2
    const key1 = `${nodeId1}-${nodeId2}`;
    if (oneWayArrowDecorators[key1]) {
        if (oneWayArrowDecorators[key1].polyline) map.removeLayer(oneWayArrowDecorators[key1].polyline);
        if (oneWayArrowDecorators[key1].decorator) map.removeLayer(oneWayArrowDecorators[key1].decorator);
        if (oneWayArrowDecorators[key1].sourceMarker) map.removeLayer(oneWayArrowDecorators[key1].sourceMarker);
        if (oneWayArrowDecorators[key1].destMarker) map.removeLayer(oneWayArrowDecorators[key1].destMarker);
        delete oneWayArrowDecorators[key1];
    }

    // Xóa cho hướng nodeId2 -> nodeId1 (nếu có)
    const key2 = `${nodeId2}-${nodeId1}`;
    if (oneWayArrowDecorators[key2]) {
        if (oneWayArrowDecorators[key2].polyline) map.removeLayer(oneWayArrowDecorators[key2].polyline);
        if (oneWayArrowDecorators[key2].decorator) map.removeLayer(oneWayArrowDecorators[key2].decorator);
        if (oneWayArrowDecorators[key2].sourceMarker) map.removeLayer(oneWayArrowDecorators[key2].sourceMarker);
        if (oneWayArrowDecorators[key2].destMarker) map.removeLayer(oneWayArrowDecorators[key2].destMarker);
        delete oneWayArrowDecorators[key2];
    }
}

function redrawAllOneWayArrows() {
    // Xóa tất cả các đối tượng trang trí (bao gồm polyline, decorator, markers) cũ trên bản đồ
    for (const key in oneWayArrowDecorators) {
        if (oneWayArrowDecorators.hasOwnProperty(key)) {
            const layers = oneWayArrowDecorators[key];
            if (layers.polyline) map.removeLayer(layers.polyline);
            if (layers.decorator) map.removeLayer(layers.decorator);
            if (layers.sourceMarker) map.removeLayer(layers.sourceMarker);
            if (layers.destMarker) map.removeLayer(layers.destMarker);
        }
    }
    oneWayArrowDecorators = {}; // Reset object lưu trữ

    // Vẽ lại mũi tên (và các thành phần khác) dựa trên oneWayEdges hiện tại
    oneWayEdges.forEach(edge => {
        if (edge && edge.length === 2) { // Thêm kiểm tra cho edge
            addOneWayArrow(edge[0], edge[1]);
        } else {
            console.warn("Edge không hợp lệ trong oneWayEdges:", edge);
        }
    });
}

// Đảm bảo các hàm này có thể truy cập toàn cục nếu gọi từ HTML trong popup
window.setOneWayDirection = function(sourceNodeId, destNodeId, edgeNodeUId, edgeNodeVId) {
    // 1. Xóa mọi thiết lập một chiều cũ cho cạnh vật lý này (cả 2 chiều)
    oneWayEdges = oneWayEdges.filter(edge =>
        !((edge[0] === edgeNodeUId && edge[1] === edgeNodeVId) || (edge[0] === edgeNodeVId && edge[1] === edgeNodeUId))
    );
    removeOneWayArrow(edgeNodeUId, edgeNodeVId); // Hàm này xóa cả 2 chiều có thể của mũi tên cũ

    // 2. Thêm hướng mới đã chọn
    oneWayEdges.push([sourceNodeId, destNodeId]);
    console.log(`Đã đặt đường một chiều: ${sourceNodeId} -> ${destNodeId}`);
    addOneWayArrow(sourceNodeId, destNodeId); // Vẽ mũi tên cho hướng mới

    map.closePopup(); // Đóng popup
}

window.clearOneWaySetting = function(nodeId1, nodeId2) {
    oneWayEdges = oneWayEdges.filter(edge =>
        !((edge[0] === nodeId1 && edge[1] === nodeId2) || (edge[0] === nodeId2 && edge[1] === nodeId1))
    );
    removeOneWayArrow(nodeId1, nodeId2); // Hàm này xóa cả 2 chiều

    console.log(`Đã xóa cài đặt đường một chiều cho cạnh ${nodeId1} - ${nodeId2}`);
    map.closePopup();
}

function handleOneWayEdgeModeClick(clickEvent) {
    const clickLatlng = clickEvent.latlng;
    const selectedEdge = findClosestEdgeToPoint(clickLatlng);

    if (selectedEdge) {
        const { u, v } = selectedEdge;

        if (!isPhysicallyTwoWayEdge(u.node_id, v.node_id)) {
            alert("Đây là đường 1 chiều. Bạn hãy chọn đường 2 chiều khác để chuyển thành đường 1 chiều!");
            map.closePopup();
            return;
        }

        const isUtoV_userSet = oneWayEdges.some(e => e[0] === u.node_id && e[1] === v.node_id);
        const isVtoU_userSet = oneWayEdges.some(e => e[0] === v.node_id && e[1] === u.node_id);

        let statusText = "Đường hai chiều (có thể đặt một chiều).";
        let statusClass = "status-default"; // Class cho CSS nếu muốn style riêng

        if (isUtoV_userSet) {
            statusText = `Hiện tại (do bạn đặt): ${u.node_id} ➔ ${v.node_id}`;
            // statusClass = "status-oneway-uv"; // Ví dụ
        } else if (isVtoU_userSet) {
            statusText = `Hiện tại (do bạn đặt): ${v.node_id} ➔ ${u.node_id}`;
            // statusClass = "status-oneway-vu"; // Ví dụ
        }

        let popupContent = `
            <div class="custom-leaflet-popup">
                <h5>Cạnh: ${u.node_id} – ${v.node_id}</h5>
                <small class="popup-status ${statusClass}">${statusText}</small>
                <hr class="popup-hr">
                <p>Chọn hướng một chiều mới:</p>
                <button class="btn btn-primary btn-popup" onclick="setOneWayDirection(${u.node_id}, ${v.node_id}, ${u.node_id}, ${v.node_id})">
                    ${u.node_id} ➔ ${v.node_id}
                </button>
                <button class="btn btn-primary btn-popup" onclick="setOneWayDirection(${v.node_id}, ${u.node_id}, ${u.node_id}, ${v.node_id})">
                    ${v.node_id} ➔ ${u.node_id}
                </button>
        `;

        if (isUtoV_userSet || isVtoU_userSet) {
            popupContent += `
                <hr class="popup-hr">
                <button class="btn btn-danger btn-popup" onclick="clearOneWaySetting(${u.node_id}, ${v.node_id})">
                    Xóa cài đặt một chiều (Trở lại 2 chiều)
                </button>`;
        }
        popupContent += `</div>`;

        const uLat = parseFloat(u.lat);
        const uLon = parseFloat(u.lon);
        const vLat = parseFloat(v.lat);
        const vLon = parseFloat(v.lon);

        if (isNaN(uLat) || isNaN(uLon) || isNaN(vLat) || isNaN(vLon)) {
            console.error("Tọa độ của node u hoặc v không hợp lệ để tính điểm giữa cho popup.");
            alert("Không thể hiển thị tùy chọn cho cạnh này do lỗi dữ liệu tọa độ.");
            return;
        }

        const midPoint = L.latLng((uLat + vLat) / 2, (uLon + vLon) / 2);

        L.popup({ className: 'synced-leaflet-popup' })
            .setLatLng(midPoint)
            .setContent(popupContent)
            .openOn(map);

    } else {
        
    }
}


document.getElementById("toggleOneWayEdgeModeBtn").addEventListener("click", function () {
    if (!isAdmin) {
        alert("Chức năng này chỉ dành cho Admin.");
        return;
    }
    isOneWayEdgeMode = !isOneWayEdgeMode;

    // Tắt các chế độ vẽ khác nếu có
    if (isOneWayEdgeMode) {
        isBlockMode = false; 
        isDrawing = false;
        isPlacingObstacle = false;
        isTrafficMode = false;
        isFloodMode = false;

        alert("Chế độ ĐẶT ĐƯỜNG MỘT CHIỀU đã BẬT.\nClick gần một cạnh để chọn hướng.\nNhấn ESC để hủy chế độ này.");
        this.textContent = "Tắt chế độ Đường 1 chiều";
        this.classList.add("btn-danger");
        this.classList.remove("btn-info");
        map.getContainer().style.cursor = 'pointer'; // Đổi con trỏ chuột
    } else {
        alert("Chế độ ĐẶT ĐƯỜNG MỘT CHIỀU đã TẮT.");
        this.textContent = "Đường 1 chiều";
        this.classList.remove("btn-danger");
        this.classList.add("btn-info");
        map.getContainer().style.cursor = ''; // Trả lại con trỏ chuột mặc định
    }
});

// Hàm vẽ lại tất cả các mũi tên (gọi khi cần, ví dụ sau khi reset guest)
function redrawAllOneWayArrows() {
    // Xóa tất cả mũi tên cũ trên bản đồ
    for (const key in oneWayArrowDecorators) {
        if (oneWayArrowDecorators.hasOwnProperty(key) && oneWayArrowDecorators[key]) {
            map.removeLayer(oneWayArrowDecorators[key]);
        }
    }
    oneWayArrowDecorators = {}; // Reset object lưu trữ

    // Vẽ lại mũi tên dựa trên oneWayEdges hiện tại
    oneWayEdges.forEach(edge => {
        addOneWayArrow(edge[0], edge[1]);
    });
}

function isPhysicallyTwoWayEdge(nodeId1, nodeId2) {
    if (!adj_list_with_weights) {
        console.error("adj_list_with_weights chưa được tải để kiểm tra isPhysicallyTwoWayEdge");
        return false; // Hoặc một giá trị mặc định khác tùy logic của bạn
    }

    let uConnectsToV = false;
    let vConnectsToU = false;

    // Kiểm tra nodeId1 -> nodeId2
    const node1Info = adj_list_with_weights.find(item => item.node_id === nodeId1);
    if (node1Info && node1Info.neighbors) {
        if (node1Info.neighbors.some(neighbor => neighbor.node_neighbor === nodeId2)) {
            uConnectsToV = true;
        }
    }

    // Kiểm tra nodeId2 -> nodeId1
    const node2Info = adj_list_with_weights.find(item => item.node_id === nodeId2);
    if (node2Info && node2Info.neighbors) {
        if (node2Info.neighbors.some(neighbor => neighbor.node_neighbor === nodeId1)) {
            vConnectsToU = true;
        }
    }
    // console.log(`Kiểm tra hai chiều <span class="math-inline">\{nodeId1\}\-</span>{nodeId2}: <span class="math-inline">\{nodeId1\}\-\></span>{nodeId2} is ${uConnectsToV}, <span class="math-inline">\{nodeId2\}\-\></span>{nodeId1} is ${vConnectsToU}`);
    return uConnectsToV && vConnectsToU;
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
