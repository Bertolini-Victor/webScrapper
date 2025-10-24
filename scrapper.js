// 1. Importar las librerías necesarias
const puppeteer = require('puppeteer');
const fs = require('fs');

// 2. Lista de perfiles de ORCID a "scrapear"
const orcidUrls = [
    'https://orcid.org/0000-0001-8296-1291',
    'https://orcid.org/0000-0002-3923-8038',
    'https://orcid.org/0000-0001-8557-7500',
    'https://orcid.org/0000-0003-1129-9776'
];

// --- FUNCIÓN PRINCIPAL ASÍNCRONA ---
async function scrapeData() {
    console.log('Iniciando el scraper...');
    const browser = await puppeteer.launch({ headless: 'new' }); 
    const todosLosPapers = []; 

    for (const url of orcidUrls) {
        console.log(`\nProcesando perfil: ${url}`);
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(60000);

        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
        });

        await page.goto(url, { waitUntil: 'domcontentloaded' });

        try {
            const cookieButtonSelector = '#onetrust-accept-btn-handler';
            await page.waitForSelector(cookieButtonSelector, { timeout: 5000 });
            await page.click(cookieButtonSelector);
            console.log('- Banner de cookies aceptado.');
        } catch (error) {
            console.log('- No se encontró el banner de cookies, continuando...');
        }
        
        // ✅ CAMBIO 1: Añadimos una pausa inicial para que la SPA se estabilice.
        console.log('- Esperando a que la aplicación se cargue completamente...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // --- LÓGICA DE PAGINACIÓN ---
        let paginaActual = 1;
        while (true) {
            console.log(`- Escaneando página ${paginaActual}...`);
            
            try {
                await page.waitForSelector('#cy-works', { timeout: 60000 });
                await page.waitForSelector('h4.work-title', { timeout: 60000 });
            } catch (error) {
                console.log('- No se encontraron trabajos en esta página. Finalizando este perfil.');
                break;
            }

            const papersEnPagina = await page.$$eval('app-work-stack', (items) => {
                return items.map(item => {
                    try {
                        const titulo = item.querySelector('h4.work-title')?.innerText.trim() || 'Título no encontrado';
                        let fecha = 'N/A';
                        let publicadoEn = 'N/A';
                        let autores = 'N/A';

                        const generalDataElements = item.querySelectorAll('.general-data');
                        const dataTexts = Array.from(generalDataElements).map(el => el.innerText.trim());

                        const contributorsLine = dataTexts.find(text => text.startsWith('CONTRIBUTORS:'));
                        if (contributorsLine) {
                            autores = contributorsLine.replace('CONTRIBUTORS:', '').trim();
                        }

                        const dateLine = dataTexts.find(text => /^\d{4}/.test(text));
                        if (dateLine) {
                            fecha = dateLine.split('|')[0].trim();
                        }
                        
                        const journalLine = dataTexts.find(text => text && !text.startsWith('CONTRIBUTORS:') && !/^\d{4}/.test(text));
                        if (journalLine) {
                            publicadoEn = journalLine;
                        }

                        const doiElement = item.querySelector('a[href*="doi.org"]');
                        const enlace = doiElement ? doiElement.href : 'No disponible';

                        if (autores.endsWith(';')) {
                            autores = autores.slice(0, -1);
                        }

                        return {
                            fechaPublicacion: fecha ? fecha.substring(0, 4) : 'N/A',
                            titulo: titulo,
                            publicadoEn: publicadoEn,
                            enlace: enlace,
                            autores: autores
                        };
                    } catch (e) {
                        return null;
                    }
                }).filter(p => p);
            });

            todosLosPapers.push(...papersEnPagina);
            console.log(`  > Se encontraron ${papersEnPagina.length} trabajos en esta página.`);

            const botonSiguienteSelector = 'button.mat-mdc-paginator-navigation-next';
            const botonSiguiente = await page.$(botonSiguienteSelector);

            if (botonSiguiente && !(await page.$eval(botonSiguienteSelector, btn => btn.disabled))) {
                try {
                    const paginatorLabelSelector = '.mat-mdc-paginator-range-label';
                    const paginatorTextBefore = await page.$eval(paginatorLabelSelector, el => el.innerText);
                    
                    await page.click(botonSiguienteSelector);
                    
                    console.log('  > Clic en "Siguiente", esperando actualización...');
                    
                    // Mantenemos la pausa fija para dar tiempo a la SPA a reaccionar.
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    await page.waitForFunction(
                        (selector, textBefore) => {
                            const currentText = document.querySelector(selector)?.innerText;
                            return currentText && currentText !== textBefore;
                        },
                        { timeout: 60000 },
                        paginatorLabelSelector,
                        paginatorTextBefore
                    );

                    console.log('  > Carga de nueva página completada.');
                    paginaActual++;
                } catch (e) {
                    console.log(`- Error al pasar a la siguiente página: ${e.message}. Asumiendo que es la última página.`);
                    break;
                }
            } else {
                console.log('- No hay más páginas en este perfil.');
                break;
            }
        }
        await page.close();
    }

    await browser.close();

    console.log(`\nProceso finalizado. Total de papers encontrados: ${todosLosPapers.length}`);
    
    const papersUnicos = Array.from(new Map(todosLosPapers.map(p => [`${p.titulo}-${p.enlace}`, p])).values());
    console.log(`Papers únicos después de filtrar duplicados: ${papersUnicos.length}`);

    const dir = './data';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
        console.log(`- Carpeta '${dir}' creada.`);
    }

    const date = new Date();
    const timestamp = date.getFullYear() + '-' +
                      ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
                      ('0' + date.getDate()).slice(-2) + '_' +
                      ('0' + date.getHours()).slice(-2) + '-' +
                      ('0' + date.getMinutes()).slice(-2) + '-' +
                      ('0' + date.getSeconds()).slice(-2);
    
    const newFileName = `${dir}/papers_scraped_${timestamp}.json`;

    fs.writeFileSync(newFileName, JSON.stringify(papersUnicos, null, 4));

    console.log(`\n✅ ¡Se ha creado un nuevo archivo: ${newFileName}!`);
}

scrapeData();

