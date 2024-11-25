// Include Tesseract.js to handle OCR for image-based PDFs
const Tesseract = window.Tesseract;

document.getElementById('fileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
        const fileReader = new FileReader();

        fileReader.onload = function () {
            const typedarray = new Uint8Array(this.result);

            // Load the PDF using pdf.js
            pdfjsLib.getDocument(typedarray).promise.then(function (pdf) {
                // Start reading pages from page 1
                let currentPage = 1;

                function processPage(pageNumber) {
                    if (pageNumber > pdf.numPages) {
                        alert('Reached the end of the PDF. All pages processed.');
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
                            document.getElementById('pdfContent').innerHTML = ""; // Clear existing content
                            document.getElementById('pdfContent').appendChild(canvas);

                            alert(`PDF page ${pageNumber} successfully loaded, now extracting text...`);

                            // Extract text content
                            page.getTextContent().then(function (textContent) {
                                const textItems = textContent.items;
                                let text = "";
                                for (let i = 0; i < textItems.length; i++) {
                                    text += textItems[i].str + " ";
                                }

                                if (text.trim().length > 0) {
                                    window.extractedText = (window.extractedText || "") + text + "\n";
                                    alert(`Text extraction completed for page ${pageNumber}. Moving to the next page...`);
                                    processPage(pageNumber + 1);
                                } else {
                                    // If no text found, use OCR to extract text from the image
                                    alert(`No text found on page ${pageNumber}, attempting OCR...`);
                                    Tesseract.recognize(
                                        canvas,
                                        'eng',
                                        {
                                            logger: (m) => console.log(m) // Log progress (optional)
                                        }
                                    ).then(({ data: { text } }) => {
                                        if (text.trim().length > 0) {
                                            window.extractedText = (window.extractedText || "") + text + "\n";
                                            alert(`OCR completed for page ${pageNumber}. Moving to the next page...`);
                                            processPage(pageNumber + 1);
                                        } else {
                                            alert(`OCR failed to extract any text on page ${pageNumber}. Moving to the next page...`);
                                            processPage(pageNumber + 1);
                                        }
                                    }).catch(function (error) {
                                        console.error('Error with OCR:', error);
                                        alert(`Failed to extract text using OCR on page ${pageNumber}. Moving to the next page...`);
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
                alert('Failed to load the PDF. Please try another file.');
            });
        };

        fileReader.readAsArrayBuffer(file);
        document.getElementById('playButton').disabled = true; // Disable play button initially
    } else {
        alert('Please select a valid PDF file.');
    }
});

// SpeechSynthesis functionality
let synth = window.speechSynthesis;
let utterance;
let isPaused = false;

document.getElementById('playButton').addEventListener('click', function () {
    if (window.extractedText) {
        if (!utterance || isPaused) {
            utterance = new SpeechSynthesisUtterance(window.extractedText);
            synth.speak(utterance);
            isPaused = false;
        } else {
            synth.resume();
        }
    } else {
        alert('Please wait for the PDF to load and the text to be extracted.');
    }
});

document.getElementById('pauseButton').addEventListener('click', function () {
    if (synth.speaking) {
        synth.pause();
        isPaused = true;
    }
});

document.getElementById('stopButton').addEventListener('click', function () {
    if (synth.speaking) {
        synth.cancel();
        isPaused = false;
    }
});
