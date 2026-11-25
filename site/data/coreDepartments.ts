export type DepartmentCategory = 'spiritual' | 'community' | 'operations' | 'administration';

export const DEPARTMENT_CATEGORIES: readonly DepartmentCategory[] = ['spiritual', 'community', 'operations', 'administration'];

export type CoreDepartment = {
  name: string;
  category: DepartmentCategory;
  leads?: readonly string[];
  description?: string;
};

export const coreDepartments: readonly CoreDepartment[] = [
  {
    name: 'Worship and Music Department (Choir / Praise Team)', category: 'spiritual',
    leads: ['Babra Katusiime'],
    description: 'Leads the congregation in praise and worship through singing and musical instruments.',
  },
  {
    name: 'Prayer and Intercession Department', category: 'spiritual',
    leads: ['Ps. Jesca'],
    description: 'Organizes corporate prayer meetings, night vigils, and fasting programs, and prays for church leaders and members.',
  },
  {
    name: 'Ushering and Protocol Department', category: 'operations',
    leads: ['Mrs. Bagonza Grace'],
    description: 'Welcomes members and visitors, seats the congregation, maintains order during services, and hosts special guests.',
  },
  {
    name: 'Evangelism and Outreach Department', category: 'community',
    leads: ['Sydney Ndugga'],
    description: 'Coordinates evangelism campaigns, neighborhood and street outreach, and follow-up with new converts.',
  },
  {
    name: 'Christian Education / Discipleship', category: 'spiritual',
    leads: ['Ap. Hiire'],
    description: 'Teaches foundational biblical doctrine and leads baptism classes and orientation for new converts.',
  },
  {
    name: 'Children’s Ministry (Children’s Church)', category: 'community',
    leads: ['Mrs. Mukisa Phiona'],
    description: 'Teaches younger children biblical principles, memory verses, and moral values in age-appropriate ways.',
  },
  {
    name: 'Youth and Young Adults Ministry', category: 'community',
    description: 'Supports teenagers and young adults through spiritual formation, mentoring, social activities, and guidance.',
  },
  {
    name: 'Men’s and Women’s Fellowships / Ministries', category: 'community',
    leads: ['Eva Musia'],
    description: 'Equips men and women through conferences, prayer groups, and community support.',
  },
  {
    name: 'Media, Technical, and Communication Department', category: 'operations',
    leads: ['Bagonza Derrick'],
    description: 'Manages live streaming, audiovisual mixing, PA systems, projection, and the church’s social media pages.',
  },
  {
    name: 'Sound and Lighting Department', category: 'operations',
    leads: ['Andrew Lian'],
    description: 'Manages sound and lighting so people in church and online can see and hear services clearly.',
  },
  {
    name: 'Hospitality and Welfare Department', category: 'community',
    leads: ['Ninsiima Carol'],
    description: 'Prepares refreshments, welcomes first-time visitors, and helps members in need with practical support, food, or clothing.',
  },
  {
    name: 'Sanctuary Keepers / Sanitation Department', category: 'operations',
    leads: ['Samalie Namyalo'],
    description: 'Keeps the church hall and facilities clean, hygienic, and orderly.',
  },
  {
    name: 'Sanctuary Keepers / Physical Department', category: 'operations',
    leads: ['Kitumba Emma'],
    description: 'Keeps the building and its systems in working order and coordinates repairs and modifications.',
  },
  {
    name: 'Finance and Treasury Department', category: 'administration',
    leads: ['Sandra Namuswe'],
    description: 'Manages tithes, offerings, budgeting, bookkeeping, and financial accountability.',
  },
  {
    name: 'Security and Safety Department', category: 'operations',
    leads: ['John Nangiibwa'],
    description: 'Keeps the congregation safe, manages parking, and protects church property during events.',
  },
  { name: 'Technical and Facilities Department', category: 'operations', leads: ['Daniel Kaggwa'] },
  { name: 'Administration', category: 'administration', leads: ['Joy'] },
  { name: 'Pastoral PA', category: 'administration', leads: ['National · Patience Kabibi', 'International · Mrs. Zaake Lillian'] },
  { name: 'Construction / Site Manager', category: 'operations', leads: ['Andrew Semakula'] },
  { name: 'AMB UAE', category: 'administration', leads: ['Lubembe Julius'] },
];
