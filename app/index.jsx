import { Redirect } from 'expo-router';

// Go straight to login. Auth check (redirect to dashboard if already signed in)
// happens inside login.jsx so the user always sees the form immediately — no hanging spinner.
export default function IndexScreen() {
  return <Redirect href="/auth/login" />;
}
