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

let startPointMarker = null; // Để lưu marker/popup của điểm bắt đầu
let endPointMarker = null;   // Để lưu marker/popup của điểm kết thúc
// Xử lý tắc đường
let trafficLevel; // Biến toàn cục để xác định mức độ tắc đường
let trafficMarkers = []; // Biến toàn cục để lưu các marker tắc đường
let trafficPolyline = null; // Biến toàn cục để lưu polyline tắc đường
let isTrafficMode = false; // Biến toàn cục để xác định chế độ tắc đường
let trafficLine = [];
let trafficEdges = []; // Biến toàn cục để lưu các cạnh tắc đường
// Khởi tạo bản đồ
const map = L.map("map").setView([21.0453, 105.8426], 16);
L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
  maxZoom: 19,
}).addTo(map);

loadTrucBachBoundary();

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
      map.closePopup(); // Đóng các popup khác nếu có
      const mapCenter = map.getCenter(); // Lấy vị trí giữa bản đồ để hiển thị popup
      let taskDescription = "thực hiện một thao tác vẽ"; // Mô tả chung
      // Cụ thể hóa mô tả tác vụ nếu có thể
      if (isBlockMode) taskDescription = "vẽ đường cấm";
      else if (isTrafficMode) taskDescription = "đánh dấu tắc đường";
      else if (isFloodMode) taskDescription = "đánh dấu ngập lụt";
      // isPlacingObstacle không dùng isDrawing, nên không cần kiểm tra ở đây nếu chỉ dựa vào isDrawing
      L.popup({
              className: 'warning-leaflet-popup synced-leaflet-popup compact-point-popup', // Sử dụng các class đã style
              autoClose: true,
              closeOnClick: true
          })
          .setLatLng(mapCenter)
          .setContent(`<b>Cảnh báo:</b> Bạn đang trong quá trình ${taskDescription}.<br>Vui lòng hoàn thành (nhấn ESC) hoặc hủy bỏ trước khi chuyển sang chế độ Guest.`)
          .openOn(map);
      this.checked = true;
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
    isOneWayEdgeMode = false;
    document.getElementById("toggleOneWayEdgeModeBtn").textContent = "Đường 1 chiều";
    selectedPoints = [];
    startPoint = null;
    map.closePopup();
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

