import { useState } from "react";

const campusImg =
  "https://bitmesra.ac.in/UploadedDocuments/user_pratyush_869/Header/Header295e75781b0f4b19b292cba095f2d310_Institute_Building.png";

const BITLogo = () => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-red-600 overflow-hidden">
      <svg viewBox="0 0 60 60" className="w-12 h-12">
        <circle cx="30" cy="30" r="28" fill="#b91c1c" />
        <circle cx="30" cy="30" r="22" fill="white" />
        <text x="30" y="27" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#b91c1c" fontFamily="serif">BIT</text>
        <text x="30" y="35" textAnchor="middle" fontSize="4.5" fill="#b91c1c" fontFamily="serif">MESRA</text>
        <circle cx="30" cy="30" r="28" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
      </svg>
    </div>
    <div>
      <p className="text-white font-bold text-sm leading-tight tracking-wide">BIRLA INSTITUTE OF TECHNOLOGY</p>
      <p className="text-amber-300 text-xs tracking-widest">MESRA, RANCHI</p>
    </div>
  </div>
);

const EyeIcon = ({ show }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {show ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </>
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.525-4.025M9.9 4.24A9.12 9.12 0 0112 4c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411M3 3l18 18" />
    )}
  </svg>
);

export default function SmartMessLogin() {
  const [tab, setTab] = useState("student"); // "student" | "admin"
  const [studentMode, setStudentMode] = useState("login"); // "login" | "register"
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [form, setForm] = useState({
    rollNo: "", name: "", email: "", phone: "", department: "", year: "",
    username: "", password: "", confirmPassword: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(tab === "admin" ? "Admin login submitted!" : studentMode === "login" ? "Student login submitted!" : "Registration submitted!");
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden font-sans">
      {/* Background campus image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${campusImg})` }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-5xl mx-4 my-8 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
        style={{ backdropFilter: "blur(2px)", background: "rgba(15,23,42,0.55)" }}>

        {/* LEFT: Info panel */}
        <div className="flex-1 p-8 md:p-10 text-white flex flex-col justify-between">
          <div>
            <BITLogo />
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 rounded-full px-4 py-1 mb-4">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-amber-300 text-xs font-semibold tracking-widest uppercase">Smart Mess Attendance</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white mb-2">
                Mess Attendance<br />
                <span className="text-amber-400">Management System</span>
              </h1>
              <p className="text-white/70 text-sm leading-relaxed mt-3">
                A digital solution for tracking student meal attendance, managing mess subscriptions, and generating automated reports for BIT Mesra.
              </p>
            </div>

            <div className="space-y-3 mt-6">
              {[
                { icon: "🍽️", title: "Real-time Meal Tracking", desc: "Mark attendance for breakfast, lunch & dinner" },
                { icon: "📊", title: "Attendance Analytics", desc: "Visual reports & monthly summaries" },
                { icon: "🔔", title: "Smart Notifications", desc: "Alerts for low attendance & billing" },
                { icon: "🎓", title: "Student Self-Service", desc: "Apply for leaves & view mess schedule" },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-3 bg-white/10 rounded-xl px-4 py-2.5 border border-white/10">
                  <span className="text-xl mt-0.5">{f.icon}</span>
                  <div>
                    <p className="text-white text-xs font-semibold">{f.title}</p>
                    <p className="text-white/55 text-xs">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/30 text-xs mt-8">© 2025 BIT Mesra — Smart Mess Attendance System</p>
        </div>

        {/* RIGHT: Auth panel */}
        <div className="w-full md:w-[400px] bg-white/95 backdrop-blur-md flex flex-col">
          {/* Tab switcher */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setTab("student")}
              className={`flex-1 py-4 text-sm font-bold tracking-wide transition-all ${tab === "student" ? "text-blue-700 border-b-2 border-blue-600 bg-blue-50/60" : "text-gray-400 hover:text-gray-600"}`}
            >
              🎓 Student
            </button>
            <button
              onClick={() => setTab("admin")}
              className={`flex-1 py-4 text-sm font-bold tracking-wide transition-all ${tab === "admin" ? "text-red-700 border-b-2 border-red-600 bg-red-50/60" : "text-gray-400 hover:text-gray-600"}`}
            >
              🛡️ Admin
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-7">
            {/* STUDENT PANEL */}
            {tab === "student" && (
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 mb-1">
                  {studentMode === "login" ? "Welcome back!" : "Create Account"}
                </h2>
                <p className="text-gray-400 text-xs mb-6">
                  {studentMode === "login" ? "Sign in to your mess account" : "Register as a new mess student"}
                </p>

                {/* Sub-toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                  <button
                    onClick={() => setStudentMode("login")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${studentMode === "login" ? "bg-white shadow text-blue-700" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setStudentMode("register")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${studentMode === "register" ? "bg-white shadow text-blue-700" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    Register
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {studentMode === "register" && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                        <input name="name" value={form.name} onChange={handleChange}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                          placeholder="Your full name" required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Roll Number</label>
                        <input name="rollNo" value={form.rollNo} onChange={handleChange}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                          placeholder="e.g. BT22CSE001" required />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                          <select name="department" value={form.department} onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50">
                            <option value="">Dept.</option>
                            <option>CSE</option><option>ECE</option><option>ME</option>
                            <option>CE</option><option>EE</option><option>IT</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
                          <select name="year" value={form.year} onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50">
                            <option value="">Year</option>
                            <option>1st</option><option>2nd</option><option>3rd</option><option>4th</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                          placeholder="you@bitmesra.ac.in" required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                        <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                          placeholder="+91 XXXXX XXXXX" />
                      </div>
                    </>
                  )}

                  {studentMode === "login" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Roll Number / Username</label>
                      <input name="username" value={form.username} onChange={handleChange}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                        placeholder="Enter roll number" required />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                    <div className="relative">
                      <input name="password" type={showPass ? "text" : "password"} value={form.password} onChange={handleChange}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 pr-10"
                        placeholder="Enter password" required />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500">
                        <EyeIcon show={showPass} />
                      </button>
                    </div>
                  </div>

                  {studentMode === "register" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm Password</label>
                      <div className="relative">
                        <input name="confirmPassword" type={showConfirmPass ? "text" : "password"} value={form.confirmPassword} onChange={handleChange}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 pr-10"
                          placeholder="Confirm password" required />
                        <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500">
                          <EyeIcon show={showConfirmPass} />
                        </button>
                      </div>
                    </div>
                  )}

                  <button type="submit"
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3 rounded-xl text-sm tracking-wide shadow-lg shadow-blue-200 transition-all">
                    {studentMode === "login" ? "Sign In" : "Create Account"}
                  </button>

                  {studentMode === "login" && (
                    <p className="text-center text-xs text-blue-500 hover:underline cursor-pointer mt-1">Forgot password?</p>
                  )}
                </form>
              </div>
            )}

            {/* ADMIN PANEL */}
            {tab === "admin" && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl">🛡️</div>
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-800">Admin Access</h2>
                    <p className="text-gray-400 text-xs">Mess management portal</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 flex gap-2 items-start">
                  <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                  <p className="text-red-600 text-xs leading-relaxed">This portal is restricted to authorized mess administrators and wardens only.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Admin ID / Username</label>
                    <input name="username" value={form.username} onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-gray-50"
                      placeholder="Enter admin ID" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                    <div className="relative">
                      <input name="password" type={showPass ? "text" : "password"} value={form.password} onChange={handleChange}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-gray-50 pr-10"
                        placeholder="Enter password" required />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                        <EyeIcon show={showPass} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="remember" className="accent-red-500 w-4 h-4" />
                    <label htmlFor="remember" className="text-xs text-gray-500">Keep me signed in on this device</label>
                  </div>

                  <button type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold py-3 rounded-xl text-sm tracking-wide shadow-lg shadow-red-200 transition-all">
                    Admin Login
                  </button>

                  <p className="text-center text-xs text-red-500 hover:underline cursor-pointer">Forgot admin credentials?</p>
                </form>

                <div className="mt-6 pt-5 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center mb-3">Quick Admin Access</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["Mess Manager", "Warden", "Accounts"].map((role) => (
                      <button key={role}
                        className="text-xs bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-500 hover:text-red-600 rounded-lg py-2 transition-all">
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-7 pb-5 pt-2 border-t border-gray-100">
            <p className="text-center text-gray-300 text-xs">
              Smart Mess Attendance · BIT Mesra · v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}