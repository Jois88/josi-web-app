// Wait until the document is ready
document.addEventListener('DOMContentLoaded', function() {
    // File Input change event
    document.getElementById('fileInput').addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const fileReader = new FileReader();
            fileReader.onload = function() {
                const typedarray = new Uint8Array(this.result);
                pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
                    pdf.getPage(1).then(function(page) {
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
                        page.render(renderContext).promise.then(function() {
                            document.getElementById('pdfContent').appendChild(canvas);
                        });

                        // Extract text content from PDF page
                        page.getTextContent().then(function(textContent) {
                            let text = "";
                            textContent.items.forEach(function(item) {
                                text += item.str + " ";
                            });

                            // Use Web Speech API to read text aloud
                            const utterance = new SpeechSynthesisUtterance(text);
                            const playButton = document.getElementById('playButton');
                            const pauseButton = document.getElementById('pauseButton');
                            const stopButton = document.getElementById('stopButton');

                            let isPaused = false;

                            // Play button event listener
                            playButton.addEventListener('click', function() {
                                if (isPaused) {
                                    speechSynthesis.resume();
                                } else {
                                    speechSynthesis.speak(utterance);
                                }
                                isPaused = false;
                            });

                            // Pause button event listener
                            pauseButton.addEventListener('click', function() {
                                if (speechSynthesis.speaking) {
                                    speechSynthesis.pause();
                                    isPaused = true;
                                }
                            });

                            // Stop button event listener
                            stopButton.addEventListener('click', function() {
                                speechSynthesis.cancel();
                                isPaused = false;
                            });

                        });
                    });
                }).catch(function(error) {
                    console.error('Error loading PDF:', error);
                });
            };
            fileReader.readAsArrayBuffer(file);
        }
    });
});
