import type { Server } from 'http';

export interface TestResponse {
  status: number;
  body: unknown;
}

export interface SuperTest {
  get(path: string): SuperTest;
  post(path: string): SuperTest;
  send(body?: unknown): SuperTest;
  expect(status: number): Promise<TestResponse>;
}

declare function request(app: Server | string): SuperTest;
export default request;
