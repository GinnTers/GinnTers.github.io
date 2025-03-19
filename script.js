function loadChart(scriptName) {
    let chartContainer = document.getElementById('chart-container');
    chartContainer.innerHTML = '<svg width="1000" height="600"></svg>'; // Reset SVG

    // Xóa script cũ nếu có
    let oldScript = document.getElementById("dynamicChartScript");
    if (oldScript) {
        document.body.removeChild(oldScript);
    }

    // Tạo script mới
    let script = document.createElement('script');
    script.src = scriptName;
    script.id = "dynamicChartScript";

    // Đợi file script load xong thì mới chạy
    script.onload = function () {
        console.log(`Biểu đồ từ ${scriptName} đã load thành công.`);
    };

    script.onerror = function () {
        console.error(`Lỗi khi tải biểu đồ từ ${scriptName}`);
    };

    document.body.appendChild(script);
}
