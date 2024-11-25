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
                        document.getElementById('pdfContent').appendChild(canvas);
                        document.getElementById('playButton').disabled = false; // Enable play button
                        alert('PDF has successfully loaded, you can now play the audio.');
                    });

                    // Extract text content
                    page.getTextContent().then(function (textContent) {
                        const textItems = textContent.items;
                        let text = "";
                        for (let i = 0; i < textItems.length; i++) {
                            text += textItems[i].str + " ";
                        }

                        // Store the text for later use
                        window.extractedText = text;
                    });
                });
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
        alert('Please wait for the PDF to load.');
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
