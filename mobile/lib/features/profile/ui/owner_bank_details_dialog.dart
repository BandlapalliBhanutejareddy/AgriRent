import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';

class OwnerBankDetailsDialog extends ConsumerStatefulWidget {
  const OwnerBankDetailsDialog({super.key});

  static Future<Map<String, dynamic>?> show(BuildContext context) {
    return showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (_) => const OwnerBankDetailsDialog(),
    );
  }

  @override
  ConsumerState<OwnerBankDetailsDialog> createState() => _OwnerBankDetailsDialogState();
}

class _OwnerBankDetailsDialogState extends ConsumerState<OwnerBankDetailsDialog> {
  final _formKey = GlobalKey<FormState>();
  final _holderCtrl = TextEditingController();
  final _bankCtrl = TextEditingController();
  final _accCtrl = TextEditingController();
  final _confirmAccCtrl = TextEditingController();
  final _ifscCtrl = TextEditingController();

  bool _isLoading = true;
  bool _isSaving = false;
  bool _obscureAcc = true;
  bool _obscureConfirm = true;
  String? _savedMaskedAccount;
  String? _serverError;

  static final RegExp _ifscRegex = RegExp(r'^[A-Z]{4}0[A-Z0-9]{6}$');

  @override
  void initState() {
    super.initState();
    _fetchExistingDetails();
  }

