const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, TabStopType, TabStopPosition, TableRow, TableCell, Table, WidthType, BorderStyle, ExternalHyperlink } = require('docx');

const mdPath = path.join(__dirname, '..', 'docs', '用户操作手册-PMAer.md');
const outputPath = path.join(__dirname, '..', 'docs', '用户操作手册-PMAer-v0.2.0.docx');
const screenshotsDir = path.join(__dirname, '..', 'docs', 'screenshots');

const md = fs.readFileSync(mdPath, 'utf-8');
const lines = md.split('\n');

const children = [];
let i = 0;

while (i < lines.length) {
  const line = lines[i];

  // Skip empty lines
  if (line.trim() === '') {
    i++;
    continue;
  }

  // Horizontal rule
  if (line.trim() === '---') {
    children.push(new Paragraph({ spacing: { before: 200, after: 200 } }));
    i++;
    continue;
  }

  // Headings
  if (line.startsWith('# ') && !line.startsWith('## ')) {
    children.push(new Paragraph({
      text: line.replace(/^# /, ''),
      heading: HeadingLevel.TITLE,
      spacing: { before: 400, after: 200 },
    }));
    i++;
    continue;
  }

  if (line.startsWith('## ')) {
    children.push(new Paragraph({
      text: line.replace(/^## /, '').replace(/⭐ /g, ''),
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 150 },
    }));
    i++;
    continue;
  }

  if (line.startsWith('### ')) {
    children.push(new Paragraph({
      text: line.replace(/^### /, ''),
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }));
    i++;
    continue;
  }

  // Images
  const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  if (imgMatch) {
    const imgPath = path.join(screenshotsDir, imgMatch[2]);
    if (fs.existsSync(imgPath)) {
      try {
        children.push(new Paragraph({
          children: [
            new ImageRun({
              data: fs.readFileSync(imgPath),
              transformation: { width: 500, height: 300 },
              type: 'png',
            }),
          ],
          spacing: { before: 100, after: 50 },
          alignment: AlignmentType.CENTER,
        }));
      } catch (e) {
        children.push(new Paragraph({ text: `[图片: ${imgMatch[1]}]`, spacing: { before: 100, after: 50 } }));
      }
    } else {
      children.push(new Paragraph({ text: `[图片: ${imgMatch[1]}]`, spacing: { before: 100, after: 50 } }));
    }
    i++;
    continue;
  }

  // Image captions (italic text after image)
  if (line.startsWith('*图') && line.endsWith('*')) {
    children.push(new Paragraph({
      children: [new TextRun({ text: line.replace(/^\*|\*$/g, ''), italics: true, size: 20, color: '666666' })],
      spacing: { before: 50, after: 200 },
      alignment: AlignmentType.CENTER,
    }));
    i++;
    continue;
  }

  // Blockquotes
  if (line.startsWith('> ')) {
    const text = line.replace(/^> /, '').replace(/\*\*/g, '').replace(/`([^`]+)`/g, '$1');
    children.push(new Paragraph({
      children: [new TextRun({ text, italics: true, size: 22, color: '555555' })],
      spacing: { before: 100, after: 100 },
      indent: { left: 400 },
    }));
    i++;
    continue;
  }

  // Table detection
  if (line.includes('|') && line.trim().startsWith('|')) {
    const tableLines = [];
    while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
      if (!lines[i].match(/^\|[\s-|]+\|$/)) { // Skip separator row
        tableLines.push(lines[i]);
      }
      i++;
    }
    
    if (tableLines.length > 0) {
      const rows = tableLines.map(line => 
        line.split('|').filter(c => c.trim() !== '').map(c => c.trim().replace(/\*\*/g, ''))
      );
      
      const tableRows = rows.map((row, rowIndex) => 
        new TableRow({
          children: row.map(cell => 
            new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ text: cell, bold: rowIndex === 0, size: 20 })],
                spacing: { before: 40, after: 40 },
              })],
              width: { size: Math.floor(9000 / row.length), type: WidthType.DXA },
            })
          ),
        })
      );

      children.push(new Table({
        rows: tableRows,
        width: { size: 9000, type: WidthType.DXA },
      }));
      children.push(new Paragraph({ spacing: { after: 100 } }));
    }
    continue;
  }

  // Ordered lists
  if (line.match(/^\d+\.\s/)) {
    const text = line.replace(/^\d+\.\s/, '').replace(/\*\*/g, '').replace(/`([^`]+)`/g, '$1');
    children.push(new Paragraph({
      children: [new TextRun({ text, size: 22 })],
      spacing: { before: 40, after: 40 },
      indent: { left: 400 },
    }));
    i++;
    continue;
  }

  // Unordered lists
  if (line.match(/^[-*]\s/)) {
    const text = line.replace(/^[-*]\s/, '').replace(/\*\*/g, '').replace(/`([^`]+)`/g, '$1');
    children.push(new Paragraph({
      children: [new TextRun({ text: '• ' + text, size: 22 })],
      spacing: { before: 40, after: 40 },
      indent: { left: 400 },
    }));
    i++;
    continue;
  }

  // Code blocks
  if (line.startsWith('```')) {
    const codeLines = [];
    i++;
    while (i < lines.length && !lines[i].startsWith('```')) {
      codeLines.push(lines[i]);
      i++;
    }
    i++; // skip closing ```
    
    codeLines.forEach(codeLine => {
      children.push(new Paragraph({
        children: [new TextRun({ text: codeLine, font: 'Consolas', size: 18 })],
        spacing: { before: 20, after: 20 },
        indent: { left: 400 },
        shading: { fill: 'F5F5F5' },
      }));
    });
    continue;
  }

  // Regular paragraphs with bold/inline code
  const text = line.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');
  const runs = [];
  
  // Parse bold and inline code
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
  parts.forEach(part => {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, size: 22 }));
    } else if (part.startsWith('`') && part.endsWith('`')) {
      runs.push(new TextRun({ text: part.slice(1, -1), font: 'Consolas', size: 20, shading: { fill: 'F0F0F0' } }));
    } else if (part) {
      runs.push(new TextRun({ text: part, size: 22 }));
    }
  });

  if (runs.length > 0) {
    children.push(new Paragraph({
      children: runs,
      spacing: { before: 60, after: 60 },
    }));
  }

  i++;
}

const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children: children,
  }],
  styles: {
    default: {
      document: {
        run: { font: '微软雅黑', size: 22 },
      },
    },
  },
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`Word document created: ${outputPath}`);
}).catch(err => {
  console.error('Error creating document:', err);
});
