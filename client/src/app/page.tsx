import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-120px)] px-4 sm:px-6">
        <div className="lg:w-1/2 text-center lg:text-center mb-8 lg:mb-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Welcome to{" "}
            <span className="bg-clip-text text-transparent" style={{ color: '#20B2AA' }}>
              CODEBYTERS
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join our coding community and take your programming skills to the next level. 
            Connect with fellow developers, share knowledge, and grow together.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link
              href="/register"
              className="px-6 sm:px-8 py-3 sm:py-4 text-white rounded-lg font-medium hover:opacity-90 transition-all duration-200 text-center text-sm sm:text-base"
              style={{ backgroundColor: '#20B2AA' }}
            >
              Get Started
            </Link>
            <a
              href="https://www.facebook.com/codebyters"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 sm:px-8 py-3 sm:py-4 border-2 rounded-lg font-medium hover:bg-[#20B2AA]/10 transition-all duration-200 text-center flex items-center justify-center gap-2 text-sm sm:text-base"
              style={{ borderColor: '#20B2AA', color: '#20B2AA' }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="hidden sm:inline">Follow us on Facebook</span>
              <span className="sm:hidden">Facebook</span>
            </a>
          </div>
        </div>
        
        <div className="lg:w-1/2 flex justify-center mt-8 lg:mt-0">
          <div className="relative">
            <Image
              src="/codebyterslogo.png"
              alt="Codebyters Logo"
              width={400}
              height={400}
              className="opacity-90 w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] lg:w-[600px] lg:h-[600px] object-contain"
            />
          </div>
        </div>
      </div>

      </div>
  
  );
}
