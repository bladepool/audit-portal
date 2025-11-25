# Inheritance Diagrams

This folder contains inheritance diagram PNG images generated from **Solidity Metrics** tool.

## How to Generate

1. Install Solidity Metrics: `npm install -g solidity-code-metrics`
2. Run: `solidity-code-metrics YourContract.sol > metrics.md`
3. The tool generates an inheritance diagram
4. Export/save the diagram as PNG
5. Upload the PNG file here with naming convention: `projectname-inheritance.png`

## Usage

- Upload PNG files to this directory
- In the admin panel, enable "Include Inheritance Diagram" toggle
- Enter the path: `/inheritance/projectname-inheritance.png`
- The image will be included in the generated PDF audit report

## File Naming Convention

Format: `projectname-inheritance.png`

Examples:
- pecunity-inheritance.png
- dogmaga-inheritance.png
- sakuraai-inheritance.png

## Alternative Method

If you cannot use Solidity Metrics tool:
1. Manually upload any inheritance/architecture diagram PNG
2. Place it in this folder
3. Reference it in the admin form
