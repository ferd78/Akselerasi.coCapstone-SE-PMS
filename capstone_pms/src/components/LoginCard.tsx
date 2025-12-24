import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Eye, EyeClosed } from "lucide-react";

const LoginCard = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);  

  const toggleVisibility = () => {
    setShowPass(!showPass);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/hr");
    } catch (err: any) {
      setError(err?.message || "Failed to sign in");
    }
  };

  return (
    <div className="h-90 w-84 bg-primary rounded-xl shadow-lg px-1 pt-10">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold text-shadow-sm text-tertiary text-center"> User Login </h1>
        <form onSubmit={handleSubmit} className="flex flex-col w-85/100">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="p-3 bg-quartenary rounded-xl shadow-xs font-medium outline-none mb-4"
          />
          <div className="relative mb-4">
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 pr-10 bg-quartenary rounded-xl shadow-xs 
                        font-medium outline-none"
            />

            <button
              type="button"
              onClick={toggleVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 
                        text-gray-500 hover:text-gray-700"
            >
              {showPass ? <EyeClosed size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button
            type="submit"
            className="bg-secondary p-3 rounded-xl shadow-xs text-md text-white font-semibold hover:bg-blue-500 hover:cursor-pointer"
          >
            Login
          </button>
          {error && <div className="text-red-500 text-sm mt-3">{error}</div>}
          <button type="button" className="text-tertiary text-sm hover:cursor-pointer hover:underline mt-6">
            Forgot Password?
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginCard;
