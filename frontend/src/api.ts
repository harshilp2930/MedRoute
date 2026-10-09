/**
 * api.ts
 * MedRoute Frontend — API client
 */
import axios from 'axios';
import type { CompileResult } from './types';

const BASE_URL = 'http://localhost:3001';

export async function compileSource(source: string): Promise<CompileResult> {
  const res = await axios.post<CompileResult>(`${BASE_URL}/compile`, { source });
  return res.data;
}

export async function fetchFiles(): Promise<{ name: string; content: string; savedAt: Date }[]> {
  const res = await axios.get(`${BASE_URL}/files`);
  return res.data.map((f: any) => ({ ...f, savedAt: new Date(f.savedAt) }));
}

export async function saveFile(name: string, content: string): Promise<{ name: string; content: string; savedAt: Date }> {
  const res = await axios.post(`${BASE_URL}/files`, { name, content });
  return { ...res.data, savedAt: new Date(res.data.savedAt) };
}

export async function deleteFile(name: string): Promise<void> {
  await axios.delete(`${BASE_URL}/files/${encodeURIComponent(name)}`);
}
