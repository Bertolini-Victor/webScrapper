# Scraper de Publicaciones ORCID con Puppeteer

Este es un script de Node.js diseñado para extraer automáticamente información
de publicaciones científicas (papers) desde perfiles públicos de ORCID. Utiliza
la librería Puppeteer para controlar un navegador headless (Chromium), lo que le
permite interactuar con páginas dinámicas construidas con JavaScript y manejar
la paginación. A su vez tambien hay un script de filtrado por DOI por si hay
repetidos que no se filtren en el scrapping por algun typo.

El objetivo principal de este scraper es recolectar datos actualizados para
alimentar el archivo papers.json utilizado en el sitio web del
[Laboratorio de Fisiología y Genética de Bacterias Beneficiosas para Plantas (LFGGBP)](https://lfgbbp.github.io/)

## ✨ Funcionalidades Principales

* Extracción de Múltiples Perfiles: Procesa una lista predefinida de URLs de ORCID.

* Manejo de Contenido Dinámico: Utiliza Puppeteer para esperar a que el contenido
cargado por JavaScript esté presente.

* Aceptación Automática de Cookies: Detecta y acepta el banner de cookies para
evitar que interfiera.

* Navegación por Paginación: Simula clics en el botón "Siguiente" y espera de
forma inteligente a que cargue el nuevo contenido.

* Extracción Robusta de Datos: Identifica y extrae los siguientes campos para
cada paper:

  * Año de Publicación (fechaPublicacion)
  * Título (titulo)
  * Nombre de la Revista/Publicación (publicadoEn)
  * Enlace DOI (enlace)
  * Lista de Autores/Colaboradores (autores)

* Filtrado de Duplicados: Elimina entradas duplicadas basándose en el título y
el enlace DOI. Ademas de exitir el archivo *cleaner.js* para generar un filtro
por DOI extra en caso de que haya formateo distintos en los perfiles
que puedan colaborar entre si.

* Salida Organizada: Guarda los datos recolectados en un nuevo archivo JSON con
marca de tiempo (ej: papers_scraped_YYYY-MM-DD_HH-mm-ss.json) en la carpeta
./data/. Ademas el archivo *cleaner.js* crea su propio archivo JSON llamado
papers_clean.json en la misma carpeta.

## 💻 Tecnologías Utilizadas

* Node.js: Entorno de ejecución para JavaScript del lado del servidor.

* Puppeteer: Librería de Node.js para controlar Chrome/Chromium.

* JavaScript (ES6+): Lenguaje principal, utilizando async/await para manejar
operaciones asíncronas.

## 🚀 Cómo Usarlo

Pre-requisitos:

* Tener Node.js y npm instalados en tu sistema. Puedes descargarlos desde nodejs.org.

Pasos:

1. Clona el repositorio:

     ~~~git
     git clone https://github.com/Bertolini-Victor/webScrapper.git
     ~~~

2. Navega al directorio:

     ~~~Powershell
     cd [webScrapper]
     ~~~

3. Instala las dependencias:

     ~~~ npm
     npm install
     ~~~

     *(Esto descargará Puppeteer y la versión de Chromium necesaria)*

4. Edita las URLs: Abre el archivo scraper.js y modifica la lista orcidUrls con
     las URLs de ORCID que necesites.

5. Ejecuta el script:

     ~~~ Node.js
     node scraper.js
     ~~~

6. Revisa los resultados: Una vez que el script termine (puede tardar unos minutos),
encontrarás un nuevo archivo JSON con los datos extraídos dentro de la carpeta ./data/.

### ⚠️ Notas Importantes

* Fragilidad: Los web scrapers dependen de la estructura HTML del sitio objetivo.
Si ORCID cambia el diseño de sus páginas, este script podría dejar de funcionar
y necesitará ser actualizado.

* Respeto por el Sitio Web: Este script está diseñado para extraer información
pública. Evita ejecutarlo con demasiada frecuencia para no sobrecargar los
servidores de ORCID.

### 📄 Licencia

* Este proyecto está bajo la Licencia MIT. Consulta el archivo LICENSE para más detalles.

### 👤 Autor

* *Victor Bertolini Agaras*
* GitHub: @Bertolini-Victor
