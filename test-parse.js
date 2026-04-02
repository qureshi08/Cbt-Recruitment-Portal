import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';

async function testPdf() {
    try {
        const buf = fs.readFileSync('Free_Test_Data_100KB_PDF.pdf');
        const res = await pdf(buf);
        console.log("PDF Parse Success:", res.text.substring(0, 50));
    } catch (err) {
        console.error("PDF Parse Error:", err);
    }
}

testPdf();
