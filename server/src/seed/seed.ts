import bcrypt from 'bcryptjs';
import { appConfig } from '../config/env.js';
import { connectDb, disconnectDb } from '../config/mongoose.js';
import { Role, UserStatus } from '../../../shared/src/enums.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

async function ensureUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}): Promise<void> {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    logger.info({ email: input.email }, 'User already exists, skipping');
    return;
  }
  await User.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    password: await bcrypt.hash(input.password, 10),
    role: input.role,
    status: UserStatus.ACTIVE,
  });
  logger.info({ email: input.email, role: input.role }, 'Created user');
}

async function seed(): Promise<void> {
  if (appConfig.isProd) {
    logger.warn('Seeding is disabled in production');
    return;
  }

  await connectDb();

  await ensureUser({
    name: 'Material Mundi Admin',
    email: 'admin@materialmundi.test',
    phone: '+10000000000',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!',
    role: Role.ADMIN,
  });

  await ensureUser({
    name: 'Demo Customer',
    email: 'customer@materialmundi.test',
    phone: '+10000000001',
    password: process.env.SEED_CUSTOMER_PASSWORD ?? 'Customer123!',
    role: Role.CUSTOMER,
  });

  await disconnectDb();
  logger.info('Seed complete');
}

seed().catch((error) => {
  logger.error({ err: error }, 'Seed failed');
  process.exitCode = 1;
  void disconnectDb().finally(() => process.exit());
});
