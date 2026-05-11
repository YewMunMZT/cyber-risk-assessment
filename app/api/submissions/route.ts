import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateScores, generateReferenceNumber } from '@/lib/scoring'
import { sendReportEmails } from '@/lib/email'
import { getAdminFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getAdminFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const riskLevel = searchParams.get('riskLevel') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { contactPersonName: { contains: search } },
        { contactEmail: { contains: search } },
      ]
    }

    if (riskLevel) {
      where.overallRiskLevel = riskLevel
    }

    const submissions = await prisma.assessmentSubmission.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
    })

    return NextResponse.json(submissions)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      companyName,
      contactPersonName,
      contactNumber,
      countryCode,
      contactEmail,
      website,
      estimatedEndpoints,
      answers,
    } = body

    // Validate required company fields
    if (!companyName?.trim() || !contactPersonName?.trim() || !contactNumber?.trim() || !contactEmail?.trim() || !estimatedEndpoints) {
      return NextResponse.json({ error: 'All company details are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Validate endpoints
    const endpoints = parseInt(estimatedEndpoints)
    if (isNaN(endpoints) || endpoints < 1) {
      return NextResponse.json({ error: 'Estimated endpoints must be a positive number' }, { status: 400 })
    }

    // Validate answers array
    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'Answers are required' }, { status: 400 })
    }

    // Load active questions
    const activeQuestions = await prisma.assessmentQuestion.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    })

    if (answers.length !== activeQuestions.length) {
      return NextResponse.json(
        { error: `Please answer all ${activeQuestions.length} questions before submitting` },
        { status: 400 }
      )
    }

    // Validate all question IDs match active questions
    const activeIds = new Set(activeQuestions.map((q) => q.id))
    for (const a of answers) {
      if (!activeIds.has(a.questionId)) {
        return NextResponse.json({ error: `Invalid question ID: ${a.questionId}` }, { status: 400 })
      }
    }

    // Build scoring inputs
    const answerInputs = answers.map((a: { questionId: number; selectedChoiceScore: number }) => {
      const question = activeQuestions.find((q) => q.id === a.questionId)!
      return {
        questionId: a.questionId,
        category: question.category,
        selectedChoiceScore: parseFloat(a.selectedChoiceScore as unknown as string),
      }
    })

    // Calculate scores
    const scores = calculateScores(answerInputs)

    // Find matching recommendation
    const recommendation = await prisma.recommendationRange.findFirst({
      where: {
        isActive: true,
        minScore: { lte: scores.overallRiskScore },
        maxScore: { gte: scores.overallRiskScore },
      },
    })

    const referenceNo = generateReferenceNumber()

    // Create submission with answers
    const submission = await prisma.assessmentSubmission.create({
      data: {
        companyName: companyName.trim(),
        contactPersonName: contactPersonName.trim(),
        contactNumber: contactNumber.trim(),
        countryCode: countryCode || '+65',
        contactEmail: contactEmail.trim().toLowerCase(),
        website: website?.trim() || null,
        estimatedEndpoints: endpoints,
        ...scores,
        overallRiskLevel: recommendation?.riskLevelName || 'Unclassified',
        recommendationTitle: recommendation?.recommendationTitle || '',
        recommendationText: recommendation?.recommendationText || '',
        reportReferenceNo: referenceNo,
        answers: {
          create: answers.map((a: {
            questionId: number
            selectedChoiceText: string
            selectedChoiceScore: number
          }) => {
            const question = activeQuestions.find((q) => q.id === a.questionId)!
            return {
              questionId: a.questionId,
              questionTextSnapshot: question.questionText,
              categorySnapshot: question.category,
              selectedChoiceText: a.selectedChoiceText,
              selectedChoiceScore: parseFloat(a.selectedChoiceScore as unknown as string),
            }
          }),
        },
      },
    })

    // Fire-and-forget email sending
    sendReportEmails({
      companyName: companyName.trim(),
      contactPersonName: contactPersonName.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      website: website?.trim() || null,
      estimatedEndpoints: endpoints,
      overallRiskScore: scores.overallRiskScore,
      overallRiskLevel: recommendation?.riskLevelName || 'Unclassified',
      peopleRawScore: scores.peopleRawScore,
      processRawScore: scores.processRawScore,
      technologyRawScore: scores.technologyRawScore,
      peopleWeightedScore: scores.peopleWeightedScore,
      processWeightedScore: scores.processWeightedScore,
      technologyWeightedScore: scores.technologyWeightedScore,
      recommendationTitle: recommendation?.recommendationTitle || '',
      recommendationText: recommendation?.recommendationText || '',
      submittedAt: submission.submittedAt,
      reportReferenceNo: referenceNo,
    }).catch((err) => console.error('[Submission] Email error:', err))

    return NextResponse.json({ id: submission.id, referenceNo }, { status: 201 })
  } catch (err) {
    console.error('[Submission] Error:', err)
    return NextResponse.json({ error: 'Failed to process submission. Please try again.' }, { status: 500 })
  }
}
