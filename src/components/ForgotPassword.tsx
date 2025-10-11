import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { ArrowLeft, Mail, Shield, Key, Eye, EyeOff, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  passwordResetService, 
  validateEmail, 
  validateOtp, 
  validatePassword,
  maskEmail,
  type ForgotPasswordRequest,
  type VerifyOtpRequest,
  type ResetPasswordRequest
} from '../services/passwordResetApi';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

type Step = 'request' | 'verify' | 'reset';
type ErrorType = 'EMAIL_NOT_FOUND' | 'RATE_LIMIT' | 'INVALID_OTP' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | null;

export function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const navigate = useNavigate();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<Step>('request');
  
  // Form data
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password validation
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  
  // OTP timer
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(false);
  
  // Response data
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
  
  // Refs for auto-focus
  const otpInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Timer effect for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Auto-focus when step changes
  useEffect(() => {
    if (currentStep === 'verify' && otpInputRef.current) {
      setTimeout(() => otpInputRef.current?.focus(), 100);
    } else if (currentStep === 'reset' && passwordInputRef.current) {
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    }
  }, [currentStep]);

  // Password validation effect
  useEffect(() => {
    if (newPassword) {
      const validation = validatePassword(newPassword);
      setPasswordErrors(validation.errors);
      setIsPasswordValid(validation.isValid);
    } else {
      setPasswordErrors([]);
      setIsPasswordValid(false);
    }
  }, [newPassword]);

  // Helper function to check individual password requirements
  const getPasswordRequirements = (password: string) => {
    return [
      {
        text: 'Ít nhất 8 ký tự',
        met: password.length >= 8
      },
      {
        text: 'Có chữ cái in hoa (A-Z)',
        met: /[A-Z]/.test(password)
      },
      {
        text: 'Có chữ cái thường (a-z)', 
        met: /[a-z]/.test(password)
      },
      {
        text: 'Có ít nhất 1 chữ số (0-9)',
        met: /\d/.test(password)
      }
    ];
  };

  const resetForm = () => {
    setError('');
    setErrorType(null);
    setSuccess('');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    
    if (!validateEmail(email)) {
      setError('Email không đúng định dạng');
      setErrorType('VALIDATION_ERROR');
      return;
    }

    setLoading(true);

    try {
      const request: ForgotPasswordRequest = { email: email.toLowerCase().trim() };
      const response = await passwordResetService.requestPasswordReset(request);
      
      if (response.success) {
        setMaskedEmail(response.maskedEmail || maskEmail(email));
        if (response.expiresAt) {
          setOtpExpiresAt(new Date(response.expiresAt));
        }
        setSuccess(response.message);
        setCurrentStep('verify');
        setOtpTimer(600); // 10 minutes
        setCanResendOtp(false);
      } else {
        setError(response.message);
        setErrorType('EMAIL_NOT_FOUND');
      }
    } catch (err: any) {
      setError(err.message);
      setErrorType(err.type);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    
    if (!validateOtp(otp)) {
      setError('Mã OTP phải có đúng 6 chữ số');
      setErrorType('VALIDATION_ERROR');
      return;
    }

    setLoading(true);

    try {
      const request: VerifyOtpRequest = { email: email.toLowerCase().trim(), otp };
      const response = await passwordResetService.verifyOtp(request);
      
      if (response.success) {
        setSuccess(response.message);
        setCurrentStep('reset');
      } else {
        setError(response.message);
        setErrorType('INVALID_OTP');
      }
    } catch (err: any) {
      setError(err.message);
      setErrorType(err.type);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    
    if (!isPasswordValid) {
      setError('Mật khẩu không đáp ứng các yêu cầu bảo mật');
      setErrorType('VALIDATION_ERROR');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setErrorType('VALIDATION_ERROR');
      return;
    }

    setLoading(true);

    try {
      const request: ResetPasswordRequest = {
        email: email.toLowerCase().trim(),
        otp,
        newPassword,
        confirmPassword
      };
      const response = await passwordResetService.resetPassword(request);
      
      if (response.success) {
        setSuccess(response.message);
        setTimeout(() => {
          onBackToLogin();
        }, 2000);
      } else {
        setError(response.message);
        setErrorType('INVALID_OTP');
      }
    } catch (err: any) {
      setError(err.message);
      setErrorType(err.type);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResendOtp) return;
    
    resetForm();
    setCanResendOtp(false);
    setOtpTimer(600);
    
    try {
      const request: ForgotPasswordRequest = { email: email.toLowerCase().trim() };
      const response = await passwordResetService.requestPasswordReset(request);
      
      if (response.success) {
        setSuccess('Mã OTP mới đã được gửi đến email của bạn');
      }
    } catch (err: any) {
      setError(err.message);
      setErrorType(err.type);
    }
  };

  const renderProgressIndicator = () => {
    const steps = [
      { key: 'request', label: 'Nhập Email', icon: Mail },
      { key: 'verify', label: 'Xác Thực OTP', icon: Shield },
      { key: 'reset', label: 'Đặt Mật Khẩu Mới', icon: Key }
    ];
    
    const currentIndex = steps.findIndex(step => step.key === currentStep);
    
    return (
      <div className="flex items-center justify-center mb-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          
          return (
            <React.Fragment key={step.key}>
              <div className={`flex flex-col items-center ${
                isActive ? 'text-orange-500' : 
                isCompleted ? 'text-green-600' : 
                'text-gray-400'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isActive ? 'border-orange-500 bg-orange-50' : 
                  isCompleted ? 'border-green-600 bg-green-50' : 
                  'border-gray-300 bg-gray-50'
                }`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className="text-xs mt-1 font-medium text-center">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 transition-colors ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderError = () => {
    if (!error) return null;
    
    if (errorType === 'EMAIL_NOT_FOUND') {
      return (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="space-y-3">
              <p>{error}</p>
              <div className="p-3 bg-white rounded-md border border-orange-200">
                <p className="text-sm font-medium text-gray-900 mb-2">💡 Gợi ý:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Kiểm tra lại chính tả email</li>
                  <li>• Thử email khác mà bạn đã từng đăng ký</li>
                  <li>• Hoặc tạo tài khoản mới</li>
                </ul>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 text-orange-500 border-orange-200 hover:bg-orange-50"
                  onClick={() => navigate('/register')}
                >
                  Đăng ký tài khoản mới
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">{error}</AlertDescription>
      </Alert>
    );
  };

  const renderSuccess = () => {
    if (!success) return null;
    
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">{success}</AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      <div
        className="flex items-center justify-center p-4"
        style={{ minHeight: "calc(100vh - 80px)" }}
      >
        <div className="w-full max-w-md">
          {/* Logo and Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex mb-2 items-center justify-center w-16 h-16">
              <img
                src="src/assets/logoEV2.png"
                alt="FPTFAST Logo"
                className="w-18 h-15 rounded-full"
              />
            </div>
            <h1 className="text-3xl text-orange-500 font-bold mb-1">
              F P T F A S T
            </h1>
            <p className="text-gray-600">Hệ thống quản lý trạm đổi pin</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="text-center space-y-2 pb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToLogin}
                className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Quay lại
              </Button>
              
              <CardTitle className="text-2xl font-bold text-gray-900 pt-6">
                Quên Mật Khẩu
              </CardTitle>
              <CardDescription className="text-gray-600">
                {currentStep === 'request' && 'Nhập email để nhận mã xác thực'}
                {currentStep === 'verify' && 'Nhập mã OTP đã gửi đến email'}
                {currentStep === 'reset' && 'Tạo mật khẩu mới cho tài khoản'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {renderProgressIndicator()}
              {renderError()}
              {renderSuccess()}

          {/* Step 1: Request OTP */}
          {currentStep === 'request' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) {
                        setError('');
                        setErrorType(null);
                      }
                    }}
                    className="pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading || !email}>
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang gửi...
                  </div>
                ) : (
                  'Gửi mã xác thực'
                )}
              </Button>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {currentStep === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Mã OTP đã được gửi đến <br />
                  <span className="font-medium text-gray-900">{maskedEmail}</span>
                </p>
                {otpTimer > 0 && (
                  <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
                    <Clock className="w-4 h-4 mr-1" />
                    Mã hết hạn sau: {formatTime(otpTimer)}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otp">Mã OTP</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    ref={otpInputRef}
                    id="otp"
                    type="text"
                    placeholder="0 0 0 0 0 0"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(value);
                      if (error) {
                        setError('');
                        setErrorType(null);
                      }
                    }}
                    className="pl-10 text-center text-xl font-mono tracking-[0.3em] py-3 bg-gray-50 border-2 focus:bg-white focus:border-orange-300"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading || otp.length !== 6}>
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang xác thực...
                  </div>
                ) : (
                  'Xác thực OTP'
                )}
              </Button>
              
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOtp}
                  disabled={!canResendOtp}
                  className="text-orange-500 hover:text-orange-600"
                >
                  {canResendOtp ? 'Gửi lại mã OTP' : `Gửi lại sau ${formatTime(otpTimer)}`}
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {currentStep === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    ref={passwordInputRef}
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) {
                        setError('');
                        setErrorType(null);
                      }
                    }}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                
                {/* Password Requirements */}
                {newPassword && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-md border border-orange-100">
                    <p className="text-xs font-medium text-gray-700 mb-2">Yêu cầu mật khẩu:</p>
                    <div className="space-y-2">
                      {getPasswordRequirements(newPassword).map((requirement, index) => (
                        <div key={index} className={`flex items-center text-xs transition-colors duration-200 ${
                          requirement.met ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {requirement.met ? (
                            <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                          ) : (
                            <X className="w-4 h-4 mr-2 flex-shrink-0" />
                          )}
                          <span className={`${requirement.met ? 'font-medium' : ''}`}>
                            {requirement.text}
                          </span>
                        </div>
                      ))}
                    </div>
                    {isPasswordValid && (
                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center text-green-700 text-xs font-medium">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          ✨ Mật khẩu đạt yêu cầu bảo mật
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) {
                        setError('');
                        setErrorType(null);
                      }
                    }}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                
                {confirmPassword && newPassword !== confirmPassword && (
                  <div className="flex items-center text-red-600 text-xs mt-1">
                    <div className="w-1 h-1 bg-red-600 rounded-full mr-2"></div>
                    Mật khẩu xác nhận không khớp
                  </div>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600" 
                disabled={loading || !isPasswordValid || newPassword !== confirmPassword}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang cập nhật...
                  </div>
                ) : (
                  'Cập nhật mật khẩu'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}