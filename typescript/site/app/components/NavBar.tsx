'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const NavBar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/search", label: "Search" },
    { href: "/ecosystem", label: "Ecosystem" },
    { href: "https://x402.gitbook.io/x402", label: "Docs" },
    { href: "https://github.com/coinbase/x402", label: "GitHub" },
    { href: "/facilitator", label: "Facilitator" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/x402-icon-black.png"
              alt="x402"
              width={32}
              height={32}
              className="mr-2"
            />
            <span className="text-xl font-semibold text-black">x402</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="px-4 py-2 text-sm font-medium text-black hover:text-gray-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="https://forms.gle/VZKvX93ifiew1ksW9"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 px-4 py-2 text-sm font-medium text-black border border-black rounded hover:bg-black hover:text-white transition-all"
            >
              Login
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-black"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-gray-200 mt-2 pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="block px-4 py-2 text-sm font-medium text-black hover:text-gray-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="https://forms.gle/VZKvX93ifiew1ksW9"
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-4 px-4 py-2 text-sm font-medium text-black border border-black rounded text-center hover:bg-black hover:text-white transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
