// Include Tesseract.js to handle OCR for image-based PDFs
const Tesseract = window.Tesseract;

// HTML Elements
const fileInput = document.getElementById('fileInput');
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const stopButton = document.getElementById('stopButton');
const pdfContent = document.getElementById('pdfContent');

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

                function processPage(pageNumber) {
                    if (pageNumber > pdf.numPages) {
                        alert('All pages processed successfully.');
                        return;
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
                            pdfContent.innerHTML = ""; // Clear existing content
                            pdfContent.appendChild(canvas);

                            // Loading message while extracting text
                            alert(`Processing page ${pageNumber}. Please wait...`);

                            // Extract text content from the PDF page
                            page.getTextContent().then(function (textContent) {
                                let text = "";
                                for (let i = 0; i < textContent.items.length; i++) {
                                    text += textContent.items[i].str + " ";
                                }

                                if (text.trim().length > 0) {
                                    // Text found in PDF, append to extracted text
                                    window.extractedText = (window.extractedText || "") + text + "\n";
                                    processPage(pageNumber + 1); // Move to the next page
                                } else {
                                    // No text found, initiate OCR
                                    alert(`No text found on page ${pageNumber}, attempting OCR...`);

                                    Tesseract.recognize(
                                        canvas,
                                        'eng',
                                        {
                                            logger: (m) => console.log(m)
                                        }
                                    ).then(({ data: { text } }) => {
                                        if (text.trim().length > 0) {
                                            // Append OCR extracted text
                                            window.extractedText = (window.extractedText || "") + text + "\n";
                                            alert(`OCR completed for page ${pageNumber}. Moving to the next page...`);
                                        } else {
                                            alert(`OCR could not extract any text on page ${pageNumber}.`);
                                        }
                                        processPage(pageNumber + 1); // Move to the next page
                                    }).catch(function (error) {
                                        console.error('Error during OCR:', error);
                                        alert(`OCR failed on page ${pageNumber}. Moving to the next page...`);
                                        processPage(pageNumber + 1);
                                    });
                                }
                            }).catch(function (error) {
                                console.error('Error extracting text:', error);
                                alert(`Failed to extract text from page ${pageNumber}. Moving to the next page...`);
                                processPage(pageNumber + 1);
                            });
                        }).catch(function (error) {
                            console.error('Error rendering page:', error);
                            alert(`Failed to render page ${pageNumber}. Moving to the next page...`);
                            processPage(pageNumber + 1);
                        });
                    }).catch(function (error) {
                        console.error('Error getting page:', error);
                        alert(`Failed to retrieve page ${pageNumber}. Moving to the next page...`);
                        processPage(pageNumber + 1);
                    });
                }

                // Start processing the first page
                processPage(currentPage);
            }).catch(function (error) {
                console.error('Error loading PDF:', error);
                alert('Failed to load the PDF. Please try again with another file.');
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

playButton.addEventListener('click', function () {
    if (window.extractedText) {
        if (!utterance || isPaused) {
            utterance = new SpeechSynthesisUtterance(window.extractedText);
            synth.speak(utterance);
            isPaused = false;
        } else {
            synth.resume();
        }
    } else {
        alert('Please wait for the PDF text extraction to complete.');
    }
});

pauseButton.addEventListener('click', function () {
    if (synth.speaking) {
        synth.pause();
        isPaused = true;
    }
});

stopButton.addEventListener('click', function () {
    if (synth.speaking) {
        synth.cancel();
        isPaused = false;
    }
});
