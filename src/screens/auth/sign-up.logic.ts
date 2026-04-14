import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { register } from '@/store/slices/auth.slice';
import { useToast } from '@/hooks/useToast';

const schema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be under 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  referralCode: z.string().optional(),
});

export type SignUpFormData = z.infer<typeof schema>;

export function useSignUpLogic() {
  const dispatch   = useAppDispatch();
  const router     = useRouter();
  const toast      = useToast();
  const loading    = useAppSelector((s) => s.auth.loading);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '', username: '', firstName: '',
      lastName: '', referralCode: '',
    },
    mode: 'onBlur',
  });

  async function onSubmit(data: SignUpFormData) {
    if (!agreedToTerms) {
      toast.warning('Terms required', 'Please agree to our Terms of Service');
      return;
    }

    const result = await dispatch(register({
      email:        data.email.toLowerCase().trim(),
      username:     data.username.toLowerCase().trim(),
      firstName:    data.firstName.trim(),
      lastName:     data.lastName.trim(),
      referralCode: data.referralCode?.trim() || undefined,
    }));

    if (register.fulfilled.match(result)) {
      // onboardingStep from response routes to verify-email
      // _layout.logic.ts handles routing based on onboardingStep
      toast.success('Account created!', 'Let\'s verify your email');
    } else {
      const msg = result.payload as string;
      toast.error('Sign up failed', msg);

      // Field-level error for username/email conflicts
      if (msg?.toLowerCase().includes('email')) {
        form.setError('email', { message: msg });
      }
      if (msg?.toLowerCase().includes('username')) {
        form.setError('username', { message: msg });
      }
    }
  }

  function goToLogin() {
    router.push('/(auth)/login');
  }

  return {
    form,
    loading,
    agreedToTerms,
    setAgreedToTerms,
    onSubmit: form.handleSubmit(onSubmit),
    goToLogin,
  };
}