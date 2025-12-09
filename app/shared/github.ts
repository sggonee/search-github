import http from "./http";

export const getGithubUsers = async () => {
  return await http.get(
    "https://api.github.com/search/users?q=tom+repos:%3E42+followers:%3E1000",
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    }
  );
};
