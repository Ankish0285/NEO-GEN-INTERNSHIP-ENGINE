import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Exports a certificate element to a downloadable PDF.
 * @param {React.RefObject} elementRef - ref to the DOM element to capture
 * @param {string} filename - filename for the downloaded PDF (e.g. 'certificate.pdf')
 */
export async function downloadCertificatePDF(elementRef, filename = 'certificate.pdf') {
  if (!elementRef || !elementRef.current) {
    throw new Error('elementRef.current is not available');
  }

  const canvas = await html2canvas(elementRef.current, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
  });

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  const pdf = new jsPDF({
    orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
    unit: 'px',
    format: [imgWidth, imgHeight],
  });

  pdf.addImage(
    canvas.toDataURL('image/png'),
    'PNG',
    0,
    0,
    imgWidth,
    imgHeight
  );

  pdf.save(filename);
}
