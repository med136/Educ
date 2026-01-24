import { Express } from 'express'
import swaggerUi from 'swagger-ui-express'

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'EduShare API',
    version: '1.0.0',
    description: 'API pour la plateforme de partage de documents éducatifs',
    contact: {
      name: 'Équipe EduShare',
      email: 'contact@edushare.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Serveur de développement',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentification et gestion des sessions' },
    { name: 'Users', description: 'Gestion des utilisateurs' },
    { name: 'Documents', description: 'Gestion des documents' },
    { name: 'Classrooms', description: 'Gestion des classes' },
    { name: 'Admin', description: 'Administration' },
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Connexion utilisateur',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Connexion réussie' },
          '401': { description: 'Identifiants invalides' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Inscription utilisateur',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  role: { type: 'string', enum: ['STUDENT', 'TEACHER', 'PARENT'] },
                },
                required: ['email', 'password', 'firstName', 'lastName', 'role'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Utilisateur créé' },
          '400': { description: 'Données invalides' },
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Obtenir le profil de l\'utilisateur connecté',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Profil utilisateur' },
          '401': { description: 'Non authentifié' },
        },
      },
    },
    '/documents': {
      get: {
        tags: ['Documents'],
        summary: 'Liste des documents',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Liste des documents' },
        },
      },
      post: {
        tags: ['Documents'],
        summary: 'Uploader un document',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Document créé' },
        },
      },
    },
    '/classrooms': {
      get: {
        tags: ['Classrooms'],
        summary: 'Liste des classes',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Liste des classes' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
}

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'EduShare API Documentation',
  }) as any)
}
