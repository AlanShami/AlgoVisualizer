let running = false;
let animationSpeed = 300;
let nodes = [];
let links = [];

const startBtn = document.querySelector('#run');
const stopBtn = document.querySelector('#stop');
const algoSelect = document.querySelector('#get-algo');
const startNodeSelect = document.querySelector('#start-node');
const endNodeSelect = document.querySelector('#end-node');

startBtn.addEventListener('click', () => {
    if (!running) {
        running = true;
        stopBtn.classList.remove('none');
        startBtn.classList.add('stop');
        runAlgorithm();
    }
});

stopBtn.addEventListener('click', () => {
    if (running) {
        running = false;
        stopBtn.classList.add('none');
        startBtn.classList.remove('stop');
    }
});

document.querySelector('#sound').addEventListener('click', () => {
    const audio = new Audio('sound.mp3');
    audio.play();
});

function setSpeed() {
    animationSpeed = document.getElementById('speed').value;
    console.log(`Speed set to: ${animationSpeed}ms`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

document.getElementById('create-custom-graph').addEventListener('click', createCustomGraph);

function createCustomGraph() {
    const input = document.getElementById('custom-graph-input').value;
    const edges = input.split(';').map(pair => {
        const [source, target, weight] = pair.split(',').map(Number);
        return { source, target, weight };
    });
    
    nodes = [...new Set(edges.flatMap(e => [e.source, e.target]))].map(id => ({ id }));
    links = edges;

    updateGraph();
    updateNodeSelections();
}

function updateNodeSelections() {
    startNodeSelect.innerHTML = '';
    endNodeSelect.innerHTML = '';
    nodes.forEach(node => {
        startNodeSelect.add(new Option(node.id, node.id));
        endNodeSelect.add(new Option(node.id, node.id));
    });
}

algoSelect.addEventListener('change', () => {
    const isPathfinding = algoSelect.value === 'dijkstra';
    document.getElementById('node-selection').style.display = isPathfinding ? 'block' : 'none';
});

// Initial setup
document.getElementById('node-selection').style.display = 'block';