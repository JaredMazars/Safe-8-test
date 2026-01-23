import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate professional PDF assessment report following Forvis Mazars branding guidelines
 */
export const generateAssessmentPDF = (userData, assessmentData, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const { contact_name, email, company_name, job_title } = userData;
      const { 
        overall_score, 
        dimension_scores, 
        insights,
        assessment_type,
        completed_at 
      } = assessmentData;

      // Create PDF document with proper margins
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        },
        info: {
          Title: `SAFE-8 Assessment Report - ${contact_name}`,
          Author: 'Forvis Mazars',
          Subject: `${assessment_type} Assessment Results`,
          Keywords: 'AI, Assessment, SAFE-8, Digital Transformation'
        }
      });

      // Create write stream
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Forvis Mazars colors
      const colors = {
        primaryBlue: '#00539F',
        secondaryRed: '#E31B23',
        accentOrange: '#F7941D',
        darkGray: '#333333',
        mediumGray: '#666666',
        lightGray: '#E5E5E5',
        white: '#FFFFFF'
      };

      const scoreCategory = overall_score >= 80 ? 'AI Leader' : 
                           overall_score >= 60 ? 'AI Adopter' : 
                           overall_score >= 40 ? 'AI Explorer' : 'AI Starter';

      const categoryColor = overall_score >= 80 ? '#00A651' : 
                           overall_score >= 60 ? '#0098DB' : 
                           overall_score >= 40 ? colors.accentOrange : colors.secondaryRed;

      let yPosition = 50;

      // ===== PAGE 1: HEADER & EXECUTIVE SUMMARY =====
      
      // Header with blue bar
      doc.rect(0, 0, doc.page.width, 4).fill(colors.primaryBlue);

      // Forvis Mazars Logo (text-based)
      yPosition = 30;
      doc.fontSize(26)
         .font('Helvetica-Bold')
         .fillColor(colors.primaryBlue)
         .text('Forvis ', 50, yPosition, { continued: true })
         .fillColor(colors.darkGray)
         .text('Mazars');

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(colors.mediumGray)
         .text('SAFE-8 ASSESSMENT PLATFORM', 50, yPosition + 32);

      // Title section with blue background
      yPosition = 100;
      doc.rect(0, yPosition, doc.page.width, 80).fill(colors.primaryBlue);
      
      doc.fontSize(28)
         .font('Helvetica-Bold')
         .fillColor(colors.white)
         .text('SAFE-8 Assessment Report', 50, yPosition + 20, {
           width: doc.page.width - 100
         });

      doc.fontSize(12)
         .font('Helvetica')
         .fillColor(colors.white)
         .text(`${assessment_type} Assessment`, 50, yPosition + 55);

      // Report metadata
      yPosition = 200;
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(colors.darkGray)
         .text('Prepared for:', 50, yPosition);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(colors.mediumGray)
         .text(contact_name, 50, yPosition + 18);

      if (job_title) {
        doc.text(job_title, 50, yPosition + 33);
        yPosition += 15;
      }

      if (company_name) {
        doc.font('Helvetica-Bold')
           .fillColor(colors.darkGray)
           .text(company_name, 50, yPosition + 33);
        yPosition += 15;
      }

      yPosition += 50;
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(colors.mediumGray)
         .text(`Assessment Date: ${new Date(completed_at).toLocaleDateString('en-GB', { 
           day: '2-digit', 
           month: 'long', 
           year: 'numeric' 
         })}`, 50, yPosition);

      // Overall Score Card
      yPosition += 40;
      
      // Draw score box with left border accent
      doc.rect(45, yPosition, 5, 80).fill(categoryColor);
      doc.rect(50, yPosition, doc.page.width - 100, 80)
         .fillAndStroke('#F5F5F5', colors.lightGray);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(colors.mediumGray)
         .text('OVERALL PERFORMANCE', 70, yPosition + 20);

      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor(colors.darkGray)
         .text(scoreCategory, 70, yPosition + 38);

      // Score on the right
      doc.fontSize(40)
         .font('Helvetica-Bold')
         .fillColor(categoryColor)
         .text(`${overall_score.toFixed(1)}%`, doc.page.width - 180, yPosition + 20, {
           width: 130,
           align: 'right'
         });

      // Executive Summary
      yPosition += 120;
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor(colors.primaryBlue)
         .text('Executive Summary', 50, yPosition);

      doc.moveTo(50, yPosition + 22)
         .lineTo(doc.page.width - 50, yPosition + 22)
         .strokeColor(colors.primaryBlue)
         .lineWidth(2)
         .stroke();

      yPosition += 40;
      const summaryText = `This report presents the results of the SAFE-8 ${assessment_type} assessment for ${company_name || 'your organization'}. The assessment evaluates AI maturity across eight critical pillars, providing insights into current capabilities and recommendations for advancement.`;

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(colors.darkGray)
         .text(summaryText, 50, yPosition, {
           width: doc.page.width - 100,
           align: 'justify',
           lineGap: 4
         });

      // ===== PAGE 2: PILLAR PERFORMANCE BREAKDOWN =====
      doc.addPage();
      yPosition = 50;

      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor(colors.primaryBlue)
         .text('Pillar Performance Breakdown', 50, yPosition);

      doc.moveTo(50, yPosition + 28)
         .lineTo(doc.page.width - 50, yPosition + 28)
         .strokeColor(colors.primaryBlue)
         .lineWidth(2)
         .stroke();

      yPosition += 50;

      // Draw each pillar with professional formatting
      dimension_scores.forEach((pillar, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        // Pillar name
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor(colors.darkGray)
           .text(pillar.pillar_name, 50, yPosition);

        // Score
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor(colors.primaryBlue)
           .text(`${pillar.score.toFixed(1)}%`, doc.page.width - 100, yPosition, {
             width: 50,
             align: 'right'
           });

        yPosition += 20;

        // Progress bar background
        const barWidth = doc.page.width - 100;
        const barHeight = 16;
        
        doc.rect(50, yPosition, barWidth, barHeight)
           .fillAndStroke('#F5F5F5', colors.lightGray);

        // Progress bar fill
        const fillWidth = (barWidth * pillar.score) / 100;
        doc.rect(50, yPosition, fillWidth, barHeight)
           .fill(colors.primaryBlue);

        yPosition += 35;

        // Separator line
        if (index < dimension_scores.length - 1) {
          doc.moveTo(50, yPosition)
             .lineTo(doc.page.width - 50, yPosition)
             .strokeColor(colors.lightGray)
             .lineWidth(0.5)
             .stroke();
          yPosition += 20;
        }
      });

      // ===== PAGE 3: GAP ANALYSIS & RECOMMENDATIONS =====
      doc.addPage();
      yPosition = 50;

      // Gap Analysis Section
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor(colors.secondaryRed)
         .text('Key Areas for Improvement', 50, yPosition);

      doc.moveTo(50, yPosition + 25)
         .lineTo(doc.page.width - 50, yPosition + 25)
         .strokeColor(colors.secondaryRed)
         .lineWidth(2)
         .stroke();

      yPosition += 45;

      if (insights.gap_analysis && insights.gap_analysis.length > 0) {
        insights.gap_analysis.forEach((gap, index) => {
          if (yPosition > 720) {
            doc.addPage();
            yPosition = 50;
          }

          // Bullet point
          doc.circle(58, yPosition + 5, 2.5).fill(colors.secondaryRed);

          doc.fontSize(10)
             .font('Helvetica')
             .fillColor(colors.darkGray)
             .text(gap, 75, yPosition, {
               width: doc.page.width - 125,
               align: 'justify',
               lineGap: 3
             });

          yPosition += doc.heightOfString(gap, {
            width: doc.page.width - 125,
            lineGap: 3
          }) + 12;
        });
      } else {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(colors.mediumGray)
           .text('No specific gaps identified at this time.', 75, yPosition);
        yPosition += 30;
      }

      // Recommendations Section
      yPosition += 30;
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor(colors.primaryBlue)
         .text('Recommended Next Steps', 50, yPosition);

      doc.moveTo(50, yPosition + 25)
         .lineTo(doc.page.width - 50, yPosition + 25)
         .strokeColor(colors.primaryBlue)
         .lineWidth(2)
         .stroke();

      yPosition += 45;

      if (insights.service_recommendations && insights.service_recommendations.length > 0) {
        insights.service_recommendations.forEach((rec, index) => {
          if (yPosition > 720) {
            doc.addPage();
            yPosition = 50;
          }

          // Numbered bullet
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .fillColor(colors.primaryBlue)
             .text(`${index + 1}.`, 50, yPosition);

          doc.font('Helvetica')
             .fillColor(colors.darkGray)
             .text(rec, 75, yPosition, {
               width: doc.page.width - 125,
               align: 'justify',
               lineGap: 3
             });

          yPosition += doc.heightOfString(rec, {
            width: doc.page.width - 125,
            lineGap: 3
          }) + 12;
        });
      } else {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(colors.mediumGray)
           .text('Complete your assessment for personalized recommendations.', 75, yPosition);
      }

      // Expert Guidance Box
      yPosition += 30;
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }

      doc.rect(50, yPosition, doc.page.width - 100, 100)
         .fillAndStroke('#F5F5F5', colors.lightGray);

      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor(colors.primaryBlue)
         .text('Need Expert Guidance?', 70, yPosition + 20);

      const guidanceText = 'Our specialists at Forvis Mazars can help you translate these insights into actionable strategies. We offer comprehensive AI transformation services tailored to your organization\'s unique needs.';

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(colors.darkGray)
         .text(guidanceText, 70, yPosition + 42, {
           width: doc.page.width - 140,
           align: 'left',
           lineGap: 2
         });

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(colors.primaryBlue)
         .text('Contact: ai.advisory@forvismazars.com', 70, yPosition + 75);

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve(outputPath);
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF and return as buffer (for email attachments)
 */
