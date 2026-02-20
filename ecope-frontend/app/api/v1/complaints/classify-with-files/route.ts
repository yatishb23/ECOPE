import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl, getAuthorizationHeader } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const authHeader = await getAuthorizationHeader(request);
    if (!authHeader) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the form data (files and complaint text)
    const formData = await request.formData();
    
    const response = await fetch(`${getBaseUrl()}/api/v1/complaints/classify-with-files`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error classifying complaint with files:', error);
    return NextResponse.json(
      { detail: 'Internal server error during classification' },
      { status: 500 }
    );
  }
}