// Load the dataset and process it for Scene 1
d3.csv("data/GlobalTemperatures.csv").then(function(csvData) {
    // Parse date and temperature anomaly
    csvData.forEach(d => {
        d.dt = new Date(d.dt);
        d.LandAverageTemperature = +d.LandAverageTemperature;
        d.OceanAverageTemperature = +d.OceanAverageTemperature;
        d.LandAndOceanAverageTemperature = +d.LandAndOceanAverageTemperature;
    });

    // Filter data for different scenes
    let data1900to1950 = csvData.filter(d => d.dt.getFullYear() >= 1900 && d.dt.getFullYear() <= 1950);
    let data1950to2000 = csvData.filter(d => d.dt.getFullYear() > 1950 && d.dt.getFullYear() <= 2000);
    let data2000toPresent = csvData.filter(d => d.dt.getFullYear() > 2000);

    // Handle missing data and apply smoothing
    data1900to1950 = handleMissingDataAndSmoothing(data1900to1950);
    data1950to2000 = handleMissingDataAndSmoothing(data1950to2000);
    data2000toPresent = handleMissingDataAndSmoothing(data2000toPresent);

    console.log("Filtered Data with Smoothing (1900-1950):", data1900to1950);
    console.log("Filtered Data with Smoothing (1950-2000):", data1950to2000);
    console.log("Filtered Data with Smoothing (2000-Present):", data2000toPresent);

    // Create the scenes
    createScene1(data1900to1950);
    createScene2(data1950to2000);
    createScene3(data2000toPresent);
}).catch(function(error) {
    console.error('Error loading or parsing data:', error);
});

// Function to handle missing data and apply smoothing
function handleMissingDataAndSmoothing(data) {
    // Removing or imputing missing values if necessary
    data = data.filter(d => !isNaN(d.LandAndOceanAverageTemperature));
    
    // Apply a simple moving average with a window of 12 months
    const windowSize = 12;
    for (let i = 0; i < data.length; i++) {
        let sum = 0, count = 0;
        let sum2 = 0, count2 = 0;
        let sum3 = 0, count3 = 0;
        for (let j = i; j < i + windowSize && j < data.length; j++) {
            sum += data[j].LandAndOceanAverageTemperature;
            count++;
            sum2 += data[j].LandAverageTemperature;
            count2++;
            sum3 += data[j].OceanAverageTemperature;
            count3++;
        }
        data[i].smoothedTemperature = sum / count;
        data[i].smoothedLandTemperature = sum2 / count2;
        data[i].smoothedOceanTemperature = sum3 / count3;
    }
    return data;
}

