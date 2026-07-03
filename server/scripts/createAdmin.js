/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'admin@kilimo.com';
  const password = 'admin123';
  const fullName = 'Administrateur';

  try {
    console.log('🔐 CRÉATION D\'UN UTILISATEUR ADMIN\n');

    // Vérifier si l'admin existe déjà
    const existing = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (existing) {
      console.log('👤 Utilisateur admin existe déjà:');
      console.log(`   📧 Email: ${existing.email}`);
      console.log(`   🔑 Rôle: ${existing.role}`);
      console.log(`   ✅ Actif: ${existing.isActive ? 'Oui' : 'Non'}`);
      
      if (existing.role !== 'admin') {
        console.log('\n🔄 Mise à jour du rôle vers admin...');
        await prisma.user.update({
          where: { id: existing.id },
          data: { 
            role: 'admin',
            isActive: true,
            fullName: fullName
          }
        });
        console.log('✅ Rôle mis à jour vers admin');
      }
      
      console.log('\n🎯 Identifiants de connexion:');
      console.log(`   Email: ${email}`);
      console.log(`   Mot de passe: ${password}`);
      return;
    }

    // Créer l'admin
    console.log('➕ Création d\'un nouvel utilisateur admin...');
    const passwordHash = await bcrypt.hash(password, 12);
    
    const admin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: 'admin',
        isActive: true
      }
    });

    console.log('✅ Utilisateur admin créé avec succès!');
    console.log(`   🆔 ID: ${admin.id}`);
    console.log(`   📧 Email: ${admin.email}`);
    console.log(`   👤 Nom: ${admin.fullName}`);
    console.log(`   🔑 Rôle: ${admin.role}`);
    console.log(`   ✅ Actif: ${admin.isActive}`);
    
    console.log('\n🎯 Identifiants de connexion:');
    console.log(`   Email: ${email}`);
    console.log(`   Mot de passe: ${password}`);

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();



