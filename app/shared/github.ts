import http from "./http";

const baseUrl = "https://api.github.com/search/users";

export const getGithubUsers = async (query: string) => {
  return await http.get(`${baseUrl}?q=tom+repos:%3E42+followers:%3E1000`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
  });
};