// Function to create Scene 1
function createScene1(data) {
    // Set dimensions and margins for the graph
    const margin = { top: 20, right: 30, bottom: 50, left: 60 },
          width = 800 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    // Append SVG object to the scene1 div
    const svg = d3.select("#scene1")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X axis: time scale
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.dt))
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    // Y axis: temperature anomaly scale
    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.smoothedTemperature) + 0.5, d3.max(data, d => d.smoothedTemperature) + 0.5])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    console.log("Axes set up");

    // Add the smoothed line path
    const line = d3.line()
        .x(d => x(d.dt))
        .y(d => y(d.smoothedTemperature));
    
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    console.log("Smoothed line path drawn");

    // Annotations for Scene 1
    const annotations = [
        { date: new Date("1914-01-01"), text: "World War I", description: "Global economic disruptions and changes in industrial activities during World War I affected climate patterns.", yOffset: -30 },
        { date: new Date("1929-01-01"), text: "Great Depression", description: "The Great Depression caused significant reductions in industrial activity and CO2 emissions, temporarily affecting global temperatures.", yOffset: -30 }
    ];

    // Tooltip setup for annotations
    const annotationTooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Add annotations
    annotations.forEach(annotation => {
        const xPos = x(annotation.date);
        const yPos = y(data.find(d => d.dt.getFullYear() === annotation.date.getFullYear()).smoothedTemperature);
        svg.append("text")
            .attr("x", xPos)
            .attr("y", yPos + annotation.yOffset)
            .attr("text-anchor", "start")
            .attr("class", "annotation")
            .text(annotation.text)
            .on("mouseover", function(event) {
                annotationTooltip.transition().duration(200).style("opacity", .9);
                annotationTooltip.html(`<strong>${annotation.text}</strong><br/>${annotation.description}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                annotationTooltip.transition().duration(500).style("opacity", 0);
            });

        // Draw a line for better visibility
        svg.append("line")
            .attr("x1", xPos)
            .attr("x2", xPos)
            .attr("y1", yPos)
            .attr("y2", yPos + annotation.yOffset)
            .attr("stroke", "black")
            .attr("stroke-width", 3);
    });

    console.log("Annotations with tooltips added");

    // Tooltip setup for 5-year averages
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Tooltip interaction for 5-year averages
    const years = d3.range(1900, 1955, 5);
    years.forEach(year => {
        const yearData = data.filter(d => d.dt.getFullYear() >= year && d.dt.getFullYear() < year + 5);
        if (yearData.length > 0) {
            const avgTemp = d3.mean(yearData, d => d.smoothedTemperature);
            const avgLandTemp = d3.mean(yearData, d => d.smoothedLandTemperature);
            svg.append("circle")
                .attr("cx", x(new Date(`${year}-01-01`)))
                .attr("cy", y(avgTemp))
                .attr("r", 4)
                .attr("fill", "orange")
                .on("mouseover", function(event) {
                    tooltip.transition().duration(200).style("opacity", .9);
                    tooltip.html(`5-Year Averages (${year} - ${year + 5}):<br/>Overall: ${avgTemp.toFixed(2)}°C <br/>Land: ${avgLandTemp.toFixed(2)}°C`)
                        .style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    tooltip.transition().duration(500).style("opacity", 0);
                });
        }
    });

    console.log("Tooltip setup complete");
}

// Function to create Scene 2
function createScene2(data) {
    // Set dimensions and margins for the graph
    const margin = { top: 20, right: 30, bottom: 50, left: 60 },
          width = 800 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    // Append SVG object to the scene2 div
    const svg = d3.select("#scene2")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X axis: time scale
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.dt))
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    // Y axis: temperature anomaly scale
    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.smoothedTemperature) + 0.5, d3.max(data, d => d.smoothedTemperature) + 0.5])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    console.log("Axes set up for Scene 2");

    // Add the smoothed line path
    const line = d3.line()
        .x(d => x(d.dt))
        .y(d => y(d.smoothedTemperature));
    
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    console.log("Smoothed line path drawn for Scene 2");

    // Annotations for Scene 2
    const annotations = [
        { date: new Date("1960-01-01"), text: "Post-War Industrial Boom", description: "Significant industrial growth post-World War II led to increased emissions and temperature rise.", yOffset: -30 },
        { date: new Date("1980-01-01"), text: "Climate Awareness", description: "Increased public awareness and scientific research on climate change started around this period.", yOffset: -30 }
    ];

    // Tooltip setup for annotations
    const annotationTooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Add annotations
    annotations.forEach(annotation => {
        const xPos = x(annotation.date);
        const yPos = y(data.find(d => d.dt.getFullYear() === annotation.date.getFullYear()).smoothedTemperature);
        svg.append("text")
            .attr("x", xPos)
            .attr("y", yPos + annotation.yOffset)
            .attr("text-anchor", "start")
            .attr("class", "annotation")
            .text(annotation.text)
            .on("mouseover", function(event) {
                annotationTooltip.transition().duration(200).style("opacity", .9);
                annotationTooltip.html(`<strong>${annotation.text}</strong><br/>${annotation.description}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                annotationTooltip.transition().duration(500).style("opacity", 0);
            });

        // Draw a line for better visibility
        svg.append("line")
            .attr("x1", xPos)
            .attr("x2", xPos)
            .attr("y1", yPos)
            .attr("y2", yPos + annotation.yOffset)
            .attr("stroke", "black")
            .attr("stroke-width", 3);
    });

    console.log("Annotations with tooltips added for Scene 2");

    // Tooltip setup for 5-year averages
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Tooltip interaction for 5-year averages
    const years = d3.range(1950, 2005, 5);
    years.forEach(year => {
        const yearData = data.filter(d => d.dt.getFullYear() >= year && d.dt.getFullYear() < year + 5);
        if (yearData.length > 0) {
            const avgTemp = d3.mean(yearData, d => d.smoothedTemperature);
            const avgLandTemp = d3.mean(yearData, d => d.smoothedLandTemperature);
            svg.append("circle")
                .attr("cx", x(new Date(`${year}-01-01`)))
                .attr("cy", y(avgTemp))
                .attr("r", 4)
                .attr("fill", "orange")
                .on("mouseover", function(event) {
                    tooltip.transition().duration(200).style("opacity", .9);
                    tooltip.html(`5-Year Averages (${year} - ${year + 5}):<br/>Overall: ${avgTemp.toFixed(2)}°C <br/>Land: ${avgLandTemp.toFixed(2)}°C`)
                        .style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    tooltip.transition().duration(500).style("opacity", 0);
                });
        }
    });

    console.log("Tooltip setup complete for Scene 2");
}

