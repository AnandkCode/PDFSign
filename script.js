let pdfDoc = null;
let pdfUpload = document.getElementById('pdfUpload');
let signatureUpload = document.getElementById('signatureUpload');
let previewArea = document.getElementById('previewArea');
let addSignatureBtn = document.getElementById('addSignatureBtn');
let saveSignatureBtn = document.getElementById('saveSignatureBtn');
let downloadPdfBtn = document.getElementById('downloadPdfBtn');
let signatureImage = document.getElementById('signatureImage');

let canvasList = [];
let currentSignaturePos = { x: 0, y: 0 };

pdfUpload.addEventListener('change', handlePDFUpload);
signatureUpload.addEventListener('change', handleSignatureUpload);
addSignatureBtn.addEventListener('click', handleAddSignature);
saveSignatureBtn.addEventListener('click', saveSignatureToPdf);
downloadPdfBtn.addEventListener('click', downloadSignedPdf);

// Handle PDF Upload
async function handlePDFUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
        const fileReader = new FileReader();
        fileReader.onload = async function() {
            const typedarray = new Uint8Array(this.result);
            pdfDoc = await pdfjsLib.getDocument(typedarray).promise;
            renderPDF();
        };
        fileReader.readAsArrayBuffer(file);
    }
    toggleButtons();
}

// Handle Signature Upload
function handleSignatureUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            signatureImage.src = e.target.result;
            signatureImage.style.display = 'block';
            signatureImage.style.position = 'absolute';
            makeElementDraggable(signatureImage);
        };
        reader.readAsDataURL(file);
    }
    toggleButtons();
}

// Enable/Disable Add Signature Button
function toggleButtons() {
    if (pdfUpload.files.length > 0 && signatureUpload.files.length > 0) {
        addSignatureBtn.disabled = false;
        saveSignatureBtn.disabled = false;
    } else {
        addSignatureBtn.disabled = true;
        saveSignatureBtn.disabled = true;
    }
}

// Render the PDF in the preview area
async function renderPDF() {
    previewArea.innerHTML = ''; // Clear previous content
    const totalPages = pdfDoc.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = { canvasContext: context, viewport: viewport };
        await page.render(renderContext).promise;

        canvasList.push(canvas);

        const pageDiv = document.createElement('div');
        pageDiv.classList.add('pdf-page');
        pageDiv.appendChild(canvas);
        previewArea.appendChild(pageDiv);
    }
}

// Handle Add Signature button click
function handleAddSignature() {
    alert("You can now drag the signature onto the PDF.");
}

// Make the signature image draggable
function makeElementDraggable(element) {
    let offsetX, offsetY;

    element.onmousedown = function(e) {
        e.preventDefault();
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        document.onmousemove = dragElement;
        document.onmouseup = stopDragElement;
    };

    function dragElement(e) {
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;

        element.style.top = `${y}px`;
        element.style.left = `${x}px`;

        currentSignaturePos = { x, y };
    }

    function stopDragElement() {
        document.onmousemove = null;
        document.onmouseup = null;
    }
}

// Save Signature to PDF canvas
function saveSignatureToPdf() {
    const canvas = canvasList[0]; // Assuming signature on the first page
    const context = canvas.getContext('2d');

    const signaturePosX = currentSignaturePos.x - canvas.getBoundingClientRect().left;
    const signaturePosY = currentSignaturePos.y - canvas.getBoundingClientRect().top;

    context.drawImage(signatureImage, signaturePosX, signaturePosY, 100, 50); // Adjust width and height if needed
    signatureImage.style.display = 'none';

    downloadPdfBtn.disabled = false;
}

// Download Signed PDF
function downloadSignedPdf() {
    const pdfCanvas = canvasList[0]; // Assuming the first page is being signed
    const dataUrl = pdfCanvas.toDataURL('image/jpeg');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'signed_pdf_page.jpg'; // Use a suitable name or generate a PDF file using jsPDF
    link.click();
}
