const fs = require('fs');
const path = require('path');

const dataDir = './data';
const inputFile = path.join(dataDir, 'papers_scraped_2025-10-19_21-39-54.json');
const outputFile = path.join(dataDir, 'papers_clean.json');

const startingPaperId = 117;

console.log(`Iniciando limpieza del archivo: ${inputFile}`);
try {
    if (!fs.existsSync(inputFile)) {
        throw new Error(`El archivo de entrada no existe: ${inputFile}`);
    }
    const rawData = fs.readFileSync(inputFile, 'utf-8');
    const papers = JSON.parse(rawData);
    console.log(`- Se leyeron ${papers.length} papers del archivo de entrada.`);

    const uniquePapersMap = new Map();
    let currentPaperId = startingPaperId;
    let validDoisCount = 0;

    papers.forEach(paper => {
        const doi = paper.enlace;
        const isValidDoi = doi && doi !== 'No disponible';

        if (isValidDoi) {
            validDoisCount++;
            if (!uniquePapersMap.has(doi)) {
                const paperConId = {
                    paperId: currentPaperId++,
                    ...paper 
                };
                uniquePapersMap.set(doi, paperConId);
            }
        }
    });

    const uniquePapersArray = Array.from(uniquePapersMap.values());
    
    console.log(`- Se encontraron ${validDoisCount} papers con DOI válido.`);
    console.log(`- Después de filtrar duplicados por DOI, quedan ${uniquePapersArray.length} papers únicos.`);
    console.log(`- Se asignarán IDs comenzando desde ${startingPaperId}.`);

    fs.writeFileSync(outputFile, JSON.stringify(uniquePapersArray, null, 4)); // null, 4 para indentación bonita

    console.log(`\n✅ ¡Archivo limpio guardado exitosamente en: ${outputFile}!`);

} catch (error) {
    console.error("\n❌ Error durante el proceso de limpieza:", error);
}