// Function to create Scene 3
function createScene3(data) {
    // Set dimensions and margins for the graph
    const margin = { top: 20, right: 30, bottom: 50, left: 60 },
          width = 800 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    // Append SVG object to the scene3 div
    const svg = d3.select("#scene3")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X axis: time scale
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.dt))
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    // Y axis: temperature anomaly scale
    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.smoothedTemperature) + 0.5, d3.max(data, d => d.smoothedTemperature) + 0.5])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    console.log("Axes set up for Scene 3");

    // Add the smoothed line path
    const line = d3.line()
        .x(d => x(d.dt))
        .y(d => y(d.smoothedTemperature));
    
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    console.log("Smoothed line path drawn for Scene 3");

    // Annotations for Scene 3
    const annotations = [
        { date: new Date("2015-01-01"), text: "Paris Agreement", description: "Global agreement to combat climate change and accelerate actions towards a sustainable low carbon future.", yOffset: -30 },
        { date: new Date("2020-01-01"), text: "COVID-19 Pandemic", description: "Temporary reduction in CO2 emissions due to global lockdowns and reduced industrial activity.", yOffset: -30 }
    ];

    // Tooltip setup for annotations
    const annotationTooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Add annotations
    annotations.forEach(annotation => {
        const xPos = x(annotation.date);
        const yPos = y(data.find(d => d.dt.getFullYear() === annotation.date.getFullYear()).smoothedTemperature);
        svg.append("text")
            .attr("x", xPos)
            .attr("y", yPos + annotation.yOffset)
            .attr("text-anchor", "start")
            .attr("class", "annotation")
            .text(annotation.text)
            .on("mouseover", function(event) {
                annotationTooltip.transition().duration(200).style("opacity", .9);
                annotationTooltip.html(`<strong>${annotation.text}</strong><br/>${annotation.description}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
           
            .on("mouseout", function() {
                annotationTooltip.transition().duration(500).style("opacity", 0);
            });

        // Draw a line for better visibility
        svg.append("line")
            .attr("x1", xPos)
            .attr("x2", xPos)
            .attr("y1", yPos)
            .attr("y2", yPos + annotation.yOffset)
            .attr("stroke", "black")
            .attr("stroke-width", 3);
    });

    console.log("Annotations with tooltips added for Scene 3");

    // Tooltip setup for 5-year averages
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Tooltip interaction for 5-year averages
    const years = d3.range(2000, new Date().getFullYear() + 1, 5);
    years.forEach(year => {
        const yearData = data.filter(d => d.dt.getFullYear() >= year && d.dt.getFullYear() < year + 5);
        if (yearData.length > 0) {
            const avgTemp = d3.mean(yearData, d => d.smoothedTemperature);
            const avgLandTemp = d3.mean(yearData, d => d.smoothedLandTemperature);
            svg.append("circle")
                .attr("cx", x(new Date(`${year}-01-01`)))
                .attr("cy", y(avgTemp))
                .attr("r", 4)
                .attr("fill", "orange")
                .on("mouseover", function(event) {
                    tooltip.transition().duration(200).style("opacity", .9);
                    tooltip.html(`5-Year Averages (${year} - ${year + 5}):<br/>Overall: ${avgTemp.toFixed(2)}°C <br/>Land: ${avgLandTemp.toFixed(2)}°C`)
                        .style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    tooltip.transition().duration(500).style("opacity", 0);
                });
        }
    });

    console.log("Tooltip setup complete for Scene 3");
}

// Function to display a specific scene
function showScene(sceneNumber) {
    d3.selectAll('.scene').style('display', 'none');
    d3.select(`#scene${sceneNumber}`).style('display', 'block');
}

// Initialize the first scene
showScene(1);
