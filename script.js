// Include Tesseract.js to handle OCR for image-based PDFs
const Tesseract = window.Tesseract;

// HTML Elements
const fileInput = document.getElementById('fileInput');
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const stopButton = document.getElementById('stopButton');
const pdfContent = document.getElementById('pdfContent');

// UI Elements for better feedback
const progressIndicator = document.createElement('div');
progressIndicator.id = 'progressIndicator';
pdfContent.parentNode.insertBefore(progressIndicator, pdfContent);

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
                        progressIndicator.innerText = 'All pages processed successfully. Starting playback...';
                        playButton.disabled = false;
                        return;
                    }

                    progressIndicator.innerText = `Processing page ${pageNumber} of ${pdf.numPages}...`;

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
                                    progressIndicator.innerText = `No text found on page ${pageNumber}. Performing OCR...`;

                                    Tesseract.recognize(
                                        canvas,
                                        'eng',
                                        {
                                            logger: (m) => console.log(m)
                                        }
                                    ).then(({ data: { text } }) => {
                                        if (text.trim().length > 0) {
                                            window.extractedText += text + "\n";
                                            progressIndicator.innerText = `OCR completed for page ${pageNumber}. Moving to the next page...`;
                                        } else {
                                            progressIndicator.innerText = `OCR could not extract any text on page ${pageNumber}. Skipping...`;
                                        }
                                        processPage(pageNumber + 1);
                                    }).catch(function (error) {
                                        console.error('Error during OCR:', error);
                                        progressIndicator.innerText = `OCR failed on page ${pageNumber}. Skipping...`;
                                        processPage(pageNumber + 1);
                                    });
                                }
                            }).catch(function (error) {
                                console.error('Error extracting text:', error);
                                progressIndicator.innerText = `Failed to extract text from page ${pageNumber}. Skipping...`;
                                processPage(pageNumber + 1);
                            });
                        }).catch(function (error) {
                            console.error('Error rendering page:', error);
                            progressIndicator.innerText = `Failed to render page ${pageNumber}. Skipping...`;
                            processPage(pageNumber + 1);
                        });
                    }).catch(function (error) {
                        console.error('Error getting page:', error);
                        progressIndicator.innerText = `Failed to retrieve page ${pageNumber}. Skipping...`;
                        processPage(pageNumber + 1);
                    });
                }

                // Start processing the first page
                processPage(currentPage);
            }).catch(function (error) {
                console.error('Error loading PDF:', error);
                progressIndicator.innerText = 'Failed to load the PDF. Please try again with another file.';
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

playButton.addEventListener('click', function () {
    if (window.extractedText) {
        if (!utterance || synth.paused) {
            if (!utterance || synth.paused === false) {
                utterance = new SpeechSynthesisUtterance(window.extractedText);
                setVoice(); // Set the voice before speaking
                utterance.rate = 1; // Set rate of speech
                utterance.pitch = 1; // Set pitch of speech

                utterance.onstart = function () {
                    console.log('Speech has started.');
                };

                utterance.onend = function () {
                    console.log('Speech has ended.');
                };

                utterance.onerror = function (event) {
                    console.error('Speech synthesis error:', event.error);
                    progressIndicator.innerText = `An error occurred during playback: ${event.error}`;
                };

                synth.speak(utterance);
            } else {
                synth.resume();
            }
        } else {
            synth.resume();
        }
        isPaused = false;
    } else {
        progressIndicator.innerText = 'Please wait for the PDF text extraction to complete.';
    }
});

pauseButton.addEventListener('click', function () {
    if (synth.speaking && !synth.paused) {
        synth.pause();
        isPaused = true;
        console.log('Speech paused.');
    }
});

stopButton.addEventListener('click', function () {
    if (synth.speaking || isPaused) {
        synth.cancel();
        utterance = null; // Reset the utterance to enable fresh playback
        isPaused = false;
        console.log('Speech stopped.');
    }
});

// Trigger setVoice() when voices are loaded
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = setVoice;
}
