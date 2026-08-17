export async function downloadCertificatePdf({ certificateId, recipientName, quizTitle, score, issueDate }) {
  // Dynamically load jsPDF on demand to keep bundle ultra-light
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Format Date (e.g. 17 August 2026)
  let formattedDate = issueDate || new Date().toISOString().split('T')[0];
  try {
    const d = new Date(issueDate || Date.now());
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  } catch {
    // fallback
  }

  const certId = certificateId || 'QF-AI-2026';
  const studentName = recipientName || 'Student';
  const assessmentTitle = quizTitle || 'Assessment';
  const finalScore = score !== undefined ? `${score}%` : '100%';

  // 1. Warm Ivory Background Fill
  doc.setFillColor(252, 252, 250); // #FCFCFA
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 2. Outer Sophisticated Slate Border
  doc.setDrawColor(15, 23, 42); // #0F172A
  doc.setLineWidth(1.2);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // 3. Inner Fine Hairline Border
  doc.setDrawColor(203, 213, 225); // #CBD5E1
  doc.setLineWidth(0.3);
  doc.rect(16, 16, pageWidth - 32, pageHeight - 32);

  // 4. Corner Geometric Indigo Accents
  doc.setDrawColor(49, 46, 129); // #312E81
  doc.setLineWidth(0.8);
  // Top-Left
  doc.line(16, 16, 24, 16);
  doc.line(16, 16, 16, 24);
  // Top-Right
  doc.line(pageWidth - 16, 16, pageWidth - 24, 16);
  doc.line(pageWidth - 16, 16, pageWidth - 16, 24);
  // Bottom-Left
  doc.line(16, pageHeight - 16, 24, pageHeight - 16);
  doc.line(16, pageHeight - 16, 16, pageHeight - 24);
  // Bottom-Right
  doc.line(pageWidth - 16, pageHeight - 16, pageWidth - 24, pageHeight - 16);
  doc.line(pageWidth - 16, pageHeight - 16, pageWidth - 16, pageHeight - 24);

  // 5. Header: Brand
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text('QUIZFORGE AI', pageWidth / 2, 30, { align: 'center' });

  // Main Title
  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.text('CERTIFICATE OF ACHIEVEMENT', pageWidth / 2, 42, { align: 'center' });

  // Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 40, 48, pageWidth / 2 + 40, 48);

  // Subtitle
  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text('This certificate is proudly presented to', pageWidth / 2, 62, { align: 'center' });

  // Recipient Name
  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(15, 23, 42);
  doc.text(studentName, pageWidth / 2, 78, { align: 'center' });

  // Recipient Underline Accent
  doc.setDrawColor(49, 46, 129);
  doc.setLineWidth(0.6);
  doc.line(pageWidth / 2 - 35, 83, pageWidth / 2 + 35, 83);

  // Achievement Lead-in
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text('for successfully completing', pageWidth / 2, 96, { align: 'center' });

  // Course / Assessment Title
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(assessmentTitle, pageWidth / 2, 108, { align: 'center' });

  // Achievement Description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Demonstrating strong proficiency and successful completion of the assessed curriculum.',
    pageWidth / 2,
    118,
    { align: 'center' }
  );

  // 6. Bottom Row Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(26, 142, pageWidth - 26, 142);

  // 7. Left: Score & Issue Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('FINAL SCORE', 30, 154);

  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(finalScore, 30, 162);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('ISSUED', 30, 172);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(formattedDate, 30, 178);

  // 8. Center: Gold Certification Seal
  doc.setFillColor(254, 243, 199); // #FEF3C7 amber-100
  doc.setDrawColor(217, 119, 6); // #D97706 amber-600
  doc.setLineWidth(0.8);
  doc.circle(pageWidth / 2, 164, 13, 'FD');

  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.3);
  doc.circle(pageWidth / 2, 164, 11, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.text('VERIFIED', pageWidth / 2, 163, { align: 'center' });
  doc.setFontSize(6);
  doc.text('QUIZFORGE AI', pageWidth / 2, 167, { align: 'center' });

  // 9. Right: Issuer Signature & Credential ID
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(pageWidth - 85, 158, pageWidth - 30, 158);

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('QuizForge AI', pageWidth - 30, 164, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Authorized Certification Authority', pageWidth - 30, 169, { align: 'right' });

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`ID: ${certId}`, pageWidth - 30, 178, { align: 'right' });

  // Save PDF file
  doc.save(`QuizForge_Certificate_${certId}.pdf`);
}
