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

    const reader = new FileReader();
    reader.onload = async function () {
        const pdfData = new Uint8Array(reader.result);

        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            textContent.items.forEach(item => {
                fullText += item.str + ' ';
            });
        }

        // اختيار نوع التلخيص
        let summary = summaryType === 'simple' ? summarizeSimple(fullText) : summarizeAdvanced(fullText);
        displaySummary(summary);
    };

    reader.readAsArrayBuffer(file);
});

// التلخيص البسيط
function summarizeSimple(text) {
    const sentences = text.split('.').filter(sentence => sentence.trim().length > 0);
    return sentences.slice(0, 5).join('. ') + '.';
}

// التلخيص المتقدم
function summarizeAdvanced(text) {
    const sentences = text.split('.').filter(sentence => sentence.trim().length > 0);
    const scores = sentences.map(sentence => ({
        sentence,
        score: sentence.split(' ').length
    }));
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, 5).map(item => item.sentence).join('. ') + '.';
}

// عرض التلخيص
function displaySummary(summary) {
    const summaryContainer = document.getElementById('summary-container');
    const summaryText = document.getElementById('summary');

    summaryText.value = summary;
    summaryContainer.style.display = 'block';

    document.getElementById('download-summary').onclick = () => {
        const format = document.getElementById('file-format').value;
        downloadSummary(summary, format);
    };
}

// تنزيل التلخيص
function downloadSummary(summary, format) {
    const blob = new Blob([summary], { type: format === 'txt' ? 'text/plain' : 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `summary.${format}`;
    link.click();
}
