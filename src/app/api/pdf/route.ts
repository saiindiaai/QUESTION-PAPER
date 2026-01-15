import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');
  if (!file) {
    return new Response('Missing file parameter', { status: 400 });
  }
  // Prevent directory traversal
  const safePath = path.normalize(file).replace(/^([.]+[\\\/])+/, '');
  const absPath = path.resolve(process.cwd(), '../', safePath);
  if (!fs.existsSync(absPath) || !absPath.endsWith('.pdf')) {
    return new Response('PDF not found', { status: 404 });
  }
  const pdfBuffer = fs.readFileSync(absPath);
  return new Response(pdfBuffer, {
    status: 200,
    headers: { 'Content-Type': 'application/pdf' },
  });
}
