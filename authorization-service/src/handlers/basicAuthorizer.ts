export const handler = async (event: any) => {
  console.log(JSON.stringify(event));

  if (event.type !== "REQUEST") {
    return {
      isAuthorized: false,
    };
  }

  try {
    const [, token] = event.headers.authorization.split(" ");
    const creds = Buffer.from(token, "base64").toString("utf-8");
    const [username, password] = creds.split(":");

    const [storedUsername, storedPassword] = (
      process.env.GITHUB_CREDS as string
    ).split("=");

    return {
      isAuthorized: storedUsername === username && storedPassword === password,
    };
  } catch (err) {
    console.log(err);
    return {
      isAuthorized: false,
    };
  }
};
