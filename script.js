// Include Tesseract.js to handle OCR for image-based PDFs
const Tesseract = window.Tesseract;

// HTML Elements
const fileInput = document.getElementById('fileInput');
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const stopButton = document.getElementById('stopButton');
const pdfContent = document.getElementById('pdfContent');
const speedControl = document.getElementById('speedControl');
const pageIndicator = document.getElementById('pageIndicator');

// UI Elements for better feedback
const progressIndicator = document.createElement('div');
progressIndicator.id = 'progressIndicator';
if (pdfContent && pdfContent.parentNode) {
    pdfContent.parentNode.insertBefore(progressIndicator, pdfContent);
}

// PDF.js & File Load Handler
fileInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
        const fileReader = new FileReader();

        fileReader.onload = function () {
            const typedarray = new Uint8Array(this.result);

            // Load the PDF using pdf.js
            pdfjsLib.getDocument(typedarray).promise.then(function (pdf) {
                let currentPage = 1;
                window.extractedText = ""; // Reset extracted text

                function processPage(pageNumber) {
                    if (pageNumber > pdf.numPages) {
                        if (progressIndicator) {
                            progressIndicator.innerText = 'All pages processed successfully. Starting playback...';
                        }
                        playButton.disabled = false;
                        return;
                    }

                    if (progressIndicator) {
                        progressIndicator.innerText = `Processing page ${pageNumber} of ${pdf.numPages}...`;
                    }
                    if (pageIndicator) {
                        pageIndicator.innerText = `Currently Reading Page: ${pageNumber}`;
                    }

                    pdf.getPage(pageNumber).then(function (page) {
                        const scale = 1.5;
                        const viewport = page.getViewport({ scale: scale });

                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        const renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };

                        // Render the page
                        page.render(renderContext).promise.then(function () {
                            // Clear existing content and append new canvas
                            pdfContent.innerHTML = ""; 
                            pdfContent.appendChild(canvas);

                            // Extract text content from the PDF page
                            page.getTextContent().then(function (textContent) {
                                let text = "";
                                for (let i = 0; i < textContent.items.length; i++) {
                                    text += textContent.items[i].str + " ";
                                }

                                if (text.trim().length > 0) {
                                    // Text found, add to extractedText
                                    window.extractedText += text + "\n";
                                    processPage(pageNumber + 1);
                                } else {
                                    // No text found, initiate OCR
                                    if (progressIndicator) {
                                        progressIndicator.innerText = `No text found on page ${pageNumber}. Performing OCR...`;
                                    }

                                    Tesseract.recognize(
                                        canvas,
                                        'eng',
                                        {
                                            logger: (m) => console.log(m)
                                        }
                                    ).then(({ data: { text } }) => {
                                        if (text.trim().length > 0) {
                                            window.extractedText += text + "\n";
                                            if (progressIndicator) {
                                                progressIndicator.innerText = `OCR completed for page ${pageNumber}. Moving to the next page...`;
                                            }
                                        } else {
                                            if (progressIndicator) {
                                                progressIndicator.innerText = `OCR could not extract any text on page ${pageNumber}. Skipping...`;
                                            }
                                        }
                                        processPage(pageNumber + 1);
                                    }).catch(function (error) {
                                        console.error('Error during OCR:', error);
                                        if (progressIndicator) {
                                            progressIndicator.innerText = `OCR failed on page ${pageNumber}. Skipping...`;
                                        }
                                        processPage(pageNumber + 1);
                                    });
                                }
                            }).catch(function (error) {
                                console.error('Error extracting text:', error);
                                if (progressIndicator) {
                                    progressIndicator.innerText = `Failed to extract text from page ${pageNumber}. Skipping...`;
                                }
                                processPage(pageNumber + 1);
                            });
                        }).catch(function (error) {
                            console.error('Error rendering page:', error);
                            if (progressIndicator) {
                                progressIndicator.innerText = `Failed to render page ${pageNumber}. Skipping...`;
                            }
                            processPage(pageNumber + 1);
                        });
                    }).catch(function (error) {
                        console.error('Error getting page:', error);
                        if (progressIndicator) {
                            progressIndicator.innerText = `Failed to retrieve page ${pageNumber}. Skipping...`;
                        }
                        processPage(pageNumber + 1);
                    });
                }

                // Start processing the first page
                processPage(currentPage);
            }).catch(function (error) {
                console.error('Error loading PDF:', error);
                if (progressIndicator) {
                    progressIndicator.innerText = 'Failed to load the PDF. Please try again with another file.';
                }
            });
        };

        fileReader.readAsArrayBuffer(file);
        playButton.disabled = true; // Disable play button until text is ready
    } else {
        alert('Please select a valid PDF file.');
    }
});

// SpeechSynthesis Functionality
let synth = window.speechSynthesis;
let utterance;
let isPaused = false;
let availableVoices = [];

// Load voices and ensure a voice is selected
function setVoice() {
    availableVoices = synth.getVoices();
    if (availableVoices.length > 0 && utterance) {
        utterance.voice = availableVoices.find(voice => voice.lang === 'en-US') || availableVoices[0];
    } else {
        console.warn('No available voices found. Please ensure your browser supports SpeechSynthesis voices.');
    }
}

// Rest of your play, pause, stop, and speedControl event handlers remain the same...

