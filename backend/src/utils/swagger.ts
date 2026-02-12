import { Express } from 'express'
import swaggerUi from 'swagger-ui-express'
import path from 'path'

const baseDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'EduShare API',
    version: '1.0.0',
    description: 'API pour la plateforme de partage de documents éducatifs',
    contact: { name: 'Équipe EduShare', email: 'contact@edushare.com' },
  },
  servers: [ { url: 'http://localhost:3000/api/v1', description: 'Serveur de développement' } ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
  },
}

function tryCreateSpec(): any {
  try {
    // dynamic require so code still runs when package is not installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const swaggerJSDoc = require('swagger-jsdoc')
    const options = {
      definition: baseDefinition,
      apis: [path.join(__dirname, '..', 'routes', '**', '*.ts')],
    }
    return swaggerJSDoc(options)
  } catch (err) {
    // fallback to minimal spec if swagger-jsdoc is not installed or fails
    // eslint-disable-next-line no-console
    console.warn('swagger-jsdoc not available — serving static minimal spec. To enable generation, run: npm --prefix backend install swagger-jsdoc')
    return { ...baseDefinition, paths: {} }
  }
}

export function setupSwagger(app: Express): void {
  const swaggerDocument = tryCreateSpec()

  // Log how many paths were discovered to help debugging
  const pathCount = swaggerDocument && swaggerDocument.paths ? Object.keys(swaggerDocument.paths).length : 0
  // eslint-disable-next-line no-console
  console.info(`Swagger spec loaded — paths: ${pathCount}`)

  // If no paths were generated, optionally fail fast (useful in CI / strict environments)
  if (pathCount === 0) {
    console.warn('No paths detected in generated Swagger spec. Ensure your routes have @openapi annotations or JSDoc comments.')
    if (process.env.SWAGGER_FAIL_ON_EMPTY === 'true') {
      console.error('SWAGGER_FAIL_ON_EMPTY is set — failing startup because no swagger paths were discovered.')
      process.exit(1)
    }
  }

  // Expose the raw spec so it's easy to inspect if UI shows nothing
  app.get('/api-docs.json', (_req, res) => res.json(swaggerDocument))

  app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'EduShare API Documentation',
  }) as any)
}

export default setupSwagger
