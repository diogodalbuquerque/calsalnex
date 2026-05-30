// App Global Variables
let globalData = null;
let currentDataset = 'financials';
let currentThreshold = 0.15;
let simulation = null;
let svg = null;
let g = null; // zoom container

// Generate Mock DBN data in memory to comply with WQU Academic Integrity Policy
function generateMockDBNData() {
    // 1. Generate Simulated Financial Interconnectedness Network (20 B3 Brazilian Assets)
    const finTickers = [
        'VALE3', 'PETR4', 'ITUB4', 'BBDC4', 'BBAS3', 
        'ABEV3', 'WEGE3', 'ITSA4', 'B3SA3', 'JBSS3', 
        'SUZB3', 'GGBR4', 'CSAN3', 'RENT3', 'LREN3', 
        'BPAC11', 'VIVT3', 'ELET3', 'RADL3', 'EQTL3'
    ];
    const finNodes = [];
    finTickers.forEach(t => {
        finNodes.push(`${t}_lag0`);
        finNodes.push(`${t}_lag1`);
    });
    
    const finEdges = [];
    // Self-lags: most assets are highly correlated with their own past
    finTickers.forEach(t => {
        finEdges.push({
            source: `${t}_lag1`,
            target: `${t}_lag0`,
            weight: 0.35 + Math.random() * 0.25
        });
    });
    
    // Core structural relationships mimicking systemic contagion paths in Brazil market
    // PETR4 (Petrobras) and ITUB4 (Itaú) act as causal drivers in the system
    finEdges.push({ source: 'PETR4_lag1', target: 'VALE3_lag0', weight: 0.421 });
    finEdges.push({ source: 'PETR4_lag1', target: 'CSAN3_lag0', weight: 0.352 });
    finEdges.push({ source: 'PETR4_lag1', target: 'GGBR4_lag0', weight: 0.315 });
    
    finEdges.push({ source: 'ITUB4_lag1', target: 'BBDC4_lag0', weight: 0.485 });
    finEdges.push({ source: 'ITUB4_lag1', target: 'BBAS3_lag0', weight: 0.412 });
    finEdges.push({ source: 'ITUB4_lag1', target: 'BPAC11_lag0', weight: 0.364 });
    
    finEdges.push({ source: 'ELET3_lag1', target: 'EQTL3_lag0', weight: 0.392 });
    finEdges.push({ source: 'RENT3_lag1', target: 'LREN3_lag0', weight: 0.345 });
    
    // Intra-slice dependencies (instant correlation/contagion routes)
    finEdges.push({ source: 'ITUB4_lag0', target: 'ITSA4_lag0', weight: 0.648 }); // Itaú to Itaúsa
    finEdges.push({ source: 'PETR4_lag0', target: 'VALE3_lag0', weight: 0.512 }); // Petrobras to Vale
    finEdges.push({ source: 'BBDC4_lag0', target: 'BBAS3_lag0', weight: 0.435 }); // Bradesco to Banco do Brasil
    finEdges.push({ source: 'RENT3_lag0', target: 'LREN3_lag0', weight: 0.328 }); // Localiza to Renner
    finEdges.push({ source: 'JBSS3_lag0', target: 'SUZB3_lag0', weight: 0.294 }); // JBS to Suzano
    
    // Add additional random relationships to make slider interactive
    const random = (seed) => {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };
    
    let seed = 12345;
    for (let i = 0; i < 35; i++) {
        const srcIdx = Math.floor(random(seed++) * finNodes.length);
        const tgtIdx = Math.floor(random(seed++) * finNodes.length);
        const src = finNodes[srcIdx];
        const tgt = finNodes[tgtIdx];
        
        // DBN rule: time cannot flow backward (present cannot cause past)
        if (src.includes('_lag0') && tgt.includes('_lag1')) continue;
        if (src === tgt) continue;
        
        // Skip duplicate edges
        if (finEdges.some(e => e.source === src && e.target === tgt)) continue;
        
        const weight = (random(seed++) * 2 - 1) * 0.28; // value between -0.28 and 0.28
        finEdges.push({
            source: src,
            target: tgt,
            weight: parseFloat(weight.toFixed(4))
        });
    }

    // 2. Generate Simple Simulated Network (5 Nodes)
    const simTickers = ['Node0', 'Node1', 'Node2', 'Node3', 'Node4'];
    const simNodes = [];
    simTickers.forEach(t => {
        simNodes.push(`${t}_lag0`);
        simNodes.push(`${t}_lag1`);
    });
    
    const simEdges = [
        { source: 'Node0_lag0', target: 'Node1_lag0', weight: 0.432 },
        { source: 'Node0_lag0', target: 'Node2_lag0', weight: 0.372 },
        { source: 'Node0_lag1', target: 'Node4_lag0', weight: 0.221 },
        { source: 'Node1_lag1', target: 'Node2_lag0', weight: 0.282 },
        { source: 'Node1_lag1', target: 'Node3_lag0', weight: 0.270 },
        { source: 'Node2_lag0', target: 'Node1_lag0', weight: -0.264 },
        { source: 'Node3_lag0', target: 'Node0_lag0', weight: -0.578 },
        { source: 'Node3_lag0', target: 'Node1_lag0', weight: -0.348 }
    ];

    globalData = {
        financials: {
            nodes: finNodes,
            edges: finEdges
        },
        simulated: {
            nodes: simNodes,
            edges: simEdges
        }
    };
}

