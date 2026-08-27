import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../shared/widgets/custom_text_field.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  String _role = 'FARMER';

  void _register() async {
    final success = await ref.read(authProvider.notifier).register(
      name: _nameController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text,
      phone: _phoneController.text.trim(),
      role: _role,
    );

    if (success && mounted) {
      context.push('/otp', extra: {'email': _emailController.text.trim(), 'purpose': 'REGISTER'});
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (authState.error != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(8)),
                  child: Text(authState.error!, style: TextStyle(color: Colors.red.shade700)),
                ),
                const SizedBox(height: 16),
              ],
              CustomTextField(label: 'Full Name', controller: _nameController),
              const SizedBox(height: 16),
              CustomTextField(label: 'Email', controller: _emailController, keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 16),
              CustomTextField(label: 'Phone (Optional)', controller: _phoneController, keyboardType: TextInputType.phone),
              const SizedBox(height: 16),
              CustomTextField(label: 'Password', controller: _passwordController, obscureText: true),
              const SizedBox(height: 16),
              const Text('I am a:', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: _role,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
                items: const [
                  DropdownMenuItem(value: 'FARMER', child: Text('Farmer')),
                  DropdownMenuItem(value: 'OWNER', child: Text('Owner')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setState(() => _role = val);
                  }
                },
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: authState.isLoading ? null : _register,
                child: authState.isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Register'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
