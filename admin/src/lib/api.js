import axiosInstance from "./axios";

const request = async (method, url, config = {}, payload) => {
  const { data } = await axiosInstance.request({
    method,
    url,
    ...config,
    ...(payload === undefined ? {} : { data: payload }),
  });
  return data;
};

export const adminApi = {
  checkAccess: () => request("get", "/admin/access"),
};

export const productApi = {
  getAll: (params) => request("get", "/admin/products", { params }),
  create: (formData) => request("post", "/admin/products", {}, formData),
  update: ({ id, formData }) => request("put", `/admin/products/${id}`, {}, formData),
  delete: (productId) => request("delete", `/admin/products/${productId}`),
};

export const orderApi = {
  getAll: (params) => request("get", "/admin/orders", { params }),
  updateStatus: ({ orderId, status }) =>
    request("patch", `/admin/orders/${orderId}/status`, {}, { status }),
};

export const statsApi = {
  getDashboard: () => request("get", "/admin/stats"),
};

export const customerApi = {
  getAll: (params) => request("get", "/admin/customers", { params }),
};
