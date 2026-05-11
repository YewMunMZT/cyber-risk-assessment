import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Public result page OR admin — allow public access by submission ID
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const submission = await prisma.assessmentSubmission.findUnique({
      where: { id },
      include: {
        answers: {
          orderBy: { id: 'asc' },
          include: { question: { select: { category: true, displayOrder: true } } },
        },
      },
    })

    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

    return NextResponse.json(submission)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await prisma.assessmentSubmission.delete({ where: { id: parseInt(params.id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 })
  }
}
