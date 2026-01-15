import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

// Root directory where subjects are stored
const ROOT_DIR = path.resolve(process.cwd(), '../');
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
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(scanPdfs(filePath));
    } else if (file.toLowerCase().endsWith('.pdf')) {
      results.push(filePath);
    }
  });
  return results;
}

export async function GET(req: NextRequest) {
  const pdfsBySubject: Record<string, Record<string, string[]>> = {};
  SUBJECTS.forEach((subject) => {
    const subjectPath = path.join(ROOT_DIR, subject);
    if (fs.existsSync(subjectPath)) {
      const topics = fs.readdirSync(subjectPath).filter((f) => fs.statSync(path.join(subjectPath, f)).isDirectory());
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
