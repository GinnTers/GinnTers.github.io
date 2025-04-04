function loadQ10Chart() { 
    d3.select("#chart").select("svg").remove();
    d3.select("#legend").html("");

    // Căn giữa tiêu đề
    d3.select("#chart")
      .insert("div", ":first-child")
      .attr("id", "title-container")
      .style("text-align", "center")
      .style("width", "100%")
      .style("background-color", "#2a5d87")
      .style("color", "#ffffff")
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .style("padding", "15px 10px")
      .style("border-radius", "5px")
      .style("margin-bottom", "15px")
      .text("Xác suất bán hàng của Mặt hàng theo Nhóm hàng trong từng Tháng");

    // Bố cục grid hiển thị 3 biểu đồ trên, 2 biểu đồ dưới
    const chartContainer = d3.select("#chart")
                              .append("div")
                              .attr("id", "chart-container")
                              .style("display", "grid")
                              .style("grid-template-columns", "repeat(3, 1fr)")
                              .style("gap", "15px")
                              .style("justify-content", "center")
                              .style("margin", "0 auto")
                              .style("max-width", "1200px");

    const tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("background", "#fff") 
        .style("color", "#333") 
        .style("padding", "8px")
        .style("border-radius", "5px")
        .style("font-size", "12px")
        .style("box-shadow", "0px 0px 5px rgba(0, 0, 0, 0.2)") 
        .style("visibility", "hidden")
        .style("pointer-events", "none")
        .style("border", "1px solid #ccc")
        .style("white-space", "nowrap");

    d3.csv("data_ggsheet.csv").then(function (data) {
        data.forEach(d => {
            d.Tháng = new Date(d["Thời gian tạo đơn"]).getMonth() + 1;
        });

        const groupedByProductGroup = d3.group(data, d => d["Mã nhóm hàng"]);
        const probabilitiesByGroup = Array.from(groupedByProductGroup, ([groupCode, groupData]) => {
            const groupName = groupData[0]["Tên nhóm hàng"];
            const items = Array.from(new Set(groupData.map(d => d["Mã mặt hàng"]))).
                map(itemCode => {
                    const itemData = groupData.find(d => d["Mã mặt hàng"] === itemCode);
                    return { itemCode, itemName: itemData["Tên mặt hàng"] };
                });

            const monthlyProbabilities = Array.from(d3.group(groupData, d => d.Tháng), ([month, monthData]) => {
                const totalMonthOrders = new Set(monthData.map(d => d["Mã đơn hàng"])).size;
                const itemProbabilities = items.map(item => {
                    const itemMonthData = monthData.filter(d => d["Mã mặt hàng"] === item.itemCode);
                    const itemOrders = new Set(itemMonthData.map(d => d["Mã đơn hàng"])).size;
                    return {
                        month,
                        itemCode: item.itemCode,
                        itemName: item.itemName,
                        probability: itemOrders / totalMonthOrders,
                        totalOrders: itemOrders
                    };
                });
                return itemProbabilities;
            }).flat();

            return {
                groupCode,
                groupName,
                items,
                monthlyProbabilities
            };
        });

        const allItems = Array.from(new Set(data.map(d => d["Mã mặt hàng"])));
        const colorScale = d3.scaleOrdinal().domain(allItems).range(d3.schemeCategory10);

        const margin = { top: 30, right: 40, bottom: 50, left: 50 },
              width  = 380,
              height = 250;

        probabilitiesByGroup.forEach((group, index) => {
            if (index === 3) {
                chartContainer.append("div")
                              .style("grid-column", "span 3")
                              .style("display", "flex")
                              .style("justify-content", "center");
            }

            const chartDiv = chartContainer.append("div")
                                           .style("border", "1px solid #ccc")
                                           .style("padding", "10px")
                                           .style("background", "#f9f9f9")
                                           .style("border-radius", "5px")
                                           .style("text-align", "center");

            chartDiv.append("h3")
                    .text(`[${group.groupCode}] ${group.groupName}`)
                    .style("color", "#2a5d87")
                    .style("text-align", "center")
                    .style("margin-bottom", "10px");

            const svg = chartDiv.append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);

            const x = d3.scaleLinear().domain([1, 12]).range([0, width]);
            const y = d3.scaleLinear().domain([0, d3.max(group.monthlyProbabilities, d => d.probability)]).nice().range([height, 0]);

            group.items.forEach(item => {
                const itemData = group.monthlyProbabilities.filter(d => d.itemCode === item.itemCode);

                const line = d3.line()
                    .x(d => x(d.month))
                    .y(d => y(d.probability))
                    .curve(d3.curveMonotoneX);

                svg.append("path")
                   .datum(itemData)
                   .attr("fill", "none")
                   .attr("stroke", colorScale(item.itemCode))
                   .attr("stroke-width", 2)
                   .attr("d", line);
            });

            svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d => `T${d}`));
            svg.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));
        });
    });
}
