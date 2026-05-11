import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  await prisma.assessmentAnswer.deleteMany()
  await prisma.assessmentSubmission.deleteMany()
  await prisma.assessmentQuestion.deleteMany()
  await prisma.recommendationRange.deleteMany()

  // Recommendation Ranges
  // Scoring: 1 = most secure (best), 9 = least secure (worst)
  // Overall score: weighted average across People(20%), Process(40%), Technology(40%)
  await prisma.recommendationRange.createMany({
    data: [
      {
        minScore: 0,
        maxScore: 2.49,
        riskLevelName: 'Low',
        recommendationTitle: 'Low Risk — Maintain & Sustain Your Security Posture',
        recommendationText:
          'Your organization demonstrates good cybersecurity hygiene. You have strong foundational controls in place across people, processes, and technology. We recommend continuing regular security awareness training, maintaining your patch management cadence, and conducting an annual third-party security assessment to identify any emerging gaps. Consider documenting your security controls formally to support compliance and governance requirements.',
        isActive: true,
      },
      {
        minScore: 2.5,
        maxScore: 4.99,
        riskLevelName: 'Moderate',
        recommendationTitle: 'Moderate Risk — Strengthen Key Security Controls',
        recommendationText:
          'Your organization has foundational security measures in place, but there are notable gaps that require attention. We recommend: (1) Implementing a structured security awareness and phishing simulation program for all staff; (2) Formalizing your Incident Response Plan and conducting tabletop exercises; (3) Upgrading endpoint protection to include advanced threat detection capabilities; (4) Establishing a regular vulnerability assessment and patch management schedule; (5) Enabling Multi-Factor Authentication (MFA) across all critical systems and remote access.',
        isActive: true,
      },
      {
        minScore: 5.0,
        maxScore: 7.49,
        riskLevelName: 'High',
        recommendationTitle: 'High Risk — Immediate Security Improvements Required',
        recommendationText:
          'Your organization faces significant cybersecurity risks that require prompt action. We strongly recommend: (1) Engaging a cybersecurity specialist to conduct a comprehensive security assessment; (2) Deploying advanced endpoint protection (EDR/XDR) immediately; (3) Implementing MFA across all systems and privileged accounts; (4) Developing and testing a formal Incident Response Plan; (5) Establishing automated backup procedures with offsite replication and recovery testing; (6) Launching an urgent security awareness training program; (7) Reviewing and tightening access controls using the principle of least privilege.',
        isActive: true,
      },
      {
        minScore: 7.5,
        maxScore: 10,
        riskLevelName: 'Critical',
        recommendationTitle: 'Critical Risk — Urgent Cybersecurity Intervention Needed',
        recommendationText:
          'Your organization is at critical risk of a significant cybersecurity incident. Immediate intervention is required. We urgently recommend: (1) Contacting a cybersecurity incident response provider to conduct an emergency assessment; (2) Isolating and protecting your most critical data and systems immediately; (3) Implementing emergency access controls and MFA on all accounts; (4) Establishing a rapid patch management process to address known vulnerabilities; (5) Deploying network monitoring and endpoint protection as priority; (6) Developing a comprehensive remediation roadmap with a qualified cybersecurity partner; (7) Briefing senior leadership on the risk exposure and required investment.',
        isActive: true,
      },
    ],
  })

  // Questions — People Category (Weight: 20%)
  // Score guide: 9 = highest risk, 2 = lowest risk
  await prisma.assessmentQuestion.createMany({
    data: [
      {
        questionText:
          'How often does your organization conduct cybersecurity awareness training for all employees?',
        category: 'People',
        choice1Text: 'We have never conducted cybersecurity awareness training',
        choice1Score: 9,
        choice2Text: 'Training is conducted once a year',
        choice2Score: 6,
        choice3Text: 'Training is conducted twice a year',
        choice3Score: 4,
        choice4Text: 'Training is conducted quarterly or more frequently',
        choice4Score: 2,
        isActive: true,
        displayOrder: 1,
      },
      {
        questionText:
          'Does your organization conduct phishing simulation exercises to test employee awareness?',
        category: 'People',
        choice1Text: 'No phishing simulations have ever been conducted',
        choice1Score: 9,
        choice2Text: 'Phishing simulations are conducted less than once a year',
        choice2Score: 7,
        choice3Text: 'Phishing simulations are conducted once a year',
        choice3Score: 4,
        choice4Text: 'Phishing simulations are conducted quarterly or more frequently',
        choice4Score: 2,
        isActive: true,
        displayOrder: 2,
      },
      {
        questionText:
          'How does your organization manage privileged and administrator access to critical systems?',
        category: 'People',
        choice1Text: 'No formal privileged access controls exist',
        choice1Score: 9,
        choice2Text: 'Basic username and password controls only',
        choice2Score: 7,
        choice3Text: 'Role-based access control (RBAC) is implemented',
        choice3Score: 4,
        choice4Text: 'MFA + RBAC with periodic access reviews and least privilege enforcement',
        choice4Score: 2,
        isActive: true,
        displayOrder: 3,
      },

      // Process Category (Weight: 40%)
      {
        questionText:
          'Does your organization have a formal, documented Incident Response Plan (IRP)?',
        category: 'Process',
        choice1Text: 'No incident response plan exists',
        choice1Score: 9,
        choice2Text: 'A plan exists but has never been tested or reviewed',
        choice2Score: 7,
        choice3Text: 'A plan exists and has been tested at least once',
        choice3Score: 4,
        choice4Text: 'A plan exists, is tested regularly, and updated after each exercise',
        choice4Score: 2,
        isActive: true,
        displayOrder: 4,
      },
      {
        questionText:
          'How frequently does your organization conduct formal cybersecurity risk assessments?',
        category: 'Process',
        choice1Text: 'A formal risk assessment has never been conducted',
        choice1Score: 9,
        choice2Text: 'Risk assessments are conducted on an ad hoc basis (infrequently)',
        choice2Score: 7,
        choice3Text: 'Risk assessments are conducted annually',
        choice3Score: 4,
        choice4Text: 'Risk assessments are conducted semi-annually or more frequently',
        choice4Score: 2,
        isActive: true,
        displayOrder: 5,
      },
      {
        questionText:
          'How are software patches and security updates managed across your organization?',
        category: 'Process',
        choice1Text: 'There is no formal patch management process in place',
        choice1Score: 9,
        choice2Text: 'Patching is performed on an ad hoc basis when issues arise',
        choice2Score: 7,
        choice3Text: 'Regular scheduled patching with a defined process and sign-offs',
        choice3Score: 4,
        choice4Text: 'Automated patch management with centralized tracking and compliance reporting',
        choice4Score: 2,
        isActive: true,
        displayOrder: 6,
      },
      {
        questionText:
          'Does your organization have a Business Continuity Plan (BCP) and Disaster Recovery Plan (DRP)?',
        category: 'Process',
        choice1Text: 'No BCP or DRP exists',
        choice1Score: 9,
        choice2Text: 'Plans exist but are outdated and have never been tested',
        choice2Score: 7,
        choice3Text: 'Plans exist and are tested at least once a year',
        choice3Score: 4,
        choice4Text: 'Plans exist, are tested regularly, and updated based on test results',
        choice4Score: 2,
        isActive: true,
        displayOrder: 7,
      },

      // Technology Category (Weight: 40%)
      {
        questionText:
          'What type of endpoint protection solution is deployed across your organization\'s devices?',
        category: 'Technology',
        choice1Text: 'No endpoint protection is deployed',
        choice1Score: 9,
        choice2Text: 'Basic antivirus software only (signature-based)',
        choice2Score: 7,
        choice3Text: 'Advanced antivirus with host-based firewall and threat intelligence',
        choice3Score: 4,
        choice4Text: 'Endpoint Detection and Response (EDR) or Extended Detection and Response (XDR)',
        choice4Score: 2,
        isActive: true,
        displayOrder: 8,
      },
      {
        questionText:
          'How is your organization\'s network traffic monitored and protected against threats?',
        category: 'Technology',
        choice1Text: 'No network monitoring or protection in place',
        choice1Score: 9,
        choice2Text: 'Basic perimeter firewall only',
        choice2Score: 7,
        choice3Text: 'Intrusion Detection/Prevention System (IDS/IPS) with network segmentation',
        choice3Score: 4,
        choice4Text: 'Full SIEM/SOC with 24/7 monitoring, alerting, and threat response',
        choice4Score: 2,
        isActive: true,
        displayOrder: 9,
      },
      {
        questionText:
          'How is critical data backup and disaster recovery managed in your organization?',
        category: 'Technology',
        choice1Text: 'No formal data backup procedures are in place',
        choice1Score: 9,
        choice2Text: 'Manual backups are performed occasionally without a schedule',
        choice2Score: 7,
        choice3Text: 'Automated daily backups to local or on-premise storage',
        choice3Score: 4,
        choice4Text: 'Automated backups with encrypted offsite/cloud storage and regular recovery testing',
        choice4Score: 2,
        isActive: true,
        displayOrder: 10,
      },
      {
        questionText:
          'How is access to cloud platforms and services secured and governed in your organization?',
        category: 'Technology',
        choice1Text: 'No access controls — open or minimal controls on cloud resources',
        choice1Score: 9,
        choice2Text: 'Basic username and password access only',
        choice2Score: 7,
        choice3Text: 'Multi-Factor Authentication (MFA) enabled for all cloud access',
        choice3Score: 4,
        choice4Text: 'MFA + Cloud Access Security Broker (CASB) + Zero Trust Network Access policies',
        choice4Score: 2,
        isActive: true,
        displayOrder: 11,
      },
    ],
  })

  console.log('Database seeded successfully!')
  console.log('Admin login: admin@example.com / Admin@123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
