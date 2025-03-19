function loadQ6Chart() {
    d3.select("#chart").select("svg").remove();

    const margin = {top: 50, right: 200, bottom: 100, left: 100};
    const width = 1355 - margin.left - margin.right;
    const height = 650 - margin.top - margin.bottom;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    d3.csv("data_ggsheet.csv").then(function (data) {
        if (!data[0]["Thành tiền"] || !data[0]["Thời gian tạo đơn"]) {
            console.error("⚠️ Tên cột không đúng! Kiểm tra file CSV.");
            return;
        }

        const revenueByHour = new Map();
        const uniqueHours = new Map();
        const hourRanges = Array.from({ length: 16 }, (_, i) => `${8 + i}:00-${8 + i}:59`);

        data.forEach(d => {
            let date = new Date(d["Thời gian tạo đơn"]);
            let hour = date.getHours();
            if (hour < 8 || hour > 23) return;

            let hourRange = `${hour}:00-${hour}:59`;
            let revenue = +d["Thành tiền"];

            revenueByHour.set(hourRange, (revenueByHour.get(hourRange) || 0) + revenue);
            uniqueHours.set(hourRange, (uniqueHours.get(hourRange) || new Set()).add(date.toDateString()));
        });

        const dataset = hourRanges.map(hourRange => {
            let avgRevenue = revenueByHour.get(hourRange) && uniqueHours.get(hourRange)
                ? (revenueByHour.get(hourRange) / uniqueHours.get(hourRange).size)
                : 0;
            return { hourRange, avgRevenue: Math.round(avgRevenue) };
        });

        const x = d3.scaleBand()
            .domain(dataset.map(d => d.hourRange))
            .range([0, width])
            .padding(0.3);

        const maxRevenue = d3.max(dataset, d => d.avgRevenue);
        const y = d3.scaleLinear()
            .domain([0, Math.ceil(maxRevenue / 200000) * 200000])
            .nice()
            .range([height, 0]);

        // 🎨 Bảng màu Tableau 20
        const tableauColors = [
            "#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC949", 
            "#AF7AA1", "#FF9DA7", "#9C755F", "#BAB0AC", "#D37295", "#FABFD2",
            "#B07AA1", "#D4A6C8", "#E6842A", "#FFA07A", "#A7C636", "#86BCB6",
            "#F4A582", "#92C5DE"
        ];

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickSize(5).tickPadding(10))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .style("font-size", "12px");

        svg.append("g")
            .call(d3.axisLeft(y).tickValues(d3.range(0, Math.ceil(maxRevenue / 200000) * 200000 + 1, 200000))
                .tickFormat(d => `${(d / 1000)}K`))
            .selectAll("text")
            .style("font-size", "12px");

        svg.selectAll(".bar")
            .data(dataset)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.hourRange))
            .attr("y", d => y(d.avgRevenue))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.avgRevenue))
            .attr("fill", (d, i) => tableauColors[i % tableauColors.length]);

        svg.selectAll(".bar-label")
            .data(dataset)
            .enter().append("text")
            .attr("class", "bar-label")
            .attr("x", d => x(d.hourRange) + x.bandwidth() / 2)
            .attr("y", d => y(d.avgRevenue) - 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#000")
            .attr("font-weight", "bold")
            .text(d => `${(d.avgRevenue / 1000).toFixed(1)}K`);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("font-weight", "bold")
            .attr("fill", "#00A896")
            .text("Doanh số bán hàng trung bình theo Khung giờ");
    });
}