export const generateAssessmentPDFBuffer = (userData, assessmentData) => {
  return new Promise((resolve, reject) => {
    try {
      const { contact_name, email, company_name, job_title } = userData;
      const { 
        overall_score, 
        dimension_scores, 
        insights,
        assessment_type,
        completed_at 
      } = assessmentData;

      const chunks = [];
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        },
        info: {
          Title: `SAFE-8 Assessment Report - ${contact_name}`,
          Author: 'Forvis Mazars',
          Subject: `${assessment_type} Assessment Results`,
          Keywords: 'AI, Assessment, SAFE-8, Digital Transformation'
        }
      });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (error) => reject(error));

      // Forvis Mazars colors
      const colors = {
        primaryBlue: '#00539F',
        secondaryRed: '#E31B23',
        accentOrange: '#F7941D',
        darkGray: '#333333',
        mediumGray: '#666666',
        lightGray: '#E5E5E5',
        white: '#FFFFFF'
      };

      const scoreCategory = overall_score >= 80 ? 'AI Leader' : 
                           overall_score >= 60 ? 'AI Adopter' : 
                           overall_score >= 40 ? 'AI Explorer' : 'AI Starter';

      const categoryColor = overall_score >= 80 ? '#00A651' : 
                           overall_score >= 60 ? '#0098DB' : 
                           overall_score >= 40 ? colors.accentOrange : colors.secondaryRed;

      let yPosition = 50;

      // ===== PAGE 1: HEADER & EXECUTIVE SUMMARY =====
      
      doc.rect(0, 0, doc.page.width, 4).fill(colors.primaryBlue);

      yPosition = 30;
      doc.fontSize(26)
         .font('Helvetica-Bold')
         .fillColor(colors.primaryBlue)
         .text('Forvis ', 50, yPosition, { continued: true })
         .fillColor(colors.darkGray)
         .text('Mazars');

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(colors.mediumGray)
         .text('SAFE-8 ASSESSMENT PLATFORM', 50, yPosition + 32);

      yPosition = 100;
      doc.rect(0, yPosition, doc.page.width, 80).fill(colors.primaryBlue);
      
      doc.fontSize(28)
         .font('Helvetica-Bold')
         .fillColor(colors.white)
         .text('SAFE-8 Assessment Report', 50, yPosition + 20, {
           width: doc.page.width - 100
         });

      doc.fontSize(12)
         .font('Helvetica')
         .fillColor(colors.white)
         .text(`${assessment_type} Assessment`, 50, yPosition + 55);

      yPosition = 200;
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(colors.darkGray)
         .text('Prepared for:', 50, yPosition);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(colors.mediumGray)
         .text(contact_name, 50, yPosition + 18);

      if (job_title) {
        doc.text(job_title, 50, yPosition + 33);
        yPosition += 15;
      }

      if (company_name) {
        doc.font('Helvetica-Bold')
           .fillColor(colors.darkGray)
           .text(company_name, 50, yPosition + 33);
        yPosition += 15;
      }

      yPosition += 50;
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(colors.mediumGray)
         .text(`Assessment Date: ${new Date(completed_at).toLocaleDateString('en-GB', { 
           day: '2-digit', 
           month: 'long', 
           year: 'numeric' 
         })}`, 50, yPosition);

      yPosition += 40;
      
      doc.rect(45, yPosition, 5, 80).fill(categoryColor);
      doc.rect(50, yPosition, doc.page.width - 100, 80)
         .fillAndStroke('#F5F5F5', colors.lightGray);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(colors.mediumGray)
         .text('OVERALL PERFORMANCE', 70, yPosition + 20);

      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor(colors.darkGray)
         .text(scoreCategory, 70, yPosition + 38);

      doc.fontSize(40)
         .font('Helvetica-Bold')
         .fillColor(categoryColor)
         .text(`${overall_score.toFixed(1)}%`, doc.page.width - 180, yPosition + 20, {
           width: 130,
           align: 'right'
         });

      yPosition += 120;
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor(colors.primaryBlue)
         .text('Executive Summary', 50, yPosition);

      doc.moveTo(50, yPosition + 22)
         .lineTo(doc.page.width - 50, yPosition + 22)
         .strokeColor(colors.primaryBlue)
         .lineWidth(2)
         .stroke();

      yPosition += 40;
      const summaryText = `This report presents the results of the SAFE-8 ${assessment_type} assessment for ${company_name || 'your organization'}. The assessment evaluates AI maturity across eight critical pillars, providing insights into current capabilities and recommendations for advancement.`;

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(colors.darkGray)
         .text(summaryText, 50, yPosition, {
           width: doc.page.width - 100,
           align: 'justify',
           lineGap: 4
         });

      // ===== PAGE 2: PILLAR PERFORMANCE =====
      doc.addPage();
      yPosition = 50;

      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor(colors.primaryBlue)
         .text('Pillar Performance Breakdown', 50, yPosition);

      doc.moveTo(50, yPosition + 28)
         .lineTo(doc.page.width - 50, yPosition + 28)
         .strokeColor(colors.primaryBlue)
         .lineWidth(2)
         .stroke();

      yPosition += 50;

      dimension_scores.forEach((pillar, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor(colors.darkGray)
           .text(pillar.pillar_name, 50, yPosition);

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor(colors.primaryBlue)
           .text(`${pillar.score.toFixed(1)}%`, doc.page.width - 100, yPosition, {
             width: 50,
             align: 'right'
           });

        yPosition += 20;

        const barWidth = doc.page.width - 100;
        const barHeight = 16;
        
        doc.rect(50, yPosition, barWidth, barHeight)
           .fillAndStroke('#F5F5F5', colors.lightGray);

        const fillWidth = (barWidth * pillar.score) / 100;
        doc.rect(50, yPosition, fillWidth, barHeight)
           .fill(colors.primaryBlue);

        yPosition += 35;

        if (index < dimension_scores.length - 1) {
          doc.moveTo(50, yPosition)
             .lineTo(doc.page.width - 50, yPosition)
             .strokeColor(colors.lightGray)
             .lineWidth(0.5)
             .stroke();
          yPosition += 20;
        }
      });

      // ===== PAGE 3: GAP ANALYSIS & RECOMMENDATIONS =====
      doc.addPage();
      yPosition = 50;

      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor(colors.secondaryRed)
         .text('Key Areas for Improvement', 50, yPosition);

      doc.moveTo(50, yPosition + 25)
         .lineTo(doc.page.width - 50, yPosition + 25)
         .strokeColor(colors.secondaryRed)
         .lineWidth(2)
         .stroke();

      yPosition += 45;

      if (insights.gap_analysis && insights.gap_analysis.length > 0) {
        insights.gap_analysis.forEach((gap) => {
          if (yPosition > 720) {
            doc.addPage();
            yPosition = 50;
          }

          doc.circle(58, yPosition + 5, 2.5).fill(colors.secondaryRed);

          doc.fontSize(10)
             .font('Helvetica')
             .fillColor(colors.darkGray)
             .text(gap, 75, yPosition, {
               width: doc.page.width - 125,
               align: 'justify',
               lineGap: 3
             });

          yPosition += doc.heightOfString(gap, {
            width: doc.page.width - 125,
            lineGap: 3
          }) + 12;
        });
      }

      yPosition += 30;
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor(colors.primaryBlue)
         .text('Recommended Next Steps', 50, yPosition);

      doc.moveTo(50, yPosition + 25)
         .lineTo(doc.page.width - 50, yPosition + 25)
         .strokeColor(colors.primaryBlue)
         .lineWidth(2)
         .stroke();

      yPosition += 45;

      if (insights.service_recommendations && insights.service_recommendations.length > 0) {
        insights.service_recommendations.forEach((rec, index) => {
          if (yPosition > 720) {
            doc.addPage();
            yPosition = 50;
          }

          doc.fontSize(10)
             .font('Helvetica-Bold')
             .fillColor(colors.primaryBlue)
             .text(`${index + 1}.`, 50, yPosition);

          doc.font('Helvetica')
             .fillColor(colors.darkGray)
             .text(rec, 75, yPosition, {
               width: doc.page.width - 125,
               align: 'justify',
               lineGap: 3
             });

          yPosition += doc.heightOfString(rec, {
            width: doc.page.width - 125,
            lineGap: 3
          }) + 12;
        });
      }

      yPosition += 30;
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }

      doc.rect(50, yPosition, doc.page.width - 100, 100)
         .fillAndStroke('#F5F5F5', colors.lightGray);

      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor(colors.primaryBlue)
         .text('Need Expert Guidance?', 70, yPosition + 20);

      const guidanceText = 'Our specialists at Forvis Mazars can help you translate these insights into actionable strategies. We offer comprehensive AI transformation services tailored to your organization\'s unique needs.';

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(colors.darkGray)
         .text(guidanceText, 70, yPosition + 42, {
           width: doc.page.width - 140,
           align: 'left',
           lineGap: 2
         });

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(colors.primaryBlue)
         .text('Contact: ai.advisory@forvismazars.com', 70, yPosition + 75);

      // Finalize PDF first
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};
