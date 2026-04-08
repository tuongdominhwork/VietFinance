require('dotenv').config();
const bcrypt = require('bcryptjs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const prisma = require('./config/db');

// ── PDF generator ──────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');

function slugify(name) {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Short paragraph templates keyed by rough category
const PARAS = {
  onboarding: [
    'This document has been prepared by the Human Resources department to assist new team members during their onboarding journey at VietFinance. Please review it carefully and reach out to your assigned buddy or HR coordinator with any questions.',
    'As part of the onboarding programme, all new hires are required to complete the steps outlined in this document within their first two weeks. Completion is tracked in the HR portal under "Onboarding Checklist".',
  ],
  policy: [
    'This policy document sets out the rules, expectations, and procedures that apply to all VietFinance employees. Non-compliance may result in disciplinary action. Updates are published on the internal portal when revisions are made.',
    'All employees are expected to acknowledge receipt of this policy through the HR self-service portal. Questions regarding interpretation should be directed to the Compliance team or your line manager.',
  ],
  training: [
    'This training material has been developed by the Learning & Development team to support employee skill-building. Please complete the accompanying assessment on the e-learning portal after reviewing this guide.',
    'Completion records are automatically stored in the Learning Management System (LMS). Certificates of completion can be downloaded from your LMS profile page once all modules are finished.',
  ],
  hr: [
    'This document is issued by the Human Resources department and is intended for internal use only. Information contained herein is confidential and should not be shared outside of authorised channels.',
    'For amendments or queries related to HR documentation, please submit a request via the HR portal or contact the HR helpdesk at hr@vietfinance.vn during business hours (Mon–Fri 08:00–17:00).',
  ],
  finance: [
    'This financial document contains sensitive information and is classified as confidential. Access is restricted to authorised personnel only. Unauthorised distribution or reproduction is strictly prohibited.',
    'All figures presented are subject to audit and may be revised. For the most current data, please refer to the primary financial systems or contact the Finance department at finance@vietfinance.vn.',
  ],
  default: [
    'This document is maintained by the relevant department at VietFinance and is subject to periodic review. The latest version is always available on the internal document portal.',
    'For questions or feedback regarding this document, please contact the document owner or the relevant department head. Version history is tracked in the document management system.',
  ],
};

function pickParas(docName) {
  const n = docName.toLowerCase();
  if (n.includes('onboard') || n.includes('welcome') || n.includes('access') || n.includes('badge')) return PARAS.onboarding;
  if (n.includes('policy') || n.includes('code') || n.includes('privacy') || n.includes('remote') || n.includes('expense') || n.includes('reimburs')) return PARAS.policy;
  if (n.includes('train') || n.includes('e-learn') || n.includes('compliance') || n.includes('customer service')) return PARAS.training;
  if (n.includes('hr') || n.includes('human') || n.includes('benefit') || n.includes('leave') || n.includes('payroll') || n.includes('recruit') || n.includes('org') || n.includes('handbook') || n.includes('performance')) return PARAS.hr;
  if (n.includes('financ') || n.includes('report') || n.includes('budget') || n.includes('audit') || n.includes('loan') || n.includes('invest') || n.includes('credit') || n.includes('fx') || n.includes('tax') || n.includes('treasury') || n.includes('saving') || n.includes('provision')) return PARAS.finance;
  return PARAS.default;
}

function makeTable(doc, headers, rows) {
  const colW = (doc.page.width - 120) / headers.length;
  let y = doc.y;

  // Header row
  doc.font('Helvetica-Bold').fontSize(9);
  headers.forEach((h, i) => {
    doc.text(h, 60 + i * colW, y, { width: colW - 4, lineBreak: false });
  });
  y += 16;
  doc.moveTo(60, y).lineTo(doc.page.width - 60, y).strokeColor('#CCCCCC').stroke();
  y += 4;

  // Data rows
  doc.font('Helvetica').fontSize(9);
  rows.forEach(row => {
    row.forEach((cell, i) => {
      doc.text(String(cell), 60 + i * colW, y, { width: colW - 4, lineBreak: false });
    });
    y += 16;
  });

  doc.y = y + 8;
}

function makePDF(docName, filePath) {
  return new Promise((resolve, reject) => {
    const pdfDoc = new PDFDocument({ margin: 60, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    pdfDoc.pipe(stream);

    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const baseName = docName.replace(/\.[^.]+$/, ''); // strip extension

    // ── Header bar ──
    pdfDoc
      .rect(0, 0, pdfDoc.page.width, 48)
      .fill('#0B3C71');
    pdfDoc
      .fillColor('white')
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('VIETFINANCE', 60, 16, { lineBreak: false });
    pdfDoc
      .fontSize(9)
      .font('Helvetica')
      .text('Internal Document', 60, 32, { lineBreak: false });

    pdfDoc.fillColor('#0B3C71').moveDown(2);

    // ── Title ──
    pdfDoc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#0B3C71')
      .text(baseName, { align: 'center' });

    pdfDoc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#555555')
      .text(`Issued: ${date}  ·  Confidential`, { align: 'center' });

    pdfDoc.moveDown(1.5);
    pdfDoc.moveTo(60, pdfDoc.y).lineTo(pdfDoc.page.width - 60, pdfDoc.y).strokeColor('#DBB35F').lineWidth(1.5).stroke();
    pdfDoc.moveDown(1);

    // ── Body paragraphs ──
    const paras = pickParas(docName);
    pdfDoc.fillColor('#222222').fontSize(11).font('Helvetica').lineGap(4);
    paras.forEach(p => {
      pdfDoc.text(p, { align: 'justify' });
      pdfDoc.moveDown(0.8);
    });

    // ── Extra content depending on type ──
    const n = docName.toLowerCase();
    pdfDoc.moveDown(0.5);

    if (n.includes('rate') || n.includes('schedule') || n.includes('catalog') || n.includes('rates')) {
      pdfDoc.font('Helvetica-Bold').fontSize(12).fillColor('#0B3C71').text('Current Rates & Schedules');
      pdfDoc.moveDown(0.5);
      makeTable(pdfDoc,
        ['Product', 'Rate (p.a.)', 'Min. Balance', 'Tenure'],
        [
          ['Standard Savings', '4.2%', '0 VND', 'Flexible'],
          ['Premium Savings', '5.8%', '50,000,000 VND', 'Flexible'],
          ['Term Deposit 6M', '6.3%', '10,000,000 VND', '6 months'],
          ['Term Deposit 12M', '7.1%', '10,000,000 VND', '12 months'],
          ['Personal Loan', '9.5%', '—', '12–60 months'],
          ['Home Loan', '7.2%', '—', 'Up to 25 years'],
        ]
      );
    } else if (n.includes('budget') || n.includes('report') || n.includes('financ')) {
      pdfDoc.font('Helvetica-Bold').fontSize(12).fillColor('#0B3C71').text('Financial Summary');
      pdfDoc.moveDown(0.5);
      makeTable(pdfDoc,
        ['Category', 'Q1 2025 (VND)', 'Q4 2024 (VND)', 'Change'],
        [
          ['Total Revenue', '1,240,000,000', '1,105,000,000', '+12.2%'],
          ['Operating Expenses', '820,000,000', '795,000,000', '+3.1%'],
          ['Net Profit', '420,000,000', '310,000,000', '+35.5%'],
          ['Loan Portfolio', '8,500,000,000', '7,900,000,000', '+7.6%'],
          ['Deposit Base', '12,300,000,000', '11,800,000,000', '+4.2%'],
        ]
      );
    } else if (n.includes('org chart') || n.includes('org_chart')) {
      pdfDoc.font('Helvetica-Bold').fontSize(12).fillColor('#0B3C71').text('Organisation Structure');
      pdfDoc.moveDown(0.5);
      makeTable(pdfDoc,
        ['Department', 'Head', 'Headcount'],
        [
          ['Executive', 'CEO — Nguyen Van An', '3'],
          ['Finance', 'CFO — Tran Thi Bich', '18'],
          ['Technology', 'CTO — Le Minh Duc', '24'],
          ['Human Resources', 'CHRO — Pham Thu Ha', '12'],
          ['Operations', 'COO — Hoang Quoc Viet', '31'],
          ['Compliance', 'CCO — Vo Thi Lan', '9'],
        ]
      );
    } else if (n.includes('checklist') || n.includes('request form') || n.includes('leave')) {
      pdfDoc.font('Helvetica-Bold').fontSize(12).fillColor('#0B3C71').text('Required Steps / Form Fields');
      pdfDoc.moveDown(0.5);
      const steps = n.includes('leave')
        ? ['Employee Name', 'Employee ID', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Approving Manager', 'Reason (optional)']
        : ['Full Name', 'Department', 'Start Date', 'Manager Signature', 'IT Contact', 'Badge Collected', 'System Access Granted', 'Training Completed'];
      pdfDoc.font('Helvetica').fontSize(11).fillColor('#222222');
      steps.forEach((s, i) => pdfDoc.text(`${i + 1}.  ${s}`));
    } else {
      pdfDoc.font('Helvetica-Bold').fontSize(12).fillColor('#0B3C71').text('Key Points');
      pdfDoc.moveDown(0.5);
      pdfDoc.font('Helvetica').fontSize(11).fillColor('#222222').list([
        'Review all sections before signing or acknowledging.',
        'Store this document in a secure location.',
        'Contact your manager if you have any questions.',
        'Report any discrepancies to the relevant department immediately.',
      ], { bulletRadius: 2, textIndent: 15 });
    }

    // ── Footer ──
    const footerY = pdfDoc.page.height - 40;
    pdfDoc
      .moveTo(60, footerY - 8)
      .lineTo(pdfDoc.page.width - 60, footerY - 8)
      .strokeColor('#CCCCCC').lineWidth(0.5).stroke();
    pdfDoc
      .fontSize(8).font('Helvetica').fillColor('#999999')
      .text('© 2025 VietFinance. Confidential — for internal use only.', 60, footerY, { align: 'center' });

    pdfDoc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// ── Accounts ───────────────────────────────────────────────
const accounts = [
  { name: 'Super Admin',    email: 'admin@vietfinance.vn',    password: 'admin123',    role: 'admin',    tier: null },
  { name: 'Branch Manager', email: 'manager@vietfinance.vn',  password: 'manager123',  role: 'manager',  tier: null },
  { name: 'Junior Nguyen',  email: 'junior@vietfinance.vn',   password: 'employee123', role: 'employee', tier: 'junior' },
  { name: 'Senior Tran',    email: 'senior@vietfinance.vn',   password: 'employee123', role: 'employee', tier: 'senior' },
  { name: 'Free User Le',   email: 'free@vietfinance.vn',     password: 'customer123', role: 'customer', tier: 'no_plan' },
  { name: 'Student Pham',   email: 'student@vietfinance.vn',  password: 'customer123', role: 'customer', tier: 'student' },
  { name: 'VIP Hoang',      email: 'vip@vietfinance.vn',      password: 'customer123', role: 'customer', tier: 'vip' },
  { name: 'Premium Vo',     email: 'premium@vietfinance.vn',  password: 'customer123', role: 'customer', tier: 'premium' },
];

async function seed() {
  // ── Users ──────────────────────────────────────────────
  for (const acc of accounts) {
    const hashed = await bcrypt.hash(acc.password, 10);
    await prisma.user.upsert({
      where: { email: acc.email },
      update: {},
      create: { name: acc.name, email: acc.email, password: hashed, role: acc.role, tier: acc.tier },
    });
  }

  const admin   = await prisma.user.findUnique({ where: { email: 'admin@vietfinance.vn' } });
  const manager = await prisma.user.findUnique({ where: { email: 'manager@vietfinance.vn' } });
  const senior  = await prisma.user.findUnique({ where: { email: 'senior@vietfinance.vn' } });

  // ── Clean existing data ─────────────────────────────────
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.document.deleteMany();
  await prisma.folder.deleteMany();

  // Remove old uploaded files
  if (fs.existsSync(UPLOADS_DIR)) fs.rmSync(UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  // ── Folders ─────────────────────────────────────────────
  const generalKnowledge = await prisma.folder.create({
    data: { name: 'General Knowledge', createdById: admin.id, permission: 'employee' },
  });
  const onboarding = await prisma.folder.create({
    data: { name: 'Onboarding', parentId: generalKnowledge.id, createdById: admin.id, permission: 'employee' },
  });
  const policies = await prisma.folder.create({
    data: { name: 'Policies', parentId: generalKnowledge.id, createdById: admin.id, permission: 'employee' },
  });
  const training = await prisma.folder.create({
    data: { name: 'Training', parentId: generalKnowledge.id, createdById: admin.id, permission: 'employee' },
  });
  const subfolder1 = await prisma.folder.create({
    data: { name: 'Subfolder 1', parentId: onboarding.id, createdById: admin.id, permission: 'admin' },
  });
  const subfolder2 = await prisma.folder.create({
    data: { name: 'Subfolder 2', parentId: onboarding.id, createdById: admin.id, permission: 'employee' },
  });
  const humanResources = await prisma.folder.create({
    data: { name: 'Human Resources', createdById: manager.id, permission: 'manager' },
  });
  const finance = await prisma.folder.create({
    data: { name: 'Finance', createdById: admin.id, permission: 'admin' },
  });

  // ── Documents (generate PDFs) ───────────────────────────
  const yesterday   = new Date(Date.now() - 86400000);
  const twoDaysAgo  = new Date(Date.now() - 2 * 86400000);

  const docDefs = [
    // Subfolder 1
    { name: 'New Hire Welcome Guide.pdf',       folderId: subfolder1.id, addedById: admin.id,   size: '1.2 MB', kind: 'PDF',        permission: 'admin',   date: new Date() },
    { name: 'System Access Request Form.docx',  folderId: subfolder1.id, addedById: admin.id,   size: '48 KB',  kind: 'Word',       permission: 'admin',   date: new Date() },
    { name: 'Office Floor Plan.pdf',            folderId: subfolder1.id, addedById: manager.id, size: '820 KB', kind: 'PDF',        permission: 'admin',   date: yesterday },
    { name: 'IT Setup Checklist.xlsx',          folderId: subfolder1.id, addedById: senior.id,  size: '96 KB',  kind: 'Excel',      permission: 'admin',   date: yesterday },
    { name: 'Badge & Security Policy.pdf',      folderId: subfolder1.id, addedById: admin.id,   size: '310 KB', kind: 'PDF',        permission: 'admin',   date: new Date() },
    // Subfolder 2
    { name: 'Team Introduction Slides.pptx',   folderId: subfolder2.id, addedById: manager.id, size: '2.4 MB', kind: 'PowerPoint', permission: 'employee', date: new Date() },
    { name: 'Mentorship Program Guide.pdf',     folderId: subfolder2.id, addedById: senior.id,  size: '540 KB', kind: 'PDF',        permission: 'employee', date: yesterday },
    // Policies
    { name: 'Code of Conduct.pdf',              folderId: policies.id,   addedById: admin.id,   size: '1.1 MB', kind: 'PDF',        permission: 'employee', date: new Date() },
    { name: 'Data Privacy Policy.pdf',          folderId: policies.id,   addedById: admin.id,   size: '680 KB', kind: 'PDF',        permission: 'employee', date: yesterday },
    { name: 'Remote Work Policy.docx',          folderId: policies.id,   addedById: manager.id, size: '124 KB', kind: 'Word',       permission: 'employee', date: new Date() },
    { name: 'Expense Reimbursement Policy.pdf', folderId: policies.id,   addedById: admin.id,   size: '430 KB', kind: 'PDF',        permission: 'employee', date: yesterday },
    // Training
    { name: 'Banking Regulations 101.pdf',      folderId: training.id,   addedById: senior.id,  size: '3.2 MB', kind: 'PDF',        permission: 'employee', date: new Date() },
    { name: 'Customer Service Training.pptx',   folderId: training.id,   addedById: manager.id, size: '1.8 MB', kind: 'PowerPoint', permission: 'employee', date: yesterday },
    { name: 'Compliance E-Learning Guide.pdf',  folderId: training.id,   addedById: admin.id,   size: '920 KB', kind: 'PDF',        permission: 'employee', date: new Date() },
    // Human Resources
    { name: 'Employee Handbook 2025.pdf',       folderId: humanResources.id, addedById: manager.id, size: '4.1 MB', kind: 'PDF',   permission: 'manager',  date: new Date() },
    { name: 'Benefits Overview.pdf',            folderId: humanResources.id, addedById: manager.id, size: '760 KB', kind: 'PDF',   permission: 'employee', date: yesterday },
    { name: 'Leave Request Form.docx',          folderId: humanResources.id, addedById: manager.id, size: '38 KB',  kind: 'Word',  permission: 'employee', date: new Date() },
    { name: 'Performance Review Template.xlsx', folderId: humanResources.id, addedById: manager.id, size: '185 KB', kind: 'Excel', permission: 'manager',  date: yesterday },
    { name: 'Payroll Calendar 2025.pdf',        folderId: humanResources.id, addedById: admin.id,   size: '210 KB', kind: 'PDF',   permission: 'employee', date: new Date() },
    { name: 'Recruitment Process Guide.pdf',    folderId: humanResources.id, addedById: manager.id, size: '1.3 MB', kind: 'PDF',   permission: 'manager',  date: yesterday },
    { name: 'Org Chart Q1 2025.pdf',            folderId: humanResources.id, addedById: admin.id,   size: '640 KB', kind: 'PDF',   permission: 'manager',  date: new Date() },
    { name: 'Training Budget 2025.xlsx',        folderId: humanResources.id, addedById: admin.id,   size: '92 KB',  kind: 'Excel', permission: 'manager',  date: yesterday },
    // Finance
    { name: 'Q1 2025 Financial Report.pdf',     folderId: finance.id, addedById: admin.id,   size: '5.6 MB', kind: 'PDF',   permission: 'admin',   date: new Date() },
    { name: 'Q4 2024 Financial Report.pdf',     folderId: finance.id, addedById: admin.id,   size: '5.2 MB', kind: 'PDF',   permission: 'admin',   date: twoDaysAgo },
    { name: 'Annual Budget 2025.xlsx',          folderId: finance.id, addedById: admin.id,   size: '1.4 MB', kind: 'Excel', permission: 'admin',   date: new Date() },
    { name: 'Savings Rate Schedule.pdf',        folderId: finance.id, addedById: manager.id, size: '320 KB', kind: 'PDF',   permission: 'employee', date: yesterday },
    { name: 'Loan Products Catalog.pdf',        folderId: finance.id, addedById: manager.id, size: '870 KB', kind: 'PDF',   permission: 'employee', date: new Date() },
    { name: 'Investment Fund Overview.pdf',     folderId: finance.id, addedById: admin.id,   size: '2.1 MB', kind: 'PDF',   permission: 'admin',   date: yesterday },
    { name: 'FX Rate Policy.pdf',               folderId: finance.id, addedById: admin.id,   size: '480 KB', kind: 'PDF',   permission: 'manager', date: new Date() },
    { name: 'Credit Card Terms 2025.pdf',       folderId: finance.id, addedById: manager.id, size: '610 KB', kind: 'PDF',   permission: 'employee', date: yesterday },
    { name: 'Audit Report 2024.pdf',            folderId: finance.id, addedById: admin.id,   size: '3.8 MB', kind: 'PDF',   permission: 'admin',   date: twoDaysAgo },
    { name: 'Tax Filing Guide 2024.pdf',        folderId: finance.id, addedById: senior.id,  size: '1.1 MB', kind: 'PDF',   permission: 'employee', date: twoDaysAgo },
    { name: 'Treasury Management Policy.docx',  folderId: finance.id, addedById: admin.id,   size: '290 KB', kind: 'Word',  permission: 'admin',   date: yesterday },
    { name: 'Provisioning Standards.xlsx',      folderId: finance.id, addedById: admin.id,   size: '740 KB', kind: 'Excel', permission: 'admin',   date: new Date() },
  ];

  process.stdout.write('Generating PDFs ');
  for (const def of docDefs) {
    const slug = slugify(def.name.replace(/\.[^.]+$/, ''));
    const fileName = `${slug}_${Date.now()}.pdf`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    await makePDF(def.name, filePath);
    await prisma.document.create({
      data: {
        name: def.name,
        folderId: def.folderId,
        addedById: def.addedById,
        size: def.size,
        kind: def.kind,
        permission: def.permission,
        filePath: `uploads/${fileName}`,
        createdAt: def.date,
        updatedAt: def.date,
      },
    });
    process.stdout.write('.');
  }
  console.log(' done');

  // ── Chat Sessions ────────────────────────────────────────
  const yesterday2 = new Date(Date.now() - 86400000);
  const twoDaysAgo2 = new Date(Date.now() - 2 * 86400000);

  const chatSeeds = [
    {
      title: 'Open a savings account',
      createdAt: new Date(),
      messages: [
        { role: 'ai',   text: "Hello! I'm VietFinance AI. How can I assist you with your banking needs today?" },
        { role: 'user', text: 'I want to open a savings account.' },
        { role: 'ai',   text: 'Great choice! We offer three savings options:\n\n• Standard Savings: 4.2% p.a.\n• Premium Savings: 5.8% p.a. (min. 50M VND)\n• Term Deposit (12 months): 7.1% p.a.\n\nWould you like to start an application?' },
        { role: 'user', text: 'Tell me about Premium Savings.' },
        { role: 'ai',   text: 'The Premium Savings account offers:\n\n• 5.8% p.a. interest rate\n• Minimum balance of 50,000,000 VND\n• Free unlimited transfers\n• Dedicated relationship manager\n• Priority customer support\n\nInterest is calculated daily and credited monthly. You can open one online in under 5 minutes!' },
      ],
    },
    {
      title: 'Transfer limits overseas',
      createdAt: new Date(Date.now() - 3600000 * 2),
      messages: [
        { role: 'ai',   text: "Hello! I'm VietFinance AI. How can I assist you with your banking needs today?" },
        { role: 'user', text: 'What are the overseas transfer limits?' },
        { role: 'ai',   text: 'Overseas transfer limits depend on your account type:\n\n• Standard: up to $5,000 USD/day\n• VIP: up to $20,000 USD/day\n• Premium: up to $50,000 USD/day\n\nAdditional verification may be required for large transfers.' },
      ],
    },
    {
      title: 'Credit card rewards policy',
      createdAt: yesterday2,
      messages: [
        { role: 'ai',   text: "Hello! I'm VietFinance AI. How can I assist you with your banking needs today?" },
        { role: 'user', text: 'How does the credit card cashback work?' },
        { role: 'ai',   text: 'Our VietCredit card offers up to 30% cashback on selected categories:\n\n• Dining & Food: 15%\n• Online Shopping: 10%\n• Travel & Transport: 8%\n• Other purchases: 1%\n\nCashback is credited monthly to your account.' },
      ],
    },
    {
      title: 'Nearest branch location',
      createdAt: yesterday2,
      messages: [
        { role: 'ai',   text: "Hello! I'm VietFinance AI. How can I assist you with your banking needs today?" },
        { role: 'user', text: 'Where is the nearest branch to District 1, Ho Chi Minh City?' },
        { role: 'ai',   text: 'The nearest branch to District 1 is:\n\n📍 VietFinance — Nguyen Hue Branch\n45 Nguyen Hue Boulevard, District 1\nHo Chi Minh City\n\n🕐 Mon–Fri: 8:00 – 17:00\n🕐 Sat: 8:00 – 12:00\n📞 (028) 3822-0000' },
      ],
    },
    {
      title: 'Loan interest rates 2025',
      createdAt: twoDaysAgo2,
      messages: [
        { role: 'ai',   text: "Hello! I'm VietFinance AI. How can I assist you with your banking needs today?" },
        { role: 'user', text: 'What are the loan interest rates for 2025?' },
        { role: 'ai',   text: 'Our 2025 loan interest rates are:\n\n• Personal Loan: 9.5% – 12% p.a.\n• Home Loan: 7.2% – 8.8% p.a.\n• Car Loan: 8.5% – 10.5% p.a.\n• Business Loan: 10% – 14% p.a.\n\nRates vary based on credit score and loan tenure.' },
      ],
    },
    {
      title: 'ATM withdrawal abroad',
      createdAt: twoDaysAgo2,
      messages: [
        { role: 'ai',   text: "Hello! I'm VietFinance AI. How can I assist you with your banking needs today?" },
        { role: 'user', text: 'Can I withdraw cash from ATMs abroad?' },
        { role: 'ai',   text: 'Yes! Your VietFinance debit card works at all VISA/Mastercard ATMs worldwide.\n\n• Daily limit: 10,000,000 VND equivalent\n• Fee: 1.5% (min. 50,000 VND) per withdrawal\n• Currency conversion uses the daily interbank rate\n\nEnable international withdrawals in the app before traveling.' },
      ],
    },
  ];

  for (const session of chatSeeds) {
    await prisma.chatSession.create({
      data: {
        title: session.title,
        userId: admin.id,
        createdAt: session.createdAt,
        updatedAt: session.createdAt,
        messages: {
          create: session.messages.map((m, i) => ({
            role: m.role,
            text: m.text,
            createdAt: new Date(session.createdAt.getTime() + i * 60000),
          })),
        },
      },
    });
  }

  console.log('\nSeed complete. Test accounts:\n');
  console.log('Role       | Tier       | Email                         | Password');
  console.log('-----------|------------|-------------------------------|------------');
  for (const acc of accounts) {
    const role  = acc.role.padEnd(10);
    const tier  = (acc.tier || '-').padEnd(10);
    const email = acc.email.padEnd(30);
    console.log(`${role} | ${tier} | ${email} | ${acc.password}`);
  }
  console.log(`\nFolders: 8 | Documents: ${docDefs.length} PDFs | Chat sessions: ${chatSeeds.length}\n`);
}

seed()
  .catch((err) => { console.error('Seed failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
