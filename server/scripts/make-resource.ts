import fs from 'fs';
import path from 'path';

// CLI Artisan Generator: npm run make:resource <name>
const resourceName = process.argv[2];

if (!resourceName) {
  console.error('❌ Please specify a resource name.');
  console.log('Usage: npm run make:resource <name>');
  console.log('Example: npm run make:resource candidate');
  process.exit(1);
}

const cleanName = resourceName.toLowerCase().trim();
const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

const rootDir = process.cwd();

const filesToGenerate = [
  {
    folder: 'controllers',
    file: `${cleanName}.controller.ts`,
    content: `import { Request, Response } from 'express';
import { ${cleanName}Service } from '../services/${cleanName}.service.js';
import { create${pascalName}Schema, update${pascalName}Schema } from '../validators/${cleanName}.validator.js';
import { asyncHandler } from '../utils/async-handler.js';

export class ${pascalName}Controller {
  getAll = asyncHandler(async (_req: Request, res: Response) => {
    const items = await ${cleanName}Service.getAll();
    res.json({ success: true, data: items });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const item = await ${cleanName}Service.getById(req.params.id);
    res.json({ success: true, data: item });
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const data = create${pascalName}Schema.parse(req.body);
    const item = await ${cleanName}Service.create(data);
    res.status(201).json({ success: true, data: item });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const data = update${pascalName}Schema.parse(req.body);
    const item = await ${cleanName}Service.update(req.params.id, data);
    res.json({ success: true, data: item });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await ${cleanName}Service.delete(req.params.id);
    res.json({ success: true, message: '${pascalName} deleted successfully' });
  });
}

export const ${cleanName}Controller = new ${pascalName}Controller();
`,
  },
  {
    folder: 'services',
    file: `${cleanName}.service.ts`,
    content: `import { prisma } from '../config/database.js';
import { NotFoundError } from '../utils/http-error.js';

export class ${pascalName}Service {
  async getAll() {
    return (prisma as any).${cleanName}?.findMany() || [];
  }

  async getById(id: string) {
    const item = await (prisma as any).${cleanName}?.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('${pascalName} not found');
    return item;
  }

  async create(data: any) {
    return (prisma as any).${cleanName}?.create({ data }) || data;
  }

  async update(id: string, data: any) {
    await this.getById(id);
    return (prisma as any).${cleanName}?.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.getById(id);
    return (prisma as any).${cleanName}?.delete({ where: { id } });
  }
}

export const ${cleanName}Service = new ${pascalName}Service();
`,
  },
  {
    folder: 'routes',
    file: `${cleanName}.routes.ts`,
    content: `import { Router } from 'express';
import { ${cleanName}Controller } from '../controllers/${cleanName}.controller.js';

export const ${cleanName}Routes: Router = Router();

${cleanName}Routes.get('/', ${cleanName}Controller.getAll);
${cleanName}Routes.get('/:id', ${cleanName}Controller.getById);
${cleanName}Routes.post('/', ${cleanName}Controller.create);
${cleanName}Routes.put('/:id', ${cleanName}Controller.update);
${cleanName}Routes.delete('/:id', ${cleanName}Controller.delete);
`,
  },
  {
    folder: 'models',
    file: `${cleanName}.model.ts`,
    content: `export interface ${pascalName}Model {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
`,
  },
  {
    folder: 'validators',
    file: `${cleanName}.validator.ts`,
    content: `import { z } from 'zod';

export const create${pascalName}Schema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const update${pascalName}Schema = create${pascalName}Schema.partial();

export type Create${pascalName}Input = z.infer<typeof create${pascalName}Schema>;
export type Update${pascalName}Input = z.infer<typeof update${pascalName}Schema>;
`,
  },
];

console.log(`🚀 Scaffolding MVC Resource: [${pascalName}]...`);

for (const target of filesToGenerate) {
  const targetDir = path.join(rootDir, target.folder);
  const targetPath = path.join(targetDir, target.file);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  if (fs.existsSync(targetPath)) {
    console.log(`⚠️  Skipping ${target.folder}/${target.file} (already exists)`);
  } else {
    fs.writeFileSync(targetPath, target.content, 'utf-8');
    console.log(`✅ Created ${target.folder}/${target.file}`);
  }
}

console.log(`\n🎉 Generated all MVC components for [${pascalName}]!`);
console.log(`👉 Don't forget to mount in routes/index.ts:`);
console.log(`   import { ${cleanName}Routes } from './${cleanName}.routes.js';`);
console.log(`   apiRouter.use('/${cleanName}s', ${cleanName}Routes);\n`);
