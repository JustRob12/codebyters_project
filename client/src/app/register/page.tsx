'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleInitial: '',
    studentId: '',
    year: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate password confirmation
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate student ID format
      if (!/^\d{4}-\d{4}$/.test(formData.studentId)) {
        throw new Error('Student ID must be in format 0000-0000');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(formData.password, 12);

      // Prepare user data for Supabase
      const userData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        middle_initial: formData.middleInitial,
        student_id: formData.studentId,
        year: formData.year,
        email: formData.email,
        password: hashedPassword,
        role: 2, // Default role for students
        is_active: true
      };

      // Insert user into Supabase
      const { data, error: insertError } = await supabase
        .from('users')
        .insert([userData])
        .select();

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSuccess(true);
      console.log('User registered successfully:', data);
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      {/* Left side with logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Image
            src="/codebyterslogo.png"
            alt="Codebyters Logo"
            width={350}
            height={350}
            className="mx-auto mb-10"
          />
         
        </div>
      </div>

      {/* Right side with register form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-6 lg:hidden">
            <Image
              src="/codebyterslogo.png"
              alt="Codebyters Logo"
              width={100}
              height={100}
              className="mx-auto mb-4"
            />
            <h1 className="text-xl font-bold" style={{ color: '#20B2AA' }}>
              CODEBYTERS
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create account</h2>
            <p className="text-gray-600 mb-6 sm:mb-8">Join our coding community today</p>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                <p className="font-medium">Registration successful!</p>
                <p className="text-sm">Welcome to Codebyters! Redirecting to login page...</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <p className="font-medium">Registration failed</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent transition-colors text-sm sm:text-base text-black"
                      placeholder="First name"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent transition-colors text-sm sm:text-base text-black"
                      placeholder="Last name"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="middleInitial" className="block text-sm font-medium text-gray-700 mb-2">
                        Middle Initial
                      </label>
                      <input
                        type="text"
                        id="middleInitial"
                        name="middleInitial"
                        value={formData.middleInitial}
                        onChange={handleChange}
                        maxLength={1}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent transition-colors text-sm sm:text-base text-black"
                        placeholder="M"
                      />
                    </div>
                    <div>
                      <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                        Student ID
                      </label>
                      <input
                        type="text"
                        id="studentId"
                        name="studentId"
                        value={formData.studentId}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                          if (value.length <= 8) {
                            const formatted = value.length > 4 
                              ? `${value.slice(0, 4)}-${value.slice(4)}` 
                              : value;
                            setFormData({...formData, studentId: formatted});
                          }
                        }}
                        required
                        pattern="[0-9]{4}-[0-9]{4}"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent transition-colors text-sm sm:text-base text-black"
                        placeholder="0000-0000"
                        maxLength={9}
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: 0000-0000</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <select
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent transition-colors text-sm sm:text-base text-black"
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent transition-colors text-sm sm:text-base text-black"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent transition-colors text-sm sm:text-base text-black"
                      placeholder="Create a password"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent transition-colors text-sm sm:text-base text-black"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="hover:opacity-80 underline"
                    style={{ color: '#20B2AA' }}
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="hover:opacity-80 underline"
                    style={{ color: '#20B2AA' }}
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full text-white py-2 sm:py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#20B2AA] focus:ring-offset-2 transition-all duration-200 text-sm sm:text-base ${
                  isLoading 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:opacity-90'
                }`}
                style={{ backgroundColor: '#20B2AA' }}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="hover:opacity-80 font-medium" style={{ color: '#20B2AA' }}>
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Terms of Service</h2>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="prose max-w-none text-gray-700">
                <h3 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h3>
                <p className="mb-4">
                  By accessing and using the Codebyters platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>

                <h3 className="text-lg font-semibold mb-3">2. Use License</h3>
                <p className="mb-4">
                  Permission is granted to temporarily download one copy of the materials on Codebyters for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc ml-6 mb-4">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or for any public display</li>
                  <li>Attempt to reverse engineer any software contained on the website</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                </ul>

                <h3 className="text-lg font-semibold mb-3">3. User Accounts</h3>
                <p className="mb-4">
                  When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
                </p>

                <h3 className="text-lg font-semibold mb-3">4. Prohibited Uses</h3>
                <p className="mb-4">You may not use our service:</p>
                <ul className="list-disc ml-6 mb-4">
                  <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                  <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                  <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                  <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                  <li>To submit false or misleading information</li>
                </ul>

                <h3 className="text-lg font-semibold mb-3">5. Content</h3>
                <p className="mb-4">
                  Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content that you post to the service, including its legality, reliability, and appropriateness.
                </p>

                <h3 className="text-lg font-semibold mb-3">6. Termination</h3>
                <p className="mb-4">
                  We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                </p>

                <h3 className="text-lg font-semibold mb-3">7. Disclaimer</h3>
                <p className="mb-4">
                  The information on this website is provided on an "as is" basis. To the fullest extent permitted by law, this Company excludes all representations, warranties, conditions and terms relating to our website and the use of this website.
                </p>

                <h3 className="text-lg font-semibold mb-3">8. Governing Law</h3>
                <p className="mb-4">
                  These Terms shall be interpreted and governed by the laws of the jurisdiction in which our company is located, without regard to its conflict of law provisions.
                </p>

                <h3 className="text-lg font-semibold mb-3">9. Changes</h3>
                <p className="mb-4">
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
                </p>

                <h3 className="text-lg font-semibold mb-3">10. Contact Information</h3>
                <p className="mb-4">
                  If you have any questions about these Terms of Service, please contact us at legal@codebyters.com.
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="px-6 py-2 bg-[#20B2AA] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Privacy Policy</h2>
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="prose max-w-none text-gray-700">
                <h3 className="text-lg font-semibold mb-3">1. Information We Collect</h3>
                <p className="mb-4">
                  We collect information you provide directly to us, such as when you create an account, update your profile, or contact us for support. This may include your name, email address, student ID, academic year, and other information you choose to provide.
                </p>

                <h3 className="text-lg font-semibold mb-3">2. How We Use Your Information</h3>
                <p className="mb-4">We use the information we collect to:</p>
                <ul className="list-disc ml-6 mb-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices, updates, security alerts, and support messages</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Communicate with you about products, services, and events</li>
                </ul>

                <h3 className="text-lg font-semibold mb-3">3. Information Sharing and Disclosure</h3>
                <p className="mb-4">
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share your information in the following circumstances:
                </p>
                <ul className="list-disc ml-6 mb-4">
                  <li>With your consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and safety</li>
                  <li>In connection with a business transfer</li>
                </ul>

                <h3 className="text-lg font-semibold mb-3">4. Data Security</h3>
                <p className="mb-4">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
                </p>

                <h3 className="text-lg font-semibold mb-3">5. Cookies and Tracking Technologies</h3>
                <p className="mb-4">
                  We use cookies and similar tracking technologies to collect and use personal information about you. You can control cookies through your browser settings, but disabling cookies may affect the functionality of our service.
                </p>

                <h3 className="text-lg font-semibold mb-3">6. Your Rights</h3>
                <p className="mb-4">You have the right to:</p>
                <ul className="list-disc ml-6 mb-4">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your personal information</li>
                  <li>Object to processing of your information</li>
                  <li>Data portability</li>
                </ul>

                <h3 className="text-lg font-semibold mb-3">7. Data Retention</h3>
                <p className="mb-4">
                  We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy, unless a longer retention period is required or permitted by law.
                </p>

                <h3 className="text-lg font-semibold mb-3">8. International Data Transfers</h3>
                <p className="mb-4">
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this policy.
                </p>

                <h3 className="text-lg font-semibold mb-3">9. Children's Privacy</h3>
                <p className="mb-4">
                  Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
                </p>

                <h3 className="text-lg font-semibold mb-3">10. Changes to This Policy</h3>
                <p className="mb-4">
                  We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
                </p>

                <h3 className="text-lg font-semibold mb-3">11. Contact Us</h3>
                <p className="mb-4">
                  If you have any questions about this Privacy Policy, please contact us at privacy@codebyters.com.
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="px-6 py-2 bg-[#20B2AA] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
