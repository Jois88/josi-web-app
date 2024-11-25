document.getElementById('fileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file.type !== 'application/pdf') {
        alert('Please select a valid PDF file.');
        return;
    }

    const fileReader = new FileReader();
    fileReader.onload = function () {
        const typedArray = new Uint8Array(this.result);
        pdfjsLib.getDocument({ data: typedArray }).promise.then(pdf => {
            // Get first page
            pdf.getPage(1).then(page => {
                const scale = 1.5;
                const viewport = page.getViewport({ scale: scale });

                // Prepare canvas using PDF page dimensions
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Render PDF page into canvas context
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                page.render(renderContext).promise.then(() => {
                    document.getElementById('pdfContent').appendChild(canvas);
                });
            });
        });
    };
    fileReader.readAsArrayBuffer(file);
});

// Voice synthesis functionality
let synth = window.speechSynthesis;
let utterance;
document.getElementById('playButton').addEventListener('click', () => {
    const text = document.getElementById('pdfContent').innerText;
    if (text.trim() === '') {
        alert('Please wait for the PDF to load.');
        return;
    }
    utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
});

document.getElementById('pauseButton').addEventListener('click', () => {
    if (synth.speaking && !synth.paused) {
        synth.pause();
    }
});

document.getElementById('stopButton').addEventListener('click', () => {
    synth.cancel();
});
