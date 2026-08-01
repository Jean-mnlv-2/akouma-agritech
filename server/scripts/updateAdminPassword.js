
/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateAdminPassword() {
  const email = 'admin@kilimo.org';
  const password = 'KilimoAdmin2026!';

  try {
    console.log('🔐 MISE À JOUR DU MOT DE PASSE ADMIN\n');

    const existing = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (!existing) {
      console.log('❌ Utilisateur admin non trouvé');
      return;
    }

    console.log('👤 Utilisateur trouvé:');
    console.log(`   📧 Email: ${existing.email}`);
    console.log(`   🔑 Rôle: ${existing.role}`);
    console.log(`   ✅ Actif: ${existing.isActive ? 'Oui' : 'Non'}`);

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash }
    });

    console.log('\n✅ Mot de passe mis à jour avec succès!');
    console.log('\n🎯 Identifiants de connexion:');
    console.log(`   Email: ${email}`);
    console.log(`   Mot de passe: ${password}`);

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du mot de passe:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();

