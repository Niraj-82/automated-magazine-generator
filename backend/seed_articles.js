require('dotenv').config();
const { sequelize } = require('./src/config/postgres');
const { connectMongo } = require('./src/config/mongo');
const { User } = require('./src/models/sql');
const { Submission } = require('./src/models/mongo');
const bcrypt = require('bcryptjs');

const articles = [
  // Technical Events
  {
    title: 'The Rise of Agentic AI in Enterprise Workflows',
    category: 'technical',
    content: 'Modern software is shifting from simple automation to autonomous agents. Using frameworks like LangGraph, developers can now create multi-agent systems that reason through tasks rather than following static scripts. This allows for dynamic error handling and more robust decision-making in complex environments like automated onboarding or supply chain management.',
    author: 1
  },
  {
    title: 'Edge Computing: Bringing Intelligence to the Source',
    category: 'technical',
    content: 'While cloud computing changed the world, the latency requirements of modern IoT devices demand a shift toward the edge. Edge computing processes data locally on the device or a nearby server, reducing the need for constant high-bandwidth backhaul and improving real-time response times for critical systems like autonomous vehicles.',
    author: 2
  },
  {
    title: 'Understanding Zero-Knowledge Proofs in Blockchain',
    category: 'technical',
    content: 'Privacy remains a significant hurdle for public blockchain adoption. Zero-Knowledge Proofs (ZKPs) offer a mathematical solution, allowing one party to prove to another that a statement is true without revealing any information beyond the validity of the statement itself. This has massive implications for secure digital identity and financial privacy.',
    author: 1
  },
  {
    title: 'The Impact of Quantum Supremacy on Modern Cryptography',
    category: 'technical',
    content: 'As quantum computers evolve, traditional RSA encryption becomes vulnerable. Post-quantum cryptography is currently being developed to create algorithms that are resistant to the processing power of quantum bits, ensuring that our digital infrastructure remains secure even as hardware capabilities leap forward.',
    author: 2
  },
  {
    title: 'Optimizing Full-Stack Performance with Next.js and Rust',
    category: 'technical',
    content: 'The modern web demands speed. By integrating Rust-based tooling into the Next.js ecosystem, developers are seeing significant reductions in build times and improved runtime performance. This article explores how native modules are replacing JavaScript-heavy build steps to streamline the developer experience.',
    author: 1
  },
  // Academic Honours
  {
    title: 'Dean’s List Achievement: A Milestone for Computer Engineering',
    category: 'academic',
    content: 'It is with great pleasure to anounce that 15 students from our department has made it to the Dean\'s List this semester. Their hard work and dedication toward academic excelence has really paid off. We hope this inspires others to keep pushing their limits in both theory and practical labs.',
    author: 2
  },
  {
    title: 'Research Paper Acceptance at International Conference',
    category: 'academic',
    content: 'Two of our final year students recently got their research paper on "Federated Learning for Privacy-Preserving Healthcare" accepted at a major IEEE conference. This is a huge achievement for the institute and highlights the quality of research being conducted in our labs.',
    author: 1
  },
  {
    title: 'Winning the National Level Smart India Hackathon',
    category: 'academic',
    content: 'Our team "ByteBusters" won first prize at SIH 2026. They devloped a solution for real-time disaster management using AI and satellite imagery. The judges were very impressed by the technical depth and the practical implementation of the project during the 36-hour coding marathon.',
    author: 2
  },
  {
    title: 'Scholarship Recipients for the Academic Year 2025-2026',
    category: 'academic',
    content: 'The college is proud to award merit scholarships to the top 5% of students in each department. These awards are based on GPA, attendance, and contribution to departmental activities. Congratulations to all the recipients for their unwavering focus.',
    author: 1
  },
  {
    title: 'Toppers’ Talk: Strategies for Cracking Competitive Exams',
    category: 'academic',
    content: 'Our top-ranking students recently shared their secrets for success in exams like GATE and GRE. Key takeaways included consistent revision, solving previous years\' question papers, and maintaining a healthy balance between coding projects and theoretical study.',
    author: 2
  },
  // Sports
  {
    title: 'Inter-College Cricket Tournament Finals',
    category: 'sports',
    content: 'The atmosphere was electric as our team faced off against our rivals in the finals. With 10 runs needed off the last over, our captain smashed two consecutive boundaries to secure the trophy. It was a legendary performance that will be remembered for years!',
    author: 1
  },
  {
    title: 'The Rise of E-Sports on Campus',
    category: 'sports',
    content: 'E-sports is no longer just a hobby; it’s a competitive discipline. Our college held its first official Valorant tournament last month, seeing participation from over 30 teams. The strategic depth and reflexes shown by the players proved that gaming belongs in the sports category.',
    author: 2
  },
  {
    title: 'Annual Sports Meet: Track and Field Results',
    category: 'sports',
    content: 'From the 100m sprint to the long jump, the annual sports meet saw record-breaking participation this year. The Computer Engineering department dominated the track events, while Mechanical took the lead in the power-lifting segment.',
    author: 1
  },
  {
    title: 'Table Tennis Championship: A Battle of Reflexes',
    category: 'sports',
    content: 'The indoor sports hall was packed for the Table Tennis finals. The match went to five sets, with high-speed rallies and incredible defensive play keeping the audience on the edge of their seats. Our student secretary took home the gold.',
    author: 2
  },
  {
    title: 'The Importance of Physical Fitness for Engineers',
    category: 'sports',
    content: 'Spending hours in front of a laptop can lead to various health issues. This article discusses how regular participation in sports like football or swimming can improve cognitive function and reduce stress levels among engineering students.',
    author: 1
  },
  // Cultural
  {
    title: 'Art and Soul: The Annual Cultural Fest Review',
    category: 'cultural',
    content: 'The campus was transformed into a vibrant canvas during our annual fest. From classical dance performances to rock bands, the diversity of talent was staggering. It served as a reminder that engineering students are just as creative as they are analytical.',
    author: 2
  },
  {
    title: 'Photography Club: Capturing Campus Life',
    category: 'cultural',
    content: 'The photography club held an exhibition titled "Light and Shadow." The collection featured candid shots of student life, architectural details of our college buildings, and stunning macro photography of the campus gardens.',
    author: 1
  },
  {
    title: 'The Evolution of the College Magazine',
    category: 'cultural',
    content: 'We are moving away from manual design to automated systems. This year’s magazine is a testament to the integration of technology and creativity, using AI to ensure that every student\'s voice is heard and presented professionally.',
    author: 2
  },
  {
    title: 'Literary Society: The Power of Poetry',
    category: 'cultural',
    content: 'The poetry slam saw students expressing their thoughts on everything from the pressure of exams to the beauty of Mumbai monsoons. It was a moving evening that showcased the emotional depth of our student community.',
    author: 1
  },
  {
    title: 'Volunteering and Social Responsibility',
    category: 'cultural',
    content: 'Our NSS unit organized a blood donation drive and a tree plantation event last month. Engaging with the community helps students develop empathy and a sense of responsibility toward society, making them better citizens and professionals.',
    author: 2
  }
];

