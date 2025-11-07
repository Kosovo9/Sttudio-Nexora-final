import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getCurrentUser } from '@/lib/clerk';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { userId } = auth();
    const jobId = params.jobId;

    // Get job from database
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if user owns this job (allow anonymous access for guest users)
    const currentUserId = userId || 'anonymous';
    const user = userId ? await getCurrentUser() : null;
    const isAdmin = user?.email === process.env.ADMIN_EMAIL;
    
    if (job.userId !== currentUserId && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Return job status with results if completed
    const response: any = {
      success: true,
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    };

    if (job.status === 'completed' && job.result) {
      response.results = (job.result as any)?.processedUrls || [];
      response.watermarkId = (job.result as any)?.watermarkId;
    }

    if (job.status === 'failed' && job.error) {
      response.error = job.error;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
