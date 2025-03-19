function loadQ5Chart() {
    d3.select("#chart").select("svg").remove();

    const margin = {top: 50, right: 200, bottom: 100, left: 250}; // Tăng bottom để tránh trục X bị chồng
    const width = 1355 - margin.left - margin.right;
    const height = 650 - margin.top - margin.bottom;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    d3.csv("data_ggsheet.csv").then(function (data) {
        console.log("Dữ liệu đã load:", data);

        data.forEach(d => {
            const date = new Date(d["Thời gian tạo đơn"]);
            d.DayOfMonth = date.getDate();
            d.ThanhTien = +d["Thành tiền"];
            d.DateOnly = date.toISOString().split('T')[0];
        });

        const revenueByDay = d3.rollup(data,
            v => d3.sum(v, d => d.ThanhTien),
            d => d.DayOfMonth
        );

        const uniqueDaysByDay = d3.rollup(data,
            v => new Set(v.map(d => d.DateOnly)).size,
            d => d.DayOfMonth
        );

        const dataset = Array.from(revenueByDay, ([day, revenue]) => ({
            day,
            avgRevenue: revenue / (uniqueDaysByDay.get(day) || 1)
        })).sort((a, b) => a.day - b.day);

        const colorScale = d3.scaleOrdinal()
            .domain(dataset.map(d => d.day))
            .range(["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC949"]);

        const x = d3.scaleBand()
            .domain(dataset.map(d => d.day))
            .range([0, width])
            .padding(0.3);

        // **Cập nhật trục Y với các giá trị cách nhau 5M**
        const maxRevenue = d3.max(dataset, d => d.avgRevenue);
        const y = d3.scaleLinear()
            .domain([0, Math.ceil(maxRevenue / 5e6) * 5e6]) // Làm tròn lên bội số của 5M
            .nice()
            .range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .tickSize(5)
                .tickPadding(10)
                .tickFormat(d => `Ngày ${String(d).padStart(2, '0')}`)
            )
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .style("font-size", "12px");

        svg.append("g")
            .call(d3.axisLeft(y).tickValues(d3.range(0, Math.ceil(maxRevenue / 5e6) * 5e6 + 1, 5e6))
                .tickFormat(d => `${(d / 1e6)}M`)) // Hiển thị đuôi M
            .selectAll("text")
            .style("font-size", "12px");

        svg.selectAll(".bar")
            .data(dataset)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.day))
            .attr("y", d => y(d.avgRevenue))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.avgRevenue))
            .attr("fill", d => colorScale(d.day));

        // **Cập nhật vị trí nhãn để nằm trong từng cột**
        svg.selectAll(".bar-label")
            .data(dataset)
            .enter().append("text")
            .attr("class", "bar-label")
            .attr("x", d => x(d.day) + x.bandwidth() / 2 - 10) 
            .attr("y", d => y(d.avgRevenue) + x.bandwidth() / 2 + 2 ) // Điều chỉnh để nhãn nằm trong cột
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "white")
            .attr("font-weight", "bold")
            .attr("transform", d => `rotate(-90, ${x(d.day) + x.bandwidth() / 2}, ${y(d.avgRevenue) + x.bandwidth() / 2})`) // Xoay chữ 90 độ
            .text(d => `${(d.avgRevenue / 1e6).toFixed(1)}tr`);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("font-weight", "bold")
            .attr("fill", "#00A896")
            .text("Doanh số bán hàng trung bình theo Ngày trong tháng");
    });
}
