/**
 * Database Seed Script
 * Creates initial admin user and demo data
 */

import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const SALT_ROUNDS = 12

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('Admin@2025Secure!', SALT_ROUNDS)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@prodipharm.com' },
    update: { passwordHash: adminPasswordHash },
    create: {
      name: 'Admin System',
      email: 'admin@prodipharm.com',
      passwordHash: adminPasswordHash,
      role: 'admin' as UserRole,
      region: 'Siège',
      country: 'Cameroun',
      phone: '+237 222 11 22 33',
      isActive: true,
    },
  })
  console.log('✅ Created/updated admin user:', admin.email)

  // Create DM users
  const dmPasswordHash = await bcrypt.hash('Dm@2025Secure!', SALT_ROUNDS)
  
  const dmUsers = [
    { name: 'Amadou Diallo', email: 'amadou.diallo@prodipharm.com', region: 'Douala', phone: '+237 699 123 456' },
    { name: 'Fatou Ndiaye', email: 'fatou.ndiaye@prodipharm.com', region: 'Yaoundé', phone: '+237 677 234 567' },
    { name: 'Ibrahim Sanogo', email: 'ibrahim.sanogo@prodipharm.com', region: 'Douala', phone: '+237 699 876 543' },
    { name: 'Aminata Koné', email: 'aminata.kone@prodipharm.com', region: 'Garoua', phone: '+237 655 987 654' },
  ]

  for (const dmData of dmUsers) {
    const dm = await prisma.user.upsert({
      where: { email: dmData.email },
      update: { passwordHash: dmPasswordHash },
      create: {
        name: dmData.name,
        email: dmData.email,
        passwordHash: dmPasswordHash,
        role: 'dm' as UserRole,
        region: dmData.region,
        country: 'Cameroun',
        phone: dmData.phone,
        isActive: true,
      },
    })
    console.log('✅ Created/updated DM user:', dm.email)
  }

  // Create supervisor
  const supervisorPasswordHash = await bcrypt.hash('Sup@2025Secure!', SALT_ROUNDS)
  const supervisor = await prisma.user.upsert({
    where: { email: 'jp.mensah@prodipharm.com' },
    update: { passwordHash: supervisorPasswordHash },
    create: {
      name: 'Jean-Pierre Mensah',
      email: 'jp.mensah@prodipharm.com',
      passwordHash: supervisorPasswordHash,
      role: 'superviseur' as UserRole,
      region: 'Cameroun',
      country: 'Cameroun',
      phone: '+237 699 000 111',
      isActive: true,
    },
  })
  console.log('✅ Created/updated supervisor user:', supervisor.email)

  // Create accounting user
  const accountingPasswordHash = await bcrypt.hash('Cpt@2025Secure!', SALT_ROUNDS)
  const accounting = await prisma.user.upsert({
    where: { email: 'marie.fouda@prodipharm.com' },
    update: { passwordHash: accountingPasswordHash },
    create: {
      name: 'Marie Fouda',
      email: 'marie.fouda@prodipharm.com',
      passwordHash: accountingPasswordHash,
      role: 'comptabilite' as UserRole,
      region: 'Siège',
      country: 'Cameroun',
      phone: '+237 222 33 44 55',
      isActive: true,
    },
  })
  console.log('✅ Created/updated accounting user:', accounting.email)

  // Create marketing user
  const marketingPasswordHash = await bcrypt.hash('Mkt@2025Secure!', SALT_ROUNDS)
  const marketing = await prisma.user.upsert({
    where: { email: 'paul.atangana@prodipharm.com' },
    update: { passwordHash: marketingPasswordHash },
    create: {
      name: 'Paul Atangana',
      email: 'paul.atangana@prodipharm.com',
      passwordHash: marketingPasswordHash,
      role: 'marketing' as UserRole,
      region: 'Siège',
      country: 'Cameroun',
      phone: '+237 222 66 77 88',
      isActive: true,
    },
  })
  console.log('✅ Created/updated marketing user:', marketing.email)

  console.log('🎉 Database seed completed!')
  console.log('\n📋 Test Credentials:')
  console.log('─────────────────────────────────────')
  console.log('Admin: admin@prodipharm.com / Admin@2025Secure!')
  console.log('DM: amadou.diallo@prodipharm.com / Dm@2025Secure!')
  console.log('Supervisor: jp.mensah@prodipharm.com / Sup@2025Secure!')
  console.log('Accounting: marie.fouda@prodipharm.com / Cpt@2025Secure!')
  console.log('Marketing: paul.atangana@prodipharm.com / Mkt@2025Secure!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
