import { Metadata } from 'next';
import { projectsAPI } from '@/lib/api';
import { getProjectPageSEO, generateMetadata as genMeta, JsonLd } from '@/lib/seo';
import ProjectPageClient from './page';

interface PageProps {
  params: { slug: string };
}

// Generate dynamic metadata for the project page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const response = await projectsAPI.getBySlug(params.slug);
    const project = response.data;
    
    if (!project) {
      return {
        title: 'Project Not Found - CFG Ninja',
        description: 'The requested audit project could not be found.',
      };
    }
    
    const seoConfig = getProjectPageSEO(project);
    return genMeta(seoConfig);
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'CFG Ninja Audit Portal',
      description: 'Smart contract audit platform',
    };
  }
}

// Server component wrapper with JSON-LD
export default async function ProjectPage({ params }: PageProps) {
  let jsonLd = null;
  
  try {
    const response = await projectsAPI.getBySlug(params.slug);
    const project = response.data;
    
    if (project) {
      const seoConfig = getProjectPageSEO(project);
      jsonLd = seoConfig.jsonLd;
    }
  } catch (error) {
    console.error('Error loading project for SEO:', error);
  }
  
  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}
      <ProjectPageClient />
    </>
  );
}
