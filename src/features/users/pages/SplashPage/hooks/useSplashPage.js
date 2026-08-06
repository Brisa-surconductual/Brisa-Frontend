import { useNavigate } from 'react-router-dom';

export function useSplashPage() {
  const navigate = useNavigate();

  function goToCreateAccount() {
    navigate('/registro/cuenta');
  }

  function goToLogin() {
    navigate('/login');
  }

  return {
    goToCreateAccount,
    goToLogin,
  };
}
