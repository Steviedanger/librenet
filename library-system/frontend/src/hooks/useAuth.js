import { useAuthContext } from '../context/AuthContext.jsx';

/**
 * Thin convenience wrapper around the auth context so components can simply
 * `import useAuth`.
 */
const useAuth = () => useAuthContext();

export default useAuth;
