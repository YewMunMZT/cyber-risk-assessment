import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const min = parseFloat(body.minScore)
    const max = parseFloat(body.maxScore)

    if (isNaN(min) || isNaN(max) || min > max) {
      return NextResponse.json({ error: 'Invalid score range' }, { status: 400 })
    }

    // Check for overlapping active ranges (excluding self)
    if (body.isActive !== false) {
      const overlapping = await prisma.recommendationRange.findFirst({
        where: {
          isActive: true,
          id: { not: parseInt(id) },
          OR: [{ minScore: { lte: max }, maxScore: { gte: min } }],
        },
      })
      if (overlapping) {
        return NextResponse.json({
          error: `Score range overlaps with existing active range: ${overlapping.riskLevelName} (${overlapping.minScore}–${overlapping.maxScore})`
        }, { status: 400 })
      }
    }

    const range = await prisma.recommendationRange.update({
      where: { id: parseInt(id) },
      data: {
        minScore: min,
        maxScore: max,
        riskLevelName: body.riskLevelName?.trim(),
        recommendationTitle: body.recommendationTitle?.trim(),
        recommendationText: body.recommendationText?.trim(),
        isActive: body.isActive,
      },
    })

    return NextResponse.json(range)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update recommendation' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await prisma.recommendationRange.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete recommendation' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const range = await prisma.recommendationRange.update({
      where: { id: parseInt(id) },
      data: { isActive: body.isActive },
    })
    return NextResponse.json(range)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
