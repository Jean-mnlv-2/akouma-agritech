import { PrismaClient } from '@prisma/client';

export async function ensureCoursePreviewTypes(prisma: PrismaClient) {
  const count = await prisma.coursePreviewType.count();
  if (count > 0) return;
  await prisma.coursePreviewType.createMany({
    data: [
      { name: 'video', label: 'Vidéo', icon: 'Play' },
      { name: 'pdf', label: 'Document PDF', icon: 'FileText' },
      { name: 'audio', label: 'Audio', icon: 'Headphones' },
    ],
    skipDuplicates: true,
  });
}
