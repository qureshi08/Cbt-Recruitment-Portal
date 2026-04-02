const fs = require('fs');
const pdfjs = require('pdfjs-dist/build/pdf.js');
const sharp = require('sharp');

async function extract() {
    console.log("Starting...");
    console.log("PDFJS Version:", pdfjs.version);
    console.log("Sharp version:", require('sharp/package.json').version);
}
extract().catch(console.error);
