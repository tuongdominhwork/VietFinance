require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('./config/db');

const accounts = [
  // Admin
  { name: 'Super Admin',    email: 'admin@vietfinance.vn',    password: 'admin123',    role: 'admin',    tier: null },
  // Manager
  { name: 'Branch Manager', email: 'manager@vietfinance.vn',  password: 'manager123',  role: 'manager',  tier: null },
  // Employees
  { name: 'Junior Nguyen',  email: 'junior@vietfinance.vn',   password: 'employee123', role: 'employee', tier: 'junior' },
  { name: 'Senior Tran',    email: 'senior@vietfinance.vn',   password: 'employee123', role: 'employee', tier: 'senior' },
  // Customers
  { name: 'Free User Le',   email: 'free@vietfinance.vn',     password: 'customer123', role: 'customer', tier: 'no_plan' },
  { name: 'Student Pham',   email: 'student@vietfinance.vn',  password: 'customer123', role: 'customer', tier: 'student' },
  { name: 'VIP Hoang',      email: 'vip@vietfinance.vn',      password: 'customer123', role: 'customer', tier: 'vip' },
  { name: 'Premium Vo',     email: 'premium@vietfinance.vn',  password: 'customer123', role: 'customer', tier: 'premium' },
];

async function seed() {
  for (const acc of accounts) {
    const hashed = await bcrypt.hash(acc.password, 10);
    await prisma.user.upsert({
      where: { email: acc.email },
      update: {},
      create: { name: acc.name, email: acc.email, password: hashed, role: acc.role, tier: acc.tier },
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
  console.log('');
}

seed()
  .catch((err) => { console.error('Seed failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
