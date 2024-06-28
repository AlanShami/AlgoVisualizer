let width, height, svg, simulation;

document.addEventListener('DOMContentLoaded', () => {
    width = 600;
    height = 400;
    svg = d3.select('#graph')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).distance(100).strength(1))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .on('tick', ticked);

    document.getElementById('random-graph').addEventListener('click', generateRandomGraph);
    document.getElementById('run').addEventListener('click', runAlgorithm);
});

function ticked() {
    svg.selectAll('*').remove();

    const link = svg.selectAll('.link')
        .data(links)
        .enter().append('line')
        .classed('link', true)
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
        .attr('stroke', 'black');

    const node = svg.selectAll('.node')
        .data(nodes)
        .enter().append('circle')
        .classed('node', true)
        .attr('r', 10)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('fill', 'teal')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    const text = svg.selectAll('.label')
        .data(nodes)
        .enter().append('text')
        .classed('label', true)
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('dy', -15)
        .text(d => d.id)
        .attr('fill', 'black')
        .attr('text-anchor', 'middle');

    // Add weight labels to edges
    svg.selectAll('.weight')
        .data(links)
        .enter().append('text')
        .classed('weight', true)
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2)
        .text(d => d.weight || 1)
        .attr('fill', 'red')
        .attr('text-anchor', 'middle');
}

function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function generateRandomGraph() {
    nodes = [];
    links = [];

    const numNodes = 10;
    for (let i = 0; i < numNodes; i++) {
        nodes.push({ id: i });
    }

    for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
            if (Math.random() < 0.3) {
                links.push({ source: i, target: j, weight: Math.floor(Math.random() * 10) + 1 });
            }
        }
    }

    updateGraph();
    updateNodeSelections();
}

function updateGraph() {
    simulation.nodes(nodes);
    simulation.force('link').links(links);
    simulation.alpha(1).restart();
    ticked();
}

async function runAlgorithm() {
    const selectedAlgorithm = document.getElementById('get-algo').value;
    const algorithmName = document.getElementById('get-algo').options[document.getElementById('get-algo').selectedIndex].text;
    
    const statusElement = document.createElement('div');
    statusElement.textContent = `Running: ${algorithmName}`;
    statusElement.style.position = 'absolute';
    statusElement.style.top = '10px';
    statusElement.style.left = '10px';
    statusElement.style.background = 'rgba(255, 255, 255, 0.8)';
    statusElement.style.padding = '5px';
    statusElement.style.borderRadius = '5px';
    document.getElementById('graph').appendChild(statusElement);

    switch (selectedAlgorithm) {
        case 'dijkstra':
            await dijkstraAlgorithm();
            break;
        case 'dfs':
            await depthFirstSearch();
            break;
        case 'bfs':
            await breadthFirstSearch();
            break;
    }

    statusElement.remove();
}

