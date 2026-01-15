import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

// For Vercel deployment, read from public folder
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const SUBJECTS = [
  'BIOLOGY_9',
  'CHEMISTRY_9',
  'GEOGRAPHY_9',
  'HISTORY_9',
  'MATH_9',
  'PHYSICS_9',
];

function scanPdfs(dir: string): string[] {
  let results: string[] = [];
  try {
    if (!fs.existsSync(dir)) {
      return results;
    }
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(scanPdfs(filePath));
      } else if (file.toLowerCase().endsWith('.pdf')) {
        // Store relative path from public folder
        const relativePath = path.relative(PUBLIC_DIR, filePath);
        results.push(relativePath);
      }
    });
  } catch (error) {
    console.error('Error scanning PDFs:', error);
  }
  return results;
}

export async function GET(req: NextRequest) {
  const pdfsBySubject: Record<string, Record<string, string[]>> = {};
  SUBJECTS.forEach((subject) => {
    const subjectPath = path.join(PUBLIC_DIR, subject);
    if (fs.existsSync(subjectPath)) {
      const topics = fs.readdirSync(subjectPath).filter((f) => {
        try {
          return fs.statSync(path.join(subjectPath, f)).isDirectory();
        } catch {
          return false;
        }
      });
      pdfsBySubject[subject] = {};
      topics.forEach((topic) => {
        const topicPath = path.join(subjectPath, topic);
        pdfsBySubject[subject][topic] = scanPdfs(topicPath);
      });
    }
  });
  return new Response(JSON.stringify(pdfsBySubject), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
