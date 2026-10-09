import config from '@payload-config';
import { RootLayout } from '@payloadcms/next/layouts';
import { handleServerFunctions } from '@payloadcms/next/layouts';
import { importMap } from './admin/importMap.js';

type Args = { children: React.ReactNode; params: Promise<{ segments: string[] }> };

const serverFunction = async (args: { name: string; args: unknown[] }) => {
  'use server';
  return handleServerFunctions({ ...args, config, importMap });
};

export default function PayloadLayout({ children, params }: Args) {
  return RootLayout({ children, config, importMap, serverFunction, params });
}
