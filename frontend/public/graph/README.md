# Call Graph Images

This folder contains call graph PNG images generated from **Solidity Metrics** tool.

## How to Generate

1. Install Solidity Metrics: `npm install -g solidity-code-metrics`
2. Run: `solidity-code-metrics YourContract.sol > metrics.md`
3. The tool generates a call graph diagram
4. Export/save the graph as PNG
5. Upload the PNG file here with naming convention: `projectname-graph.png`

## Usage

- Upload PNG files to this directory
- In the admin panel, enable "Include Call Graph" toggle
- Enter the path: `/graph/projectname-graph.png`
- The image will be included in the generated PDF audit report

## File Naming Convention

Format: `projectname-graph.png`

Examples:
- pecunity-graph.png
- dogmaga-graph.png
- sakuraai-graph.png
