import { request } from "node:https";

export const getRandomPhotoUrl = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const photoRequest = request(
      "https://source.unsplash.com/random",
      (response) => {
        if (response.statusCode === 302) {
          resolve(response.headers["location"] as string);
          return;
        }

        reject("Something went wrong");
      }
    );

    photoRequest.end();
  });
};
