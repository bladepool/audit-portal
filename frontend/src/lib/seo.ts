import { Project } from './types';

export interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  openGraph?: {
    title: string;
    description: string;
    url: string;
    images?: Array<{
      url: string;
      width: number;
      height: number;
      alt: string;
    }>;
    type: string;
  };
  twitter?: {
    card: string;
    title: string;
    description: string;
    images?: string[];
  };
  jsonLd?: any;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://audit.cfg.ninja';

/**
 * Generate organization JSON-LD for homepage
 */
export function getOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CFG Ninja Audits',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Leading blockchain smart contract audit platform providing comprehensive security audits for Ethereum, Solana, BSC, and other blockchain networks',
    sameAs: [
      'https://twitter.com/cfgninja',
      'https://t.me/cfgninja',
      'https://github.com/cfgninja',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: 'English',
    },
  };
}

/**
 * Generate website JSON-LD for homepage
 */
export function getWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CFG Ninja Audit Portal',
    url: BASE_URL,
    description: 'Explore comprehensive smart contract audits across multiple blockchain networks',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate product JSON-LD for project page
 */
export function getProjectJsonLd(project: Project) {
  const auditDate = project.timeline?.audit_release 
    ? new Date(project.timeline.audit_release).toISOString()
    : new Date().toISOString();
    
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${project.name} (${project.symbol})`,
    description: project.description || `Smart contract audit for ${project.name} on ${project.platform || project.ecosystem}`,
    brand: {
      '@type': 'Brand',
      name: project.name,
    },
    logo: project.logo ? `${BASE_URL}${project.logo}` : undefined,
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: project.audit_score ? {
      '@type': 'AggregateRating',
      ratingValue: (project.audit_score / 20).toFixed(1), // Convert 0-100 to 0-5
      bestRating: '5',
      worstRating: '0',
      ratingCount: project.total_votes || 1,
    } : undefined,
    review: {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: (project.audit_score / 20).toFixed(1),
        bestRating: '5',
        worstRating: '0',
      },
      author: {
        '@type': 'Organization',
        name: 'CFG Ninja Audits',
      },
      datePublished: auditDate,
      reviewBody: project.description || `Security audit for ${project.name}`,
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Blockchain Platform',
        value: project.platform || project.ecosystem,
      },
      {
        '@type': 'PropertyValue',
        name: 'Audit Score',
        value: project.audit_score.toString(),
      },
      {
        '@type': 'PropertyValue',
        name: 'Total Issues',
        value: project.total_issues?.toString() || '0',
      },
      project.contract_info?.contract_address ? {
        '@type': 'PropertyValue',
        name: 'Contract Address',
        value: project.contract_info.contract_address,
      } : null,
    ].filter(Boolean),
  };
}

/**
 * Generate breadcrumb JSON-LD for project page
 */
export function getBreadcrumbJsonLd(project: Project) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: project.platform || project.ecosystem,
        item: `${BASE_URL}?platform=${encodeURIComponent(project.platform || project.ecosystem)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: project.name,
        item: `${BASE_URL}/${project.slug}`,
      },
    ],
  };
}

/**
 * Generate complete SEO config for homepage
 */
export function getHomePageSEO(): SEOConfig {
  const title = 'CFG Ninja Audit Portal - Smart Contract Security Audits';
  const description = 'Explore 1,200+ comprehensive blockchain smart contract audits for Ethereum, Solana, BSC, Polygon, and more. View security scores, vulnerabilities, and audit reports.';
  
  return {
    title,
    description,
    canonical: BASE_URL,
    openGraph: {
      title,
      description,
      url: BASE_URL,
      type: 'website',
      images: [{
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'CFG Ninja Audit Portal',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${BASE_URL}/og-image.png`],
    },
    jsonLd: [
      getOrganizationJsonLd(),
      getWebsiteJsonLd(),
    ],
  };
}

/**
 * Generate complete SEO config for project page
 */
export function getProjectPageSEO(project: Project): SEOConfig {
  const title = `${project.name} (${project.symbol}) Audit - CFG Ninja`;
  const description = project.description 
    || `Comprehensive smart contract audit for ${project.name} on ${project.platform || project.ecosystem}. Score: ${project.audit_score}/100. ${project.total_issues || 0} issues found.`;
  
  const canonical = `${BASE_URL}/${project.slug}`;
  const imageUrl = project.logo ? `${BASE_URL}${project.logo}` : `${BASE_URL}/og-image.png`;
  
  return {
    title,
    description,
    canonical,
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      images: [{
        url: imageUrl,
        width: 800,
        height: 800,
        alt: `${project.name} logo`,
      }],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [imageUrl],
    },
    jsonLd: [
      getProjectJsonLd(project),
      getBreadcrumbJsonLd(project),
    ],
  };
}

/**
 * Generate meta tags for Next.js metadata API
 */
export function generateMetadata(seoConfig: SEOConfig): any {
  return {
    title: seoConfig.title,
    description: seoConfig.description,
    alternates: {
      canonical: seoConfig.canonical,
    },
    openGraph: seoConfig.openGraph,
    twitter: seoConfig.twitter,
  };
}

/**
 * Component to render JSON-LD script tags
 */
export function JsonLd({ data }: { data: any | any[] }) {
  const jsonLdArray = Array.isArray(data) ? data : [data];
  
  return (
    <>
      {jsonLdArray.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item),
          }}
        />
      ))}
    </>
  );
}