// Initialize application on load
window.addEventListener('DOMContentLoaded', () => {
    // Set initial threshold slider value
    document.getElementById('threshold-range').value = currentThreshold;
    document.getElementById('threshold-val').textContent = currentThreshold.toFixed(2);
    
    // Generate data locally without calling file paths
    generateMockDBNData();
    loadSelectedDataset();
});

// Tab Switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.getElementById(`btn-${tabName}`).classList.add('active');
}

// Load selected dataset
function loadSelectedDataset() {
    if (!globalData) return;
    currentDataset = document.getElementById('select-dataset').value;
    renderGraph();
}

// Update Threshold Slider value
function updateThreshold(val) {
    currentThreshold = parseFloat(val);
    document.getElementById('threshold-val').textContent = currentThreshold.toFixed(2);
    renderGraph(); // Re-render filtered graph
}

// Draw Graph with D3.js
function renderGraph() {
    const viewport = document.getElementById('graph-viewport');
    viewport.innerHTML = ''; // Clear container
    
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    
    // Extract dataset
    const rawNodes = globalData[currentDataset].nodes;
    const rawEdges = globalData[currentDataset].edges;
    
    // Filter edges by threshold (absolute weight >= threshold)
    const activeEdges = rawEdges.filter(d => Math.abs(d.weight) >= currentThreshold);
    
    // Determine which nodes are active (either are part of an active edge, or we keep all for simulated)
    const activeNodeNames = new Set();
    if (currentDataset === 'simulated') {
        // Keep all nodes for simulated to show isolated states
        rawNodes.forEach(n => activeNodeNames.add(n));
    } else {
        // Only keep nodes that have active connections to avoid clutter
        activeEdges.forEach(e => {
            activeNodeNames.add(e.source);
            activeNodeNames.add(e.target);
        });
    }
    
    // Map node strings to objects
    const nodes = Array.from(activeNodeNames).map(name => ({
        id: name,
        type: name.includes('_lag1') ? 'lag1' : 'lag0',
        ticker: name.split('_')[0]
    }));
    
    // Clone edges to prevent D3 mutation of cached objects
    const links = activeEdges.map(e => ({
        source: e.source,
        target: e.target,
        weight: e.weight
    }));
    
    // Update Stats counters
    document.getElementById('stat-nodes').textContent = nodes.length;
    document.getElementById('stat-edges').textContent = links.length;
    
    // Empty state if no active edges
    if (nodes.length === 0) {
        viewport.innerHTML = `
            <div class="empty-details-state" style="padding-top: 150px;">
                <p>No active connections above threshold ${currentThreshold.toFixed(2)}</p>
                <p style="font-size: 0.75rem; margin-top: 0.5rem;">Try lowering the threshold slider.</p>
            </div>
        `;
        renderHeatmap([], []);
        return;
    }
    
    // Create SVG element
    svg = d3.select('#graph-viewport')
        .append('svg')
        .attr('class', 'd3-graph')
        .attr('viewBox', `0 0 ${width} ${height}`);
        
    // Create Arrow markers for directed edges (one positive, one negative)
    svg.append('defs').append('marker')
        .attr('id', 'arrow-pos')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 22) // Offset from node center
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('class', 'link-marker-pos');
        
    svg.append('defs').append('marker')
        .attr('id', 'arrow-neg')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 22)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('class', 'link-marker-neg');
        
    // Setup Zoom & Pan container
    g = svg.append('g');
    
    svg.call(d3.zoom()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        })
    );
    
    // Render Heatmap in sidebar
    renderHeatmap(nodes, activeEdges);
    
    // Setup D3 Force Simulation
    simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(120))
        .force('charge', d3.forceManyBody().strength(-150))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(25));
        
    // Draw links/edges
    const link = g.append('g')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('class', d => `link ${d.weight > 0 ? 'positive' : 'negative'}`)
        .attr('stroke-width', d => Math.abs(d.weight) * 4 + 0.8)
        .attr('marker-end', d => d.weight > 0 ? 'url(#arrow-pos)' : 'url(#arrow-neg)');
        
    // Draw nodes
    const node = g.append('g')
        .selectAll('.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended)
        );
        
    // Node circle styling
    node.append('circle')
        .attr('r', 16)
        .attr('class', d => d.type)
        .attr('style', d => d.type === 'lag0' ? 'color: var(--color-lag0);' : 'color: var(--color-lag1);');
        
    // Node text label
    node.append('text')
        .attr('dx', 0)
        .attr('dy', 4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .text(d => d.ticker);
        
    // Node Tooltip / Highlight Hover Effects
    node.on('mouseover', function(event, d) {
        d3.select(this).classed('active', true);
        
        const activeConnectedNodes = new Set();
        activeConnectedNodes.add(d.id);
        
        link.classed('active', l => {
            const isConnected = l.source.id === d.id || l.target.id === d.id;
            if (isConnected) {
                activeConnectedNodes.add(l.source.id);
                activeConnectedNodes.add(l.target.id);
            }
            return isConnected;
        });
        
        node.style('opacity', n => activeConnectedNodes.has(n.id) ? 1 : 0.3);
        link.style('opacity', l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.15);
        
        showDetailsPanel(d, activeEdges);
    });
    
    node.on('mouseout', function() {
        d3.select(this).classed('active', false);
        link.classed('active', false);
        node.style('opacity', 1);
        link.style('opacity', 1);
        resetDetailsPanel();
    });
    
    // Ticking logic for forces
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
            
        node
            .attr('transform', d => `translate(${d.x}, ${d.y})`);
    });
}

