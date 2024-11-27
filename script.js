const Tesseract = window.Tesseract;

// HTML Elements
const fileInput = document.getElementById('fileInput');
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const stopButton = document.getElementById('stopButton');
const speedControl = document.getElementById('speedControl');
const speedValue = document.getElementById('speedValue');
const pageIndicator = document.getElementById('pageIndicator');
const progressIndicator = document.getElementById('progressIndicator');
const pdfContent = document.getElementById('pdfContent');

// Variables for PDF and Speech
let pdfDocument = null;
let currentPage = 1;
let isPaused = false;
let synth = window.speechSynthesis;
let utterance;
let extractedText = ""; // Text for playback

// Event Listeners
speedControl.addEventListener('input', function () {
    speedValue.innerText = `${speedControl.value}x`;
    if (utterance) {
        utterance.rate = parseFloat(speedControl.value);
    }
});

fileInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
        const fileReader = new FileReader();
        fileReader.onload = function () {
            const typedArray = new Uint8Array(this.result);
            pdfjsLib.getDocument(typedArray).promise.then(function (pdf) {
                pdfDocument = pdf;
                extractedText = ""; // Reset extracted text
                currentPage = 1; // Start from the first page
                processPage(currentPage);
            }).catch(function (error) {
                console.error("Error loading PDF:", error);
                progressIndicator.innerText = "Failed to load the PDF. Please try again.";
            });
        };
        fileReader.readAsArrayBuffer(file);
    } else {
        alert("Please upload a valid PDF file.");
    }
});

function processPage(pageNumber) {
    if (pageNumber > pdfDocument.numPages) {
        progressIndicator.innerText = "All pages processed successfully. Starting playback...";
        playAudio();
        return;
    }

    pageIndicator.innerText = `Currently Reading Page: ${pageNumber}`;
    progressIndicator.innerText = `Processing page ${pageNumber} of ${pdfDocument.numPages}...`;

    pdfDocument.getPage(pageNumber).then(function (page) {
        const scale = 1.5;
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };

        page.render(renderContext).promise.then(function () {
            // Extract text from the page
            page.getTextContent().then(function (textContent) {
                let text = "";
                textContent.items.forEach(item => {
                    text += item.str + " ";
                });

                if (text.trim()) {
                    extractedText += text + "\n";
                    processPage(pageNumber + 1);
                } else {
                    // Perform OCR if no text found
                    performOCR(canvas, pageNumber);
                }
            }).catch(function (error) {
                console.error("Error extracting text:", error);
                progressIndicator.innerText = `Failed to extract text from page ${pageNumber}. Skipping...`;
                processPage(pageNumber + 1);
            });
        });
    }).catch(function (error) {
        console.error("Error rendering page:", error);
        progressIndicator.innerText = `Failed to render page ${pageNumber}. Skipping...`;
        processPage(pageNumber + 1);
    });
}

function performOCR(canvas, pageNumber) {
    progressIndicator.innerText = `Performing OCR on page ${pageNumber}...`;

    Tesseract.recognize(canvas, 'eng', {
        logger: (m) => console.log(m),
    }).then(({ data: { text } }) => {
        if (text.trim()) {
            extractedText += text + "\n";
            progressIndicator.innerText = `OCR completed for page ${pageNumber}.`;
        } else {
            progressIndicator.innerText = `OCR found no text on page ${pageNumber}.`;
        }
        processPage(pageNumber + 1);
    }).catch(function (error) {
        console.error("Error during OCR:", error);
        progressIndicator.innerText = `OCR failed on page ${pageNumber}. Skipping...`;
        processPage(pageNumber + 1);
    });
}

function playAudio() {
    if (!extractedText.trim()) {
        progressIndicator.innerText = "No text to read. Please upload a valid PDF.";
        return;
    }

    if (isPaused && utterance) {
        synth.resume();
        isPaused = false;
        return;
    }

    utterance = new SpeechSynthesisUtterance(extractedText);
    utterance.rate = parseFloat(speedControl.value);

    utterance.onstart = function () {
        progressIndicator.innerText = "Reading started.";
    };

    utterance.onend = function () {
        progressIndicator.innerText = "Reading finished.";
    };

    utterance.onerror = function (event) {
        console.error("SpeechSynthesis error:", event);
        progressIndicator.innerText = "An error occurred during playback.";
    };

    synth.speak(utterance);
}

playButton.addEventListener('click', playAudio);

pauseButton.addEventListener('click', function () {
    if (synth.speaking && !synth.paused) {
        synth.pause();
        isPaused = true;
        progressIndicator.innerText = "Reading paused.";
    }
});

stopButton.addEventListener('click', function () {
    if (synth.speaking) {
        synth.cancel();
        isPaused = false;
        progressIndicator.innerText = "Reading stopped.";
    }
});
