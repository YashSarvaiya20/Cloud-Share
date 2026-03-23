import axios from "axios";

export const getMyFiles = async (getToken) => {
  const token = await getToken({ template: "codehooks" });

  return axios.get("http://localhost:8080/api/v1.0/files/my", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
