import { PrismaClient, ArticleStatus, ArticleVisibility, CommentStatus } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // 1. Create Users
  console.log('👤 Creating users...')
  const hashedPassword = await bcrypt.hash('password123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@edushare.com' },
    update: {},
    create: {
      email: 'admin@edushare.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: 'ADMIN',
      isActive: true,
    },
  })

  const teacher1 = await prisma.user.upsert({
    where: { email: 'marie.dubois@edushare.com' },
    update: {},
    create: {
      email: 'marie.dubois@edushare.com',
      password: hashedPassword,
      firstName: 'Marie',
      lastName: 'Dubois',
      role: 'TEACHER',
      isActive: true,
    },
  })

  const teacher2 = await prisma.user.upsert({
    where: { email: 'pierre.martin@edushare.com' },
    update: {},
    create: {
      email: 'pierre.martin@edushare.com',
      password: hashedPassword,
      firstName: 'Pierre',
      lastName: 'Martin',
      role: 'TEACHER',
      isActive: true,
    },
  })

  console.log('✅ Created users')

  // 2. Create Categories
  console.log('📁 Creating categories...')
  const cat1 = await prisma.articleCategory.upsert({
    where: { slug: 'mathematiques' },
    update: {},
    create: { name: 'Mathématiques', slug: 'mathematiques' },
  })

  const cat2 = await prisma.articleCategory.upsert({
    where: { slug: 'sciences' },
    update: {},
    create: { name: 'Sciences', slug: 'sciences' },
  })

  const cat3 = await prisma.articleCategory.upsert({
    where: { slug: 'technologie' },
    update: {},
    create: { name: 'Technologie', slug: 'technologie' },
  })

  await prisma.articleCategory.upsert({
    where: { slug: 'methodologie' },
    update: {},
    create: { name: 'Méthodologie', slug: 'methodologie' },
  })

  console.log('✅ Created categories')

  // 3. Create Tags
  console.log('🏷️  Creating tags...')
  const tag1 = await prisma.articleTag.upsert({
    where: { slug: 'python' },
    update: {},
    create: { name: 'Python', slug: 'python' },
  })

  const tag2 = await prisma.articleTag.upsert({
    where: { slug: 'javascript' },
    update: {},
    create: { name: 'JavaScript', slug: 'javascript' },
  })

  const tag3 = await prisma.articleTag.upsert({
    where: { slug: 'tutoriel' },
    update: {},
    create: { name: 'Tutoriel', slug: 'tutoriel' },
  })

  await prisma.articleTag.upsert({
    where: { slug: 'debutant' },
    update: {},
    create: { name: 'Débutant', slug: 'debutant' },
  })

  const tag5 = await prisma.articleTag.upsert({
    where: { slug: 'physique' },
    update: {},
    create: { name: 'Physique', slug: 'physique' },
  })

  const tag6 = await prisma.articleTag.upsert({
    where: { slug: 'theorie' },
    update: {},
    create: { name: 'Théorie', slug: 'theorie' },
  })

  console.log('✅ Created tags')

  // 4. Create Articles
  console.log('📝 Creating articles...')
  
  const article1 = await prisma.article.upsert({
    where: { slug: 'introduction-python-debutants' },
    update: {},
    create: {
      title: 'Introduction à Python pour les Débutants',
      slug: 'introduction-python-debutants',
      excerpt:
        'Découvrez les bases de Python, le langage de programmation le plus populaire pour débuter. Syntaxe, variables, et premiers programmes.',
      content: `<h2>Qu'est-ce que Python ?</h2><p>Python est un langage de programmation de haut niveau, interprété et polyvalent. Il est connu pour sa syntaxe claire et lisible, ce qui en fait un excellent choix pour les débutants.</p><h3>Pourquoi apprendre Python ?</h3><ul><li>Syntaxe simple et intuitive</li><li>Large communauté et nombreuses ressources</li><li>Applications variées : web, data science, IA, automatisation</li><li>Bibliothèques riches et puissantes</li></ul>`,
      status: ArticleStatus.PUBLISHED,
      visibility: ArticleVisibility.PUBLIC,
      coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
      readingTime: 5,
      authorId: teacher1.id,
      categoryId: cat3.id,
      publishedAt: new Date(),
    },
  })

  await prisma.articleTagLink.upsert({
    where: {
      articleId_tagId: {
        articleId: article1.id,
        tagId: tag1.id,
      },
    },
    update: {},
    create: {
      articleId: article1.id,
      tagId: tag1.id,
    },
  })

  await prisma.articleTagLink.upsert({
    where: {
      articleId_tagId: {
        articleId: article1.id,
        tagId: tag3.id,
      },
    },
    update: {},
    create: {
      articleId: article1.id,
      tagId: tag3.id,
    },
  })

  const article2 = await prisma.article.upsert({
    where: { slug: 'javascript-es6-nouveautes' },
    update: {},
    create: {
      title: 'JavaScript ES6+ : Les Nouveautés Essentielles',
      slug: 'javascript-es6-nouveautes',
      excerpt:
        'Explorez les fonctionnalités modernes de JavaScript : arrow functions, destructuring, promises, async/await et bien plus encore.',
      content: `<h2>ES6 et au-delà</h2><p>ECMAScript 6 (ES6) et les versions suivantes ont apporté de nombreuses améliorations à JavaScript.</p><h3>1. Arrow Functions</h3><pre><code>const add = (a, b) => a + b;</code></pre><h3>2. Destructuring</h3><pre><code>const { name, age } = user;</code></pre>`,
      status: ArticleStatus.PUBLISHED,
      visibility: ArticleVisibility.PUBLIC,
      coverImage: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800',
      readingTime: 7,
      authorId: teacher1.id,
      categoryId: cat3.id,
      publishedAt: new Date(),
    },
  })

  await prisma.articleTagLink.upsert({
    where: {
      articleId_tagId: {
        articleId: article2.id,
        tagId: tag2.id,
      },
    },
    update: {},
    create: {
      articleId: article2.id,
      tagId: tag2.id,
    },
  })

  const article3 = await prisma.article.upsert({
    where: { slug: 'lois-newton-mecanique' },
    update: {},
    create: {
      title: 'Les Lois de Newton : Fondements de la Mécanique',
      slug: 'lois-newton-mecanique',
      excerpt:
        'Découvrez les trois lois fondamentales de Newton qui régissent le mouvement des corps. Théorie, exemples et applications pratiques.',
      content: `<h2>Les trois lois de Newton</h2><p>Isaac Newton a formulé trois lois qui sont au cœur de la mécanique classique.</p><h3>Première loi : Principe d'inertie</h3><p>Tout corps persévère dans son état de repos ou de mouvement rectiligne uniforme, à moins qu'une force n'agisse sur lui.</p>`,
      status: ArticleStatus.PUBLISHED,
      visibility: ArticleVisibility.PUBLIC,
      coverImage: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800',
      readingTime: 6,
      authorId: teacher2.id,
      categoryId: cat2.id,
      publishedAt: new Date(),
    },
  })

  await prisma.articleTagLink.upsert({
    where: {
      articleId_tagId: {
        articleId: article3.id,
        tagId: tag5.id,
      },
    },
    update: {},
    create: {
      articleId: article3.id,
      tagId: tag5.id,
    },
  })

  await prisma.articleTagLink.upsert({
    where: {
      articleId_tagId: {
        articleId: article3.id,
        tagId: tag6.id,
      },
    },
    update: {},
    create: {
      articleId: article3.id,
      tagId: tag6.id,
    },
  })

  await prisma.article.upsert({
    where: { slug: 'equations-second-degre-guide' },
    update: {},
    create: {
      title: 'Les Équations du Second Degré : Guide Complet',
      slug: 'equations-second-degre-guide',
      excerpt:
        'Maîtrisez les équations du second degré avec ce guide complet. Discriminant, formules, et résolution pas à pas avec exemples.',
      content: `<h2>Introduction aux équations du second degré</h2><p>Une équation du second degré est une équation de la forme ax² + bx + c = 0, où a ≠ 0.</p><h3>Le discriminant Δ</h3><p>Δ = b² - 4ac</p>`,
      status: ArticleStatus.PUBLISHED,
      visibility: ArticleVisibility.PUBLIC,
      coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
      readingTime: 8,
      authorId: teacher1.id,
      categoryId: cat1.id,
      publishedAt: new Date(),
    },
  })

  await prisma.article.upsert({
    where: { slug: 'chimie-organique-bases' },
    update: {},
    create: {
      title: 'La Chimie Organique : Les Bases',
      slug: 'chimie-organique-bases',
      excerpt:
        'Introduction à la chimie organique : hydrocarbures, groupes fonctionnels, nomenclature et réactions fondamentales.',
      content: `<h2>Qu'est-ce que la chimie organique ?</h2><p>La chimie organique est l'étude des composés contenant du carbone. Elle est essentielle pour comprendre la vie et de nombreux matériaux.</p>`,
      status: ArticleStatus.PUBLISHED,
      visibility: ArticleVisibility.PUBLIC,
      coverImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
      readingTime: 10,
      authorId: teacher2.id,
      categoryId: cat2.id,
      publishedAt: new Date(),
    },
  })

  await prisma.article.upsert({
    where: { slug: 'methodes-travail-efficaces' },
    update: {},
    create: {
      title: 'Méthodes de Travail Efficaces pour Réussir',
      slug: 'methodes-travail-efficaces',
      excerpt:
        'Améliorez votre productivité et vos résultats avec ces méthodes de travail éprouvées : planification, concentration, et révisions.',
      content: `<h2>Optimiser son temps d'étude</h2><p>Une bonne organisation est la clé de la réussite académique.</p><h3>1. La technique Pomodoro</h3><ul><li>Travailler 25 minutes sans interruption</li><li>Pause de 5 minutes</li></ul>`,
      status: ArticleStatus.PUBLISHED,
      visibility: ArticleVisibility.PUBLIC,
      coverImage: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800',
      readingTime: 4,
      authorId: teacher1.id,
      categoryId: cat3.id,
      publishedAt: new Date(),
    },
  })

  console.log('✅ Created 6 articles')

  // 5. Create Comments
  console.log('💬 Creating comments...')
  await prisma.articleComment.create({
    data: {
      articleId: article1.id,
      content: 'Excellent tutoriel ! Très clair pour les débutants.',
      authorName: 'Jean Dupont',
      authorEmail: 'jean.dupont@example.com',
      status: CommentStatus.APPROVED,
      ipAddress: '127.0.0.1',
    },
  })

  await prisma.articleComment.create({
    data: {
      articleId: article2.id,
      content: 'Article très utile ! J\'ai enfin compris les arrow functions.',
      authorName: 'Sophie Martin',
      authorEmail: 'sophie.martin@example.com',
      status: CommentStatus.PENDING,
      ipAddress: '127.0.0.1',
    },
  })

  console.log('✅ Created comments')

  console.log('🎉 Seed completed successfully!')
  console.log('\n📋 Summary:')
  console.log(`   - Users: 3`)
  console.log(`   - Categories: 4`)
  console.log(`   - Tags: 6`)
  console.log(`   - Articles: 6`)
  console.log(`   - Comments: 2`)
  console.log('\n🔑 Login credentials:')
  console.log('   Admin: admin@edushare.com / password123')
  console.log('   Teacher 1: marie.dubois@edushare.com / password123')
  console.log('   Teacher 2: pierre.martin@edushare.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
