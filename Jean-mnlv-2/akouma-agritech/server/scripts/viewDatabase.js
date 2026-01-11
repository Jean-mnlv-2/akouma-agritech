/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function viewDatabase() {
  try {
    console.log('🔍 AFFICHAGE DE LA BASE DE DONNÉES LOCALE\n');
    console.log('=' .repeat(50));

    // Vérifier la connexion
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connexion à la base de données réussie\n');

    // Afficher les utilisateurs
    console.log('👥 UTILISATEURS:');
    console.log('-'.repeat(30));
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.fullName || 'Sans nom'}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Rôle: ${user.role}`);
        console.log(`   ✅ Actif: ${user.isActive ? 'Oui' : 'Non'}`);
        console.log(`   📅 Créé: ${user.createdAt.toLocaleString()}`);
        console.log(`   🆔 ID: ${user.id}`);
      });
    }

    // Afficher les pays
    console.log('\n\n🌍 PAYS:');
    console.log('-'.repeat(30));
    const countries = await prisma.country.findMany({
      select: { id: true, name: true, code: true, phoneCode: true },
      orderBy: { name: 'asc' }
    });

    console.log(`Total: ${countries.length} pays`);
    if (countries.length > 0) {
      console.log('\nPremiers 10 pays:');
      countries.slice(0, 10).forEach((country, index) => {
        console.log(`${index + 1}. ${country.name} (${country.code}) - ${country.phoneCode}`);
      });
      if (countries.length > 10) {
        console.log(`... et ${countries.length - 10} autres pays`);
      }
    }

    // Afficher les autres tables principales
    console.log('\n\n📊 AUTRES TABLES:');
    console.log('-'.repeat(30));

    const tables = [
      { name: 'Courses', model: prisma.course },
      { name: 'News', model: prisma.news },
      { name: 'Seeds', model: prisma.seed },
      { name: 'Shop Products', model: prisma.shopProduct },
      { name: 'Partners', model: prisma.partner },
      { name: 'Donations', model: prisma.donation },
      { name: 'Contact Messages', model: prisma.contactMessage },
      { name: 'Live Streams', model: prisma.liveStream },
      { name: 'E-Learning Stats', model: prisma.eLearningStat },
      { name: 'Tasks', model: prisma.task }
    ];

    for (const table of tables) {
      try {
        const count = await table.model.count();
        console.log(`${table.name}: ${count} enregistrements`);
      } catch (error) {
        console.log(`${table.name}: Table non accessible (${error.message})`);
      }
    }

    // Vérifier les utilisateurs admin
    console.log('\n\n🔐 VÉRIFICATION ADMIN:');
    console.log('-'.repeat(30));
    const adminUsers = users.filter(u => u.role === 'admin');
    
    if (adminUsers.length === 0) {
      console.log('❌ Aucun utilisateur admin trouvé!');
      console.log('💡 Exécutez: node scripts/createAdmin.js');
    } else {
      console.log(`✅ ${adminUsers.length} utilisateur(s) admin trouvé(s):`);
      adminUsers.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.fullName})`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'affichage de la base:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

viewDatabase();



