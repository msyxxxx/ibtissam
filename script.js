document.getElementById('upload-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const fileInput = document.getElementById('pdf-file');
    const summaryType = document.getElementById('summary-type').value;

    if (!fileInput.files.length) {
        alert('يرجى اختيار ملف PDF');
        return;
    }

    const file = fileInput.files[0];
    if (file.type !== 'application/pdf') {
        alert('يرجى اختيار ملف بصيغة PDF فقط.');
        return;
    }

    // قراءة ملف PDF باستخدام pdf.js
    const reader = new FileReader();
    reader.onload = async function () {
        const pdfData = new Uint8Array(reader.result);

        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            textContent.items.forEach(item => {
                fullText += item.str + ' ';
            });
        }

        // استدعاء نوع التلخيص المختار
        if (summaryType === 'simple') {
            summarizeSimple(fullText);
        } else if (summaryType === 'advanced') {
            summarizeAdvanced(fullText);
        }
    };

    reader.readAsArrayBuffer(file);
});

// التلخيص البسيط
function summarizeSimple(text) {
    const sentences = text.split('.').filter(sentence => sentence.trim().length > 0);
    const summary = sentences.slice(0, 5); // استخراج أول 5 جمل

    displaySummary(summary);
}

// التلخيص المتقدم باستخدام TF-IDF
function summarizeAdvanced(text) {
    const sentences = text.split('.').filter(sentence => sentence.trim().length > 0);
    const tokenizer = new natural.WordTokenizer();
    const tfidf = new natural.TfIdf();

    sentences.forEach(sentence => tfidf.addDocument(tokenizer.tokenize(sentence)));

    const scoredSentences = sentences.map((sentence, index) => ({
        text: sentence,
        score: tfidf.tfidfs(sentence, index)
    }));

    const sortedSentences = scoredSentences.sort((a, b) => b.score - a.score);
    const summary = sortedSentences.slice(0, 5).map(item => item.text);

    displaySummary(summary);
}

// عرض التلخيص على الشاشة
function displaySummary(summary) {
    document.getElementById('summary').innerText = summary.join('\n\n');
    document.getElementById('summary-container').style.display = 'block';

    // تحميل التلخيص
    document.getElementById('download-summary').onclick = () => {
        const blob = new Blob([summary.join('\n\n')], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'summary.txt';
        link.click();
    };
}
