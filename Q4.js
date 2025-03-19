function loadQ4Chart() {

// Kiểm tra và xóa biểu đồ cũ trước khi vẽ mới
d3.select("#chart").select("svg").remove();

const margin = {top: 50, right: 200, bottom: 100, left: 100};
const width = 1355 - margin.left - margin.right;
const height = 650 - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const daysOfWeek = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];

d3.csv("data_ggsheet.csv", function(d) {
    return {
        ngay: new Date(d["Thời gian tạo đơn"]).getDay(),
        ngayGoc: d["Thời gian tạo đơn"].split(" ")[0],
        doanhThu: +d["Thành tiền"]
    };
}).then(function(data) {
    let doanhThuTheoNgay = d3.rollup(
        data,
        v => ({
            tongDoanhThu: d3.sum(v, d => d.doanhThu),
            soNgayXuatHien: new Set(v.map(d => d.ngayGoc)).size
        }),
        d => d.ngay
    );

    let doanhThuArray = Array.from(doanhThuTheoNgay, ([key, value]) => ({
        ngay: daysOfWeek[key - 1 < 0 ? 6 : key - 1],
        doanhThuTB: value.tongDoanhThu / value.soNgayXuatHien
    })).sort((a, b) => daysOfWeek.indexOf(a.ngay) - daysOfWeek.indexOf(b.ngay));

    const maxDoanhThu = d3.max(doanhThuArray, d => d.doanhThuTB);
    
    const colorScale = d3.scaleOrdinal()
        .domain(doanhThuArray.map(d => d.ngay))
        .range(d3.schemeCategory10);

    const xScale = d3.scaleBand()
        .domain(doanhThuArray.map(d => d.ngay))
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, Math.ceil(maxDoanhThu / 5e6) * 5e6])
        .nice()
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(30)")
        .attr("text-anchor", "start")
        .style("font-size", "12px");

    svg.append("g")
        .call(d3.axisLeft(yScale)
        .tickValues(d3.range(0, Math.ceil(maxDoanhThu / 5e6) * 5e6 + 1, 5e6))
        .tickFormat(d => `${d / 1e6}M`))
        .selectAll("text")
        .style("font-size", "12px");

    svg.selectAll(".bar")
        .data(doanhThuArray)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.ngay))
        .attr("y", d => yScale(d.doanhThuTB))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.doanhThuTB))
        .attr("fill", d => colorScale(d.ngay));

    svg.selectAll(".bar-label")
        .data(doanhThuArray)
        .enter()
        .append("text")
        .attr("x", d => xScale(d.ngay) + xScale.bandwidth() / 2) // Căn giữa cột
        .attr("y", d => Math.max(yScale(d.doanhThuTB) - 10, 10)) // Đặt vị trí đúng
        .attr("class", "bar-label")
        .attr("text-anchor", "middle")
        .text(d => `${Math.round(d.doanhThuTB).toLocaleString("vi-VN")} VND`) // Hiển thị số có định dạng
        .style("fill", "black")
        .style("font-size", "12px")
        .style("font-weight", "bold");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .attr("fill", "#00A896")
        .text("Doanh số bán hàng trung bình theo Ngày trong tuần");
});
}