document.getElementById('fileInput').addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const fileReader = new FileReader();
        fileReader.onload = function() {
            const typedarray = new Uint8Array(this.result);

            // Get the document from PDF.js
            pdfjsLib.getDocument({ data: typedarray }).promise.then(function(pdf) {
                // Get the first page of the document
                pdf.getPage(1).then(function(page) {
                    const scale = 1.5;
                    const viewport = page.getViewport({ scale: scale });

                    // Create a canvas to render the page
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    // Render the page onto the canvas
                    page.render(renderContext).promise.then(function() {
                        // Append the canvas to the container div
                        document.getElementById('pdfContent').innerHTML = ''; // Clear previous content
                        document.getElementById('pdfContent').appendChild(canvas);
                    });
                });
            }).catch(function(error) {
                console.error('Error loading PDF:', error);
            });
        };
        fileReader.readAsArrayBuffer(file);
    }
});
