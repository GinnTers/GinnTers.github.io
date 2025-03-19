function loadQ1Chart() {


// Kiểm tra và xóa biểu đồ cũ trước khi vẽ mới
d3.select("#chart").select("svg").remove();

// Kích thước
const margin = {top: 50, right: 200, bottom: 50, left: 250}; 
const width = 1355 - margin.left - margin.right;
const height = 650 - margin.top - margin.bottom;

// Tạo SVG mới trong #chart
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Đọc dữ liệu CSV
d3.csv("data_ggsheet.csv", function(d) {
    return {
        "Mã mặt hàng": d["Mã mặt hàng"],
        "Tên mặt hàng": d["Tên mặt hàng"],
        "Nhóm hàng": d["Tên nhóm hàng"],
        "Mã nhóm hàng": d["Mã nhóm hàng"],
        "Thành tiền": +d["Thành tiền"]
    };
}).then(function(data) {
    let doanhThuTheoMatHang = d3.rollup(
        data,
        v => d3.sum(v, d => d["Thành tiền"]),
        d => `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`,
        d => d["Nhóm hàng"]
    );

    let maNhomHangMap = new Map();
    data.forEach(d => {
        if (!maNhomHangMap.has(d["Nhóm hàng"])) {
            maNhomHangMap.set(d["Nhóm hàng"], d["Mã nhóm hàng"].split("-")[0]);
        }
    });

    let doanhThuArray = Array.from(doanhThuTheoMatHang, ([key, value]) => ({
        matHang: key,
        nhomHang: Array.from(value.keys())[0],
        doanhThu: Array.from(value.values())[0]
    })).sort((a, b) => b.doanhThu - a.doanhThu);

    const colorScale = d3.scaleOrdinal()
        .domain([...new Set(doanhThuArray.map(d => d.nhomHang))])
        .range(["#00A896", "#E63946", "#457B9D", "#F4A261", "#FFCA3A"]);

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(doanhThuArray, d => d.doanhThu)])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(doanhThuArray.map(d => d.matHang))
        .range([0, height])
        .padding(0.2);

    // Vẽ trục X
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.max(doanhThuArray, d => d.doanhThu) / 1e8)
        .tickFormat(d => d3.format(".1s")(d)))
        .selectAll("text").style("font-size", "12px");

    // Vẽ trục Y
    svg.append("g")
        .call(d3.axisLeft(yScale))
        .selectAll("text").style("font-size", "12px");

    // Vẽ cột
    svg.selectAll(".bar")
        .data(doanhThuArray)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => yScale(d.matHang))
        .attr("width", d => xScale(d.doanhThu))
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScale(d.nhomHang));

    // Nhãn trên cột
    svg.selectAll(".bar-label")
        .data(doanhThuArray)
        .enter().append("text")
        .attr("class", "bar-label")
        .attr("x", d => xScale(d.doanhThu) - 10)
        .attr("y", d => yScale(d.matHang) + yScale.bandwidth() / 2 + 5)
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr("text-anchor", "end")
        .text(d => (d.doanhThu / 1e6).toFixed(0) + " triệu VND");

    // **CẬP NHẬT tiêu đề biểu đồ theo quý**
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .attr("fill", "#00A896")
        .text("Doanh số bán hàng theo Mặt hàng");

    // Chú thích màu sắc (Legend)
    const legend = d3.select("#legend").html(""); // Xóa chú thích cũ trước khi vẽ mới

    const legendItems = legend.selectAll(".legend-item")
        .data(colorScale.domain())
        .enter().append("div")
        .attr("class", "legend-item")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin-bottom", "5px");

    legendItems.append("div")
        .style("width", "15px")
        .style("height", "15px")
        .style("background-color", d => colorScale(d))
        .style("margin-right", "10px");

    legendItems.append("span")
        .style("font-size", "12px")
        .text(d => `[${maNhomHangMap.get(d)}] ${d}`);
});
}