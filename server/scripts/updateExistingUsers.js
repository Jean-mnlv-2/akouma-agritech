/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateExistingUsers() {
  try {
    console.log('🔄 MISE À JOUR DES UTILISATEURS EXISTANTS VERS ADMIN\n');

    // Mettre à jour tous les utilisateurs existants vers admin
    const result = await prisma.user.updateMany({
      where: {
        role: 'user'  // Seulement ceux qui ont le rôle 'user'
      },
      data: {
        role: 'admin'
      }
    });

    console.log(`✅ ${result.count} utilisateur(s) mis à jour vers le rôle admin`);

    // Afficher tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log('\n👥 UTILISATEURS ACTUELS:');
    console.log('-'.repeat(40));
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName || 'Sans nom'}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Rôle: ${user.role}`);
      console.log(`   ✅ Actif: ${user.isActive ? 'Oui' : 'Non'}`);
      console.log('');
    });

    console.log('🎯 Tous les utilisateurs ont maintenant le rôle admin!');
    console.log('💡 Vous pouvez vous connecter avec n\'importe quel compte existant.');

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingUsers();



