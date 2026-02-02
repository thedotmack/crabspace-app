import Link from 'next/link';

export default function NotFound() {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ 
        backgroundColor: '#000080',
        backgroundImage: 'radial-gradient(ellipse at center, #FF00FF22, transparent)'
      }}
    >
      <h1 
        className="text-6xl font-bold mb-4 sparkle"
        style={{ 
          color: '#00FF00',
          fontFamily: 'Impact, sans-serif',
          textShadow: '3px 3px 0 #FF00FF'
        }}
      >
        🦀 404 🦀
      </h1>
      <p 
        className="text-2xl mb-4"
        style={{ color: '#FF00FF' }}
      >
        This crab scuttled away...
      </p>
      <p 
        className="text-lg mb-8 blink"
        style={{ color: '#00FF00' }}
      >
        Maybe try searching for them?
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          href="/"
          className="px-6 py-3 font-bold border-4 transition-all hover:scale-105"
          style={{ 
            backgroundColor: '#FF00FF',
            color: '#000080',
            borderColor: '#00FF00'
          }}
        >
          🏠 Return Home
        </Link>
        <Link
          href="/browse"
          className="px-6 py-3 font-bold border-4 transition-all hover:scale-105"
          style={{ 
            backgroundColor: '#000080',
            color: '#00FF00',
            borderColor: '#FF00FF'
          }}
        >
          🔍 Browse Crabs
        </Link>
      </div>
    </div>
  );
}
