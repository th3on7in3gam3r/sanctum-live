type CoreDepartment = {
  name: string;
  leads?: readonly string[];
  description?: string;
};

export const coreDepartments: readonly CoreDepartment[] = [
  {
    name: 'Worship and Music Department (Choir / Praise Team)',
    leads: ['Babra Katusiime'],
    description: 'Leads the congregation in praise and worship through singing and musical instruments.',
  },
  {
    name: 'Prayer and Intercession Department',
    leads: ['Ps. Jesca'],
    description: 'Organizes corporate prayer meetings, night vigils, and fasting programs, and prays for church leaders and members.',
  },
  {
    name: 'Ushering and Protocol Department',
    leads: ['Mrs. Bagonza Grace'],
    description: 'Welcomes members and visitors, seats the congregation, maintains order during services, and hosts special guests.',
  },
  {
    name: 'Evangelism and Outreach Department',
    leads: ['Sydney Ndugga'],
    description: 'Coordinates evangelism campaigns, neighborhood and street outreach, and follow-up with new converts.',
  },
  {
    name: 'Christian Education / Discipleship',
    leads: ['Ap. Hiire'],
    description: 'Teaches foundational biblical doctrine and leads baptism classes and orientation for new converts.',
  },
  {
    name: 'Children’s Ministry (Children’s Church)',
    leads: ['Mrs. Mukisa Phiona'],
    description: 'Teaches younger children biblical principles, memory verses, and moral values in age-appropriate ways.',
  },
  {
    name: 'Youth and Young Adults Ministry',
    description: 'Supports teenagers and young adults through spiritual formation, mentoring, social activities, and guidance.',
  },
  {
    name: 'Men’s and Women’s Fellowships / Ministries',
    leads: ['Eva Musia'],
    description: 'Equips men and women through conferences, prayer groups, and community support.',
  },
  {
    name: 'Media, Technical, and Communication Department',
    leads: ['Bagonza Derrick'],
    description: 'Manages live streaming, audiovisual mixing, PA systems, projection, and the church’s social media pages.',
  },
  {
    name: 'Sound and Lighting Department',
    leads: ['Andrew Lian'],
    description: 'Manages sound and lighting so people in church and online can see and hear services clearly.',
  },
  {
    name: 'Hospitality and Welfare Department',
    leads: ['Ninsiima Carol'],
    description: 'Prepares refreshments, welcomes first-time visitors, and helps members in need with practical support, food, or clothing.',
  },
  {
    name: 'Sanctuary Keepers / Sanitation Department',
    leads: ['Samalie Namyalo'],
    description: 'Keeps the church hall and facilities clean, hygienic, and orderly.',
  },
  {
    name: 'Sanctuary Keepers / Physical Department',
    leads: ['Kitumba Emma'],
    description: 'Keeps the building and its systems in working order and coordinates repairs and modifications.',
  },
  {
    name: 'Finance and Treasury Department',
    leads: ['Sandra Namuswe'],
    description: 'Manages tithes, offerings, budgeting, bookkeeping, and financial accountability.',
  },
  {
    name: 'Security and Safety Department',
    leads: ['John Nangiibwa'],
    description: 'Keeps the congregation safe, manages parking, and protects church property during events.',
  },
  { name: 'Technical and Facilities Department', leads: ['Daniel Kaggwa'] },
  { name: 'Administration', leads: ['Joy'] },
  { name: 'Pastoral PA', leads: ['National · Patience Kabibi', 'International · Mrs. Zaake Lillian'] },
  { name: 'Construction / Site Manager', leads: ['Andrew Semakula'] },
  { name: 'AMB UAE', leads: ['Lubembe Julius'] },
];
