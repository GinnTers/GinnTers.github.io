function loadQ3Chart() {

// Kiểm tra và xóa biểu đồ cũ trước khi vẽ mới
d3.select("#chart").select("svg").remove();

const margin = { top: 50, right: 200, bottom: 100, left: 100 };
const width = 1355 - margin.left - margin.right;
const height = 650 - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Hàm chuyển đổi số tháng thành dạng "Tháng XX"
const formatMonth = month => `Tháng ${month.toString().padStart(2, '0')}`;

d3.csv("data_ggsheet.csv", function(d) {
    return {
        thang: new Date(d["Thời gian tạo đơn"]).getMonth() + 1, // Lấy tháng (1-12)
        doanhThu: +d["Thành tiền"]
    };
}).then(function(data) {
    let doanhThuTheoThang = d3.rollup(
        data,
        v => d3.sum(v, d => d.doanhThu),
        d => d.thang
    );

    let doanhThuArray = Array.from(doanhThuTheoThang, ([key, value]) => ({
        thang: formatMonth(key), // Định dạng thành "Tháng XX"
        doanhThu: value
    })).sort((a, b) => a.thang.localeCompare(b.thang, 'vi', { numeric: true }));

    const colorScale = d3.scaleOrdinal()
        .domain(doanhThuArray.map(d => d.thang))
        .range(d3.schemeCategory10);

    const xScale = d3.scaleBand()
        .domain(doanhThuArray.map(d => d.thang))
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(doanhThuArray, d => d.doanhThu)])
        .range([height, 0]);

    // Vẽ trục X (Tháng)
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(30)")
        .attr("text-anchor", "start")
        .style("font-size", "12px");

    // Vẽ trục Y (Doanh thu) với định dạng "400M"
    svg.append("g")
        .call(d3.axisLeft(yScale)
        .tickValues(d3.range(0, d3.max(doanhThuArray, d => d.doanhThu) + 100000000, 200000000))
        .tickFormat(d => (d / 1e6) + "M"))
        .selectAll("text")
        .style("font-size", "12px");

    // Vẽ các cột
    svg.selectAll(".bar")
        .data(doanhThuArray)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.thang))
        .attr("y", d => yScale(d.doanhThu))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.doanhThu))
        .attr("fill", d => colorScale(d.thang));

    // Nhãn bên trong cột (màu trắng, dạng "400 triệu VND")
    svg.selectAll(".bar-label")
        .data(doanhThuArray)
        .enter()
        .append("text")
        .attr("x", d => xScale(d.thang) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.doanhThu) + 15) // Đặt nhãn bên trong cột, trên cùng
        .attr("class", "bar-label")
        .attr("text-anchor", "middle") // Căn giữa nhãn với cột
        .text(d => (d.doanhThu / 1e6).toFixed(0) + " triệu VND")
        .style("fill", "white") // Đổi màu chữ thành trắng
        .style("font-size", "10px")
        .style("font-weight", "bold");

    // Tiêu đề biểu đồ
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .attr("fill", "#00A896")
        .text("Doanh số bán hàng theo Tháng");
});
}