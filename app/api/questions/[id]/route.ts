import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const id = parseInt(params.id)
    const body = await request.json()

    const question = await prisma.assessmentQuestion.update({
      where: { id },
      data: {
        questionText: body.questionText?.trim(),
        category: body.category,
        choice1Text: body.choice1Text?.trim(), choice1Score: parseFloat(body.choice1Score),
        choice2Text: body.choice2Text?.trim(), choice2Score: parseFloat(body.choice2Score),
        choice3Text: body.choice3Text?.trim(), choice3Score: parseFloat(body.choice3Score),
        choice4Text: body.choice4Text?.trim(), choice4Score: parseFloat(body.choice4Score),
        isActive: body.isActive,
        displayOrder: parseInt(body.displayOrder) || 0,
      },
    })

    return NextResponse.json(question)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const id = parseInt(params.id)
    await prisma.assessmentQuestion.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const id = parseInt(params.id)
    const body = await request.json()

    const question = await prisma.assessmentQuestion.update({
      where: { id },
      data: { isActive: body.isActive },
    })

    return NextResponse.json(question)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update question status' }, { status: 500 })
  }
}
