// import React, { useEffect, useRef, useState } from 'react';
// import { PDFDocumentProxy, getDocument } from 'pdfjs-dist';
//
// const pdfToImg = () => {
//     const [image, setImage] = useState(null);
//     const canvasRef = useRef(null);
//
//     useEffect((zone) => {
//         const fetchAndConvertPdf = async () => {
//             const pdfUrl = await fetch(`https://www.nyc.gov/assets/planning/download/pdf/zoning/zoning-maps/map${zone}.pdf`)
//             const pdf = await getDocument(pdfUrl).promise;
//
//             if (pdf.numPages > 0) {
//                 const page = await pdf.getPage(1); // Get the first page
//                 const viewport = page.getViewport({ scale: 2 }); // Adjust scale as needed
//
//                 const canvas = canvasRef.current;
//                 canvas.width = viewport.width;
//                 canvas.height = viewport.height;
//
//                 const context = canvas.getContext('2d');
//
//                 // Render the PDF page into the canvas context
//                 await page.render({ canvasContext: context, viewport }).promise;
//
//                 // Convert canvas to image (PNG)
//                 const imgData = canvas.toDataURL('image/png');
//                 setImage(imgData);
//             }
//         };
//
//         fetchAndConvertPdf();
//     }, []);
//
//     return image;
// };
//
// export default pdfToImg()