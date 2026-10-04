import path from 'path';

const rootDir = process.cwd();

export const paths = {
  root: rootDir,
  src: path.resolve(rootDir, 'src'),
  prisma: path.resolve(rootDir, 'prisma'),
  dist: path.resolve(rootDir, 'dist'),
};
