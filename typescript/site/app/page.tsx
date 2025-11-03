import Link from 'next/link';
import { CodeBracketIcon } from '@heroicons/react/24/outline';
import NavBar from './components/NavBar';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <NavBar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-12 text-black">
            Portal of AI Internet
          </h1>

          {/* Try Demo Link */}
          <div className="flex justify-center">
            <Link
              href="/protected"
              className="px-8 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 text-lg"
            >
              <CodeBracketIcon className="w-5 h-5" />
              Try Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-500">
            By using this site, you agree to be bound by the{' '}
            <a
              href="https://www.coinbase.com/legal/developer-platform/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black underline hover:text-gray-600"
            >
              CDP Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="https://www.coinbase.com/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black underline hover:text-gray-600"
            >
              Global Privacy Policy
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
