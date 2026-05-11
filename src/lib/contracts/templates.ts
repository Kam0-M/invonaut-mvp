export type ClauseBlock = {
    id: string
    title: string
    content: string
    category: string
  }
  
  export type ContractTemplate = {
    type: string
    name: string
    description: string
    icon: string
    clauses: Omit<ClauseBlock, 'id'>[]
  }
  
  export const CONTRACT_TEMPLATES: ContractTemplate[] = [
    {
      type: 'service_agreement',
      name: 'Freelance Service Agreement',
      description: 'General terms for project-based work. Covers scope, payment, IP, and revisions.',
      icon: 'FileText',
      clauses: [
        {
          title: 'Scope of Services',
          category: 'custom',
          content: 'The service provider agrees to perform the following services for the client:\n\n[Describe the specific services, deliverables, and project scope here.]\n\nAll work will be completed to a professional standard in accordance with industry best practices.',
        },
        {
          title: 'Project Timeline',
          category: 'custom',
          content: 'Work will commence on [start date] and is expected to be completed by [end date].\n\nThe service provider will notify the client promptly of any circumstances that may affect the delivery timeline.',
        },
        {
          title: 'Fees and Payment',
          category: 'payment',
          content: 'The client agrees to pay the service provider a total fee of $[amount] for the services described in this agreement.\n\nPayment is due within 30 days of invoice date. Invoices not paid within 30 days are subject to a late fee of 1.5% per month on the outstanding balance.',
        },
        {
          title: 'Revisions',
          category: 'revision',
          content: 'This agreement includes up to two (2) rounds of revisions. A revision round is defined as a consolidated set of changes submitted at one time. Additional revisions will be billed at the hourly rate of $[rate]/hour.',
        },
        {
          title: 'Intellectual Property',
          category: 'ip',
          content: 'Upon receipt of full payment, the service provider assigns to the client all intellectual property rights in the deliverables, including copyright. The service provider retains the right to display the work in their portfolio unless otherwise agreed in writing.',
        },
        {
          title: 'Confidentiality',
          category: 'confidentiality',
          content: 'Both parties agree to keep confidential all non-public information disclosed in connection with this agreement. This obligation survives termination of the agreement for a period of two (2) years.',
        },
        {
          title: 'Limitation of Liability',
          category: 'liability',
          content: "The service provider's total liability shall not exceed the total fees paid by the client in the three months preceding the claim. Neither party shall be liable for indirect, incidental, or consequential damages.",
        },
        {
          title: 'Governing Law',
          category: 'governing_law',
          content: 'This agreement shall be governed by the laws of the state in which the service provider is registered. Any disputes shall be resolved in the courts of that state.',
        },
      ],
    },
    {
      type: 'nda',
      name: 'Non-Disclosure Agreement',
      description: 'Protect confidential information before a project begins. Mutual or one-way.',
      icon: 'Lock',
      clauses: [
        {
          title: 'Purpose',
          category: 'custom',
          content: 'The parties wish to explore a potential business relationship and may need to disclose certain confidential information to each other. This agreement sets out the terms under which such information will be shared and protected.',
        },
        {
          title: 'Definition of Confidential Information',
          category: 'confidentiality',
          content: 'Confidential Information means any information disclosed by one party to the other, either directly or indirectly, in writing, orally or by inspection of tangible objects, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure.',
        },
        {
          title: 'Obligations of Receiving Party',
          category: 'confidentiality',
          content: 'The receiving party agrees to: (i) hold the confidential information in strict confidence; (ii) not disclose it to any third party without prior written consent; (iii) use it solely for evaluating the potential business relationship; and (iv) protect it using at least the same degree of care used to protect its own confidential information.',
        },
        {
          title: 'Exclusions',
          category: 'confidentiality',
          content: 'Confidential information does not include information that: (i) is or becomes publicly available through no breach of this agreement; (ii) was rightfully known before disclosure; (iii) is independently developed without use of confidential information; or (iv) must be disclosed by law.',
        },
        {
          title: 'Term',
          category: 'termination',
          content: 'This agreement shall remain in effect for two (2) years from the date of execution, or until the parties enter into a formal agreement that supersedes it, whichever comes first.',
        },
        {
          title: 'Governing Law',
          category: 'governing_law',
          content: 'This agreement shall be governed by the laws of the state in which the disclosing party is registered.',
        },
      ],
    },
    {
      type: 'project_proposal',
      name: 'Project Proposal',
      description: 'Scoped deliverables and pricing for client approval before formal engagement.',
      icon: 'ClipboardList',
      clauses: [
        {
          title: 'Project Overview',
          category: 'custom',
          content: 'This proposal outlines the scope, timeline, and investment for the following project:\n\nProject Name: [Project Name]\nClient: [Client Name]\nDate: [Date]\n\n[Provide a brief overview of the project and its objectives.]',
        },
        {
          title: 'Scope of Work',
          category: 'custom',
          content: 'The following deliverables are included in this proposal:\n\n1. [Deliverable 1]\n2. [Deliverable 2]\n3. [Deliverable 3]\n\nAny work outside this scope will be quoted separately and require written approval before proceeding.',
        },
        {
          title: 'Timeline',
          category: 'custom',
          content: 'Estimated project timeline:\n\nPhase 1: [Description] — [Duration]\nPhase 2: [Description] — [Duration]\nFinal delivery: [Target date]\n\nTimelines are contingent on timely feedback and approvals from the client.',
        },
        {
          title: 'Investment',
          category: 'payment',
          content: 'Total project investment: $[amount]\n\nPayment schedule:\n— 50% deposit due before work begins: $[amount]\n— 50% due upon project completion: $[amount]\n\nThis proposal is valid for 30 days from the date above.',
        },
        {
          title: 'Next Steps',
          category: 'custom',
          content: 'To proceed with this project, please sign this proposal and return it along with the deposit payment. Work will begin within [X] business days of receiving both.',
        },
      ],
    },
    {
      type: 'retainer',
      name: 'Retainer Agreement',
      description: 'Ongoing monthly engagement with defined scope, hours, and billing.',
      icon: 'RefreshCw',
      clauses: [
        {
          title: 'Services',
          category: 'custom',
          content: 'The service provider agrees to make available up to [X] hours per month for the following ongoing services:\n\n[Describe the retainer services here.]\n\nHours not used in a given month do not roll over to the following month.',
        },
        {
          title: 'Term',
          category: 'termination',
          content: 'This retainer agreement commences on [start date] and continues on a month-to-month basis until terminated by either party with 30 days written notice.',
        },
        {
          title: 'Monthly Fee',
          category: 'payment',
          content: 'The client agrees to pay a monthly retainer fee of $[amount], due on the [1st/15th] of each month.\n\nThe retainer fee covers up to [X] hours of services. Work exceeding this will be billed at $[rate]/hour.',
        },
        {
          title: 'Invoicing',
          category: 'payment',
          content: 'Monthly invoices will be issued on the first business day of each month. Payment is due within 14 days. Late payments will incur a fee of 1.5% per month on the outstanding balance.',
        },
        {
          title: 'Intellectual Property',
          category: 'ip',
          content: 'Upon receipt of full payment for each month, the service provider assigns to the client all intellectual property rights in the deliverables produced during that month.',
        },
        {
          title: 'Confidentiality',
          category: 'confidentiality',
          content: 'Both parties agree to keep confidential all non-public information disclosed in connection with this agreement. This obligation survives termination for two (2) years.',
        },
        {
          title: 'Termination',
          category: 'termination',
          content: 'Either party may terminate this agreement with 30 days written notice. The client will pay for all work completed during the notice period at the agreed monthly rate.',
        },
      ],
    },
    {
      type: 'work_for_hire',
      name: 'Work-for-Hire Agreement',
      description: 'Full IP ownership transfers to client upon payment. Common for commissioned work.',
      icon: 'PenLine',
      clauses: [
        {
          title: 'Services and Deliverables',
          category: 'custom',
          content: 'The service provider agrees to create and deliver the following work product for the client:\n\n[Describe the specific work to be created and delivered.]\n\nDelivery format: [Specify file formats, handoff method, etc.]',
        },
        {
          title: 'Work Made for Hire',
          category: 'ip',
          content: 'All work created under this agreement is considered work made for hire as defined by applicable copyright law. The client owns all intellectual property rights in the deliverables from the moment of creation, regardless of payment status.\n\nIf any deliverable is found not to qualify as work made for hire, the service provider irrevocably assigns all rights to the client upon full payment.',
        },
        {
          title: 'Compensation',
          category: 'payment',
          content: 'The client agrees to pay the service provider $[amount] for the work described in this agreement.\n\nPayment schedule: [e.g., 50% upfront, 50% on delivery]\n\nThe service provider will not commence work until the initial payment is received.',
        },
        {
          title: 'Kill Fee',
          category: 'kill_fee',
          content: 'If the client cancels this agreement after work has commenced, a kill fee of 25% of the total fee is due immediately, plus payment for all work completed to the cancellation date.',
        },
        {
          title: 'Warranties',
          category: 'custom',
          content: 'The service provider warrants that: (i) the work is original; (ii) it does not infringe any third-party rights; and (iii) they have full authority to enter into this agreement and assign the rights described herein.',
        },
        {
          title: 'Governing Law',
          category: 'governing_law',
          content: 'This agreement shall be governed by the laws of the state in which the service provider is registered.',
        },
      ],
    },
    {
      type: 'subcontractor',
      name: 'Subcontractor Agreement',
      description: 'For hiring someone to help on a project. Covers deliverables, pay, and confidentiality.',
      icon: 'Handshake',
      clauses: [
        {
          title: 'Engagement',
          category: 'custom',
          content: 'The contractor engages the subcontractor to perform the following services in connection with a client project:\n\n[Describe the specific tasks and deliverables expected from the subcontractor.]\n\nThe subcontractor agrees to perform these services to a professional standard.',
        },
        {
          title: 'Timeline',
          category: 'custom',
          content: 'The subcontractor agrees to complete the work by [deadline]. The subcontractor will notify the contractor immediately of any circumstances that may affect the delivery timeline.',
        },
        {
          title: 'Compensation',
          category: 'payment',
          content: 'The contractor agrees to pay the subcontractor $[amount] upon satisfactory completion and delivery of the work described in this agreement.\n\nPayment will be made within 14 days of the contractor receiving payment from the end client.',
        },
        {
          title: 'Confidentiality',
          category: 'confidentiality',
          content: 'The subcontractor agrees to keep confidential all information about the contractor\'s client, project details, and business operations. The subcontractor will not contact the end client directly without prior written consent from the contractor.',
        },
        {
          title: 'Intellectual Property',
          category: 'ip',
          content: 'All work produced by the subcontractor under this agreement is assigned to the contractor upon full payment. The subcontractor waives all moral rights to the extent permitted by law.',
        },
        {
          title: 'Independent Contractor',
          category: 'custom',
          content: 'The subcontractor is an independent contractor and not an employee of the contractor. The subcontractor is responsible for their own taxes, insurance, and business expenses.',
        },
        {
          title: 'Non-Solicitation',
          category: 'confidentiality',
          content: 'The subcontractor agrees not to solicit or accept direct work from the contractor\'s clients for a period of 12 months following the completion of this agreement.',
        },
      ],
    },
  ]
  
  export function getTemplate(type: string): ContractTemplate | undefined {
    return CONTRACT_TEMPLATES.find(t => t.type === type)
  }