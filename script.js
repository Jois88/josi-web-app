const Tesseract = window.Tesseract;

// HTML Elements
const fileInput = document.getElementById('fileInput');
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const stopButton = document.getElementById('stopButton');
const speedControl = document.getElementById('speedControl');
const speedValue = document.getElementById('speedValue');
const pdfContent = document.getElementById('pdfContent');
const pageIndicator = document.getElementById('pageIndicator');
const progressIndicator = document.getElementById('progressIndicator');

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
                window.currentUtterance = null;
                window.isPaused = false;
                playButton.disabled = true;
                
                function processPage(pageNumber) {
                    if (pageNumber > pdf.numPages) {
                        progressIndicator.innerText = 'All pages processed successfully.';
                        return;
                    }

                    progressIndicator.innerText = `Processing page ${pageNumber} of ${pdf.numPages}...`;
                    pageIndicator.innerText = `Currently Reading Page: ${pageNumber}`;

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
                            pdfContent.innerHTML = "";
                            pdfContent.appendChild(canvas);

                            // Extract text content from the PDF page
                            page.getTextContent().then(function (textContent) {
                                let text = "";
                                for (let i = 0; i < textContent.items.length; i++) {
                                    text += textContent.items[i].str + " ";
                                }

                                if (text.trim().length > 0) {
                                    // Text found, start reading
                                    readPageText(text, pageNumber + 1);
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
                                            readPageText(text, pageNumber + 1);
                                            progressIndicator.innerText = `OCR completed for page ${pageNumber}.`;
                                        } else {
                                            progressIndicator.innerText = `OCR could not extract any text on page ${pageNumber}. Skipping...`;
                                            processPage(pageNumber + 1);
                                        }
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

                function readPageText(text, nextPage) {
                    if (window.isPaused) {
                        return;
                    }
                    
                    window.currentUtterance = new SpeechSynthesisUtterance(text);
                    setVoice(window.currentUtterance);
                    window.currentUtterance.rate = parseFloat(speedControl.value);

                    window.currentUtterance.onend = function () {
                        processPage(nextPage);
                    };

                    window.currentUtterance.onerror = function (event) {
                        console.error('Speech synthesis error:', event.error);
                        progressIndicator.innerText = `An error occurred during playback: ${event.error}`;
                        processPage(nextPage);
                    };

                    synth.speak(window.currentUtterance);
                }

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

// Load voices and ensure a voice is selected
function setVoice(utterance) {
    const availableVoices = synth.getVoices();
    if (availableVoices.length > 0) {
        utterance.voice = availableVoices.find(voice => voice.lang === 'en-US') || availableVoices[0];
    } else {
        console.warn('No available voices found. Please ensure your browser supports SpeechSynthesis voices.');
    }
}

playButton.addEventListener('click', function () {
    if (window.currentUtterance && synth.paused) {
        synth.resume();
        window.isPaused = false;
    }
});

pauseButton.addEventListener('click', function () {
    if (synth.speaking) {
        synth.pause();
        window.isPaused = true;
    }
});

stopButton.addEventListener('click', function () {
    if (synth.speaking) {
        synth.cancel();
        window.isPaused = true;
        progressIndicator.innerText = 'Speech stopped.';
    }
});

// Speed Control
speedControl.addEventListener('input', function () {
    speedValue.innerText = `${speedControl.value}x`;
    if (window.currentUtterance) {
        window.currentUtterance.rate = parseFloat(speedControl.value);
    }
});

// Trigger setVoice() when voices are loaded
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => setVoice(window.currentUtterance);
}

