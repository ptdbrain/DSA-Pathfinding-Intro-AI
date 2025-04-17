import streamlit as st
from streamlit_folium import st_folium
import folium
from geopy.geocoders import Nominatim
import pandas as pd
# Cấu hình trang: rộng tối đa, không có sidebar
st.set_page_config(layout="wide")

# CSS để ẩn phần header và làm nền đen cho toàn bộ trang
st.markdown(
    """
    <style>
        /* Ẩn phần header của Streamlit */
        header {
            visibility: hidden;
        }

        /* Cấu hình nền đen cho toàn bộ trang */
        html, body, [data-testid="stApp"] {
            background-color: #D3D3D3;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }

        .block-container {
            padding: 0 !important;
            margin: 0 !important;
            height: 100%;
        }

        /* Cấu hình cho iframe để bản đồ chiếm hết không gian */
        iframe {
            height: 100vh !important;
            width: 100vw !important;
            border: none;
        }

        /* Ẩn thanh cuộn */
        .css-1r6x9br {
            display: none;
        }
    </style>
    """,
    unsafe_allow_html=True
)

# Lấy tọa độ Phường Trúc Bạch
geolocator = Nominatim(user_agent="myApp")
location = geolocator.geocode("Phường Trúc Bạch, Ba Đình, Hà Nội")
latitude, longitude = location.latitude, location.longitude

# Tạo bản đồ Folium với kiểu tile khác (ví dụ: CartoDB positron)
m = folium.Map(
    location=[latitude-0.0018   , longitude + 0.0039], 
    zoom_start=16.2, 
    control_scale=True,
    tiles='CartoDB positron'  # Chọn kiểu bản đồ CartoDB positron (có nền sáng, dễ nhìn)
)


nodes_df = pd.read_csv("nodes_latlon.csv")  # cột: node_id, lat, lon, added

for _, row in nodes_df.iterrows():
    lat, lon = row['lat'], row['lon']

    folium.CircleMarker(
        location=(lat, lon),
        radius=3,            # kích thước chấm
        color='blue',        # viền
        fill=True,
        fill_color='blue',   # màu chấm
        fill_opacity=0.9,
        popup=None,
        tooltip=None
    ).add_to(m)
    # Hiển thị bản đồ full màn hình
st_folium(m, width=None, height=1000, use_container_width=True)