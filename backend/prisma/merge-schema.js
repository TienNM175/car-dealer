const fs = require('fs');
const path = require('path');

// Đường dẫn đến thư mục chứa các file schema
const schemaDir = path.join(__dirname, 'schema');
// Đường dẫn đến file schema merged
const outputPath = path.join(__dirname, 'schema.prisma');

// Đọc và gộp nội dung các file
let mergedSchema = '';

// Đọc file schema.prisma đầu tiên (chứa generator và datasource)
const mainSchemaPath = path.join(schemaDir, 'schema.prisma');
const mainSchema = fs.readFileSync(mainSchemaPath, 'utf8');
const mainContent = mainSchema.split('\n')
  .filter(line => !line.startsWith('import'))
  .join('\n');

mergedSchema += mainContent + '\n';

// Đọc và gộp các file khác
const files = fs.readdirSync(schemaDir);
files.forEach(file => {
  if (file !== 'schema.prisma' && file.endsWith('.prisma')) {
    console.log(`Merging ${file}...`);
    const content = fs.readFileSync(path.join(schemaDir, file), 'utf8');
    mergedSchema += '\n// Content from ' + file + '\n';
    mergedSchema += content + '\n';
  }
});

// Ghi nội dung đã gộp vào file schema.prisma
fs.writeFileSync(outputPath, mergedSchema);

console.log('Schema files merged successfully to:', outputPath);