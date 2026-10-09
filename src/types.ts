export interface Candidate {
  id: string;
  name: string;
  tagline: string;
  bio: string;
  avatarUrl: string;
  department: string;
  agenda: string[];
}

export interface Position {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  candidates: Candidate[];
}

export interface VoteRecord {
  id?: string;
  voterName: string; // Full Name
  adNo: string;      // Admission Number / Ad No
  voterId?: string;  // Kept for backward compatibility
  selections: {
    [positionId: string]: {
      candidateId: string;
      candidateName: string;
    };
  };
  submittedAt: number;
  verificationHash: string;
  avatarUrl?: string;
}

export interface ElectionConfig {
  electionTitle: string;
  academicYear: string;
  organizationName: string;
  status: 'active' | 'paused' | 'closed';
  allowMultipleSubmissionsPerDevice: boolean;
  announcement?: string;
  adminPassword?: string;
}

export const DEFAULT_POSITIONS: Position[] = [
  {
    id: 'president',
    order: 1,
    title: 'Student Body President',
    subtitle: 'Position 1: Chief Executive & Student Representation',
    description: 'Represents the entire student body, coordinates university councils, and leads student welfare initiatives.',
    candidates: [
      {
        id: 'pres_alex',
        name: 'Alexandria "Alex" Chen',
        department: 'Economics & Public Policy, Senior',
        tagline: 'Transparency, Inclusion & Campus Accessibility',
        bio: 'Serving as Junior Senator for 2 years. Championed 24/7 library access and campus dining subsidy programs.',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        agenda: [
          'Subsidized campus night shuttle transportation',
          'Mental health support fund & peer counseling',
          'Transparent council budget allocation dashboard'
        ]
      },
      {
        id: 'pres_marcus',
        name: 'Marcus Vance',
        department: 'Computer Science & Management, Senior',
        tagline: 'Innovation, Career Pathways & Modern Facilities',
        bio: 'Founder of campus Hackathon Society. Secured $45k in external project sponsorships and tech equipment.',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        agenda: [
          'Industry tech & business mentorship pipelines',
          'High-speed campus Wi-Fi and modern makerspaces',
          'Streamlined student club event funding approvals'
        ]
      }
    ]
  },
  {
    id: 'vice_president',
    order: 2,
    title: 'Vice President of Academic Affairs',
    subtitle: 'Position 2: Curriculum & Academic Rights Advocacy',
    description: 'Oversees faculty liaison committees, academic integrity reviews, research grants, and learning resources.',
    candidates: [
      {
        id: 'vp_priya',
        name: 'Priya Sharma',
        department: 'Biomedical Engineering, Junior',
        tagline: 'Research Grants & Equitable Grading Frameworks',
        bio: 'Undergraduate researcher and STEM Women Society director. Co-authored the Open Educational Resources policy.',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
        agenda: [
          'Zero-cost open textbook pledge for foundational courses',
          'Standardized 24-hr grace period for assignment submissions',
          'Expanded undergraduate summer research micro-stipends'
        ]
      },
      {
        id: 'vp_david',
        name: 'David O\'Connor',
        department: 'History & International Relations, Junior',
        tagline: 'Mentorship, Practical Internships & Flexible Learning',
        bio: 'Editor of Academic Gazette and peer tutor coordinator. Organized the annual Cross-Disciplinary Symposium.',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        agenda: [
          'Hybrid and recorded lecture guarantee for working students',
          'Global exchange travel grants & regional conference passes',
          'Alumni-to-student career shadowing network expansion'
        ]
      }
    ]
  }
];

export const DEFAULT_CONFIG: ElectionConfig = {
  electionTitle: 'Annual General Student Council Election',
  organizationName: 'University Student Union',
  academicYear: '2026 - 2027',
  status: 'active',
  allowMultipleSubmissionsPerDevice: false,
  announcement: 'Voting is officially open! Step through each position to cast your confidential ballot.',
  adminPassword: 'admin'
};
