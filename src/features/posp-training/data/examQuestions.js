// POSP certification exam question bank, keyed by section id — see
// `sections.js`. A section with no entry here is skipped by the exam.
//
// Answer-key convention: for every question the factually-correct answer is
// placed at index 1, i.e. option "b" (the exam renders options a, b, c, d in
// order). `correctOption` therefore is always 1 and must stay in sync with the
// option order — if you reorder options, keep the correct answer at index 1.
// `correctOption` is the 0-based index compared against the taker's selection
// by `scoreSection` in lib/examScoring.js.
export const examQuestions = {
  general: [
    {
      id: 1,
      question: "What does 'POSP' stand for?",
      options: [
        "Point of Service Provider",
        "Point of Sale Person",
        "Primary Options for Sales Plan",
        "Personal Officer for Sales Process"
      ],
      correctOption: 1
    },
    {
      id: 2,
      question: "Which regulatory body governs the insurance sector in India?",
      options: [
        "RBI",
        "IRDAI",
        "SEBI",
        "PFRDA"
      ],
      correctOption: 1
    },
    {
      id: 3,
      question: "What does 'Premium' refer to in an insurance contract?",
      options: [
        "The coverage amount",
        "The fee paid by the insured to the insurer",
        "The claim amount",
        "The bonus declared by the insurer"
      ],
      correctOption: 1
    },
    {
      id: 4,
      question: "Which of the following is NOT covered under a standard Motor Third Party Insurance policy?",
      options: [
        "Death of a third party",
        "Damage to the insured's own vehicle",
        "Injury to a third party",
        "Damage to third party property"
      ],
      correctOption: 1
    },
    {
      id: 5,
      question: "What is 'Indemnity' in insurance?",
      options: [
        "Making a profit from an insurance claim",
        "Restoring the insured to the same financial position as before the loss",
        "Paying a fixed amount regardless of the loss",
        "Transferring rights to the insurer"
      ],
      correctOption: 1
    },
    {
      id: 6,
      question: "In health insurance, what is a waiting period?",
      options: [
        "The time taken to issue the policy",
        "The time during which certain diseases are not covered",
        "The time taken to settle a claim",
        "The grace period for paying the premium"
      ],
      correctOption: 1
    },
    {
      id: 7,
      question: "What is a 'Deductible' in an insurance policy?",
      options: [
        "The maximum amount the insurer will pay",
        "The portion of the claim that the policyholder must pay",
        "The commission paid to the agent",
        "The discount given on the premium"
      ],
      correctOption: 1
    },
    {
      id: 8,
      question: "If an insured fails to disclose a material fact while applying for insurance, it is a breach of which principle?",
      options: [
        "Insurable Interest",
        "Utmost Good Faith",
        "Indemnity",
        "Contribution"
      ],
      correctOption: 1
    },
    {
      id: 9,
      question: "A 'Floater' health insurance policy covers:",
      options: [
        "Only the main earner",
        "The entire family under a single Sum Insured",
        "Only critical illnesses",
        "Accidental injuries only"
      ],
      correctOption: 1
    },
    {
      id: 10,
      question: "Which of the following is NOT a type of General Insurance?",
      options: [
        "Motor Insurance",
        "Whole Life Insurance",
        "Health Insurance",
        "Fire Insurance"
      ],
      correctOption: 1
    }
  ],
  life: [
    {
      id: 11,
      question: "What is the primary purpose of life insurance?",
      options: [
        "To provide an investment return",
        "To protect against the financial impact of premature death",
        "To pay for medical expenses",
        "To cover property damage"
      ],
      correctOption: 1
    },
    {
      id: 12,
      question: "Which principle of insurance means that the insured must have a financial interest in the subject matter?",
      options: [
        "Utmost Good Faith",
        "Insurable Interest",
        "Indemnity",
        "Subrogation"
      ],
      correctOption: 1
    },
    {
      id: 13,
      question: "What type of policy combines life insurance protection with an investment component?",
      options: [
        "Term Insurance",
        "Endowment Policy",
        "Health Insurance",
        "Personal Accident Insurance"
      ],
      correctOption: 1
    },
    {
      id: 14,
      question: "Which of these is a benefit of Term Life Insurance?",
      options: [
        "High investment returns",
        "High coverage at a low premium",
        "Maturity benefit",
        "Surrender value"
      ],
      correctOption: 1
    },
    {
      id: 15,
      question: "What does 'Sum Assured' mean?",
      options: [
        "The premium amount",
        "The guaranteed amount payable on the occurrence of the insured event",
        "The claim amount requested",
        "The bonus accumulated"
      ],
      correctOption: 1
    },
    {
      id: 16,
      question: "Which document contains the detailed terms and conditions of the insurance contract?",
      options: [
        "Proposal Form",
        "Policy Document",
        "Cover Note",
        "Claim Form"
      ],
      correctOption: 1
    },
    {
      id: 17,
      question: "What is the purpose of 'Nomination' in a life insurance policy?",
      options: [
        "To transfer ownership of the policy",
        "To name the person who will receive the benefits if the life insured dies",
        "To take a loan against the policy",
        "To assign the policy to a bank"
      ],
      correctOption: 1
    },
    {
      id: 18,
      question: "What is a 'Grace Period'?",
      options: [
        "Time taken to issue the policy",
        "Extra time given to pay the premium after the due date",
        "Time during which pre-existing diseases are not covered",
        "Time allowed to cancel the policy"
      ],
      correctOption: 1
    },
    {
      id: 19,
      question: "What is the 'Free Look Period' in an insurance policy?",
      options: [
        "Period when no premium is required",
        "Period to review the policy terms and cancel if unsatisfied",
        "Period to increase the Sum Assured for free",
        "Period to claim a free health checkup"
      ],
      correctOption: 1
    },
    {
      id: 20,
      question: "Who is the 'Insured' in an insurance contract?",
      options: [
        "The insurance company",
        "The person or entity protected against financial loss",
        "The agent selling the policy",
        "The surveyor assessing the claim"
      ],
      correctOption: 1
    }
  ]
};
