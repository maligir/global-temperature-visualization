// script.js

// Set up dimensions and margins for the graph
const margin = { top: 20, right: 30, bottom: 50, left: 60 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create an SVG container
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Scales
const x = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

// Line generator
const line = d3.line()
    .x(d => x(d.dt))
    .y(d => y(d.LandAverageTemperature))
    .curve(d3.curveMonotoneX); // For smooth curves

// Tooltip setup
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Function to calculate moving average
function movingAverage(data, windowSize) {
    return data.map((d, i) => {
        if (i < windowSize) return null; // Skip initial points
        let avg = 0;
        for (let j = 0; j < windowSize; j++) {
            avg += data[i - j].LandAverageTemperature;
        }
        avg /= windowSize;
        return { dt: d.dt, LandAverageTemperature: avg };
    }).filter(d => d !== null); // Remove null values
}

// Decade-based annotations with historical events
const annotationsData = [
    { year: 1880, description: "Industrial Revolution accelerates global emissions.", details: "The Industrial Revolution, which began in the 18th century, had fully taken hold by the 1880s, leading to significant increases in the burning of fossil fuels." },
    { year: 1910, description: "WWI and Spanish Flu affect global industry and emissions.", details: "World War I (1914-1918) and the Spanish Flu pandemic (1918-1919) disrupted industrial activity and emissions, although the long-term trend of rising emissions continued." },
    { year: 1930, description: "Great Depression leads to a temporary reduction in emissions.", details: "The Great Depression saw a global economic downturn that temporarily reduced industrial activity and emissions, though the effect was short-lived." },
    { year: 1950, description: "Post-WWII industrial boom increases emissions.", details: "The post-World War II era saw significant economic growth and industrial expansion, leading to a sharp increase in emissions." },
    { year: 1970, description: "Environmental movements lead to the establishment of the EPA and global awareness.", details: "The environmental movement of the 1970s led to greater awareness of pollution and the creation of regulatory bodies like the U.S. Environmental Protection Agency." },
    { year: 1990, description: "Increased awareness and research on global warming; Kyoto Protocol.", details: "The 1990s saw a surge in research on global warming, leading to international agreements like the Kyoto Protocol to address greenhouse gas emissions." },
    { year: 2010, description: "Paris Agreement seeks global commitment to reducing carbon emissions.", details: "The Paris Agreement, adopted in 2015, marked a global effort to limit temperature rise and reduce carbon emissions." }
];

// Function to add annotations with improved styling and interaction
function addAnnotations(data, xScale, yScale) {
    // Filter annotations to only include those within the current range
    const filteredAnnotations = annotationsData.filter(ann => {
        const year = new Date(ann.year, 0, 1);
        return year >= xScale.domain()[0] && year <= xScale.domain()[1];
    });

    // Add text annotations to the SVG
    const annotations = svg.selectAll(".annotation")
        .data(filteredAnnotations)
        .enter().append("g")
        .attr("class", "annotation")
        .attr("transform", d => {
            const x = xScale(new Date(d.year, 0, 1));
            const y = yScale(d3.mean(data, e => e.LandAverageTemperature)) - 50; // Offset the annotation
            return `translate(${x},${y})`;
        })
        .on("mouseover", function(event, d) {
            d3.select(this).raise(); // Bring the annotation to the front
            d3.select(this).select("text")
                .text(d.details)
                .style("font-weight", "bold");
            d3.select(this).select("rect")
                .style("fill", "#f4f4f4")
                .style("stroke", "#333")
                .style("stroke-width", "1px");
        })
        .on("mouseout", function(event, d) {
            d3.select(this).lower(); // Send the annotation back to its original position
            d3.select(this).select("text")
                .text(`${d.year}: ${d.description}`)
                .style("font-weight", "normal");
            d3.select(this).select("rect")
                .style("fill", "rgba(255, 255, 255, 0.8)")
                .style("stroke", "none");
        });

        annotations.append("rect")
        .attr("x", -150)
        .attr("y", -20)
        .attr("width", 300)
        .attr("height", 40)
        .attr("rx", 10) // Rounded corners
        .attr("ry", 10) // Rounded corners
        .style("fill", "rgba(255, 255, 255, 0.8)")
        .style("stroke", "none")
        .style("overflow", "hidden");

    annotations.append("foreignObject")
        .attr("x", -150)
        .attr("y", -20)
        .attr("width", 300)
        .attr("height", 40)
        .append("xhtml:div")
        .style("font-size", "12px")
        .style("color", "#333")
        .style("text-align", "center")
        .style("overflow", "auto")
        .style("height", "100%")
        .html(d => `${d.year}: ${d.description}`);

    // Add lines to indicate the exact date of the annotation
    annotations.append("line")
        .attr("x1", 0)
        .attr("y1", 20)
        .attr("x2", 0)
        .attr("y2", 50)
        .attr("stroke", "#333")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,4");
}

// Function to update the chart with smoothed data and fewer points
function updateChart(data) {
    // Smoothing the data using a moving average with a window size of 12
    const smoothedData = movingAverage(data, 12);

    // Determine the number of points to display (max 12)
    const numPoints = Math.min(12, smoothedData.length);
    const interval = Math.floor(smoothedData.length / numPoints);

    // Filter data to include only the points to be displayed
    const displayData = smoothedData.filter((d, i) => i % interval === 0);

    // Set domains for scales
    x.domain(d3.extent(data, d => d.dt));
    y.domain([d3.min(data, d => d.LandAverageTemperature) - 1, d3.max(data, d => d.LandAverageTemperature) + 1]);

    // Remove old line, axes, and annotations
    svg.selectAll(".line").remove();
    svg.selectAll(".axis").remove();
    svg.selectAll(".dot").remove();
    svg.selectAll(".annotation").remove();

    // Draw the smoothed line
    svg.append("path")
        .datum(displayData)
        .attr("class", "line")
        .attr("d", line)
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);

    // Draw axes
    svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y")))
        .append("text")
        .attr("fill", "#000")
        .attr("x", width / 2)
        .attr("y", 35)
        .attr("text-anchor", "middle")
        .text("Year");

    svg.append("g")
        .attr("class", "y-axis axis")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("dy", "0.71em")
        .attr("text-anchor", "middle")
        .text("Temperature Anomaly (°C)");

    // Add circles for tooltips
    svg.selectAll(".dot")
        .data(displayData)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.dt))
        .attr("cy", d => y(d.LandAverageTemperature))
        .attr("r", 5)
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`Year: ${d3.timeFormat("%Y")(d.dt)}<br>Temp: ${d.LandAverageTemperature.toFixed(2)}°C`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add annotations for significant historical events
    addAnnotations(data, x, y);

    // Update the displayed year range
    const startYear = x.domain()[0].getFullYear();
    const endYear = x.domain()[1].getFullYear();
    d3.select("#currentRange").text(`Viewing Years: ${startYear} - ${endYear}`);
}

