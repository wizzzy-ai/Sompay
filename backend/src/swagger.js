import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PSP API',
      version: '1.0.0',
      description: 'Authentication and user profile API',
    },
    servers: [
      { url: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}` }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // JSDoc in routes/controllers
};

const swaggerSpec = swaggerJsdoc(options);

export default (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: false,
      showExtensions: true,
      showCommonExtensions: true,
      withCredentials: true
    }
  }));
};
