import LoginForm from './components/auth/LoginForm';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-primary mb-2">Retro Board</h1>
          <p className="text-neutral-400">Collaborative retrospectives for agile teams</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}