async function seed() {
  await sequelize.authenticate();
  await connectMongo();
  
  // Create second student
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash('demo123', salt);
  
  const [student2] = await User.findOrCreate({
    where: { email: 'student2@fcrit.ac.in' },
    defaults: {
      name: 'Rohan Deshmukh',
      email: 'student2@fcrit.ac.in',
      role: 'student',
      rollNumber: '1023457',
      department: 'Computer Engineering',
      passwordHash
    }
  });

  const student1 = await User.findOne({ where: { email: 'student@fcrit.ac.in' }});
  
  const authorMap = {
    1: student1,
    2: student2
  };

  // Clear existing submissions
  await Submission.deleteMany({});
  
  for (const art of articles) {
    const author = authorMap[art.author];
    await Submission.create({
      title: art.title,
      content: art.content,
      category: art.category,
      status: 'needs_review', // bypass AI triage for these seeded ones so they show up for faculty
      authorId: author.id,
      authorName: author.name,
      authorRoll: author.rollNumber,
      department: author.department,
      aiAnalysis: {
        grammarScore: 80 + Math.floor(Math.random() * 20),
        toneScore: 80 + Math.floor(Math.random() * 20),
        riskLevel: 'clean',
        riskScore: 10
      }
    });
  }
  
  console.log('Seed completed!');
  process.exit(0);
}

seed().catch(console.error);
