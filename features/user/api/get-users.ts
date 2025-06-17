import { useRequest } from "ahooks";

import { getAllUsers } from "../actions";

export const useGetAllUsers = () => {
  return useRequest(getAllUsers);
};
