// modules/identity — public surface of M1 Identity & Access.
// The ONLY import path other code may use (docs/modules/M1-identity-access.md).
export * from './contracts'
export * from './store/authStore'
export { authService, isMockAuth } from './service/authService'
export type { AuthSession, AuthService, OtpRequestResult, OtpVerifyResult } from './service/authService'
export { default as Login } from './ui/Login'
