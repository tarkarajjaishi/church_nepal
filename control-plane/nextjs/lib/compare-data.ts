export type FeatureComparison = {
  name: string;
  competitor: boolean | string;
  churchnepal: boolean | string;
};

export type CompetitorData = {
  name: string;
  features: FeatureComparison[];
  verdict: string;
};

const comparisonData: Record<string, CompetitorData> = {
  wix: {
    name: 'Wix',
    features: [
      { name: 'Website Builder', competitor: true, churchnepal: true },
      { name: 'E-commerce', competitor: true, churchnepal: true },
      { name: 'SEO Tools', competitor: true, churchnepal: true },
      { name: 'Email Marketing', competitor: true, churchnepal: true },
      { name: 'Donation Processing', competitor: false, churchnepal: true },
      { name: 'Member Directory', competitor: false, churchnepal: true },
      { name: 'Event Management', competitor: true, churchnepal: true },
      { name: 'Prayer Requests', competitor: false, churchnepal: true },
      { name: 'Groups & Small Groups', competitor: false, churchnepal: true },
      { name: 'Sermon Management', competitor: false, churchnepal: true },
      { name: 'Attendance Tracking', competitor: false, churchnepal: true },
      { name: 'CRM Features', competitor: false, churchnepal: true },
      { name: 'Mobile Responsive', competitor: true, churchnepal: true },
      { name: 'Custom Domain', competitor: true, churchnepal: true },
      { name: 'Multi-language Support', competitor: true, churchnepal: true },
    ],
    verdict: 'While Wix offers great website building capabilities, Churchnepal provides specialized tools for churches that Wix lacks, such as dedicated donation processing, member management, and prayer request systems.'
  },
  squarespace: {
    name: 'Squarespace',
    features: [
      { name: 'Website Builder', competitor: true, churchnepal: true },
      { name: 'E-commerce', competitor: true, churchnepal: true },
      { name: 'SEO Tools', competitor: true, churchnepal: true },
      { name: 'Email Marketing', competitor: true, churchnepal: true },
      { name: 'Donation Processing', competitor: false, churchnepal: true },
      { name: 'Member Directory', competitor: false, churchnepal: true },
      { name: 'Event Management', competitor: true, churchnepal: true },
      { name: 'Prayer Requests', competitor: false, churchnepal: true },
      { name: 'Groups & Small Groups', competitor: false, churchnepal: true },
      { name: 'Sermon Management', competitor: false, churchnepal: true },
      { name: 'Attendance Tracking', competitor: false, churchnepal: true },
      { name: 'CRM Features', competitor: false, churchnepal: true },
      { name: 'Mobile Responsive', competitor: true, churchnepal: true },
      { name: 'Custom Domain', competitor: true, churchnepal: true },
      { name: 'Portfolio Galleries', competitor: true, churchnepal: true },
    ],
    verdict: 'Squarespace excels in design aesthetics but falls short in church-specific functionality. Churchnepal offers purpose-built tools for church operations that Squarespace cannot match.'
  },
  wordpress: {
    name: 'WordPress',
    features: [
      { name: 'Website Builder', competitor: true, churchnepal: true },
      { name: 'E-commerce', competitor: true, churchnepal: true },
      { name: 'SEO Tools', competitor: true, churchnepal: true },
      { name: 'Email Marketing', competitor: true, churchnepal: true },
      { name: 'Donation Processing', competitor: false, churchnepal: true },
      { name: 'Member Directory', competitor: false, churchnepal: true },
      { name: 'Event Management', competitor: true, churchnepal: true },
      { name: 'Prayer Requests', competitor: false, churchnepal: true },
      { name: 'Groups & Small Groups', competitor: false, churchnepal: true },
      { name: 'Sermon Management', competitor: false, churchnepal: true },
      { name: 'Attendance Tracking', competitor: false, churchnepal: true },
      { name: 'CRM Features', competitor: false, churchnepal: true },
      { name: 'Mobile Responsive', competitor: true, churchnepal: true },
      { name: 'Custom Domain', competitor: true, churchnepal: true },
      { name: 'Plugin Ecosystem', competitor: true, churchnepal: true },
    ],
    verdict: 'WordPress offers extensive customization options but requires technical expertise. Churchnepal provides church-specific solutions out-of-the-box without needing additional plugins or development.'
  },
  weebly: {
    name: 'Weebly',
    features: [
      { name: 'Website Builder', competitor: true, churchnepal: true },
      { name: 'E-commerce', competitor: true, churchnepal: true },
      { name: 'SEO Tools', competitor: true, churchnepal: true },
      { name: 'Email Marketing', competitor: true, churchnepal: true },
      { name: 'Donation Processing', competitor: false, churchnepal: true },
      { name: 'Member Directory', competitor: false, churchnepal: true },
      { name: 'Event Management', competitor: true, churchnepal: true },
      { name: 'Prayer Requests', competitor: false, churchnepal: true },
      { name: 'Groups & Small Groups', competitor: false, churchnepal: true },
      { name: 'Sermon Management', competitor: false, churchnepal: true },
      { name: 'Attendance Tracking', competitor: false, churchnepal: true },
      { name: 'CRM Features', competitor: false, churchnepal: true },
      { name: 'Mobile Responsive', competitor: true, churchnepal: true },
      { name: 'Custom Domain', competitor: true, churchnepal: true },
      { name: 'Drag & Drop Editor', competitor: true, churchnepal: true },
    ],
    verdict: 'Weebly offers simple website creation but lacks the specialized tools churches need. Churchnepal provides comprehensive church management features that Weebly simply doesn\'t offer.'
  }
};

export function getComparisonData(competitor: string): CompetitorData {
  const normalizedCompetitor = competitor.toLowerCase();
  if (normalizedCompetitor in comparisonData) {
    return comparisonData[normalizedCompetitor];
  }
  throw new Error(`Unknown competitor: ${competitor}`);
}
