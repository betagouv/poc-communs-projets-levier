import { NextRequest, NextResponse } from 'next/server';
import { analyzeProject } from '@/app/actions';

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    console.log("description", description);
    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const result = await analyzeProject(description);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze project' },
      { status: 500 }
    );
  }
} 