  @override
  void dispose() {
    _holderCtrl.dispose();
    _bankCtrl.dispose();
    _accCtrl.dispose();
    _confirmAccCtrl.dispose();
    _ifscCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchExistingDetails() async {
    setState(() {
      _isLoading = true;
      _serverError = null;
    });

    try {
      final res = await ApiClient().dio.get('owner/bank-details');
      if (res.statusCode == 200 && res.data != null && res.data['success'] == true) {
        final data = res.data['data'];
        if (data != null && data is Map<String, dynamic>) {
          _holderCtrl.text = (data['accountHolderName'] ?? '').toString();
          _bankCtrl.text = (data['bankName'] ?? '').toString();
          _ifscCtrl.text = (data['ifscCode'] ?? '').toString();
          _savedMaskedAccount = (data['accountNumberMasked'] ?? '').toString();
        }
      }
    } catch (e) {
      // If none saved yet or network error, default to user's name
      final user = ref.read(authProvider).user;
      if (_holderCtrl.text.isEmpty && user?.name != null) {
        _holderCtrl.text = user!.name;
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _saveBankDetails() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
      _serverError = null;
    });

    try {
      final payload = {
        'accountHolderName': _holderCtrl.text.trim(),
        'bankName': _bankCtrl.text.trim(),
        'accountNumber': _accCtrl.text.trim(),
        'confirmAccountNumber': _confirmAccCtrl.text.trim(),
        'ifscCode': _ifscCtrl.text.trim().toUpperCase(),
      };

      final res = await ApiClient().dio.post('owner/bank-details', data: payload);
      if (res.statusCode == 200 && res.data != null && res.data['success'] == true) {
        final data = res.data['data'] as Map<String, dynamic>?;
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Bank details saved securely for payouts.'),
              backgroundColor: Color(0xFF16A34A),
              behavior: SnackBarBehavior.floating,
            ),
          );
          Navigator.of(context).pop(data);
        }
      } else {
        setState(() {
          _serverError = res.data?['message']?.toString() ?? 'Failed to save bank details.';
        });
      }
    } catch (e) {
      setState(() {
        _serverError = 'Connection failed. Please check your network and try again.';
      });
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Dialog(
      backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 500, maxHeight: 680),
        child: _isLoading
            ? Container(
                padding: const EdgeInsets.all(40),
                child: const Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: AppTheme.primaryGreen),
                    SizedBox(height: 16),
                    Text(
                      'Loading bank details...',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.all(22),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFF2563EB).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: const Icon(
                              Icons.account_balance_rounded,
                              color: Color(0xFF2563EB),
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'bank_details'.tr(lang).isEmpty || 'bank_details'.tr(lang) == 'bank_details'
                                      ? 'Bank Account & Payouts'
                                      : 'bank_details'.tr(lang),
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 18,
                                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Direct deposit account for rental earnings',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close_rounded),
                            onPressed: () => Navigator.of(context).pop(),
                            color: isDark ? Colors.white54 : Colors.grey.shade600,
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),

                      // Existing Verified Account Banner (if present)
                      if (_savedMaskedAccount != null && _savedMaskedAccount!.isNotEmpty) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF16A34A).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: const Color(0xFF16A34A).withValues(alpha: 0.25),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.verified_rounded, color: Color(0xFF16A34A), size: 22),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Active Payout Account: $_savedMaskedAccount',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13,
                                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                      ),
                                    ),
                                    if (_bankCtrl.text.isNotEmpty)
                                      Text(
                                        '${_bankCtrl.text} (${_ifscCtrl.text})',
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: isDark ? Colors.white70 : const Color(0xFF475569),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Server Error Alert
                      if (_serverError != null) ...[
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.red.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline_rounded, color: Colors.red, size: 18),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _serverError!,
                                  style: const TextStyle(color: Colors.red, fontSize: 12),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),
                      ],

                      // 1. Account Holder Name
                      Text(
                        'Account Holder Name',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _holderCtrl,
                        textCapitalization: TextCapitalization.words,
                        decoration: _inputDecoration(
                          isDark: isDark,
                          hint: 'As printed on passbook / cheque',
                          prefixIcon: Icons.person_outline_rounded,
                        ),
                        validator: (v) {
                          if (v == null || v.trim().length < 2) {
                            return 'Enter full name (minimum 2 characters)';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),

                      // 2. Bank Name
                      Text(
                        'Bank Name',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _bankCtrl,
                        textCapitalization: TextCapitalization.words,
                        decoration: _inputDecoration(
                          isDark: isDark,
                          hint: 'e.g. State Bank of India, HDFC Bank',
                          prefixIcon: Icons.account_balance_rounded,
                        ),
                        validator: (v) {
                          if (v == null || v.trim().length < 2) {
                            return 'Enter valid bank name';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),

                      // 3. Account Number
                      Text(
                        'Account Number',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _accCtrl,
                        keyboardType: TextInputType.number,
                        obscureText: _obscureAcc,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(20),
                        ],
                        decoration: _inputDecoration(
                          isDark: isDark,
                          hint: _savedMaskedAccount != null
                              ? 'Enter new account number to change'
                              : 'e.g. 123456789012',
                          prefixIcon: Icons.pin_rounded,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscureAcc ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                              size: 18,
                              color: isDark ? Colors.white38 : Colors.grey.shade600,
                            ),
                            onPressed: () => setState(() => _obscureAcc = !_obscureAcc),
                          ),
                        ),
                        validator: (v) {
                          if (_savedMaskedAccount != null && (v == null || v.trim().isEmpty)) {
                            // If user is just keeping existing account details without re-entering
                            return null;
                          }
                          if (v == null || v.trim().length < 8) {
                            return 'Account number must be 8-20 digits';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),

                      // 4. Confirm Account Number
                      Text(
                        'Confirm Account Number',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _confirmAccCtrl,
                        keyboardType: TextInputType.number,
                        obscureText: _obscureConfirm,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(20),
                        ],
                        decoration: _inputDecoration(
                          isDark: isDark,
                          hint: 'Re-enter account number',
                          prefixIcon: Icons.lock_outline_rounded,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                              size: 18,
                              color: isDark ? Colors.white38 : Colors.grey.shade600,
                            ),
                            onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                          ),
                        ),
                        validator: (v) {
                          if (_accCtrl.text.isNotEmpty && v != _accCtrl.text) {
                            return 'Account numbers do not match';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),

                      // 5. IFSC Code
                      Text(
                        'IFSC Code (11 characters)',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _ifscCtrl,
                        textCapitalization: TextCapitalization.characters,
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z0-9]')),
                          LengthLimitingTextInputFormatter(11),
                        ],
                        decoration: _inputDecoration(
                          isDark: isDark,
                          hint: 'e.g. SBIN0001234',
                          prefixIcon: Icons.verified_user_outlined,
                        ),
                        validator: (v) {
                          final val = (v ?? '').trim().toUpperCase();
                          if (val.length != 11) {
                            return 'IFSC code must be exactly 11 characters';
                          }
                          if (!_ifscRegex.hasMatch(val)) {
                            return 'Invalid format (e.g. 4 letters, 0, then 6 alphanumeric: SBIN0001234)';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 24),

                      // Action Buttons
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: _isSaving ? null : () => Navigator.of(context).pop(),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                side: BorderSide(
                                  color: isDark ? Colors.white24 : Colors.grey.shade300,
                                ),
                              ),
                              child: Text(
                                'Cancel',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 2,
                            child: ElevatedButton(
                              onPressed: _isSaving ? null : _saveBankDetails,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                backgroundColor: const Color(0xFF16A34A),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                elevation: 0,
                              ),
                              child: _isSaving
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Text(
                                      'Save Bank Details',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 15,
                                      ),
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  InputDecoration _inputDecoration({
    required bool isDark,
    required String hint,
    required IconData prefixIcon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(
        fontSize: 13,
        color: isDark ? Colors.white38 : Colors.grey.shade400,
      ),
      prefixIcon: Icon(
        prefixIcon,
        size: 18,
        color: isDark ? Colors.white38 : Colors.grey.shade500,
      ),
      suffixIcon: suffixIcon,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      filled: true,
      fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade50,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: isDark ? Colors.white10 : Colors.grey.shade200,
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: isDark ? Colors.white10 : Colors.grey.shade200,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF16A34A), width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.red, width: 1),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.red, width: 1.5),
      ),
    );
  }
}
