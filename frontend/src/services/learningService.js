import { api } from './api';

/**
 * Serialise a params object { search, category, page, limit, status }
 * into a query string, omitting keys with falsy values.
 */
const toQuery = (params = {}) => {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return qs ? `?${qs}` : '';
};

/** Public resources — no auth required. */
export const getPublicResources = (params) =>
  api.get(`/guides/public${toQuery(params)}`);

/** Resources visible to authenticated students. */
export const getStudentResources = (params) =>
  api.get(`/guides/student${toQuery(params)}`);

/** Resources visible to authenticated partners. */
export const getPartnerResources = (params) =>
  api.get(`/guides/partner${toQuery(params)}`);

/** All resources — admin only. */
export const getAdminResources = (params) =>
  api.get(`/guides/admin${toQuery(params)}`);

/** Fetch a single resource by ID. */
export const getResourceById = (id) =>
  api.get(`/guides/${id}`);

/** Create a new resource — admin only. */
export const createResource = (data) =>
  api.post('/guides', data);

/** Update an existing resource — admin only. */
export const updateResource = (id, data) =>
  api.put(`/guides/${id}`, data);

/** Delete a resource — admin only. */
export const deleteResource = (id) =>
  api.delete(`/guides/${id}`);

/** Publish a resource — admin only. */
export const publishResource = (id) =>
  api.put(`/guides/${id}/publish`);

/** Unpublish a resource — admin only. */
export const unpublishResource = (id) =>
  api.put(`/guides/${id}/unpublish`);
