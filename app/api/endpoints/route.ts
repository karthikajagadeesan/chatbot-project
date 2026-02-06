import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('api_endpoints')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ endpoints: data || [] });
  } catch (error: any) {
    console.error('Endpoints API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch endpoints' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, endpointName, endpointUrl, endpointType } = await req.json();

    if (!userId || !endpointName || !endpointUrl || !endpointType) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('api_endpoints')
      .insert({
        user_id: userId,
        endpoint_name: endpointName,
        endpoint_url: endpointUrl,
        endpoint_type: endpointType,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ endpoint: data });
  } catch (error: any) {
    console.error('Endpoints API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create endpoint' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const endpointId = searchParams.get('id');

    if (!endpointId) {
      return NextResponse.json(
        { error: 'Endpoint ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('api_endpoints')
      .delete()
      .eq('id', endpointId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Endpoints API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete endpoint' },
      { status: 500 }
    );
  }
}
