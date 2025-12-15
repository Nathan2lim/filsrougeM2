import { PrismaClient, TicketStatus, TicketPriority, InvoiceStatus, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================
  // CRÉATION DES RÔLES
  // ============================================
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'Administrateur système - Accès total',
        permissions: [
          'users:read', 'users:write', 'users:delete',
          'tickets:read', 'tickets:write', 'tickets:delete', 'tickets:assign',
          'billing:read', 'billing:write', 'billing:delete',
          'reporting:read', 'reporting:export',
          'roles:read', 'roles:write',
        ],
      },
    }),
    prisma.role.upsert({
      where: { name: 'MANAGER' },
      update: {},
      create: {
        name: 'MANAGER',
        description: 'Gestionnaire de compte - Gestion équipe et facturation',
        permissions: [
          'users:read', 'users:write',
          'tickets:read', 'tickets:write', 'tickets:assign',
          'billing:read', 'billing:write',
          'reporting:read', 'reporting:export',
        ],
      },
    }),
    prisma.role.upsert({
      where: { name: 'AGENT' },
      update: {},
      create: {
        name: 'AGENT',
        description: 'Agent support - Gestion des tickets',
        permissions: [
          'tickets:read', 'tickets:write',
          'users:read',
        ],
      },
    }),
    prisma.role.upsert({
      where: { name: 'CLIENT' },
      update: {},
      create: {
        name: 'CLIENT',
        description: 'Client final - Création et consultation de tickets',
        permissions: [
          'tickets:read:own', 'tickets:write:own',
          'billing:read:own',
        ],
      },
    }),
  ]);

  console.log(`✅ Created ${roles.length} roles`);

  // ============================================
  // CRÉATION DES UTILISATEURS
  // ============================================
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminRole = roles.find(r => r.name === 'ADMIN')!;
  const managerRole = roles.find(r => r.name === 'MANAGER')!;
  const agentRole = roles.find(r => r.name === 'AGENT')!;
  const clientRole = roles.find(r => r.name === 'CLIENT')!;

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@servicehub.com' },
      update: {},
      create: {
        email: 'admin@servicehub.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'ServiceHub',
        roleId: adminRole.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager@servicehub.com' },
      update: {},
      create: {
        email: 'manager@servicehub.com',
        password: hashedPassword,
        firstName: 'Marie',
        lastName: 'Manager',
        roleId: managerRole.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'agent1@servicehub.com' },
      update: {},
      create: {
        email: 'agent1@servicehub.com',
        password: hashedPassword,
        firstName: 'Jean',
        lastName: 'Agent',
        roleId: agentRole.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'agent2@servicehub.com' },
      update: {},
      create: {
        email: 'agent2@servicehub.com',
        password: hashedPassword,
        firstName: 'Sophie',
        lastName: 'Support',
        roleId: agentRole.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'client1@example.com' },
      update: {},
      create: {
        email: 'client1@example.com',
        password: hashedPassword,
        firstName: 'Pierre',
        lastName: 'Client',
        roleId: clientRole.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'client2@example.com' },
      update: {},
      create: {
        email: 'client2@example.com',
        password: hashedPassword,
        firstName: 'Anne',
        lastName: 'Entreprise',
        roleId: clientRole.id,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // ============================================
  // CRÉATION DES TICKETS DE DÉMONSTRATION
  // ============================================
  const client1 = users.find(u => u.email === 'client1@example.com')!;
  const client2 = users.find(u => u.email === 'client2@example.com')!;
  const agent1 = users.find(u => u.email === 'agent1@servicehub.com')!;
  const agent2 = users.find(u => u.email === 'agent2@servicehub.com')!;
  const manager = users.find(u => u.email === 'manager@servicehub.com')!;

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const tickets = await Promise.all([
    prisma.ticket.create({
      data: {
        reference: `TKT-${dateStr}-0001`,
        title: 'Problème de connexion à la plateforme',
        description: 'Je n\'arrive pas à me connecter depuis ce matin. Message d\'erreur: "Identifiants invalides"',
        status: TicketStatus.OPEN,
        priority: TicketPriority.HIGH,
        createdById: client1.id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 jours
      },
    }),
    prisma.ticket.create({
      data: {
        reference: `TKT-${dateStr}-0002`,
        title: 'Demande de fonctionnalité: Export Excel',
        description: 'Nous aimerions pouvoir exporter nos rapports au format Excel en plus du PDF.',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.MEDIUM,
        createdById: client2.id,
        assignedToId: agent1.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
      },
    }),
    prisma.ticket.create({
      data: {
        reference: `TKT-${dateStr}-0003`,
        title: 'Bug affichage tableau de bord',
        description: 'Les graphiques ne s\'affichent pas correctement sur Safari.',
        status: TicketStatus.WAITING_CLIENT,
        priority: TicketPriority.LOW,
        createdById: client1.id,
        assignedToId: agent2.id,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 jours
      },
    }),
    prisma.ticket.create({
      data: {
        reference: `TKT-${dateStr}-0004`,
        title: 'Erreur critique: Perte de données',
        description: 'URGENT: Des données ont disparu après la mise à jour de ce matin.',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.CRITICAL,
        createdById: client2.id,
        assignedToId: agent1.id,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // +1 jour
      },
    }),
    prisma.ticket.create({
      data: {
        reference: `TKT-${dateStr}-0005`,
        title: 'Question sur la facturation',
        description: 'Pouvez-vous m\'expliquer le détail de ma dernière facture ?',
        status: TicketStatus.RESOLVED,
        priority: TicketPriority.LOW,
        createdById: client1.id,
        assignedToId: agent2.id,
        resolvedAt: new Date(),
      },
    }),
  ]);

  console.log(`✅ Created ${tickets.length} tickets`);

  // ============================================
  // CRÉATION DES COMMENTAIRES
  // ============================================
  await prisma.ticketComment.createMany({
    data: [
      {
        ticketId: tickets[1].id,
        authorId: agent1.id,
        content: 'Bonjour, j\'ai bien reçu votre demande. Je vais étudier la faisabilité avec l\'équipe technique.',
        isInternal: false,
      },
      {
        ticketId: tickets[1].id,
        authorId: agent1.id,
        content: 'Note interne: Vérifier avec l\'équipe dev le temps nécessaire pour cette fonctionnalité.',
        isInternal: true,
      },
      {
        ticketId: tickets[2].id,
        authorId: agent2.id,
        content: 'Pouvez-vous nous indiquer la version exacte de Safari que vous utilisez ?',
        isInternal: false,
      },
      {
        ticketId: tickets[4].id,
        authorId: agent2.id,
        content: 'Votre facture détaillée vous a été envoyée par email. N\'hésitez pas si vous avez d\'autres questions.',
        isInternal: false,
      },
    ],
  });

  console.log('✅ Created ticket comments');

  // ============================================
  // CRÉATION DES FACTURES
  // ============================================
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        reference: `INV-${dateStr}-0001`,
        status: InvoiceStatus.PAID,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal: 500.00,
        taxRate: 20.00,
        taxAmount: 100.00,
        total: 600.00,
        createdById: manager.id,
        notes: 'Facture mensuelle - Abonnement Pro',
        lines: {
          create: [
            {
              description: 'Abonnement mensuel Pro',
              quantity: 1,
              unitPrice: 299.00,
              total: 299.00,
            },
            {
              description: 'Support premium (10 tickets)',
              quantity: 10,
              unitPrice: 20.10,
              total: 201.00,
            },
          ],
        },
        payments: {
          create: {
            amount: 600.00,
            method: PaymentMethod.CREDIT_CARD,
            reference: 'TXN-123456789',
          },
        },
      },
    }),
    prisma.invoice.create({
      data: {
        reference: `INV-${dateStr}-0002`,
        status: InvoiceStatus.SENT,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal: 799.00,
        taxRate: 20.00,
        taxAmount: 159.80,
        total: 958.80,
        createdById: manager.id,
        notes: 'Facture mensuelle - Abonnement Enterprise',
        lines: {
          create: [
            {
              description: 'Abonnement mensuel Enterprise',
              quantity: 1,
              unitPrice: 599.00,
              total: 599.00,
            },
            {
              description: 'Formation utilisateurs (2h)',
              quantity: 2,
              unitPrice: 100.00,
              total: 200.00,
            },
          ],
        },
      },
    }),
    prisma.invoice.create({
      data: {
        reference: `INV-${dateStr}-0003`,
        status: InvoiceStatus.DRAFT,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal: 150.00,
        taxRate: 20.00,
        taxAmount: 30.00,
        total: 180.00,
        createdById: manager.id,
        lines: {
          create: [
            {
              description: 'Intervention technique ponctuelle',
              quantity: 3,
              unitPrice: 50.00,
              total: 150.00,
              ticketId: tickets[3].id,
            },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${invoices.length} invoices`);

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
