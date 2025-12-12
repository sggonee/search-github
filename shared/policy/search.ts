export const AdvancedFilters = [
  { key: 'organization', label: 'Organization', targetId: 'filter-organization' },
  { key: 'user', label: 'User', targetId: 'filter-user' },
  { key: 'in-login', label: 'Username', targetId: 'filter-in-login' },
  { key: 'in-name', label: 'Full name', targetId: 'filter-in-name' },
  { key: 'in-email', label: 'Email', targetId: 'filter-in-email' },
  { key: 'repos', label: 'Number of repositories', targetId: 'filter-repos' },
  { key: 'followers', label: 'Number of followers', targetId: 'filter-followers' },
  { key: 'location', label: 'Location', targetId: 'filter-location' },
  { key: 'language', label: 'Language', targetId: 'filter-language' },
  { key: 'created', label: 'Creation date', targetId: 'filter-created' },
  { key: 'sponsorable', label: 'Sponsorable', targetId: 'filter-sponsorable' },
];

export const SearchFilter: Record<string, { token: string; range: string[] }> = {
  organization: { token: 'type:org', range: ['type:user', 'type:org'] },
  user: { token: 'type:user', range: ['type:user', 'type:org'] },

  'in-login': { token: 'in:login', range: ['in:login', 'in:name', 'in:email'] },
  'in-name': { token: 'in:name', range: ['in:login', 'in:name', 'in:email'] },
  'in-email': { token: 'in:email', range: ['in:login', 'in:name', 'in:email'] },

  location: { token: 'location:', range: ['location:'] },
  language: { token: 'language:', range: ['language:'] },
  created: { token: 'created:', range: ['created:'] },

  repos: { token: 'repos:', range: ['repos:'] },
  followers: { token: 'followers:', range: ['followers:'] },

  sponsorable: { token: 'is:sponsorable', range: ['is:sponsorable'] },
};
