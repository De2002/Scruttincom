import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-white/50">
      <p className="text-6xl">🎙</p>
      <p className="text-white font-semibold text-lg">Nothing here</p>
      <p className="text-sm">This page doesn't exist</p>
      <button
        onClick={() => navigate('/')}
        className="mt-2 glass px-5 py-2.5 rounded-xl text-white/70 hover:text-white text-sm transition-all hover:bg-white/10"
      >
        Back to Stream
      </button>
    </div>
  );
}