/*---------------------------------------------------------------------------------------------------------
----------------------------------Xử lý sự kiện trên bàn đồ------------------------------------------------*/
// Xử lý click trên bản đồ
map.on("click", function (e) {
  if (isAdmin && !isBlockMode && !isPlacingObstacle && !isTrafficMode) {
    alert(
      "Chế độ Admin đang hoạt động. \n Bạn đéo thể tìm đường (theo ý giang lê)"
    );
    return; // Nếu là Admin thì không cho tìm đường
  }
  // Lấy tọa độ điẻm chấm trên bản đổ
  const clickedLat = e.latlng.lat;
  const clickedLon = e.latlng.lng;

  // Chế độ cấm đường
  if (isBlockMode) {
    isDrawing = true;
    startPoint = [clickedLat, clickedLon];
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

    // Vẽ vật cản
    const obstacles = drawObstacle(clickedPoint, radius);

    // Thêm vào danh sách quản lý
    obstacleMarkers.push(obstacles);

    // Xử lý các cạnh bị chặn
    detectBlockedEdgesByObstacle(clickedPoint, radius);
    return;
  }

  // Chế độ tắc đường
  if (isTrafficMode) {
    isDrawing = true;
    startPoint = [clickedLat, clickedLon];
    // Thêm điểm đầu và vẽ
    points.push([clickedLat, clickedLon]);
    L.circleMarker([clickedLat, clickedLon], {
      radius: 5,
      color: "#f44336",
      fillColor: "#f44336",
      fillOpacity: 1,
    }).addTo(map); // Vẽ chấm đầu của cấm đường

    if (trafficPolyline) {
      map.removeLayer(trafficPolyline);
    }

    trafficPolyline = L.polyline(points, {
      color: "#f44336",
      weight: 3,
      dashArray: "10,10",
      opacity: 0.8,
    }).addTo(map);
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

  if (selectedPoints.length === 0) { 
      selectedPoints.push(closestNode.node_id);

      if (startPointMarker) {
          map.removeLayer(startPointMarker);
          startPointMarker = null;
      }

      startPointMarker = L.circleMarker([closestNode.lat, closestNode.lon], {
          radius: 4, // Giữ nguyên radius: 4
          color: "green", // Giữ nguyên màu "green"
          fillColor: "green",
          fillOpacity: 0.7,
          pane: 'markerPane'
      }).addTo(map)
        // Thêm class cho popup để style
        .bindPopup(`<b>Điểm bắt đầu</b>`, { 
          className: 'point-popup start-point-popup compact-point-popup', // Thêm class compact
          autoClose: false, // QUAN TRỌNG: Giữ popup này mở
          closeOnClick: false
        })
        .openPopup();

  } else if (selectedPoints.length === 1) { // Chọn điểm kết thúc
      if (selectedPoints[0] === closestNode.node_id) { // Kiểm tra trùng điểm
          L.popup({ className: 'error-leaflet-popup synced-leaflet-popup' }) // Thêm synced-leaflet-popup để dùng chung style nền
              .setLatLng([closestNode.lat, closestNode.lon])
              .setContent("<b>Lỗi:</b> Điểm cuối không được trùng với điểm đầu. Vui lòng chọn một điểm khác.")
              .openOn(map);
          return;
      }

      selectedPoints.push(closestNode.node_id);

      if (endPointMarker) {
          map.removeLayer(endPointMarker);
          endPointMarker = null;
      }

      endPointMarker = L.circleMarker([closestNode.lat, closestNode.lon], {
          radius: 4, // Giữ nguyên radius: 4
          color: "green", // Giữ nguyên màu "green"
          fillColor: "green",
          fillOpacity: 0.7,
          pane: 'markerPane'
      }).addTo(map)
        // Thêm class cho popup để style
        .bindPopup(`<b>Điểm kết thúc</b>`, { 
            className: 'point-popup end-point-popup compact-point-popup', // Thêm class compact
            autoClose: false, // QUAN TRỌNG: Giữ popup này mở
            closeOnClick: false
        })
        .openPopup();

      findAndDrawPath(); // Tìm đường khi đã có 2 điểm

  } else { // Đã có 2 điểm
      // Sử dụng L.popup cho thông báo này
      L.popup({ className: 'info-leaflet-popup synced-leaflet-popup' }) // Thêm synced-leaflet-popup
          .setLatLng([closestNode.lat, closestNode.lon]) // Vị trí của điểm click cuối cùng
          .setContent("Đã có 2 điểm được chọn. Nhấn 'Làm mới' (Reset) để tìm đường mới.")
          .openOn(map);
      return;
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
});

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
  map.closePopup(); // Đóng các popup khác nếu có
  // Lấy vị trí trung tâm của bản đồ để hiển thị popup
  const mapCenter = map.getCenter();
  L.popup({
          className: 'info-leaflet-popup synced-leaflet-popup compact-point-popup', // Sử dụng các class đã style
          autoClose: true,
          closeOnClick: true
      })
      .setLatLng(mapCenter) // Hiển thị popup ở giữa màn hình bản đồ
      .setContent("<b>Hướng dẫn:</b> Click vào bản đồ để bắt đầu vẽ đường tắc.<br>Nhấn phím <b>ESC</b> để hoàn thành hoặc hủy vẽ.")
      .openOn(map);

  setTimeout(() => {
      map.closePopup(); // Đóng popup cụ thể này hoặc tất cả
  }, 5000); // Đóng sau 5 giây
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
  map.closePopup(); // Đóng các popup khác nếu có
  // Lấy vị trí trung tâm của bản đồ để hiển thị popup
  const mapCenter = map.getCenter();
  L.popup({
          className: 'info-leaflet-popup synced-leaflet-popup compact-point-popup', // Sử dụng các class đã style
          autoClose: true,
          closeOnClick: true
      })
      .setLatLng(mapCenter) // Hiển thị popup ở giữa màn hình bản đồ
      .setContent("<b>Hướng dẫn:</b> Click vào bản đồ để bắt đầu vẽ cấm đường.<br>Nhấn phím <b>ESC</b> để hoàn thành hoặc hủy vẽ.")
      .openOn(map);

  setTimeout(() => {
      map.closePopup(); // Đóng popup cụ thể này hoặc tất cả
  }, 5000); // Đóng sau 5 giây
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
    ? "Hủy chọn vùng cấm"
    : "Đặt vùng cấm";
  placeObstacleBtn.classList.toggle("btn-danger", isPlacingObstacle);
  placeObstacleBtn.classList.toggle("btn-warning", !isPlacingObstacle);

  if (isPlacingObstacle) {
    map.closePopup(); // Đóng các popup khác nếu có
    // Lấy vị trí trung tâm của bản đồ để hiển thị popup
    const mapCenter = map.getCenter();
    L.popup({
            className: 'info-leaflet-popup synced-leaflet-popup compact-point-popup', // Sử dụng các class đã style
            autoClose: true,
            closeOnClick: true
        })
        .setLatLng(mapCenter) // Hiển thị popup ở giữa màn hình bản đồ
        .setContent("<b>Hướng dẫn:</b> Click vào bản đồ để đặt vùng cấm.")
        .openOn(map);

    setTimeout(() => {
        map.closePopup(); // Đóng popup cụ thể này hoặc tất cả
    }, 5000); // Đóng sau 5 giây
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
  if (startPointMarker) {
      map.removeLayer(startPointMarker);
      startPointMarker = null;
  }
  if (endPointMarker) {
      map.removeLayer(endPointMarker);
      endPointMarker = null;
  }
  // Đóng tất cả popup đang mở 
  map.closePopup();
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
  placeObstacleBtn.textContent = "Đặt vùng cấm";
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
  placeObstacleBtn.textContent = "Đặt vùng cấm";
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
            radius: 4, // Kích thước marker
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
                    repeat: '20px',  // Lặp lại mũi tên mỗi 80px
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
        const { u, v } = selectedEdge; // u và v là các object node từ findClosestEdgeToPoint

        // Đảm bảo u và v có node_id hợp lệ
        if (!u || typeof u.node_id === 'undefined' || !v || typeof v.node_id === 'undefined') {
            console.error("Node u hoặc v không hợp lệ từ selectedEdge:", selectedEdge);
            return;
        }

        if (!isPhysicallyTwoWayEdge(u.node_id, v.node_id)) {
            map.closePopup(); // Đóng các popup khác trước khi hiển thị thông báo này

            const popupLocation = clickLatlng; 

            L.popup({
                    className: 'info-leaflet-popup synced-leaflet-popup compact-point-popup', // Sử dụng các class đã style
                    autoClose: true, // Cho phép tự đóng khi mở popup khác hoặc click map
                    closeOnClick: true // Đóng khi click map
                })
                .setLatLng(popupLocation)
                .setContent("<b>Thông báo:</b> Đây là đường 1 chiều mặc định. Vui lòng chọn đường 2 chiều khác để chuyển thành đường 1 chiều!")
                .openOn(map);
            return; // Dừng xử lý tiếp
        }
        const isUtoV_userSet = oneWayEdges.some(e => e[0] === u.node_id && e[1] === v.node_id);
        const isVtoU_userSet = oneWayEdges.some(e => e[0] === v.node_id && e[1] === u.node_id);

        let currentDirectionText = "Hiện tại: Đường hai chiều.";
        let nextSourceNodeId, nextDestNodeId;
        let buttonActionText;

        // Quy ước "Hướng 1" là từ u sang v (theo thứ tự selectedEdge trả về)
        // và "Hướng 2" là từ v sang u.
        const Hướng1_Source = u.node_id;
        const Hướng1_Dest = v.node_id;
        const Hướng2_Source = v.node_id;
        const Hướng2_Dest = u.node_id;

        if (isUtoV_userSet) {
            // Hiện tại là Hướng 1 (U -> V), nút sẽ đổi sang Hướng 2 (V -> U)
            currentDirectionText = `Hiện tại: Một chiều`;
            nextSourceNodeId = Hướng2_Source;
            nextDestNodeId = Hướng2_Dest;
            buttonActionText = `Đổi chiều`;
        } else if (isVtoU_userSet) {
            // Hiện tại là Hướng 2 (V -> U), nút sẽ đổi sang Hướng 1 (U -> V)
            currentDirectionText = `Hiện tại: Một chiều`;
            nextSourceNodeId = Hướng1_Source;
            nextDestNodeId = Hướng1_Dest;
            buttonActionText = `Đổi chiều`;
        } else {
            // Chưa đặt, nút sẽ đặt chiều mặc định là Hướng 1 (U -> V)
            currentDirectionText = "Hiện tại: Đường hai chiều."; // Hoặc "Sẵn sàng đặt một chiều."
            nextSourceNodeId = Hướng1_Source;
            nextDestNodeId = Hướng1_Dest;
            buttonActionText = `Đặt một chiều`;
        }

        let popupContent = `
            <div class="custom-leaflet-popup">
                <h5>Điều chỉnh hướng cho đoạn đường</h5>
                <small class="popup-status">${currentDirectionText}</small>
                <hr class="popup-hr">
                <button class="btn btn-primary btn-popup" onclick="setOneWayDirection(${nextSourceNodeId}, ${nextDestNodeId}, ${u.node_id}, ${v.node_id})">
                    ${buttonActionText}
                </button>
        `;

        if (isUtoV_userSet || isVtoU_userSet) {
            popupContent += `
                <button class="btn btn-danger btn-popup" style="margin-top: 8px;" onclick="clearOneWaySetting(${u.node_id}, ${v.node_id})">
                    Xóa một chiều
                </button>`;
        }
        popupContent += `</div>`;

        const uLat = parseFloat(u.lat);
        const uLon = parseFloat(u.lon);
        const vLat = parseFloat(v.lat);
        const vLon = parseFloat(v.lon);

        if (isNaN(uLat) || isNaN(uLon) || isNaN(vLat) || isNaN(vLon)) {
            console.error("Tọa độ của node u hoặc v không hợp lệ để tính điểm giữa cho popup.");
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

    isOneWayEdgeMode = !isOneWayEdgeMode;

    // Tắt các chế độ vẽ khác nếu có
    if (isOneWayEdgeMode) {
        isBlockMode = false; 
        isDrawing = false;
        isPlacingObstacle = false;
        isTrafficMode = false;
        isFloodMode = false;

        map.closePopup(); // Đóng các popup khác nếu có
        // Lấy vị trí trung tâm của bản đồ để hiển thị popup
        const mapCenter = map.getCenter();
        L.popup({
                className: 'info-leaflet-popup synced-leaflet-popup compact-point-popup', // Sử dụng các class đã style
                autoClose: true,
                closeOnClick: true
            })
            .setLatLng(mapCenter) // Hiển thị popup ở giữa màn hình bản đồ
            .setContent("<b>Hướng dẫn:</b> Click vào bản đồ để chọn đường.<br>Nhấn phím <b>ESC</b> để hoàn thành hoặc hủy chế độ.")
            .openOn(map);
          
        setTimeout(() => {
            map.closePopup(); // Đóng popup cụ thể này hoặc tất cả
        }, 5000); // Đóng sau 5 giây        this.textContent = "Tắt chế độ Đường 1 chiều";
        this.classList.add("btn-danger");
        this.classList.remove("btn-info");
        map.getContainer().style.cursor = 'pointer'; // Đổi con trỏ chuột
    } else {
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

document.addEventListener('DOMContentLoaded', function () {
    const collapsibleTriggers = document.querySelectorAll('.collapsible-trigger');

    collapsibleTriggers.forEach(trigger => {
        trigger.addEventListener('click', function () {
            const content = this.nextElementSibling;
            const isActive = this.classList.contains('active'); 

            closeOtherCollapsibles(this); 

            if (!isActive) {
                this.classList.add('active');
                content.style.display = "block";
            }
        });
    });

    function closeOtherCollapsibles(currentTrigger) {
        collapsibleTriggers.forEach(trigger => {
            if (trigger !== currentTrigger || trigger.classList.contains('active')) {
                const content = trigger.nextElementSibling;
                  if (content && content.style.display !== "none") { // Chỉ đóng nếu đang mở
                    trigger.classList.remove('active');
                    content.style.display = "none";
                }
            }
        });
    }

});

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