// Drag functions
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

// Populate Details sidebar panel on hover
function showDetailsPanel(node, activeEdges) {
    const panel = document.getElementById('details-panel');
    
    const incoming = activeEdges.filter(e => e.target === node.id);
    const outgoing = activeEdges.filter(e => e.source === node.id);
    
    let html = `
        <div class="node-title">
            <span class="node-title-badge ${node.type}">${node.type === 'lag0' ? 'PRESENT' : 'PAST'}</span>
            <h3>${node.id}</h3>
        </div>
    `;
    
    if (incoming.length === 0 && outgoing.length === 0) {
        html += `<p style="font-size: 0.8rem; color: var(--text-secondary);">This node is isolated at the current threshold.</p>`;
    } else {
        if (incoming.length > 0) {
            html += `<h4 style="font-size: 0.8rem; color: var(--text-muted); margin: 0.5rem 0 0.25rem 0; text-transform: uppercase;">Direct Causes (Inputs):</h4><div class="details-list">`;
            incoming.forEach(edge => {
                const wt = edge.weight;
                html += `
                    <div class="details-item">
                        <span>${edge.source}</span>
                        <span class="details-weight ${wt > 0 ? 'pos' : 'neg'}">${wt > 0 ? '+' : ''}${wt.toFixed(4)}</span>
                    </div>
                `;
            });
            html += `</div>`;
        }
        
        if (outgoing.length > 0) {
            html += `<h4 style="font-size: 0.8rem; color: var(--text-muted); margin: 0.5rem 0 0.25rem 0; text-transform: uppercase;">Causal Effects (Outputs):</h4><div class="details-list">`;
            outgoing.forEach(edge => {
                const wt = edge.weight;
                html += `
                    <div class="details-item">
                        <span>→ ${edge.target}</span>
                        <span class="details-weight ${wt > 0 ? 'pos' : 'neg'}">${wt > 0 ? '+' : ''}${wt.toFixed(4)}</span>
                    </div>
                `;
            });
            html += `</div>`;
        }
    }
    
    html += `<p style="margin-top: 1rem; font-size: 0.75rem; color: var(--text-muted); text-align: center;">💡 Tip: Drag this node to pin or reposition it.</p>`;
    panel.innerHTML = html;
}

