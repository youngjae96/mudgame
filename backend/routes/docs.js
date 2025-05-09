const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const PatchNoteController = require('../controllers/PatchNoteController');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GHLD API',
      version: '1.0.0',
      description: 'GHLD 게임 서버 REST API 문서'
    },
    servers: [
      { url: '/api' }
    ]
  },
  apis: ['./routes/*.js'], // JSDoc 주석 기반 자동 문서화
};

const specs = swaggerJsdoc(options);

router.use('/', swaggerUi.serve, swaggerUi.setup(specs));

module.exports = (app) => {
  app.get('/api/patchnotes', PatchNoteController.getAll);
  app.get('/api/patchnotes/:id', PatchNoteController.getOne);
  app.post('/api/patchnotes', PatchNoteController.create);
  app.put('/api/patchnotes/:id', PatchNoteController.update);
  app.delete('/api/patchnotes/:id', PatchNoteController.remove);
}; 