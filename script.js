document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
        const fileReader = new FileReader();

        fileReader.onload = function() {
            const typedarray = new Uint8Array(this.result);

            pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
                let textContent = "";
                const pageCount = pdf.numPages;

                // Loop through all the pages to extract the text
                for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
                    pdf.getPage(pageNum).then(function(page) {
                        page.getTextContent().then(function(text) {
                            text.items.forEach(function(item) {
                                textContent += item.str + " ";
                            });

                            // Display the content in the div
                            document.getElementById('pdfContent').innerText = textContent;
                        });
                    });
                }
            }).catch(function(error) {
                console.error("Error during PDF reading:", error);
            });
        };

        fileReader.readAsArrayBuffer(file);
    } else {
        alert("Please upload a valid PDF file.");
    }
});