// Reset Details sidebar panel
function resetDetailsPanel() {
    document.getElementById('details-panel').innerHTML = `
        <div class="empty-details-state">
            <svg class="info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Hover or click on any node in the graph to inspect its direct causes and downstream effects.</p>
            <p style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">💡 Drag nodes to reposition them and dynamically reorganize the graph layout.</p>
        </div>
    `;
}

// Render dynamic Matrix Heatmap
function renderHeatmap(nodes, activeEdges) {
    const container = document.getElementById('heatmap-container');
    container.innerHTML = '';
    
    if (nodes.length === 0) return;
    
    const sortedNodes = nodes.map(n => n.id).sort();
    
    const matrix = {};
    sortedNodes.forEach(row => {
        matrix[row] = {};
        sortedNodes.forEach(col => {
            matrix[row][col] = 0;
        });
    });
    
    activeEdges.forEach(edge => {
        if (matrix[edge.source] && matrix[edge.source][edge.target] !== undefined) {
            matrix[edge.source][edge.target] = edge.weight;
        }
    });
    
    const table = document.createElement('table');
    table.className = 'heatmap-table';
    
    sortedNodes.forEach(rowNode => {
        const tr = document.createElement('tr');
        sortedNodes.forEach(colNode => {
            const td = document.createElement('td');
            td.className = 'heatmap-cell';
            const weight = matrix[rowNode][colNode];
            
            if (weight > 0) {
                td.style.backgroundColor = `rgba(16, 185, 129, ${Math.min(1.0, weight * 1.5)})`;
            } else if (weight < 0) {
                td.style.backgroundColor = `rgba(239, 68, 68, ${Math.min(1.0, Math.abs(weight) * 1.5)})`;
            } else {
                td.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
            }
            
            td.title = `${rowNode} → ${colNode}\nCausal Weight: ${weight !== 0 ? (weight > 0 ? '+' : '') + weight.toFixed(4) : '0.0000'}`;
            
            td.addEventListener('mouseover', () => {
                if (weight !== 0) {
                    const mockNode = {
                        id: rowNode,
                        type: rowNode.includes('_lag1') ? 'lag1' : 'lag0'
                    };
                    showDetailsPanel(mockNode, activeEdges);
                }
            });
            td.addEventListener('mouseout', () => {
                resetDetailsPanel();
            });
            
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });
    
    container.appendChild(table);
}
