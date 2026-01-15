import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');
  if (!file) {
    return new Response('Missing file parameter', { status: 400 });
  }
  
  // For Vercel, PDFs are in public folder
  const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
  const filePath = path.join(PUBLIC_DIR, file);
  
  // Prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR) || !filePath.endsWith('.pdf')) {
    return new Response('Invalid file path', { status: 400 });
  }
  
  try {
    if (!fs.existsSync(filePath)) {
      return new Response('PDF not found', { status: 404 });
    }
    const pdfBuffer = fs.readFileSync(filePath);
    return new Response(pdfBuffer, {
      status: 200,
      headers: { 'Content-Type': 'application/pdf' },
    });
  } catch (error) {
    console.error('PDF serving error:', error);
    return new Response('Error serving PDF', { status: 500 });
  }
}
