document.getElementById('fileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
        const fileReader = new FileReader();

        fileReader.onload = function () {
            const typedarray = new Uint8Array(this.result);

            // Load the PDF using pdf.js
            pdfjsLib.getDocument(typedarray).promise.then(function (pdf) {
                pdf.getPage(1).then(function (page) {
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
                    page.render(renderContext).promise.then(function () {
                        document.getElementById('pdfContent').innerHTML = ""; // Clear existing content
                        document.getElementById('pdfContent').appendChild(canvas);
                        alert('PDF has successfully loaded, now extracting text...');

                        // Extract text content
                        page.getTextContent().then(function (textContent) {
                            const textItems = textContent.items;
                            let text = "";
                            for (let i = 0; i < textItems.length; i++) {
                                text += textItems[i].str + " ";
                            }

                            if (text.trim().length > 0) {
                                window.extractedText = text;
                                document.getElementById('playButton').disabled = false; // Enable play button
                                alert('Text extraction completed, you can now play the audio.');
                            } else {
                                alert('No text found in the PDF page, please choose another file.');
                            }
                        }).catch(function (error) {
                            console.error('Error extracting text:', error);
                            alert('Failed to extract text from the PDF. Please try again with another file.');
                        });
                    }).catch(function (error) {
                        console.error('Error rendering page:', error);
                        alert('Failed to render the PDF page.');
                    });
                }).catch(function (error) {
                    console.error('Error getting page:', error);
                    alert('Failed to retrieve the page from the PDF.');
                });
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
