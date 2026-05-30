# Causal Network Explorer (DYNOTEARS)

An interactive, visual dashboard designed to explore **Dynamic Bayesian Networks (DBNs)** and causal structure learning from time-series data. 

## Overview

This project is a self-contained, interactive frontend simulation tool built with D3.js. It visualizes how causal connections propagate between past variables (lagged states) and present variables (current states) in a dynamic network.

### Key Concepts Illustrated:
- **Intra-slice Causal Graphs**: Causal relationships between variables within the same time step.
- **Inter-slice (Lagged) Causal Graphs**: Directed links from past states to present states, showing how historical events influence current outcomes.
- **Acyclicity Constraints**: Real-time filtering and validation demonstrating that time flows forward (no paths exist from the present back to the past).
- **Threshold Filtering**: Dynamically pruning weak connections to isolate strong causal paths and reduce network noise.

## Interactive Features
- **Dynamic Graph Rendering**: Powered by D3.js, allowing dragging, zooming, panning, and hovering to highlight path propagation.
- **Threshold Slider**: Real-time filtering of connection weights.
- **Adjacency Heatmap**: Color-coded visualization of positive and negative causal dependencies.

## Acknowledgments & Credits
The conceptual framework and methodologies demonstrated in this simulator are inspired by quantitative analysis models learned during studies with **WorldQuant University (WQU)**. WQU is a tuition-free, non-profit online institution specializing in quantitative education. We express our sincere gratitude for the knowledge obtained from WQU.

## References

* Ferreira, Gabriel Azevedo. "I Have a Question about Dynotears." PyPI Project Package Documentation, [https://pypi.org/project/causalnex/](https://pypi.org/project/causalnex/).
* Pamfil, Roxana, et al. "DYNOTEARS: Structure Learning from Time-Series Data." arXiv, 27 Apr 2020, [https://arxiv.org/abs/2002.00498](https://arxiv.org/abs/2002.00498).

---

*Acknowledgment: This project was built utilizing the knowledge and materials obtained from WorldQuant University.*
