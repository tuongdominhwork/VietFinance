const prisma = require('../config/db');

const SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  tier: true,
  isActive: true,
  createdAt: true,
};

const User = {
  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findById(id) {
    return prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
  },

  async create({ name, email, password, role, tier = null }) {
    return prisma.user.create({
      data: { name, email, password, role, tier },
      select: SAFE_SELECT,
    });
  },

  async updatePassword(id, hashedPassword) {
    await prisma.user.update({ where: { id }, data: { password: hashedPassword } });
  },

  async deactivate(id) {
    await prisma.user.update({ where: { id }, data: { isActive: false } });
  },

  async list({ role, tier } = {}) {
    const where = {};
    if (role) where.role = role;
    if (tier) where.tier = tier;
    return prisma.user.findMany({ where, select: SAFE_SELECT, orderBy: { createdAt: 'asc' } });
  },
};

module.exports = User;
