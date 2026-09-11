export const mockAuthUser = {
  id: 'user-admin-001',
  email: 'admin@toc.co.th',
  username: 'admin',
  fullName: 'System Administrator',
  name: 'System Administrator',
  role: 'admin' as const,
  status: 'active' as const,
  mustChangePassword: false,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
}

export const mockLoginSuccessResponse = {
  success: true,
  data: {
    accessToken: 'mock-access-token-xyz123',
    refreshToken: 'mock-refresh-token-abc456',
    tokenType: 'Bearer',
    user: mockAuthUser,
  },
}

export const mockProfileResponse = {
  success: true,
  data: mockAuthUser,
}

export const mockLoginFailureResponse = {
  success: false,
  error: {
    code: 'unauthorized',
    message: 'Invalid email or password.',
  },
}

export const mockLogoutSuccessResponse = {
  success: true,
  data: null,
}
