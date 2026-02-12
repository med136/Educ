import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating sample menu...')

  const menu = await prisma.menu.upsert({
    where: { slug: 'main' },
    update: {},
    create: {
      slug: 'main',
      title: 'Menu Principal',
      published: true,
      metadata: { theme: 'default' },
    },
  })

  // Create top-level items
  await prisma.menuItem.upsert({
    where: { id: 'home-item' },
    update: {},
    create: {
      id: 'home-item',
      menuId: menu.id,
      label: 'Accueil',
      url: '/',
      order: 0,
      visible: true,
      i18n: {
        create: [
          { lang: 'fr', label: 'Accueil' },
          { lang: 'ar', label: 'الصفحة الرئيسية' },
        ],
      },
    },
  })

  await prisma.menuItem.upsert({
    where: { id: 'about-item' },
    update: {},
    create: {
      id: 'about-item',
      menuId: menu.id,
      label: 'About',
      url: '/about',
      order: 1,
      visible: true,
      i18n: {
        create: [
          { lang: 'fr', label: 'À propos' },
          { lang: 'ar', label: 'حول' },
        ],
      },
    },
  })

  console.log('Sample menu created:', menu.slug)
}

main()
  .catch((e) => {
    console.error('Error creating sample menu', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
