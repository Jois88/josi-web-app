const Tesseract = window.Tesseract;

// HTML Elements
const fileInput = document.getElementById('fileInput');
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const stopButton = document.getElementById('stopButton');
const nextPageButton = document.createElement('button');
const speedControl = document.getElementById('speedControl');
const speedValue = document.getElementById('speedValue');
const pageIndicator = document.getElementById('pageIndicator');
const progressIndicator = document.getElementById('progressIndicator');
const pdfContent = document.getElementById('pdfContent');

// Add Next Page button
nextPageButton.textContent = "Next Page";
nextPageButton.id = "nextPageButton";
nextPageButton.style.display = "none"; // Hide initially
document.querySelector('.controls').appendChild(nextPageButton);

// Variables for PDF and Speech
let pdfDocument = null;
let currentPage = 1;
let isPaused = false;
let synth = window.speechSynthesis;
let utterance;
let stopRequested = false;

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
                currentPage = 1; // Ensure starting from the first page
                progressIndicator.innerText = "PDF loaded. Ready to start.";
                playButton.disabled = false;
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

playButton.addEventListener('click', function () {
    stopRequested = false;
    if (!pdfDocument) {
        progressIndicator.innerText = "Please load a PDF before starting playback.";
        return;
    }
    isPaused = false;
    processAndReadPage(currentPage);
});

pauseButton.addEventListener('click', function () {
    if (synth.speaking) {
        synth.pause();
        isPaused = true;
        progressIndicator.innerText = "Playback paused.";
    }
});

stopButton.addEventListener('click', function () {
    if (synth.speaking) {
        synth.cancel();
        stopRequested = true;
        isPaused = false;
        progressIndicator.innerText = "Playback stopped.";
    }
});

nextPageButton.addEventListener('click', function () {
    if (currentPage <= pdfDocument.numPages) {
        processAndReadPage(currentPage);
    } else {
        progressIndicator.innerText = "No more pages to process.";
    }
});

function processAndReadPage(pageNumber) {
    if (pageNumber > pdfDocument.numPages) {
        progressIndicator.innerText = "All pages read successfully.";
        nextPageButton.style.display = "none"; // Hide Next Page button
        return;
    }

    if (stopRequested) {
        return;
    }

    pageIndicator.innerText = `Currently Reading Page: ${pageNumber}`;
    progressIndicator.innerText = `Processing page ${pageNumber}...`;

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

        // Render the page to the canvas
        page.render(renderContext).promise.then(function () {
            pdfContent.innerHTML = ""; // Clear previous page
            pdfContent.appendChild(canvas);

            // Extract text content
            page.getTextContent().then(function (textContent) {
                let text = "";
                textContent.items.forEach(item => {
                    text += item.str + " ";
                });

                if (text.trim()) {
                    readTextAloud(text, pageNumber);
                } else {
                    // If no text is found, perform OCR
                    performOCR(canvas, pageNumber);
                }
            }).catch(function (error) {
                console.error("Error extracting text:", error);
                progressIndicator.innerText = `Failed to extract text from page ${pageNumber}. Would you like to skip this page?`;
                nextPageButton.style.display = "inline"; // Show Next Page button
            });
        });
    }).catch(function (error) {
        console.error("Error rendering page:", error);
        progressIndicator.innerText = `Failed to render page ${pageNumber}. Would you like to skip this page?`;
        nextPageButton.style.display = "inline"; // Show Next Page button
    });
}

function performOCR(canvas, pageNumber) {
    progressIndicator.innerText = `Performing OCR on page ${pageNumber}...`;

    Tesseract.recognize(canvas, 'eng', {
        logger: (m) => console.log(m),
    }).then(({ data: { text } }) => {
        if (text.trim()) {
            readTextAloud(text, pageNumber);
        } else {
            progressIndicator.innerText = `No text found on page ${pageNumber}. Would you like to skip this page?`;
            nextPageButton.style.display = "inline"; // Show Next Page button
        }
    }).catch(function (error) {
        console.error("Error during OCR:", error);
        progressIndicator.innerText = `OCR failed on page ${pageNumber}. Would you like to skip this page?`;
        nextPageButton.style.display = "inline"; // Show Next Page button
    });
}

function readTextAloud(text, pageNumber) {
    if (stopRequested) {
        return;
    }

    utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = parseFloat(speedControl.value);

    utterance.onstart = function () {
        progressIndicator.innerText = `Reading page ${pageNumber}...`;
    };

    utterance.onend = function () {
        nextPageButton.style.display = "inline"; // Show Next Page button after reading
        progressIndicator.innerText = `Finished reading page ${pageNumber}. Click 'Next Page' to continue.`;
        currentPage++; // Increment the page
    };

    utterance.onerror = function (event) {
        console.error("SpeechSynthesis error:", event);
        progressIndicator.innerText = "An error occurred during playback.";
        nextPageButton.style.display = "inline"; // Show Next Page button
    };

    synth.speak(utterance);
}
