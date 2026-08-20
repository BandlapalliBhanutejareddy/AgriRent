import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../shared/widgets/custom_text_field.dart';

class OtpScreen extends ConsumerStatefulWidget {
  final String email;
  final String purpose;

  const OtpScreen({Key? key, required this.email, required this.purpose}) : super(key: key);

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _otpController = TextEditingController();

  void _verify() async {
    final success = await ref.read(authProvider.notifier).verifyOtp(
      widget.email,
      _otpController.text.trim(),
      widget.purpose,
    );

    if (success && mounted) {
      if (widget.purpose == 'REGISTER' || widget.purpose == 'LOGIN') {
        final user = ref.read(authProvider).user;
        if (user?.role == 'OWNER') {
          context.go('/owner');
        } else {
          context.go('/farmer');
        }
      } else {
        // e.g. Forgot Password flow
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('OTP Verified. You can reset password now.')));
        context.go('/login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Verify Email')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('We sent a 6-digit code to ${widget.email}.', style: const TextStyle(fontSize: 16)),
              const SizedBox(height: 24),
              if (authState.error != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(8)),
                  child: Text(authState.error!, style: TextStyle(color: Colors.red.shade700)),
                ),
                const SizedBox(height: 16),
              ],
              CustomTextField(
                label: 'Enter OTP Code',
                controller: _otpController,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: authState.isLoading ? null : _verify,
                child: authState.isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Verify'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
