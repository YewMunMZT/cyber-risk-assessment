import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getAdminFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [
      totalSubmissions,
      totalActiveQuestions,
      totalRecommendations,
      submissions,
      recentSubmissions,
    ] = await Promise.all([
      prisma.assessmentSubmission.count(),
      prisma.assessmentQuestion.count({ where: { isActive: true } }),
      prisma.recommendationRange.count({ where: { isActive: true } }),
      prisma.assessmentSubmission.findMany({ select: { overallRiskScore: true, overallRiskLevel: true } }),
      prisma.assessmentSubmission.findMany({
        orderBy: { submittedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          companyName: true,
          contactPersonName: true,
          overallRiskScore: true,
          overallRiskLevel: true,
          reportReferenceNo: true,
          submittedAt: true,
        },
      }),
    ])

    const avgScore =
      submissions.length > 0
        ? Math.round((submissions.reduce((s, r) => s + r.overallRiskScore, 0) / submissions.length) * 100) / 100
        : 0

    const byRiskLevel = submissions.reduce<Record<string, number>>((acc, s) => {
      acc[s.overallRiskLevel] = (acc[s.overallRiskLevel] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      totalSubmissions,
      totalActiveQuestions,
      totalRecommendations,
      avgScore,
      byRiskLevel,
      recentSubmissions,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