// Load and process data
d3.csv("data/GlobalTemperatures.csv").then(data => {
    data.forEach(d => {
        d.dt = new Date(d.dt);
        d.LandAverageTemperature = +d.LandAverageTemperature;
    });

    // Initial chart rendering
    updateChart(data);

    // Scene navigation
    const scenes = [
        { start: 1750, end: 1800 },
        { start: 1800, end: 1850 },
        { start: 1850, end: 1900 },
        { start: 1900, end: 1950 },
        { start: 1950, end: 2000 }
    ];
    let currentScene = 0;

    function loadScene(index) {
        currentScene = index;
        const scene = scenes[currentScene];
        d3.select("#startYear").property("value", scene.start);
        d3.select("#endYear").property("value", scene.end);
        const filteredData = data.filter(d => 
            d.dt.getFullYear() >= scene.start && d.dt.getFullYear() <= scene.end
        );
        updateChart(filteredData);
    }

    d3.select("#updateButton").on("click", () => {
        const startYear = +d3.select("#startYear").node().value;
        const endYear = +d3.select("#endYear").node().value;
        const filteredData = data.filter(d => 
            d.dt.getFullYear() >= startYear && d.dt.getFullYear() <= endYear
        );
        updateChart(filteredData);
    });

    d3.select("#prevScene").on("click", () => {
        if (currentScene > 0) {
            loadScene(currentScene - 1);
        }
    });

    d3.select("#nextScene").on("click", () => {
        if (currentScene < scenes.length - 1) {
            loadScene(currentScene + 1);
        }
    });

    // Load the first scene initially
    loadScene(0);

    // Add event listeners for decade buttons
    d3.selectAll(".decadeButton").on("click", function() {
        const decade = +d3.select(this).attr("data-decade");
        const scene = scenes.find(s => s.start === decade);
        if (scene) {
            loadScene(scenes.indexOf(scene));
        }
    });
});