function loadQ9Chart() { 
    d3.select("#chart").select("svg").remove();
    d3.select("#legend").html("");

    d3.csv("data_ggsheet.csv").then(function (data) {
        const ordersByGroup = d3.rollup(
            data,
            (v) => new Set(v.map(d => d["Mã đơn hàng"])).size,
            (d) => `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`
        );

        const probabilityByItem = d3.rollup(
            data,
            (v) => {
                const group = `[${v[0]["Mã nhóm hàng"]}] ${v[0]["Tên nhóm hàng"]}`;
                const uniqueOrders = new Set(v.map(d => d["Mã đơn hàng"])).size;
                return {
                    probability: uniqueOrders / ordersByGroup.get(group),
                    totalOrders: uniqueOrders
                };
            },
            (d) => `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
            (d) => `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`
        );

        let dataset = [];
        probabilityByItem.forEach((items, group) => {
            items.forEach((values, item) => {
                dataset.push({
                    group: group,
                    item: item,
                    probability: values.probability,
                    probabilityFormatted: (values.probability * 100).toFixed(1) + "%", 
                    totalOrders: values.totalOrders
                });
            });
        });

        const groupedData = d3.group(dataset, d => d.group);

        d3.select("#chart").append("h2")
            .text("Xác suất bán hàng của Mặt hàng theo Nhóm hàng")
            .style("text-align", "center")
            .style("color", "#007B7F")
            .style("font-size", "20px")
            .style("margin-bottom", "15px");

        // 🔧 Điều chỉnh kích thước của container
        const container = d3.select("#chart")
            .style("display", "grid")
            .style("grid-template-columns", "repeat(auto-fit, minmax(500px, 1fr))") // Mở rộng ô chứa
            .style("grid-gap", "30px") // Khoảng cách giữa các biểu đồ
            .style("width", "100%")
            .style("max-width", "1600px")
            .style("margin", "0 auto")
            .style("padding", "15px");

        const itemColor = d3.scaleOrdinal(d3.schemeTableau10)
                            .domain(dataset.map(d => d.item));

        groupedData.forEach((items, group) => {
            items.sort((a, b) => d3.descending(a.probability, b.probability));

            const chartDiv = container.append("div")
                                      .style("padding", "15px")
                                      .style("background", "#FAFAFA")
                                      .style("border-radius", "8px")
                                      .style("box-shadow", "0px 4px 8px rgba(0, 0, 0, 0.15)")
                                      .style("min-width", "500px") // Rộng hơn
                                      .style("max-width", "600px"); // Giới hạn tối đa

            chartDiv.append("h3")
                    .text(group)
                    .style("color", "#007B7F")
                    .style("text-align", "center")
                    .style("margin", "10px 0");

            const chartWidth = Math.min(chartDiv.node().clientWidth, 550);
            const margin = { top: 20, right: 30, bottom: 50, left: 140 }; // Mở rộng left để tránh cắt nhãn
            const width = chartWidth - margin.left - margin.right;
            const height = Math.min(350, Math.max(180, items.length * 35)); // Điều chỉnh chiều cao

            const svg = chartDiv.append("svg")
                    .attr("width", chartWidth)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);

            const x = d3.scaleLinear()
                .domain([0, d3.max(items, d => d.probability)])
                .range([0, width - 15]); 

            const y = d3.scaleBand()
                        .domain(items.map(d => d.item))
                        .range([0, height])
                        .padding(0.3);

            svg.selectAll(".bar")
               .data(items)
               .enter()
               .append("rect")
               .attr("class", "bar")
               .attr("y", d => y(d.item))
               .attr("width", d => x(d.probability))
               .attr("height", y.bandwidth())
               .attr("fill", d => itemColor(d.item));

            svg.selectAll(".label")
               .data(items)
               .enter()
               .append("text")
               .attr("class", "label")
               .attr("x", d => x(d.probability) + 8)
               .attr("y", d => y(d.item) + y.bandwidth() / 2)
               .attr("dy", "0.35em")
               .style("font-size", "13px")
               .style("fill", "#333")
               .style("text-anchor", "start")
               .text(d => d.probabilityFormatted);

            svg.append("g")
               .call(d3.axisLeft(y).tickSize(0).tickPadding(5))
               .selectAll("text")
               .style("font-size", "13px");

            svg.append("g")
                .attr("transform", `translate(0, ${height})`)
                .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".0%")));
        });
    }).catch(error => console.error("Lỗi khi đọc CSV:", error));
}
