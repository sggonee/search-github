type MockUser = {
  id: number;
  login: string;
  name?: string;
  email?: string;
  followers: number;
  public_repos: number;
  location?: string;
  language?: string;
  created_at: string;
  sponsorable: boolean;
  type: 'User' | 'Organization';
};

const seed: MockUser[] = [
  {
    id: 1,
    login: 'alice',
    name: 'Alice Kim',
    email: 'alice@test.com',
    followers: 120,
    public_repos: 15,
    location: 'Seoul',
    language: 'TypeScript',
    created_at: '2020-01-01',
    sponsorable: true,
    type: 'User',
  },
  {
    id: 2,
    login: 'bob',
    name: 'Bob Lee',
    email: 'bob@test.com',
    followers: 5,
    public_repos: 3,
    location: 'Busan',
    language: 'JavaScript',
    created_at: '2023-06-15',
    sponsorable: false,
    type: 'User',
  },
  {
    id: 3,
    login: 'charlie',
    name: 'Charlie Park',
    email: 'charlie@company.com',
    followers: 980,
    public_repos: 42,
    location: 'New York',
    language: 'Python',
    created_at: '2017-09-01',
    sponsorable: true,
    type: 'User',
  },
  {
    id: 4,
    login: 'delta-dev',
    name: 'Delta Dev',
    email: 'delta@opensource.org',
    followers: 2500,
    public_repos: 120,
    location: 'Berlin',
    language: 'Go',
    created_at: '2015-03-20',
    sponsorable: true,
    type: 'User',
  },
  {
    id: 5,
    login: 'echo',
    name: 'Echo Zhang',
    email: 'echo@test.cn',
    followers: 300,
    public_repos: 25,
    location: 'Beijing',
    language: 'Java',
    created_at: '2019-11-11',
    sponsorable: false,
    type: 'User',
  },
  {
    id: 6,
    login: 'acme-org',
    followers: 5000,
    public_repos: 200,
    location: 'San Francisco',
    created_at: '2018-05-10',
    sponsorable: false,
    type: 'Organization',
  },
  {
    id: 7,
    login: 'open-source-lab',
    followers: 12000,
    public_repos: 560,
    location: 'London',
    created_at: '2012-08-01',
    sponsorable: true,
    type: 'Organization',
  },
  {
    id: 8,
    login: 'frontend-guild',
    followers: 800,
    public_repos: 90,
    location: 'Seoul',
    created_at: '2021-02-14',
    sponsorable: true,
    type: 'Organization',
  },
  {
    id: 9,
    login: 'legacy-systems',
    followers: 50,
    public_repos: 10,
    location: 'Tokyo',
    created_at: '2010-01-01',
    sponsorable: false,
    type: 'Organization',
  },
  {
    id: 10,
    login: 'newcomers',
    followers: 2,
    public_repos: 1,
    location: 'Remote',
    created_at: '2024-01-01',
    sponsorable: false,
    type: 'Organization',
  },
];

// 스크롤/페이지네이션 테스트를 위해 충분히 큰 데이터셋을 생성
const generatedUsers: MockUser[] = Array.from({ length: 120 }, (_, i) => {
  const n = i + 1;
  const padded = String(n).padStart(3, '0');

  // 다양성 확보
  const locations = ['Seoul', 'Busan', 'Tokyo', 'New York', 'Berlin', 'Remote'];
  const languages = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Java', 'Rust'];

  return {
    id: 1000 + n,
    login: `user-${padded}`,
    name: `User ${padded}`,
    email: `user-${padded}@test.dev`,
    followers: (n * 37) % 5000,
    public_repos: (n * 13) % 300,
    location: locations[n % locations.length],
    language: languages[n % languages.length],
    created_at: `20${10 + (n % 15)}-${String((n % 12) + 1).padStart(2, '0')}-${String((n % 28) + 1).padStart(2, '0')}`,
    sponsorable: n % 3 === 0,
    type: 'User',
  };
});

export const mockUsers: MockUser[] = [...seed, ...generatedUsers];
