import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const name = data.get('name') as string;
    const college = data.get('college') as string;
    const email = data.get('email') as string;
    const mobile = data.get('mobile') as string;
    const file = data.get('photo') as File;

    if (!name || !college || !email || !mobile || !file) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = file.name.split('.').pop();
    const filename = `${uniqueSuffix}.${ext}`;
    
    // Ensure uploads dir exists (in public/uploads for serving)
    // Note: in production, usage of public dir for dynamic uploads is discouraged but requested for this task.
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    
    const path = join(uploadDir, filename);
    await writeFile(path, buffer);
    
    const photoPath = `/uploads/${filename}`;

    // Database insertion
    const user = await prisma.user.create({
      data: {
        name,
        college,
        email,
        mobile,
        photoPath,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
