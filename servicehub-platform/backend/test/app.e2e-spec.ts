import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('should return 404 for root path', () => {
      return request(app.getHttpServer()).get('/').expect(404);
    });
  });

  describe('Auth Endpoints', () => {
    it('/api/v1/auth/login (POST) - should fail with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('/api/v1/auth/login (POST) - should fail with missing credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('Protected Routes', () => {
    it('/api/v1/users (GET) - should fail without token', () => {
      return request(app.getHttpServer()).get('/api/v1/users').expect(401);
    });

    it('/api/v1/tickets (GET) - should fail without token', () => {
      return request(app.getHttpServer()).get('/api/v1/tickets').expect(401);
    });

    it('/api/v1/invoices (GET) - should fail without token', () => {
      return request(app.getHttpServer()).get('/api/v1/invoices').expect(401);
    });

    it('/api/v1/dashboard (GET) - should fail without token', () => {
      return request(app.getHttpServer()).get('/api/v1/dashboard').expect(401);
    });
  });
});
