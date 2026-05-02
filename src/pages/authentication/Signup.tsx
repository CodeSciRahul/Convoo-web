//Sign up or register page

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { userSignup } from "@/services/apiService";
import toast from "react-hot-toast";
import { AxiosError } from 'axios';
import { SignupResponse, SignupFormInputs } from "@/types";
import { FaEnvelope, FaCoffee, FaEyeSlash, FaEye, FaUser, FaPhone } from "react-icons/fa";
import iconImage from "@/assets/icon.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const navigate = useNavigate();
  const [isShowPassword, setIsShowPassword] = useState(false);
  const [isShowConfirmPassword, setIsShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setIsShowPassword(!isShowPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setIsShowConfirmPassword(!isShowConfirmPassword);
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<SignupFormInputs & { confirmPassword: string }>();

  const password = watch("password");

  const onSubmit = async (data: SignupFormInputs & { confirmPassword: string }) => {
    try {
      const { confirmPassword, ...signupData } = data;
      const response = await userSignup(signupData) as { data: SignupResponse };
      if (response?.data) {
        toast.success(`${response?.data?.message}`);
        navigate("/login");
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(`${error.response?.data?.message}`);
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign up | Convoo</title>
        <meta
          name="description"
          content="Create a Convoo account and start chatting with friends and groups."
        />
        <meta property="og:title" content="Sign up | Convoo" />
        <meta
          property="og:description"
          content="Create a Convoo account and start chatting with friends and groups."
        />
        <meta property="og:type" content="website" />
      </Helmet>
      <div
        className={cn(
          "flex items-center justify-center min-h-screen w-screen p-4 bg-gradient-to-br from-slate-50 to-slate-100",
          className
        )}
        {...props}
      >
      <div className="w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden bg-white">
        <div className="md:flex flex-col-reverse md:flex-row-reverse min-h-[600px]">
          {/* Left Panel - Branding */}
          <div className="hidden w-full md:w-1/2 bg-gradient-to-br from-blue-500 to-purple-600 p-8 md:p-12 md:flex md:flex-col md:justify-between text-white relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

            <div className="relative z-10">
              {/* Logo */}
              <div className="mb-8">
                <div className="flex items-center justify-start gap-4 mb-4">
                  <div className="rounded-full bg-white/20 backdrop-blur-sm">
                    <img
                      src={iconImage}
                      alt="Convoo Logo"
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">Convoo</h1>
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <div className="mb-8">
                <p className="text-xl md:text-2xl leading-relaxed font-light">
                  Share Your Smile with this world and Find Friends
                </p>
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-start">
              {/* Cup Icon */}
              <div className="mb-4">
                <FaCoffee className="w-8 h-8 opacity-90" />
              </div>
              {/* Enjoy text */}
              <p className="text-2xl font-semibold">Enjoy..!</p>
            </div>
          </div>

          {/* Right Panel - Signup Form */}
          <div className="w-full h-full md:h-auto md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
            <div className="w-full max-w-md mx-auto">
              {/* Header */}
              <h2 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                SIGN UP HERE
              </h2>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter Username"
                      autoComplete="name"
                      className="pl-4 pr-12 py-6 border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...register("name", {
                        required: "Name is Required",
                      })}
                    />
                    <FaUser className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter Email ID"
                      autoComplete="email"
                      className="pl-4 pr-12 py-6 border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Invalid email address",
                        },
                      })}
                    />
                    <FaEnvelope className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Mobile Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="Enter Mobile No"
                      autoComplete="tel"
                      className="pl-4 pr-12 py-6 border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...register("mobile", {
                        required: "Mobile is required",
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: "Invalid mobile number",
                        },
                      })}
                    />
                    <FaPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                  {errors.mobile && (
                    <p className="text-sm text-red-600 mt-1">{errors.mobile.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="password"
                      type={isShowPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Enter Password"
                      className="pl-4 pr-12 py-6 border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...register("password", {
                        required: "Password is required",
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                          message: "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character",
                        },
                      })}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {isShowPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={isShowConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Confirm Password"
                      className="pl-4 pr-12 py-6 border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...register("confirmPassword", {
                        required: "Please confirm your password",
                        validate: (value) =>
                          value === password || "Passwords do not match",
                      })}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleConfirmPasswordVisibility}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {isShowConfirmPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full py-6 mt-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing up..." : "Continue"}
                </Button>
              </form>

              {/* Login link */}
              <div className="mt-6 text-center text-sm text-gray-600">
                Have an account?{" "}
                <a
                  href="/login"
                  className="font-semibold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent underline"
                >
                  Login
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
