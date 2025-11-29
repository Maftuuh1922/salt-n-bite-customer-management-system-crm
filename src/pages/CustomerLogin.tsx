import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
import { setAuthToken } from '@/lib/auth';
import { showNotification } from '@/components/NotificationToast';
import { Toaster } from '@/components/ui/sonner';
const phoneSchema = z.object({
  phone_number: z.string().min(10, "Please enter a valid phone number."),
});
const otpSchema = z.object({
  otp: z.string().length(4, "OTP must be 4 digits."),
});
type PhoneFormData = z.infer<typeof phoneSchema>;
type OtpFormData = z.infer<typeof otpSchema>;
export function CustomerLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const phoneForm = useForm<PhoneFormData>({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm<OtpFormData>({ resolver: zodResolver(otpSchema) });
  const onPhoneSubmit = (data: PhoneFormData) => {
    setPhoneNumber(data.phone_number);
    setStep('otp');
    showNotification('info', 'OTP Sent!', `Enter the mock OTP '1234' for ${data.phone_number}`);
  };
  const onOtpSubmit = async (data: OtpFormData) => {
    setIsLoading(true);
    try {
      const res = await api<{ token: string }>('/api/customers/login', {
        method: 'POST',
        body: JSON.stringify({ phone_number: phoneNumber, otp: data.otp }),
      });
      setAuthToken(res.token);
      showNotification('success', 'Login successful!');
      navigate('/customer/dashboard');
    } catch (err) {
      showNotification('error', 'Login failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };
  const handleGuestLogin = () => {
    setAuthToken('customer-jwt-cust_1');
    navigate('/customer/dashboard');
  };
  return (
    <div className="min-h-screen flex items-center justify-center batik-bg p-4">
      <Toaster richColors closeButton />
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-display">Customer Portal</CardTitle>
          <CardDescription>Welcome back to Salt N Bite</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'phone' ? (
            <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input id="phone_number" placeholder="+6281234567890" {...phoneForm.register('phone_number')} defaultValue="+6281234567890" />
                {phoneForm.formState.errors.phone_number && <p className="text-red-500 text-sm mt-1">{phoneForm.formState.errors.phone_number.message}</p>}
              </div>
              <Button type="submit" className="w-full">Send OTP</Button>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">Enter the 4-digit code sent to <br /><span className="font-semibold text-foreground">{phoneNumber}</span></p>
              <div>
                <Label htmlFor="otp">One-Time Password (use 1234)</Label>
                <Input id="otp" type="password" maxLength={4} {...otpForm.register('otp')} autoFocus />
                {otpForm.formState.errors.otp && <p className="text-red-500 text-sm mt-1">{otpForm.formState.errors.otp.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Verifying...' : 'Login'}</Button>
              <Button variant="link" onClick={() => setStep('phone')} className="w-full">Back</Button>
            </form>
          )}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGuestLogin}>Continue as Guest</Button>
        </CardContent>
      </Card>
    </div>
  );
}