async function dijkstraAlgorithm() {
    const startNodeId = parseInt(startNodeSelect.value);
    const endNodeId = parseInt(endNodeSelect.value);
    
    const distances = {};
    const previous = {};
    const unvisited = new Set(nodes.map(node => node.id));

    nodes.forEach(node => {
        distances[node.id] = Infinity;
        previous[node.id] = null;
    });

    distances[startNodeId] = 0;

    while (unvisited.size > 0 && running) {
        const currentNodeId = Array.from(unvisited).reduce((minNode, nodeId) => 
            distances[nodeId] < distances[minNode] ? nodeId : minNode
        );

        unvisited.delete(currentNodeId);

        if (currentNodeId === endNodeId) break;

        const neighbors = links.filter(link => 
            link.source.id === currentNodeId || link.target.id === currentNodeId
        );

        for (const neighbor of neighbors) {
            const neighborId = neighbor.source.id === currentNodeId ? neighbor.target.id : neighbor.source.id;
            const weight = neighbor.weight || 1;
            const tentativeDistance = distances[currentNodeId] + weight;

            if (tentativeDistance < distances[neighborId]) {
                distances[neighborId] = tentativeDistance;
                previous[neighborId] = currentNodeId;
            }
        }

        // Highlight current node and its edges
        svg.selectAll('.node')
            .attr('fill', d => d.id === currentNodeId ? 'red' : (d.id === startNodeId ? 'green' : (d.id === endNodeId ? 'blue' : 'teal')));

        svg.selectAll('.link')
            .attr('stroke', d => 
                (d.source.id === currentNodeId || d.target.id === currentNodeId) ? 'red' : 'black'
            );

        await sleep(animationSpeed);
    }

    // Highlight the shortest path
    let path = [];
    let current = endNodeId;
    while (current !== null) {
        path.unshift(current);
        current = previous[current];
    }

    for (let i = 0; i < path.length - 1; i++) {
        svg.selectAll('.link')
            .filter(d => 
                (d.source.id === path[i] && d.target.id === path[i+1]) ||
                (d.target.id === path[i] && d.source.id === path[i+1])
            )
            .attr('stroke', 'gold')
            .attr('stroke-width', 3);

        await sleep(animationSpeed);
    }

    document.getElementById('algorithm-info').textContent = `Shortest path: ${path.join(' -> ')}`;
}

async function depthFirstSearch() {
    const visited = new Set();
    const stack = [nodes[0]];
    const path = [];

    while (stack.length > 0 && running) {
        const node = stack.pop();
        if (!visited.has(node.id)) {
            visited.add(node.id);
            path.push(node.id);

            // Highlight current node
            svg.selectAll('.node')
                .attr('fill', d => d.id === node.id ? 'red' : (visited.has(d.id) ? 'orange' : 'teal'));

            // Highlight edges to unvisited neighbors
            const neighbors = links.filter(link => 
                (link.source.id === node.id && !visited.has(link.target.id)) ||
                (link.target.id === node.id && !visited.has(link.source.id))
            );

            svg.selectAll('.link')
                .attr('stroke', d => 
                    neighbors.some(n => (n.source.id === d.source.id && n.target.id === d.target.id) ||
                                        (n.source.id === d.target.id && n.target.id === d.source.id)) 
                    ? 'red' : 'black'
                );

            // Add unvisited neighbors to the stack
            neighbors.forEach(neighbor => {
                const neighborNode = neighbor.source.id === node.id ? neighbor.target : neighbor.source;
                if (!visited.has(neighborNode.id)) {
                    stack.push(neighborNode);
                }
            });

            await sleep(animationSpeed);
        }
    }

    document.getElementById('algorithm-info').textContent = `DFS path: ${path.join(' -> ')}`;
}

async function breadthFirstSearch() {
    const visited = new Set();
    const queue = [nodes[0]];
    const path = [];

    while (queue.length > 0 && running) {
        const node = queue.shift();
        if (!visited.has(node.id)) {
            visited.add(node.id);
            path.push(node.id);

            // Highlight current node
            svg.selectAll('.node')
                .attr('fill', d => d.id === node.id ? 'red' : (visited.has(d.id) ? 'orange' : 'teal'));

            // Highlight edges to unvisited neighbors
            const neighbors = links.filter(link => 
                (link.source.id === node.id && !visited.has(link.target.id)) ||
                (link.target.id === node.id && !visited.has(link.source.id))
            );

            svg.selectAll('.link')
                .attr('stroke', d => 
                    neighbors.some(n => (n.source.id === d.source.id && n.target.id === d.target.id) ||
                                        (n.source.id === d.target.id && n.target.id === d.source.id)) 
                    ? 'red' : 'black'
                );

            // Add unvisited neighbors to the queue
            neighbors.forEach(neighbor => {
                const neighborNode = neighbor.source.id === node.id ? neighbor.target : neighbor.source;
                if (!visited.has(neighborNode.id)) {
                    queue.push(neighborNode);
                }
            });

            await sleep(animationSpeed);
        }
    }

    document.getElementById('algorithm-info').textContent = `BFS path: ${path.join(' -> ')}`;
}