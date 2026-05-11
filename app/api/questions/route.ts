import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}
    if (activeOnly) where.isActive = true
    if (category && category !== 'all') where.category = category

    const questions = await prisma.assessmentQuestion.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    })

    return NextResponse.json(questions)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const {
      questionText, category,
      choice1Text, choice1Score,
      choice2Text, choice2Score,
      choice3Text, choice3Score,
      choice4Text, choice4Score,
      isActive, displayOrder,
    } = body

    if (
      !questionText?.trim() || !category ||
      !choice1Text?.trim() || choice1Score === undefined || choice1Score === '' ||
      !choice2Text?.trim() || choice2Score === undefined || choice2Score === '' ||
      !choice3Text?.trim() || choice3Score === undefined || choice3Score === '' ||
      !choice4Text?.trim() || choice4Score === undefined || choice4Score === ''
    ) {
      return NextResponse.json({ error: 'All fields including choice texts and scores are required' }, { status: 400 })
    }

    if (!['People', 'Process', 'Technology'].includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const question = await prisma.assessmentQuestion.create({
      data: {
        questionText: questionText.trim(),
        category,
        choice1Text: choice1Text.trim(), choice1Score: parseFloat(choice1Score),
        choice2Text: choice2Text.trim(), choice2Score: parseFloat(choice2Score),
        choice3Text: choice3Text.trim(), choice3Score: parseFloat(choice3Score),
        choice4Text: choice4Text.trim(), choice4Score: parseFloat(choice4Score),
        isActive: isActive !== false,
        displayOrder: parseInt(displayOrder) || 0,
      },
    })

    return NextResponse.json(question, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }
}
