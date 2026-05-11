import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET() {
  try {
    const ranges = await prisma.recommendationRange.findMany({
      orderBy: { minScore: 'asc' },
    })
    return NextResponse.json(ranges)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { minScore, maxScore, riskLevelName, recommendationTitle, recommendationText, isActive } = body

    if (
      minScore === undefined || minScore === '' ||
      maxScore === undefined || maxScore === '' ||
      !riskLevelName?.trim() ||
      !recommendationTitle?.trim() ||
      !recommendationText?.trim()
    ) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const min = parseFloat(minScore)
    const max = parseFloat(maxScore)

    if (isNaN(min) || isNaN(max)) {
      return NextResponse.json({ error: 'Scores must be valid numbers' }, { status: 400 })
    }

    if (min > max) {
      return NextResponse.json({ error: 'Min score must be less than or equal to max score' }, { status: 400 })
    }

    // Check for overlapping active ranges
    if (isActive !== false) {
      const overlapping = await prisma.recommendationRange.findFirst({
        where: {
          isActive: true,
          OR: [
            { minScore: { lte: max }, maxScore: { gte: min } },
          ],
        },
      })
      if (overlapping) {
        return NextResponse.json({
          error: `Score range overlaps with existing active range: ${overlapping.riskLevelName} (${overlapping.minScore}–${overlapping.maxScore})`
        }, { status: 400 })
      }
    }

    const range = await prisma.recommendationRange.create({
      data: {
        minScore: min,
        maxScore: max,
        riskLevelName: riskLevelName.trim(),
        recommendationTitle: recommendationTitle.trim(),
        recommendationText: recommendationText.trim(),
        isActive: isActive !== false,
      },
    })

    return NextResponse.json(range, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create recommendation range' }, { status: 500 })
  }
}
